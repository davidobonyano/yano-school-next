/**
 * Image compression utility for server-side image processing
 * Uses Sharp for high-performance image compression
 */

import sharp from 'sharp';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CompressionResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    original: { width: number; height: number };
    compressed: { width: number; height: number };
  };
}

/**
 * Compress an image buffer with automatic quality adjustment
 */
export async function compressImage(
  inputBuffer: Buffer,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    maxSizeKB = 400,
    format = 'jpeg'
  } = options;

  const originalSize = inputBuffer.length;
  
  // Get original image metadata
  const metadata = await sharp(inputBuffer).metadata();
  const originalDimensions = {
    width: metadata.width || 0,
    height: metadata.height || 0
  };

  // Calculate scaling to fit within max dimensions while maintaining aspect ratio
  const scaleX = maxWidth / originalDimensions.width;
  const scaleY = maxHeight / originalDimensions.height;
  const scale = Math.min(1, Math.min(scaleX, scaleY));

  const targetWidth = Math.round(originalDimensions.width * scale);
  const targetHeight = Math.round(originalDimensions.height * scale);

  let currentQuality = quality;
  let compressedBuffer: Buffer;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    // Create sharp instance with resizing and quality settings
    let sharpInstance = sharp(inputBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

    // Apply format-specific settings
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ 
          quality: currentQuality,
          progressive: true,
          mozjpeg: true
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ 
          quality: currentQuality,
          progressive: true
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ 
          quality: currentQuality
        });
        break;
    }

    compressedBuffer = await sharpInstance.toBuffer();
    
    // If size is acceptable or we've tried enough times, break
    if (compressedBuffer.length <= maxSizeKB * 1024 || attempts >= maxAttempts) {
      break;
    }

    // Reduce quality for next attempt
    currentQuality = Math.max(20, currentQuality - 10);
    attempts++;
  } while (compressedBuffer.length > maxSizeKB * 1024 && currentQuality > 20);

  const compressedSize = compressedBuffer.length;
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

  return {
    buffer: compressedBuffer,
    originalSize,
    compressedSize,
    compressionRatio,
    dimensions: {
      original: originalDimensions,
      compressed: { width: targetWidth, height: targetHeight }
    }
  };
}

/**
 * Get optimal compression settings based on file type and size
 */
export function getCompressionSettings(fileType: string, fileSize: number): CompressionOptions {
  const isImage = fileType.startsWith('image/');
  if (!isImage) {
    return { maxSizeKB: 1000 }; // For non-images, just limit size
  }

  // For very large images, be more aggressive with compression
  if (fileSize > 5 * 1024 * 1024) { // > 5MB
    return {
      maxWidth: 800,
      maxHeight: 800,
      quality: 70,
      maxSizeKB: 300,
      format: 'jpeg'
    };
  }

  // For medium images
  if (fileSize > 1 * 1024 * 1024) { // > 1MB
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 80,
      maxSizeKB: 350,
      format: 'jpeg'
    };
  }

  // For smaller images, less aggressive compression
  return {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
    maxSizeKB: 400,
    format: 'jpeg'
  };
}
