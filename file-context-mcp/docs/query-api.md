# Query API Documentation

## Endpoints

### Query with File Context
```typescript
POST /api/query

// Request Body
{
  "path": string | string[],  // Single file path or array of paths relative to storage
  "query": string,            // The question or prompt for the LLM
  "model": "ollama" | "llamacpp" | "together"  // Which model to use
}

// Example
{
  "path": "code-samples/example.ts",
  "query": "Explain what this code does",
  "model": "llamacpp"
}

// Multiple files example
{
  "path": [
    "code-samples/example.ts",
    "notes/project-notes.md"
  ],
  "query": "Compare these files and explain their relationship",
  "model": "ollama"
}

// Response
{
  "text": string,    // The model's response
  "model": string,   // Which model was used
  "error"?: string   // Present if there was an error
}
```

## Model Selection

### Available Models
1. **Ollama** (Local)
   ```typescript
   {
     "model": "ollama",
     // Uses MODEL_NAME from env, defaults to "llama2"
   }
   ```

2. **llama.cpp** (Local)
   ```typescript
   {
     "model": "llamacpp",
     // Connects to LLAMA_CPP_BASE_URL from env
     // Defaults to "http://localhost:8080"
   }
   ```

3. **Together.ai** (Cloud)
   ```typescript
   {
     "model": "together",
     // Requires TOGETHER_API_KEY in env
   }
   ```

### Default Model
- Set via `DEFAULT_MODEL` in environment variables
- Falls back to "llamacpp" if not specified

### Model Configuration
```typescript
// Environment Variables
TOGETHER_API_KEY=your_api_key
OLLAMA_BASE_URL=http://localhost:11434
LLAMA_CPP_BASE_URL=http://localhost:8080
MODEL_NAME=llama2
DEFAULT_MODEL=llamacpp
```

## Example Usage

### Basic Query
```typescript
// Query a specific file with default model
const response = await fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'code-samples/example.ts',
    query: 'Explain this code',
    model: 'llamacpp'
  })
});

const result = await response.json();
// {
//   text: "This TypeScript code defines...",
//   model: "llamacpp"
// }
```

### Multiple Files Query
```typescript
// Query multiple files with Ollama
const response = await fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: [
      'code-samples/example.ts',
      'notes/project-notes.md'
    ],
    query: 'Compare these files',
    model: 'ollama'
  })
});
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/query', ...);
  const result = await response.json();
  
  if (result.error) {
    // Handle error from model
    console.error('Model error:', result.error);
  } else {
    // Process successful response
    console.log('Model response:', result.text);
  }
} catch (error) {
  // Handle network/server errors
  console.error('API error:', error);
}
```

## Best Practices

1. **Model Selection**
   - Use `llamacpp` for fast local inference
   - Use `ollama` for more model options
   - Use `together` for cloud-based inference

2. **Path References**
   - Always use paths relative to storage directory
   - Multiple files should be related to the query
   - Order paths logically for context building

3. **Query Formatting**
   - Be specific in your queries
   - Consider file types and content
   - Keep queries focused and clear

4. **Error Handling**
   - Always check for `error` in response
   - Handle network errors separately
   - Consider model-specific error messages

## Limitations

- Maximum context length varies by model
- Response time varies by model and input size
- File content must be text-based
- All files must be within storage directory 