import { useState, KeyboardEvent } from 'react';
import { FileInfo } from '../../types';

interface ChatInputProps {
  onSend: (text: string) => void;
  selectedFiles: FileInfo[];
  isLoading?: boolean;
}

export function ChatInput({ onSend, selectedFiles, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input">
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          Selected context: {selectedFiles.map(f => f.name).join(', ')}
        </div>
      )}
      <div className="input-container">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
} 