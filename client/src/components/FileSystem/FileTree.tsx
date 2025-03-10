import { FileInfo } from '../../types';
import { FileUpload } from './FileUpload';

interface FileTreeProps {
  files: FileInfo[];
  selectedFiles: FileInfo[];
  onSelect: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
  onUpload: (files: File[], folderPath: string) => void;
  isLoading?: boolean;
}

export function FileTree({
  files,
  selectedFiles,
  onSelect,
  onDelete,
  onUpload,
  isLoading,
}: FileTreeProps) {
  const renderFile = (file: FileInfo, depth = 0) => {
    const isSelected = selectedFiles.some(f => f.path === file.path);

    return (
      <div key={file.path}>
        <div
          className={`file-item ${file.type} ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          <div
            className="file-item-content"
            onClick={() => file.type === 'file' && onSelect(file)}
          >
            <span className="file-icon">
              {file.type === 'directory' ? '📁' : '📄'}
            </span>
            <span className="file-name">{file.name}</span>
          </div>
          <div className="file-actions">
            {file.type === 'directory' && (
              <FileUpload
                onUpload={onUpload}
                folderPath={file.path}
                isLoading={isLoading}
              />
            )}
            {file.type === 'file' && (
              <button
                className="delete-button"
                onClick={() => onDelete(file)}
                disabled={isLoading}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        {file.children?.map(child => renderFile(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="file-tree">
      {files.map(file => renderFile(file))}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading">Loading files...</div>
        </div>
      )}
    </div>
  );
} 