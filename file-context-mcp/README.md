# File Context MCP (Model Context Processor)

## Overview
File Context MCP is a TypeScript-based application that provides an API for querying Large Language Models (LLMs) with context from local files. It supports multiple LLM providers (Ollama, Together.ai, and llama.cpp) and can process various file types to generate context-aware responses.

## Core Features

### 1. File System Navigation
- Secure storage directory isolation
- Dynamic file and directory traversal within storage
- Support for multiple file types (`.txt`, `.md`, `.ts`, `.json`, etc.)
- Safe path handling with sanitization and validation

```typescript:src/core/fileSystem.ts
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
}
```

### 2. Context Processing
- Intelligent context formatting for LLM queries
- Smart context truncation with configurable limits:
  - Per-file limit (1000 characters)
  - Total context limit (4000 characters)
- File content aggregation for directory queries
- Automatic context size management to prevent timeouts

```typescript
// Example of context handling
export class ModelInterface {
  async query(prompt: string, context: FileInfo[], model: string): Promise<LLMResponse> {
    // Convert FileInfo array to string context with truncation
    const MAX_CONTENT_LENGTH = 1000; // Per-file limit
    const contextString = context
      .map(file => {
        let content = file.content || '[No content available]';
        if (content.length > MAX_CONTENT_LENGTH) {
          content = content.slice(0, MAX_CONTENT_LENGTH) + '... [content truncated]';
        }
        return `File: ${file.path}\n${content}`;
      })
      .join('\n\n');
    
    // Process with selected model...
  }
}
```

### Prompt Formatting
The system uses a structured prompt format:
```typescript
const formatPrompt = (prompt: string, context: string): string => {
  const systemPrompt = `You are a helpful AI assistant. Analyze the following file content and answer the question. Keep your response concise and focused on the question.`;
  
  // Ensure reasonable context size
  const MAX_TOTAL_CONTEXT = 4000;
  let formattedContext = context;
  if (context.length > MAX_TOTAL_CONTEXT) {
    formattedContext = context.slice(0, MAX_TOTAL_CONTEXT) + '\n... [additional context truncated for length]';
  }
  
  return `${systemPrompt}\n\nContext:\n${formattedContext}\n\nQuestion: ${prompt}`;
};
```

### Query Examples

1. **Simple Query (No Context)**
```json
{
  "query": "What is 2+2?",
  "model": "ollama"
}
```

2. **Single File Context**
```json
{
  "path": "src/App.tsx",
  "query": "What does this React component do?",
  "model": "ollama"
}
```

3. **Multiple Files Context**
```json
{
  "path": ["src/App.tsx", "src/components/Button.tsx"],
  "query": "Compare these two files",
  "model": "ollama"
}
```

### Performance Considerations

1. **Context Size Management**
   - Individual file content is limited to 1000 characters
   - Total context is capped at 4000 characters
   - Automatic truncation with clear indicators
   - Prevents timeouts and memory issues

2. **Response Time Optimization**
   - Empty context queries process faster
   - Large files are automatically truncated
   - Multiple file contexts are properly formatted
   - Clear logging for debugging response times

3. **Error Handling**
   - Graceful handling of missing files
   - Clear error messages for context issues
   - Proper logging of truncation events
   - Network error handling with retries

### 3. Multi-Model Support
- Ollama (local) integration
- Together.ai (cloud) integration
- llama.cpp (local) integration
- Extensible model interface design

```4:69:src/core/modelInterface.ts
export interface LLMResponse {
  text: string;
  model: string;
  error?: string;
}

export class ModelInterface {
  async queryOllama(prompt: string, context: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(`${config.ollamaBaseUrl}/api/generate`, {
        model: config.modelName,
        prompt: this.formatPrompt(prompt, context),
        stream: false
      });
      return {
      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama');
      }
    } catch (error) {
      return {
        text: response.data.response,
        model: 'ollama'
      };
    } catch (error) {
      console.error('Ollama error:', error);
      return {
        text: '',
        model: 'ollama',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
          model: config.modelName,
  async queryTogether(prompt: string, context: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        'https://api.together.xyz/inference',
        {
          model: config.modelName,
          prompt: this.formatPrompt(prompt, context),
          max_tokens: 512,
        },
        {
          headers: {
            Authorization: `Bearer ${config.togetherApiKey}`
          }
        }
      );
      return {
      return {
        text: response.data.output.text,
        model: 'together'
      };
    } catch (error) {
      return {
        text: '',
        model: 'together',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  private formatPrompt(prompt: string, context: string): string {
    return `Context: ${context}\n\nQuestion: ${prompt}`;
  }
}
```


