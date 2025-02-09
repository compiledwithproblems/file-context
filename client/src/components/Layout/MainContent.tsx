import { ChatWindow } from '../Chat/ChatWindow';
import { ChatInput } from '../Chat/ChatInput';
import { Message, FileInfo } from '../../types';

interface MainContentProps {
  messages: Message[];
  selectedFiles: FileInfo[];
  isLoading?: boolean;
  onSendMessage: (text: string) => void;
}

export function MainContent({
  messages,
  selectedFiles,
  isLoading,
  onSendMessage,
}: MainContentProps) {
  return (
    <div className="main-content">
      <ChatWindow messages={messages} isLoading={isLoading} />
      <ChatInput
        onSend={onSendMessage}
        selectedFiles={selectedFiles}
        isLoading={isLoading}
      />
    </div>
  );
} 