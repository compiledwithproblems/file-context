import { Message } from '../../types';
import { MarkdownMessage } from './MarkdownMessage';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`message ${message.type}`}>
      <div className="message-content">
        {message.type === 'bot' ? (
          <MarkdownMessage content={message.text} />
        ) : (
          message.text
        )}
      </div>
      <div className="message-time">
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
} 