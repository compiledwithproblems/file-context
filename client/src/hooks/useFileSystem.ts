import { useState, useCallback, useEffect } from 'react';
import { FileInfo } from '../types';
import { listFiles, createFolder, uploadFiles, uploadFile, deleteFile } from '../utils/api';

export function useFileSystem() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      console.log('Fetching files...');
      setIsLoading(true);
      setError(null);
      const fileList = await listFiles('./', true);
      console.log('Received files:', fileList);
      setFiles(fileList);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err instanceof Error ? err.message : 'Failed to list files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateFolder = useCallback(async (path: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await createFolder(path);
      await refreshFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsLoading(false);
    }
  }, [refreshFiles]);

  const handleUploadFiles = useCallback(async (files: File[], folderPath: string = './') => {
    try {
      setIsLoading(true);
      setError(null);
      await uploadFiles(files, folderPath);
      await refreshFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setIsLoading(false);
    }
  }, [refreshFiles]);

  const handleUploadFile = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      await uploadFile(file);
      await refreshFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  }, [refreshFiles]);

  const handleDeleteFile = useCallback(async (filename: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteFile(filename);
      setSelectedFiles(prev => prev.filter(f => f.path !== filename));
      await refreshFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setIsLoading(false);
    }
  }, [refreshFiles]);

  const toggleFileSelection = useCallback((file: FileInfo) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.path === file.path);
      if (isSelected) {
        return prev.filter(f => f.path !== file.path);
      } else {
        return [...prev, file];
      }
    });
  }, []);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  return {
    files,
    selectedFiles,
    isLoading,
    error,
    refreshFiles,
    createFolder: handleCreateFolder,
    uploadFiles: handleUploadFiles,
    uploadFile: handleUploadFile,
    deleteFile: handleDeleteFile,
    toggleFileSelection,
  };
} 