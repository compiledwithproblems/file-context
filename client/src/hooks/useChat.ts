import { useState, useCallback } from 'react';
import { Message, QueryRequest, QueryResponse } from '../types';
import { queryLLM } from '../utils/api';

// Helper to normalize paths to use forward slashes and ensure relative to storage
const normalizePath = (path: string) => {
  if (!path) return '';
  // Remove any leading slashes and 'storage/' prefix and ensure path is relative
  const cleanPath = path
    .replace(/^[\/\\]|^storage[\/\\]/, '')  // Remove leading slashes and storage prefix
    .replace(/\\/g, '/')  // Convert backslashes to forward slashes
    .replace(/\/+/g, '/') // Remove any double slashes
    .replace(/^\.\//, ''); // Remove leading ./
  return cleanPath;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string, paths: string[], model: 'llamacpp' | 'ollama' | 'together') => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        type: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Create request with optional path
      const request: QueryRequest = {
        query: text,
        model,
      };
      
      // Only add path if we have files selected
      if (paths && paths.length > 0) {
        request.path = paths.length === 1 ? paths[0] : paths;
      }

      console.log('Sending request with paths:', request.path);
      
      const response = await queryLLM(request);

      // Add bot message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        type: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
} 