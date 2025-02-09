import { useState, useCallback } from 'react';
import { Message, FileInfo } from '../types';
import { queryLLM } from '../utils/api';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string, selectedFiles: FileInfo[]) => {
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

      // Query LLM
      const response = await queryLLM({
        paths: selectedFiles.map(f => f.path),
        query: text,
      });

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