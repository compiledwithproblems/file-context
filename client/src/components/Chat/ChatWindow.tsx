import { useEffect, useRef } from 'react';
import { Message } from '../../types';
import { ChatMessage } from './ChatMessage';

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map(message => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="message bot">
          <div className="message-content">
            <div className="loading-indicator">Thinking...</div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
} 