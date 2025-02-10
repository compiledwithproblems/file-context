import { useRef } from 'react';

interface FileUploadProps {
  onUpload: (files: File[], folderPath: string) => void;
  folderPath?: string;
  isLoading?: boolean;
}

export function FileUpload({ onUpload, folderPath = '.', isLoading }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Remove storage/ prefix and normalize slashes
      const normalizedPath = folderPath
        .replace(/^[\/\\]|^storage[\/\\]/, '')
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/');
      onUpload(files, normalizedPath);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleUpload}
        disabled={isLoading}
        className="file-input"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="upload-button"
      >
        Upload Files
      </button>
    </div>
  );
} 