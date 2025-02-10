import express from 'express';
import { Request } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { OpenAPIV3 } from 'openapi-types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { FileSystemTools, FileInfo } from './core/fileSystem';
import { ModelInterface } from './core/modelInterface';
import { Logger } from './utils/logger';
import { fileUtils } from './utils/fileUtils';
import { promptUtils } from './utils/promptUtils';
import { validators } from './utils/validators';
import { config } from './config/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, path.join(__dirname, '../storage'));
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueFilename = `${path.parse(file.originalname).name}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isTextFile = fileUtils.isTextFile(file.originalname);
    const isSupportedBinary = fileUtils.isSupportedBinaryFile(file.originalname);
    
    if (isTextFile || isSupportedBinary) {
      // Set file type in request for later processing
      file.mimetype = fileUtils.getMimeType(file.originalname);
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Load OpenAPI specification from YAML file
const openApiPath = path.join(__dirname, 'resources', 'file-context-api.yml');
const openApiSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8')) as OpenAPIV3.Document;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

const fileTools = new FileSystemTools();
const modelInterface = new ModelInterface();

// Get files/directories at path
app.get('/api/files', async (req, res) => {
  try {
    // Convert undefined, empty string, or '.' to empty string to get storage root
    let requestedPath = (req.query.path as string) || '';
    requestedPath = requestedPath === '.' ? '' : requestedPath;
    
    const recursive = req.query.recursive === 'true';
    
    // Validate path is safe
    if (!validators.isValidPath(requestedPath)) {
      throw new Error('Invalid path parameter');
    }

    const files = await fileTools.readDirectory(requestedPath, recursive);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create new folder
app.post('/api/folders', async (req, res) => {
  try {
    const { path: folderPath } = req.body;
    
    if (!validators.isValidPath(folderPath)) {
      throw new Error('Invalid folder path');
    }

    const sanitizedPath = fileUtils.sanitizePath(path.join('storage', folderPath));
    const folder = await fileTools.createFolder(sanitizedPath);
    
    res.json({
      message: 'Folder created successfully',
      folder
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Configure multer for folder uploads with the same settings
const folderUpload = multer({
  storage,
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isTextFile = fileUtils.isTextFile(file.originalname);
    const isSupportedBinary = fileUtils.isSupportedBinaryFile(file.originalname);
    
    if (isTextFile || isSupportedBinary) {
      file.mimetype = fileUtils.getMimeType(file.originalname);
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
}).array('files');

// Upload files to a folder
app.post('/api/folders/upload', async (req, res) => {
  try {
    folderUpload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const folderPath = req.body.folderPath || '';
      if (!validators.isValidPath(folderPath)) {
        return res.status(400).json({ error: 'Invalid folder path' });
      }

      const targetPath = fileUtils.sanitizePath(path.join('storage', folderPath));
      await fileTools.ensureFolder(targetPath);

      const files = (req.files as Express.Multer.File[]) || [];
      const uploadedFiles = files.map(file => ({
        name: file.originalname,
        size: fileUtils.formatFileSize(file.size),
        path: file.path
      }));

      Logger.info('Files uploaded successfully', { 
        folderPath: targetPath,
        numFiles: files.length,
        files: uploadedFiles.map(f => f.name)
      });

      res.json({
        message: 'Files uploaded successfully',
        files: uploadedFiles
      });
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Query LLM with file context
app.post('/api/query', async (req, res) => {
  try {
    const { path: filePath, query, model } = req.body;
    
    // Validate model is required
    if (!validators.isValidModel(model)) {
      throw new Error('Invalid model parameter');
    }

    // Initialize empty context if no path provided
    let context: FileInfo[] = [];

    // Only process paths if they were provided
    if (filePath !== undefined) {
      // Validate path if provided
      if (!validators.isValidPath(filePath)) {
        throw new Error('Invalid path parameter');
      }

      // Normalize paths to ensure they're relative to storage
      const normalizePath = (path: string) => {
        // Remove any leading slashes and 'storage/' prefix if present
        return path.replace(/^[\/\\]|^storage[\/\\]/, '');
      };

      if (Array.isArray(filePath)) {
        const contextArrays = await Promise.all(filePath.map(async (path) => {
          const normalizedPath = normalizePath(path);
          Logger.debug('Processing array path', { originalPath: path, normalizedPath });
          return fileTools.getContextFromPath(normalizedPath);
        }));
        context = contextArrays.flat();
      } else {
        const normalizedPath = normalizePath(filePath);
        Logger.debug('Processing single path', { originalPath: filePath, normalizedPath });
        context = await fileTools.getContextFromPath(normalizedPath);
      }
    } else {
      Logger.debug('No path provided, proceeding with empty context');
    }

    // Process query with model
    const response = await modelInterface.query(query, context, model);
    res.json(response);
  } catch (error) {
    Logger.error('Error processing query', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload file to storage
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    Logger.info('File uploaded successfully', { 
      filename: req.file.originalname,
      size: req.file.size
    });

    res.json({ 
      message: 'File uploaded successfully',
      file: {
        name: req.file.originalname,
        size: fileUtils.formatFileSize(req.file.size),
        path: req.file.path
      }
    });
  } catch (error) {
    Logger.error('Error uploading file', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete file from storage
app.delete('/api/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../storage', filename);

    if (!validators.isValidPath(filePath)) {
      throw new Error('Invalid file path');
    }

    await fileTools.deleteFile(filePath);
    Logger.info('File deleted successfully', { filename });
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    Logger.error('Error deleting file', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});