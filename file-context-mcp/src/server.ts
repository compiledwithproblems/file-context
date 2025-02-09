import express from 'express';
import { Request } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { OpenAPIV3 } from 'openapi-types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { FileSystemTools } from './core/fileSystem';
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
    // Ensure filename is unique by appending timestamp if file exists
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

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

const fileTools = new FileSystemTools();
const modelInterface = new ModelInterface();

// Get files/directories at path
app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path as string || './';
    const recursive = req.query.recursive === 'true';
    const files = await fileTools.readDirectory(dirPath, recursive);
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
      const { paths, path, query, model = config.defaultModel } = req.body;
      
      Logger.debug('Received query request', { paths, path, query, model });
      
      // Validate inputs
      if (!validators.isValidQuery(query)) {
        throw new Error('Invalid query parameter');
      }

      let context = '';
      
      // Handle array of paths (new method)
      if (paths?.length) {
        Logger.debug('Processing multiple paths', { paths });
        const allContexts = await Promise.all(
          paths.map(async (p: string) => {
            if (!validators.isValidPath(p)) {
              Logger.warn('Invalid path in paths array', { path: p });
              return null;
            }
            const sanitizedPath = fileUtils.sanitizePath(p);
            const contextFiles = await fileTools.getContextFromPath(sanitizedPath);
            return contextFiles;
          })
        );

        // Filter out nulls and flatten array
        const validContextFiles = allContexts
          .filter(Boolean)
          .flat()
          .filter(file => file.content && fileUtils.isTextFile(file.path));

        Logger.debug('Retrieved context files', {
          numFiles: validContextFiles.length,
          files: validContextFiles.map(f => ({ name: f.name, type: f.type }))
        });

        context = validContextFiles
          .map(file => `File: ${file.name}\n${file.content}`)
          .join('\n\n');
      }
      // Handle single path (legacy method)
      else if (path) {
        if (!validators.isValidPath(path)) {
          throw new Error('Invalid path parameter');
        }
        const sanitizedPath = fileUtils.sanitizePath(path);
        Logger.debug('Processing single path', { originalPath: path, sanitizedPath });
        
        const contextFiles = await fileTools.getContextFromPath(sanitizedPath);
        const filteredFiles = contextFiles.filter(file => file.content && fileUtils.isTextFile(file.path));
        
        Logger.debug('Retrieved context files', { 
          numFiles: filteredFiles.length,
          files: filteredFiles.map(f => ({ name: f.name, type: f.type }))
        });

        context = filteredFiles
          .map(file => `File: ${file.name}\n${file.content}`)
          .join('\n\n');
      }
      
      Logger.debug('Generated context', { 
        contextLength: context.length,
        hasContent: context.length > 0
      });
  
      const formattedPrompt = promptUtils.formatContextPrompt(
        promptUtils.truncateContext(context),
        query
      );
      
      Logger.debug('Formatted prompt', { 
        promptLength: formattedPrompt.length,
        truncated: formattedPrompt.length < context.length,
        prompt: formattedPrompt
      });
  
      Logger.debug('Processing query', { 
        paths: paths || path || 'no path provided', 
        model 
      });
      
      let response;
      switch (model) {
        case 'ollama':
          response = await modelInterface.queryOllama(formattedPrompt, context);
          break;
        case 'together':
          response = await modelInterface.queryTogether(formattedPrompt, context);
          break;
        case 'llamacpp':
          response = await modelInterface.queryLlamaCpp(formattedPrompt, context);
          break;
        default:
          throw new Error('Invalid model specified');
      }
  
      Logger.info('Query processed successfully');
      res.json(response);
    } catch (error) {
      Logger.error('Error processing query', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
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