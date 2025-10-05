// Content extraction utility for monitoring
import * as cheerio from 'cheerio';

export interface ExtractedContent {
  selector: string;
  content: string;
  textContent: string;
  htmlContent: string;
  attributes: Record<string, string>;
}

export async function extractContentFromSelectors(
  html: string, 
  selectors: string[]
): Promise<Record<string, string>> {
  const $ = cheerio.load(html);
  const extractedContent: Record<string, string> = {};

  for (const selector of selectors) {
    try {
      const elements = $(selector);
      
      if (elements.length === 0) {
        extractedContent[selector] = '';
        continue;
      }

      if (elements.length === 1) {
        // Single element - extract text content
        extractedContent[selector] = elements.text().trim();
      } else {
        // Multiple elements - extract all text content
        const texts = elements.map((_, el) => $(el).text().trim()).get();
        extractedContent[selector] = texts.join(' | ');
      }
    } catch (error) {
      console.warn(`Failed to extract content for selector "${selector}":`, error);
      extractedContent[selector] = '';
    }
  }

  return extractedContent;
}

export async function extractDetailedContent(
  html: string, 
  selectors: string[]
): Promise<ExtractedContent[]> {
  const $ = cheerio.load(html);
  const extractedContent: ExtractedContent[] = [];

  for (const selector of selectors) {
    try {
      const elements = $(selector);
      
      if (elements.length === 0) {
        extractedContent.push({
          selector,
          content: '',
          textContent: '',
          htmlContent: '',
          attributes: {}
        });
        continue;
      }

      elements.each((_, element) => {
        const $el = $(element);
        const attributes: Record<string, string> = {};
        
        // Extract all attributes
        $el.get(0)?.attributes?.forEach((attr: Attr) => {
          attributes[attr.name] = attr.value;
        });

        extractedContent.push({
          selector,
          content: $el.text().trim(),
          textContent: $el.text().trim(),
          htmlContent: $el.html() || '',
          attributes
        });
      });
    } catch (error) {
      console.warn(`Failed to extract detailed content for selector "${selector}":`, error);
      extractedContent.push({
        selector,
        content: '',
        textContent: '',
        htmlContent: '',
        attributes: {}
      });
    }
  }

  return extractedContent;
}

export function generateContentHash(content: string): string {
  // Simple hash function for content comparison
  let hash = 0;
  if (content.length === 0) return hash.toString();
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

export function compareContent(oldContent: string, newContent: string): {
  hasChanged: boolean;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  similarity: number;
} {
  if (oldContent === newContent) {
    return {
      hasChanged: false,
      changeType: 'unchanged',
      similarity: 1.0
    };
  }

  if (!oldContent && newContent) {
    return {
      hasChanged: true,
      changeType: 'added',
      similarity: 0.0
    };
  }

  if (oldContent && !newContent) {
    return {
      hasChanged: true,
      changeType: 'removed',
      similarity: 0.0
    };
  }

  // Calculate similarity using simple character comparison
  const maxLength = Math.max(oldContent.length, newContent.length);
  const minLength = Math.min(oldContent.length, newContent.length);
  
  let matches = 0;
  for (let i = 0; i < minLength; i++) {
    if (oldContent[i] === newContent[i]) {
      matches++;
    }
  }

  const similarity = maxLength > 0 ? matches / maxLength : 0;

  return {
    hasChanged: true,
    changeType: 'modified',
    similarity
  };
}
