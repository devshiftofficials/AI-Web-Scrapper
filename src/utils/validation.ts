// Input validation and XSS prevention utilities
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export function validateUrl(url: string): ValidationResult {
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'Only HTTP and HTTPS URLs are allowed'
      };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return {
          isValid: false,
          error: 'Suspicious URL pattern detected'
        };
      }
    }

    // Sanitize URL
    const sanitizedUrl = urlObj.toString();
    
    return {
      isValid: true,
      sanitizedValue: sanitizedUrl
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters and patterns
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .replace(/iframe/gi, '') // Remove iframe tags
    .replace(/object/gi, '') // Remove object tags
    .replace(/embed/gi, '') // Remove embed tags
    .replace(/form/gi, '') // Remove form tags
    .trim();
}

export function validateDepth(depth: number): ValidationResult {
  if (typeof depth !== 'number' || isNaN(depth)) {
    return {
      isValid: false,
      error: 'Depth must be a valid number'
    };
  }

  if (depth < 0 || depth > 10) {
    return {
      isValid: false,
      error: 'Depth must be between 0 and 10'
    };
  }

  return {
    isValid: true,
    sanitizedValue: Math.floor(depth).toString()
  };
}

export function validateMaxPages(maxPages: number): ValidationResult {
  if (typeof maxPages !== 'number' || isNaN(maxPages)) {
    return {
      isValid: false,
      error: 'Max pages must be a valid number'
    };
  }

  if (maxPages < 1 || maxPages > 1000) {
    return {
      isValid: false,
      error: 'Max pages must be between 1 and 1000'
    };
  }

  return {
    isValid: true,
    sanitizedValue: Math.floor(maxPages).toString()
  };
}

export function validateCustomSchema(schema: Record<string, string>): ValidationResult {
  if (!schema || typeof schema !== 'object') {
    return {
      isValid: false,
      error: 'Schema must be a valid object'
    };
  }

  const maxFields = 20;
  const fieldKeys = Object.keys(schema);
  
  if (fieldKeys.length > maxFields) {
    return {
      isValid: false,
      error: `Schema cannot have more than ${maxFields} fields`
    };
  }

  for (const [key, value] of Object.entries(schema)) {
    // Validate field name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      return {
        isValid: false,
        error: `Invalid field name: ${key}. Field names must start with a letter or underscore and contain only letters, numbers, and underscores.`
      };
    }

    // Validate field selector
    if (typeof value !== 'string' || value.trim() === '') {
      return {
        isValid: false,
        error: `Field "${key}" must have a valid CSS selector`
      };
    }

    // Sanitize CSS selector
    const sanitizedSelector = sanitizeInput(value);
    if (sanitizedSelector !== value) {
      return {
        isValid: false,
        error: `Field "${key}" contains invalid characters in selector`
      };
    }
  }

  return {
    isValid: true,
    sanitizedValue: JSON.stringify(schema)
  };
}

export function validateExtractionOptions(options: Record<string, boolean | Record<string, string>>): ValidationResult {
  if (!options || typeof options !== 'object') {
    return {
      isValid: false,
      error: 'Extraction options must be a valid object'
    };
  }

  const validOptions = [
    'text',
    'links',
    'images',
    'metaTags',
    'tables',
    'structuredData',
    'customSchema'
  ];

  for (const [key, value] of Object.entries(options)) {
    if (!validOptions.includes(key)) {
      return {
        isValid: false,
        error: `Invalid extraction option: ${key}`
      };
    }

    if (typeof value !== 'boolean') {
      return {
        isValid: false,
        error: `Extraction option "${key}" must be a boolean`
      };
    }
  }

  return {
    isValid: true,
    sanitizedValue: JSON.stringify(options)
  };
}
