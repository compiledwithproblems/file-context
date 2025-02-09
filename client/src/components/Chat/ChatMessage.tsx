import { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`message ${message.type}`}>
      <div className="message-content">
        {message.text}
      </div>
      <div className="message-time">
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
} 