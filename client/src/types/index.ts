export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileInfo[];
}

export interface Message {
  id: string;
  text: string;
  type: 'user' | 'bot';
  timestamp: Date;
}

export interface GetFilesRequest {
  path?: string;
  recursive?: boolean;
}

export interface CreateFolderRequest {
  path: string;
}

export interface QueryRequest {
  paths?: string[];
  path?: string;
  query: string;
  model?: 'llamacpp' | 'ollama' | 'together';
}

export interface QueryResponse {
  text: string;
  model: string;
  error?: string;
} 