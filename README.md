# File Context MCP (Model Context Processor)

## Overview
File Context MCP is a TypeScript-based application that provides an API for querying Large Language Models (LLMs) with context from local files. It supports multiple LLM providers (Ollama, Together.ai, and llama.cpp) and can process various file types to generate context-aware responses.

## Core Features

### 1. File System Navigation
- Secure storage directory isolation
- Dynamic file and directory traversal
- Support for multiple file types (`.txt`, `.md`, `.ts`, `.json`, etc.)
- Safe path handling with sanitization and validation

Reference implementation:

```13:36:src/core/fileSystem.ts
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

```


### 2. Context Processing
- Intelligent context formatting for LLM queries
- Smart context truncation with configurable limits:
  - Per-file limit (1000 characters)
  - Total context limit (4000 characters)
- File content aggregation for directory queries
- Automatic context size management

### 3. Multi-Model Support
- Ollama (local) integration
- Together.ai (cloud) integration
- llama.cpp (local) integration
- Extensible model interface design

## API Endpoints

### 1. List Files
```
GET /api/files
Query Parameters:
  - path (optional): Path relative to storage directory
  - recursive (optional): Boolean to list files recursively
```

### 2. Upload File
```
POST /api/files/upload
Content-Type: multipart/form-data
Body:
  - file: File (must be a text file, max 5MB)
```

### 3. Query with Context
```
POST /api/query
Body:
{
  "path": string | string[],
  "query": string,
  "model": "ollama" | "together" | "llamacpp"
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

2. **Docker Setup**

```1:40:docker-compose.yml
version: '3.8'

services:
  file-context-client:
    container_name: file-context-client
    build: 
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ./client:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3001
    depends_on:
      - file-context-api

  file-context-api:
    container_name: file-context-api
    build:
      context: ./file-context-mcp
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - ./file-context-mcp/storage:/app/storage
    environment:
      - PORT=3001
      - TOGETHER_API_KEY=${TOGETHER_API_KEY}
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - LLAMA_CPP_BASE_URL=http://host.docker.internal:8080
      - MODEL_NAME=llama3.2
    extra_hosts:
      - "host.docker.internal:host-gateway"
    env_file:
      - file-context-mcp/.env

volumes:
  ollama_data: 
```


3. **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd file-context-mcp

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## Supported File Types

The application supports various text-based file types:

```4:53:src/utils/fileUtils.ts
  isTextFile(filePath: string): boolean {
    const textExtensions = {
      // Documents
      documents: [
        '.txt', '.md', '.rtf', '.log', '.doc', '.docx', '.odt', 
        '.pdf', '.tex', '.epub'
      ],
      
      // Code files
      code: [
        // Web
        '.html', '.css', '.js', '.jsx', '.ts', '.tsx', 
        '.vue', '.svelte', '.php', '.asp', '.jsp',
        // Programming languages
        '.py', '.java', '.cpp', '.c', '.h', '.cs', '.rb', 
        '.go', '.rs', '.swift', '.kt', '.scala', '.r',
        // Shell/Scripts
        '.sh', '.bash', '.ps1', '.bat', '.cmd'
      ],
      
      // Data formats
      data: [
        '.json', '.yaml', '.yml', '.xml', '.csv', '.tsv',
        '.ini', '.conf', '.config', '.env', '.properties',
        '.xls', '.xlsx', '.ods'
      ],
      
      // Web assets
      webAssets: [
        '.svg', '.htm', '.xhtml', '.less', '.sass', '.scss',
        '.graphql', '.gql', '.wasm'
      ],
      
      // Configuration
      config: [
        '.toml', '.editorconfig', '.gitignore', '.npmrc',
        '.eslintrc', '.prettierrc', '.babelrc'
      ],
      
      // Database
      database: [
        '.sql', '.prisma', '.sqllite', '.mdb'
      ]
    };

    const extension = path.extname(filePath).toLowerCase();
    return Object.values(textExtensions)
      .flat()
      .includes(extension);
  }
```


## Security Features

1. **Storage Directory Isolation**
   - All file operations restricted to `/storage` directory
   - Path validation prevents directory traversal
   - Relative paths always resolved against storage root

2. **File Upload Security**
   - File type validation
   - Size limits (5MB per file)
   - Secure file storage
   - Safe file deletion

## Project Structure
```
file-context-mcp/
├── src/
│   ├── server.ts              # Main application server
│   ├── core/                  # Core functionality
│   │   ├── fileSystem.ts      # File operations
│   │   └── modelInterface.ts  # LLM integrations
│   ├── utils/                 # Utility functions
│   ├── config/               # Configuration
│   └── resources/           # API specifications
├── storage/                 # File storage directory
├── dist/                   # Compiled output
└── node_modules/          # Dependencies
```

## Development

### Running with Docker
```bash
# Build and start all services
docker-compose up --build

# Start specific service
docker-compose up file-context-api

# Stop all services
docker-compose down
```

### Testing
The project includes a Postman collection for API testing:

```1:137:file-context-mcp/postman/File-Context-MCP.postman_collection.json
{
	"info": {
		"_postman_id": "b4ddfb19-1edd-4b28-a859-3802788894c8",
		"name": "File-Context-MCP",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "24037082"
	},
	"item": [
		{
			"name": "List files",
			"request": {
				"auth": {
					"type": "noauth"
				},
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3001/api/files?path=./storage",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3001",
					"path": [
						"api",
						"files"
					],
					"query": [
						{
							"key": "path",
							"value": "./storage"
						}
					]
				}
			},
			"response": []
		},
		{
			"name": "Query",
			"request": {
				"auth": {
					"type": "noauth"
				},
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\r\n    \"path\": \"./storage/code-samples/example.ts\",\r\n    \"query\": \"Explain what this TypeScript code does\",\r\n    \"model\": \"ollama\"\r\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3001/api/query",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3001",
					"path": [
						"api",
						"query"
					]
				}
			},
			"response": []
		},
		{
			"name": "Analyze multiple files",
			"request": {
				"auth": {
					"type": "noauth"
				},
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\r\n    \"path\": \"./storage\",\r\n    \"query\": \"What types of files are in this directory and summarize their contents?\",\r\n    \"model\": \"ollama\"\r\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3001/api/query",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3001",
					"path": [
						"api",
						"query"
					]
				}
			},
			"response": []
		},
		{
			"name": "File Upload",
			"request": {
				"auth": {
					"type": "noauth"
				},
				"method": "POST",
				"header": [],
				"body": {
					"mode": "formdata",
					"formdata": [
						{
							"key": "file",
							"type": "file",
							"src": "/C:/Users/btate/Downloads/lover.yml"
						}
					]
				},
				"url": {
					"raw": "http://localhost:3001/api/files/upload",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3001",
					"path": [
						"api",
						"files",
						"upload"
					]
				}
			},
			"response": []
		}
	]
}
```


## Error Handling
The application implements comprehensive error handling:
- File system errors
- API response errors
- Invalid input errors
- Model-specific errors
- File upload/deletion errors

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the ISC License - see the LICENSE file for details.

## Future Considerations
1. Streaming support for responses
2. Rate limiting and caching
3. Additional model providers
4. Enhanced context processing
5. Support for binary file types

For more detailed documentation on specific features, please refer to the docs directory in the repository.
