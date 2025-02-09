import { FileTree } from '../FileSystem/FileTree';
import { FileUpload } from '../FileSystem/FileUpload';
import { CreateFolder } from '../FileSystem/CreateFolder';
import { FileInfo } from '../../types';

interface SidebarProps {
  files: FileInfo[];
  selectedFiles: FileInfo[];
  isLoading?: boolean;
  onSelectFile: (file: FileInfo) => void;
  onDeleteFile: (file: FileInfo) => void;
  onUploadFiles: (files: File[]) => void;
  onCreateFolder: (path: string) => void;
}

export function Sidebar({
  files,
  selectedFiles,
  isLoading,
  onSelectFile,
  onDeleteFile,
  onUploadFiles,
  onCreateFolder,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Files</h2>
        <div className="sidebar-actions">
          <FileUpload onUpload={onUploadFiles} isLoading={isLoading} />
          <CreateFolder onCreate={onCreateFolder} isLoading={isLoading} />
        </div>
      </div>
      <FileTree
        files={files}
        selectedFiles={selectedFiles}
        onSelect={onSelectFile}
        onDelete={onDeleteFile}
        isLoading={isLoading}
      />
    </div>
  );
} 