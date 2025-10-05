// Image download utilities
export interface ImageInfo {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  size?: number;
  filename?: string;
  downloaded?: boolean;
}

export interface DownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  size?: number;
}

export interface BulkDownloadResult {
  totalImages: number;
  successfulDownloads: number;
  failedDownloads: number;
  results: Array<{
    image: ImageInfo;
    result: DownloadResult;
  }>;
  zipFile?: string; // Base64 encoded zip file
}

// Convert relative URLs to absolute URLs
export function resolveImageUrl(src: string, baseUrl: string): string {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return src;
  }
}

// Extract filename from URL
export function extractFilename(url: string, alt?: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    if (filename && filename.includes('.')) {
      return filename;
    }
    
    // If no extension, try to get from alt text or generate one
    const cleanAlt = alt?.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) || 'image';
    return `${cleanAlt}.jpg`;
  } catch {
    return alt ? `${alt.replace(/[^a-zA-Z0-9]/g, '_')}.jpg` : 'image.jpg';
  }
}

// Download a single image
export async function downloadImage(
  imageInfo: ImageInfo, 
  baseUrl: string
): Promise<DownloadResult> {
  try {
    const absoluteUrl = resolveImageUrl(imageInfo.src, baseUrl);
    
    const response = await fetch(absoluteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const blob = await response.blob();
    const filename = extractFilename(absoluteUrl, imageInfo.alt);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      size: blob.size
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Download multiple images as a ZIP file
export async function downloadImagesAsZip(
  images: ImageInfo[], 
  baseUrl: string,
  zipName: string = 'scraped_images.zip'
): Promise<BulkDownloadResult> {
  const results: Array<{ image: ImageInfo; result: DownloadResult }> = [];
  let successfulDownloads = 0;
  let failedDownloads = 0;

  try {
    // Dynamic import for JSZip (we'll need to add this dependency)
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Download each image and add to ZIP
    for (const image of images) {
      try {
        const absoluteUrl = resolveImageUrl(image.src, baseUrl);
        
        const response = await fetch(absoluteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          results.push({
            image,
            result: {
              success: false,
              error: `HTTP ${response.status}: ${response.statusText}`
            }
          });
          failedDownloads++;
          continue;
        }

        const blob = await response.blob();
        const filename = extractFilename(absoluteUrl, image.alt);
        
        // Add to ZIP with unique filename to avoid conflicts
        const uniqueFilename = `${successfulDownloads + 1}_${filename}`;
        zip.file(uniqueFilename, blob);

        results.push({
          image,
          result: {
            success: true,
            filename: uniqueFilename,
            size: blob.size
          }
        });
        successfulDownloads++;
      } catch (error) {
        results.push({
          image,
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        failedDownloads++;
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create download link for ZIP
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      totalImages: images.length,
      successfulDownloads,
      failedDownloads,
      results
    };
  } catch (_error) {
    return {
      totalImages: images.length,
      successfulDownloads,
      failedDownloads,
      results,
      zipFile: undefined
    };
  }
}

// Get image dimensions and size info
export async function getImageInfo(imageUrl: string, baseUrl: string): Promise<Partial<ImageInfo>> {
  try {
    const absoluteUrl = resolveImageUrl(imageUrl, baseUrl);
    
    const response = await fetch(absoluteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return {};
    }

    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: blob.size,
          filename: extractFilename(absoluteUrl)
        });
      };
      img.onerror = () => {
        resolve({
          size: blob.size,
          filename: extractFilename(absoluteUrl)
        });
      };
      img.src = absoluteUrl;
    });
  } catch {
    return {};
  }
}

// Validate image URL
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    
    return validExtensions.some(ext => pathname.endsWith(ext)) || 
           urlObj.searchParams.has('format') ||
           pathname.includes('image') ||
           urlObj.hostname.includes('img') ||
           urlObj.hostname.includes('image');
  } catch {
    return false;
  }
}

// Filter and clean image data
export function processImageData(images: Array<{ src: string; alt: string }>, baseUrl: string): ImageInfo[] {
  return images
    .filter(img => img.src && isValidImageUrl(img.src))
    .map(img => ({
      src: resolveImageUrl(img.src, baseUrl),
      alt: img.alt || 'Image',
      filename: extractFilename(img.src, img.alt)
    }))
    .filter((img, index, array) => 
      array.findIndex(i => i.src === img.src) === index // Remove duplicates
    );
}
