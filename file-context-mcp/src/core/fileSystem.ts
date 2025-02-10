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
  private storageRoot: string;

  constructor() {
    this.storageRoot = path.join(__dirname, '../../storage');
  }

  private validatePath(targetPath: string): string {
    // Convert empty or "." paths to storage root
    if (!targetPath || targetPath === '.') {
      return this.storageRoot;
    }

    // Always resolve relative to storage root
    const absolutePath = path.join(this.storageRoot, targetPath);
    const normalizedPath = path.normalize(absolutePath);
    
    // Ensure the path is within storage directory
    if (!normalizedPath.startsWith(this.storageRoot)) {
      throw new Error('Access denied: Path is outside storage directory');
    }
    
    return normalizedPath;
  }

  async readDirectory(dirPath: string, recursive: boolean = false): Promise<FileInfo[]> {
    try {
      const fullPath = this.validatePath(dirPath);
      Logger.debug('Reading directory', { dirPath, fullPath, recursive });

      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const files: FileInfo[] = [];

      for (const entry of entries) {
        const entryFullPath = path.join(fullPath, entry.name);
        // Create path relative to storage root
        const relativePath = path.relative(this.storageRoot, entryFullPath);
        
        if (entry.isDirectory()) {
          const dirInfo: FileInfo = {
            name: entry.name,
            path: relativePath,
            type: 'directory'
          };

          if (recursive) {
            // Pass the relative path for recursion
            dirInfo.children = await this.readDirectory(relativePath, true);
          }

          files.push(dirInfo);
        } else {
          try {
            const content = await fs.readFile(entryFullPath, 'utf-8');
            files.push({
              name: entry.name,
              path: relativePath,
              type: 'file',
              content
            });
          } catch (error) {
            Logger.error(`Failed to read file content: ${entryFullPath}`, error);
            files.push({
              name: entry.name,
              path: relativePath,
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
      const fullPath = this.validatePath(filePath);
      Logger.debug('Reading file', { filePath });
      const content = await fs.readFile(fullPath, 'utf-8');
      const fileInfo: FileInfo = {
        name: path.basename(filePath),
        path: filePath, // Return relative path
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
      // Always resolve relative to storage directory
      const fullPath = path.join(this.storageRoot, targetPath);
      Logger.debug('Getting context from path', { targetPath, fullPath });
      
      const stat = await fs.stat(fullPath);
      
      let result: FileInfo[];
      if (stat.isDirectory()) {
        result = await this.readDirectory(targetPath);
      } else {
        const content = await fs.readFile(fullPath, 'utf-8');
        result = [{
          name: path.basename(targetPath),
          path: targetPath,
          type: 'file',
          content
        }];
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