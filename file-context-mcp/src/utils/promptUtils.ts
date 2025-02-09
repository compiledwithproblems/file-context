import { Logger } from './logger';

export const promptUtils = {
    formatContextPrompt(context: string, query: string): string {
      Logger.debug('Raw inputs before formatting', {
        rawContext: context,
        rawQuery: query
      });

      const systemPrompt = `### System: You are an expert programmer named Lexie providing practical solutions. Always format code blocks with the appropriate language tag (e.g. \`\`\`javascript).`;
      
      const contextSection = context.trim() ? 
        `\nContext files:\n${context.split('File:').map(part => {
          if (!part.trim()) return '';
          return `File:${part.trim()}\n\`\`\`\n${part.split('\n').slice(1).join('\n')}\n\`\`\``;
        }).join('\n\n')}` : '';

      return `${systemPrompt}${contextSection}

### User: ${query}

### Assistant:`;
    },
  
    truncateContext(context: string, maxLength: number = 4000): string {
      if (!context || context.length <= maxLength) return context;
      
      // Try to truncate at a natural break point
      const truncated = context.slice(0, maxLength);
      const lastNewline = truncated.lastIndexOf('\n');
      
      if (lastNewline > maxLength * 0.8) {
        return truncated.slice(0, lastNewline) + '\n... (truncated)';
      }
      
      return truncated + '... (truncated)';
    }
  };