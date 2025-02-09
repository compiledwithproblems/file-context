import { useState } from 'react';

interface CreateFolderProps {
  onCreate: (path: string) => void;
  isLoading?: boolean;
}

export function CreateFolder({ onCreate, isLoading }: CreateFolderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      setFolderName('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        className="create-folder-button"
      >
        New Folder
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="create-folder-form">
      <input
        type="text"
        value={folderName}
        onChange={e => setFolderName(e.target.value)}
        placeholder="Folder name"
        disabled={isLoading}
        autoFocus
      />
      <div className="form-buttons">
        <button type="submit" disabled={!folderName.trim() || isLoading}>
          Create
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 