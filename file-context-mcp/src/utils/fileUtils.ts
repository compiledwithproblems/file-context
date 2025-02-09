import path from 'path';

export const fileUtils = {
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
  },

  // Helper to check if a file is a binary format that we want to support
  isSupportedBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
      // Microsoft Office
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      
      // OpenDocument
      '.odt', '.ods', '.odp',
      
      // PDF
      '.pdf',
      
      // Archives (for future support)
      '.zip', '.rar', '.7z', '.tar', '.gz',
      
      // Images (for future support)
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
      
      // Other binary formats
      '.epub', '.mobi'
    ];

    const extension = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(extension);
  },

  sanitizePath(inputPath: string): string {
    // Remove any parent directory traversal
    const normalizedPath = path.normalize(inputPath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.resolve(normalizedPath);
  },

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  // Helper to get MIME type for file uploads
  getMimeType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      // Documents
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      
      // Spreadsheets
      '.csv': 'text/csv',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
      
      // Data formats
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.yaml': 'application/yaml',
      '.yml': 'application/yaml',
      
      // Code files
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.py': 'text/x-python',
      '.java': 'text/x-java-source',
      '.html': 'text/html',
      '.css': 'text/css',
      
      // Default
      'default': 'application/octet-stream'
    };

    return mimeTypes[extension] || mimeTypes.default;
  }
};