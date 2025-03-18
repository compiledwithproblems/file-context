# File Context

File Context is a tool that allows developers to work with their codebase in a more contextual manner. It provides a web interface for exploring, searching, and understanding your code, enhanced with AI capabilities. The system is designed to work with multiple AI providers including Ollama, llama.cpp, and Together.ai, giving you flexibility in choosing your preferred AI backend.

## Project Overview

The project consists of two main components:

1. **Client** - A frontend application built with React/TypeScript that provides a user interface for interacting with your codebase.
2. **File Context MCP (Main Control Program)** - A backend service that handles file operations, AI processing, and serves the API for the client.

## Features

- Interactive file explorer
- Code search and navigation
- AI-powered code understanding and analysis
- Support for multiple AI models including local (Ollama, llama.cpp) and cloud-based models (via Together AI)

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
- [Node.js](https://nodejs.org/) (LTS version recommended)
- An API key from [Together AI](https://www.together.ai/) (optional, for cloud-based models)
- Ollama or llama.cpp running locally (optional, for local models)

## Quick Start

### Using Docker Compose (Recommended)


1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/file-context.git
   cd file-context
   ```

2. Create a `.env` file in the `file-context-mcp` directory:
   ```
   TOGETHER_API_KEY=your_together_api_key  # Optional
   OLLAMA_BASE_URL=http://host.docker.internal:11434  # If using Ollama locally
   LLAMA_CPP_BASE_URL=http://host.docker.internal:8080  # If using llama.cpp locally
   MODEL_NAME=llama3.2  # Default model to use
   ```

3. Start the application using Docker Compose:
   ```bash
   docker-compose up
   ```

4. Access the application in your browser at http://localhost:5173

### Manual Setup

If you prefer to run the components separately:

#### Backend (file-context-mcp)

1. Navigate to the backend directory:
   ```bash
   cd file-context-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the configuration mentioned above.

4. Build and start the server:
   ```bash
   npm run build
   npm start
   ```

The API server will start on port 3001 (or as configured in your .env file).

#### Frontend (client)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The client will be available at http://localhost:5173.

## Configuration Options

### Backend Environment Variables

- `PORT`: Port for the API server (default: 3001)
- `TOGETHER_API_KEY`: API key for Together AI
- `OLLAMA_BASE_URL`: Base URL for Ollama API
- `LLAMA_CPP_BASE_URL`: Base URL for llama.cpp API
- `MODEL_NAME`: Default AI model to use

### Frontend Environment Variables

- `VITE_API_URL`: URL of the backend API (default in Docker: http://localhost:3001)

## Project Structure
