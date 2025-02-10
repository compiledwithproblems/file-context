import { ChatWindow } from '../Chat/ChatWindow';
import { ChatInput } from '../Chat/ChatInput';
import { Message, FileInfo } from '../../types';

interface MainContentProps {
  messages: Message[];
  selectedFiles: FileInfo[];
  isLoading?: boolean;
  onSendMessage: (text: string, paths: string[], model: 'llamacpp' | 'ollama' | 'together') => void;
  onRemoveFile: (file: FileInfo) => void;
}

export function MainContent({
  messages,
  selectedFiles,
  isLoading,
  onSendMessage,
  onRemoveFile,
}: MainContentProps) {
  return (
    <div className="main-content">
      <ChatWindow messages={messages} isLoading={isLoading} />
      <ChatInput
        onSend={(text, paths, model) => Promise.resolve(onSendMessage(text, paths, model))}
        selectedFiles={selectedFiles}
        isLoading={isLoading}
        onRemoveFile={onRemoveFile}
      />
    </div>
  );
} 