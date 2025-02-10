import axios from 'axios';
import { config } from '../config/config';
import { FileInfo } from './fileSystem';
import { Logger } from '../utils/logger';

export interface LLMResponse {
  text: string;
  model: string;
  error?: string;
}

export class ModelInterface {
  async query(prompt: string, context: FileInfo[], model: string): Promise<LLMResponse> {
    Logger.debug('Starting LLM query', { model, contextSize: context.length });
    
    // Convert FileInfo array to string context with truncation
    const MAX_CONTENT_LENGTH = 1000; // Truncate each file's content if too long
    const contextString = context
      .map(file => {
        let content = file.content || '[No content available]';
        if (content.length > MAX_CONTENT_LENGTH) {
          content = content.slice(0, MAX_CONTENT_LENGTH) + '... [content truncated]';
        }
        return `File: ${file.path}\n${content}`;
      })
      .join('\n\n');

    Logger.debug('Formatted context', { 
      contextLength: contextString.length,
      numFiles: context.length,
      truncated: context.some(f => (f.content?.length || 0) > MAX_CONTENT_LENGTH)
    });

    // Select model based on input
    switch (model) {
      case 'ollama':
        return this.queryOllama(prompt, contextString);
      case 'together':
        return this.queryTogether(prompt, contextString);
      case 'llamacpp':
        return this.queryLlamaCpp(prompt, contextString);
      default:
        return {
          text: '',
          model: model,
          error: 'Invalid model specified'
        };
    }
  }

  async queryOllama(prompt: string, context: string): Promise<LLMResponse> {
    try {
      const formattedPrompt = this.formatPrompt(prompt, context);
      const requestPayload = {
        model: config.modelName,
        prompt: formattedPrompt,
        stream: false
      };

      Logger.debug('Sending request to Ollama', { 
        promptLength: prompt.length,
        contextLength: context.length,
        url: `${config.ollamaBaseUrl}/api/generate`,
        model: config.modelName,
        fullRequest: requestPayload
      });

      const startTime = Date.now();
      const response = await axios.post(`${config.ollamaBaseUrl}/api/generate`, requestPayload);
      const duration = Date.now() - startTime;

      Logger.debug('Received Ollama response', { 
        duration: `${duration}ms`,
        responseStatus: response.status,
        hasResponse: !!response.data?.response,
        responseData: response.data
      });

      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama');
      }

      return {
        text: response.data.response,
        model: 'ollama'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Logger.error('Ollama network error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      } else {
        Logger.error('Ollama error:', error);
      }
      return {
        text: '',
        model: 'ollama',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async queryTogether(prompt: string, context: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        'https://api.together.xyz/inference',
        {
          model: config.modelName,
          prompt: this.formatPrompt(prompt, context),
          max_tokens: 512,
        },
        {
          headers: {
            Authorization: `Bearer ${config.togetherApiKey}`
          }
        }
      );

      return {
        text: response.data.output.text,
        model: 'together'
      };
    } catch (error) {
      return {
        text: '',
        model: 'together',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async queryLlamaCpp(prompt: string, context: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(`${config.llamaCppBaseUrl}/completion`, {
        prompt: this.formatPrompt(prompt, context),
        temperature: 0.7,
        n_predict: 800,
        stop: ["###", "### User:", "### System:"],
        stream: false
      });

      if (!response.data || !response.data.content) {
        throw new Error('Invalid response from llama.cpp server');
      }

      return {
        text: response.data.content,
        model: 'llamacpp'
      };
    } catch (error) {
      console.error('llama.cpp error:', error);
      return {
        text: '',
        model: 'llamacpp',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private formatPrompt(prompt: string, context: string): string {
    const systemPrompt = `You are a helpful AI assistant. Analyze the following file content and answer the question. Keep your response concise and focused on the question.`;
    
    // Ensure reasonable context size
    const MAX_TOTAL_CONTEXT = 4000;
    let formattedContext = context;
    if (context.length > MAX_TOTAL_CONTEXT) {
      formattedContext = context.slice(0, MAX_TOTAL_CONTEXT) + '\n... [additional context truncated for length]';
    }
    
    const finalPrompt = `${systemPrompt}\n\n${formattedContext.trim() ? `Context:\n${formattedContext}` : 'No context provided.'}\n\nQuestion: ${prompt}`;
    
    Logger.debug('Formatted prompt', {
      promptLength: finalPrompt.length,
      hasContext: !!context.trim(),
      contextLength: context.length,
      truncated: context.length > MAX_TOTAL_CONTEXT
    });

    return finalPrompt;
  }
}