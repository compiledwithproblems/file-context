import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileInfo[];  // For recursive directory listing
}

export class FileSystemTools {
  async readDirectory(dirPath: string, recursive: boolean = false): Promise<FileInfo[]> {
    try {
      Logger.debug('Reading directory', { dirPath, recursive });
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: FileInfo[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          const dirInfo: FileInfo = {
            name: entry.name,
            path: fullPath,
            type: 'directory'
          };

          if (recursive) {
            dirInfo.children = await this.readDirectory(fullPath, true);
          }

          files.push(dirInfo);
        } else {
          try {
            // Read the file content for files
            const content = await fs.readFile(fullPath, 'utf-8');
            files.push({
              name: entry.name,
              path: fullPath,
              type: 'file',
              content
            });
          } catch (error) {
            Logger.error(`Failed to read file content: ${fullPath}`, error);
            // Still include the file, just without content
            files.push({
              name: entry.name,
              path: fullPath,
              type: 'file'
            });
          }
        }
      }

      Logger.debug('Directory read successfully', { 
        dirPath,
        numEntries: files.length,
        entries: files.map(f => ({ name: f.name, type: f.type, hasContent: !!f.content, hasChildren: !!f.children }))
      });

      return files;
    } catch (error) {
      Logger.error('Failed to read directory', { dirPath, error });
      throw new Error(`Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async readFile(filePath: string): Promise<FileInfo> {
    try {
      Logger.debug('Reading file', { filePath });
      const content = await fs.readFile(filePath, 'utf-8');
      const fileInfo: FileInfo = {
        name: path.basename(filePath),
        path: filePath,
        type: 'file',
        content
      };
      Logger.debug('File read successfully', { 
        filePath,
        contentLength: content.length
      });
      return fileInfo;
    } catch (error) {
      Logger.error('Failed to read file', { filePath, error });
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContextFromPath(targetPath: string): Promise<FileInfo[]> {
    try {
      Logger.debug('Getting context from path', { targetPath });
      const stat = await fs.stat(targetPath);
      
      let result: FileInfo[];
      if (stat.isDirectory()) {
        result = await this.readDirectory(targetPath);
      } else {
        result = [await this.readFile(targetPath)];
      }

      Logger.debug('Context retrieved successfully', { 
        targetPath,
        numItems: result.length,
        isDirectory: stat.isDirectory()
      });

      return result;
    } catch (error) {
      Logger.error('Failed to get context', { targetPath, error });
      throw new Error(`Failed to get context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      Logger.debug('Deleting file', { filePath });
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new Error('Path is not a file');
      }
      await fs.unlink(filePath);
      Logger.debug('File deleted successfully', { filePath });
    } catch (error) {
      Logger.error('Failed to delete file', { filePath, error });
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createFolder(folderPath: string): Promise<FileInfo> {
    try {
      Logger.debug('Creating folder', { folderPath });
      await fs.mkdir(folderPath, { recursive: true });
      
      const folderInfo: FileInfo = {
        name: path.basename(folderPath),
        path: folderPath,
        type: 'directory'
      };

      Logger.debug('Folder created successfully', { folderInfo });
      return folderInfo;
    } catch (error) {
      Logger.error('Failed to create folder', { folderPath, error });
      throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async ensureFolder(folderPath: string): Promise<void> {
    try {
      await fs.access(folderPath);
    } catch {
      await this.createFolder(folderPath);
    }
  }
}