import dotenv from 'dotenv';
dotenv.config();

export const config = {
  togetherApiKey: process.env.TOGETHER_API_KEY || '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  llamaCppBaseUrl: process.env.LLAMA_CPP_BASE_URL || 'http://localhost:8080',
  modelName: process.env.MODEL_NAME || 'llama2',
  defaultModel: process.env.DEFAULT_MODEL || 'llamacpp'
};