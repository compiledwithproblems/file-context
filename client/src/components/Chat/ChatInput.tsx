import { useState, KeyboardEvent } from 'react';
import { FileInfo } from '../../types';

interface ChatInputProps {
  onSend: (text: string, paths: string[], model: 'llamacpp' | 'ollama' | 'together') => Promise<void>;
  selectedFiles: FileInfo[];
  isLoading?: boolean;
  onRemoveFile: (file: FileInfo) => void;
}

export function ChatInput({ onSend, selectedFiles, isLoading, onRemoveFile }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<'llamacpp' | 'ollama' | 'together'>('llamacpp');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      const currentInput = input.trim();
      setInput('');
      onSend(
        currentInput,
        selectedFiles.map(f => f.path),
        selectedModel
      ).catch(err => {
        console.error('Failed to send message:', err);
        setInput(currentInput); // Restore input if send fails
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeFile = (file: FileInfo) => {
    onRemoveFile(file);
  };

  return (
    <div className="chat-input">
      <div className="chat-input-header">
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            {selectedFiles.map(file => (
              <span key={file.path} className="file-tag" onClick={() => removeFile(file)}>
                📄 {file.name}
                <span className="remove-tag">×</span>
              </span>
            ))}
          </div>
        )}
        <select 
          value={selectedModel} 
          onChange={e => setSelectedModel(e.target.value as 'llamacpp' | 'ollama' | 'together')}
          className="model-selector"
        >
          <option value="llamacpp">llama.cpp</option>
          <option value="ollama">Ollama</option>
          <option value="together">Together</option>
        </select>
      </div>
      <div className="input-container">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFiles.length > 0 ? "Ask about the selected files..." : "Type your message..."}
          rows={3}
        />
        <button
          onClick={handleSend}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
} 