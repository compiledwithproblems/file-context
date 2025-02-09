import { useRef } from 'react';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  isLoading?: boolean;
}

export function FileUpload({ onUpload, isLoading }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
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