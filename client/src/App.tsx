import { useChat } from './hooks/useChat';
import { useFileSystem } from './hooks/useFileSystem';
import { Sidebar } from './components/Layout/Sidebar';
import { MainContent } from './components/Layout/MainContent';
import './App.css';

function App() {
  const {
    files,
    selectedFiles,
    isLoading: isFileLoading,
    error: fileError,
    createFolder,
    uploadFiles,
    deleteFile,
    toggleFileSelection,
  } = useFileSystem();

  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    sendMessage,
  } = useChat();

  const isLoading = isFileLoading || isChatLoading;
  const error = fileError || chatError;

  return (
    <div className="app">
      {error && <div className="error-banner">{error}</div>}
      <Sidebar
        files={files}
        selectedFiles={selectedFiles}
        isLoading={isLoading}
        onSelectFile={toggleFileSelection}
        onDeleteFile={file => deleteFile(file.path)}
        onUploadFiles={uploadFiles}
        onCreateFolder={createFolder}
      />
      <MainContent
        messages={messages}
        selectedFiles={selectedFiles}
        isLoading={isLoading}
        onSendMessage={text => sendMessage(text, selectedFiles)}
      />
    </div>
  );
}

export default App;