## Architecture

### Core Components

1. **Server (server.ts)**
   - Express.js REST API implementation
   - File upload/delete handling with multer
   - Request validation and routing
   - OpenAPI/Swagger integration

2. **FileSystemTools (core/fileSystem.ts)**
   - File and directory operations
   - Content reading and parsing
   - Directory traversal
   - Secure file deletion
   - Error handling for file operations

3. **ModelInterface (core/modelInterface.ts)**
   - Multiple LLM provider support (Ollama, Together.ai)
   - Response formatting and error handling
   - Configurable model parameters
   - Unified query interface

4. **Utility Modules**
   - `fileUtils`: File type detection, path sanitization, size formatting
   - `promptUtils`: Context formatting, intelligent truncation
   - `validators`: Path, query, and model validation
   - `logger`: Structured logging with levels

5. **Configuration (config/config.ts)**
   - Environment variable management
   - API keys and endpoints
   - Model configuration
   - Server settings

6. **API Specification (resources/file-context-api.yml)**
   - OpenAPI 3.0 documentation
   - Request/response schemas
   - Endpoint documentation
   - Error response definitions

## API Endpoints

### GET /api/files
Lists files and directories within the storage directory.

**Query Parameters:**
- `path` (optional): Path relative to storage directory. Empty or "." returns storage root contents
- `recursive` (optional): Boolean to list files recursively

**Example Response:**
```json
[
  {
    "name": "code-samples",
    "path": "code-samples",
    "type": "directory"
  },
  {
    "name": "config-example.json",
    "path": "config-example.json",
    "type": "file",
    "content": "..."
  }
]
```

### 2. Upload File
```
POST /api/files/upload
Content-Type: multipart/form-data
Body:
  - file: File (must be a text file, max 5MB)
Response:
{
  "message": "File uploaded successfully",
  "file": {
    "name": string,
    "size": string,
    "path": string
  }
}
```

### 3. Delete File
```
DELETE /api/files/{filename}
Params:
  - filename: string (name of file to delete)
Response:
{
  "message": "File deleted successfully"
}
```

### 4. Query with Context
```
POST /api/query
Body:
{
  "path": string (optional),
  "query": string,
  "model": "ollama" | "together" | "llamacpp"
}
Response:
{
  "text": string,
  "model": string,
  "error?: string
}
```

## Setup and Configuration

1. **Environment Variables**
```env
TOGETHER_API_KEY=your_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
LLAMA_CPP_BASE_URL=http://localhost:8080
MODEL_NAME=llama2
DEFAULT_MODEL=llamacpp
PORT=3001
```

2. **Installation**
```bash
npm install
```

3. **Running the Application**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## How It Works

1. **File Processing Flow**
   - Request received → Path validation → File reading → Content extraction
   - Directory handling includes recursive file reading
   - Content filtering based on file type
   - File uploads are validated for type and size
   - Secure file deletion with path validation

2. **Context Processing**
   - File contents are aggregated
   - Context is formatted with clear boundaries
   - Large contexts are intelligently truncated
   - Prompt formatting adds structure for LLM understanding

3. **Model Integration**
   - Unified interface for different LLM providers
   - Error handling and response normalization
   - Configurable model parameters

## Security Features

1. **Storage Directory Isolation**
   - All file operations restricted to `/storage` directory
   - Path validation ensures no directory traversal outside storage
   - Relative paths always resolved against storage root
   - Empty or "." paths default to storage root

2. **Path Sanitization**
   - Prevention of directory traversal attacks
   - Path validation and normalization
   - Safe file type checking
   - All paths validated against storage root

3. **File Upload Security**
   - Files stored only in designated storage directory
   - File type validation
   - File size limits (10MB max)
   - Secure file storage
   - Safe file deletion within storage only

## Supported File Types

