export const validators = {
    isValidPath(path?: string): boolean {
      // Allow undefined/null paths
      if (!path) return true;
      // Basic path validation
      return typeof path === 'string' && !path.includes('..');
    },
  
    isValidQuery(query: string): boolean {
      return typeof query === 'string' && query.trim().length > 0;
    },
  
    isValidModel(model: string): boolean {
      const validModels = ['ollama', 'together', 'llamacpp'];
      return validModels.includes(model);
    }
  };