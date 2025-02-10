import { FileInfo, QueryRequest, QueryResponse } from '../types';

// Update this to match your actual API server URL
const API_BASE = 'http://localhost:3001/api';

// Helper to normalize paths to use forward slashes and ensure relative to storage
const normalizePath = (path: string) => {
  if (!path) return '';
  // Remove any leading slashes and 'storage/' prefix and ensure path is relative
  const cleanPath = path
    .replace(/^[\/\\]|^storage[\/\\]/, '')  // Remove leading slashes and storage prefix
    .replace(/\\/g, '/')  // Convert backslashes to forward slashes
    .replace(/\/+/g, '/') // Remove any double slashes
    .replace(/^\.\//, ''); // Remove leading ./
  return cleanPath;
};

async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Failed to fetch after retries');
}

export async function listFiles(path = '.', recursive = false): Promise<FileInfo[]> {
  try {
    const normalizedPath = normalizePath(path);
    const params = new URLSearchParams({ path: normalizedPath, recursive: String(recursive) });
    const response = await fetchWithRetry(`${API_BASE}/files?${params}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('List files error:', text);
      throw new Error('Failed to list files. Is the backend server running?');
    }
    return response.json();
  } catch (err) {
    console.error('List files error:', err);
    // Return empty array as fallback when server is not available
    return [];
  }
}

export async function createFolder(path: string): Promise<void> {
  try {
    const normalizedPath = normalizePath(path);
    const response = await fetchWithRetry(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: normalizedPath }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Create folder error:', text);
      throw new Error('Failed to create folder. Is the backend server running?');
    }
  } catch (err) {
    console.error('Create folder error:', err);
    throw new Error('Failed to create folder. Is the backend server running?');
  }
}

export async function uploadFiles(files: File[], folderPath: string): Promise<void> {
  try {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('folderPath', normalizePath(folderPath));

    const response = await fetchWithRetry(`${API_BASE}/folders/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Upload files error:', text);
      throw new Error('Failed to upload files. Is the backend server running?');
    }
  } catch (err) {
    console.error('Upload files error:', err);
    throw new Error('Failed to upload files. Is the backend server running?');
  }
}

export async function uploadFile(file: File): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithRetry(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Upload file error:', text);
      throw new Error('Failed to upload file. Is the backend server running?');
    }
  } catch (err) {
    console.error('Upload file error:', err);
    throw new Error('Failed to upload file. Is the backend server running?');
  }
}

export async function deleteFile(filename: string): Promise<void> {
  try {
    const normalizedPath = normalizePath(filename);
    const response = await fetchWithRetry(`${API_BASE}/files/${encodeURIComponent(normalizedPath)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Delete file error:', text);
      throw new Error('Failed to delete file. Is the backend server running?');
    }
  } catch (err) {
    console.error('Delete file error:', err);
    throw new Error('Failed to delete file. Is the backend server running?');
  }
}

export async function queryLLM(request: QueryRequest): Promise<QueryResponse> {
  try {
    console.log('Sending LLM request:', request);

    const response = await fetchWithRetry(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Query LLM error:', text);
      throw new Error('Failed to query LLM. Is the backend server running?');
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (err) {
    console.error('Query LLM error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to query LLM');
  }
} 