The application supports the following text-based file types:
- Documentation: `.txt`, `.md`
- Code files: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.cpp`, `.c`, `.h`
- Configuration: `.json`, `.yaml`, `.yml`, `.env`
- Web files: `.html`, `.css`
- Data files: `.csv`, `.xml`, `.log`

File type validation is enforced during:
- File uploads
- Context processing
- File reading operations

Maximum file size: 5MB per file

## Error Handling

The application implements comprehensive error handling:
- File system errors
- API response errors
- Invalid input errors
- Model-specific errors
- File upload/deletion errors

## Development

### Project Structure
```
file-context-mcp/
├── src/
│   ├── server.ts              # Main application server
│   ├── core/                  # Core functionality
│   │   ├── fileSystem.ts      # Secure file operations handling
│   │   └── modelInterface.ts  # LLM provider integrations
│   ├── utils/                 # Utility functions
│   │   ├── fileUtils.ts       # File type & path utilities
│   │   ├── promptUtils.ts     # Prompt formatting
│   │   ├── validators.ts      # Input validation
│   │   └── logger.ts         # Application logging
│   ├── config/               # Configuration
│   │   └── config.ts        # Environment & app config
│   └── resources/           # API specifications
│       └── file-context-api.yml  # OpenAPI spec
├── storage/                 # File storage directory
│   ├── code-samples/       # Example code files
│   └── notes/             # Documentation & notes
├── postman/               # API testing
│   └── File-Context-MCP.postman_collection.json  # Postman collection
├── dist/                  # Compiled output
└── node_modules/         # Dependencies
```

### Adding New Features
1. **New File Types**
   - Add extensions to `fileUtils.isTextFile()`
   - Implement specific handlers if needed

2. **New Model Providers**
   - Extend `ModelInterface` class
   - Add provider to `validators.isValidModel()`
   - Implement provider-specific error handling

## Testing

### Postman Collection
The project includes a Postman collection (`postman/File-Context-MCP.postman_collection.json`) for testing all API endpoints. To use it:

1. **Import the Collection**
   - Open Postman
   - Click "Import" button
   - Select or drag the `File-Context-MCP.postman_collection.json` file

2. **Available Requests**
   ```
   File-Context-MCP
   ├── List files
   │   └── GET http://localhost:3001/api/files?path=./storage
   ├── Query
   │   └── POST http://localhost:3001/api/query (single file analysis)
   ├── Analyze multiple files
   │   └── POST http://localhost:3001/api/query (directory analysis)
   └── File Upload
       └── POST http://localhost:3001/api/files/upload
   ```

3. **Testing File Operations**
   - **List Files**: View contents of the storage directory
   - **Upload File**: Use form-data with key "file" and select a text file
   - **Query File**: Analyze single file contents with LLM
   - **Analyze Directory**: Process multiple files with LLM

4. **Example Queries**
   ```json
   // Single file analysis
   {
       "path": "./storage/code-samples/example.ts",
       "query": "Explain what this TypeScript code does",
       "model": "llamacpp"
   }

   // Directory analysis
   {
       "path": "./storage",
       "query": "What types of files are in this directory and summarize their contents?",
       "model": "llamacpp"
   }

   // Query without context
   {
       "query": "What is 2+2?",
       "model": "llamacpp"
   }
   ```

5. **File Upload Guide**
   - Use the "File Upload" request
   - Select "form-data" in the Body tab
   - Add key "file" with type "File"
   - Choose a supported text file (see Supported File Types)
   - Maximum file size: 5MB

### Manual Testing
- Use the provided test files in `/storage`
- Test different file types and queries
- Verify model responses and error handling
- Test file size limits and type restrictions

### Environment Setup
Make sure to:
- Have the server running (`npm run dev`)
- Configure environment variables
- Have Ollama running locally (for Ollama model)
- Set Together.ai API key (for Together model)

## Future Considerations
1. How to handle large files efficiently
2. Expanding supported file types
3. Optimizing context processing
4. Adding streaming support for responses
5. Implementing rate limiting and caching

This project demonstrates modern TypeScript/Node.js practices with a focus on modularity, type safety, and error handling while providing a flexible interface for LLM interactions with file-based context.

### Security Considerations
1. **Storage Directory**
   - All file operations are restricted to the `/storage` directory
   - Paths are validated and normalized before any operation
   - Directory traversal attempts are blocked
   - Relative paths are always resolved against storage root

2. **Path Handling**
   - Empty paths default to storage root
   - "." is treated as storage root
   - Parent directory references ("..") are sanitized
   - Absolute paths are validated against storage root

