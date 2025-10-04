import { Request } from 'express';
import crypto from 'crypto';
import { Buffer } from 'buffer';

/**
 * Comprehensive file upload security utility
 * Provides MIME type validation, file content analysis, and security checks
 */
export class FileUploadSecurity {
  
  // Allowed MIME types and their corresponding magic bytes
  private static readonly ALLOWED_TYPES = {
    'image/jpeg': [
      [0xFF, 0xD8, 0xFF],  // JPEG
      [0xFF, 0xD8]         // JPEG (shorter variant)
    ],
    'image/jpg': [
      [0xFF, 0xD8, 0xFF],  // Same as JPEG
      [0xFF, 0xD8]
    ],
    'image/png': [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]  // PNG
    ],
    'image/webp': [
      [0x52, 0x49, 0x46, 0x46]  // RIFF (WebP container)
    ]
  };

  // Maximum file sizes by type (in bytes)
  private static readonly MAX_SIZES = {
    'image/jpeg': 5 * 1024 * 1024,  // 5MB
    'image/jpg': 5 * 1024 * 1024,   // 5MB
    'image/png': 5 * 1024 * 1024,   // 5MB
    'image/webp': 5 * 1024 * 1024   // 5MB
  };

  // Dangerous file extensions to reject
  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.pl', '.py', '.rb', '.sh', '.dll',
    '.msi', '.app', '.deb', '.rpm', '.dmg', '.pkg', '.sql', '.db'
  ];

  /**
   * Validate file based on MIME type and content analysis
   */
  static async validateFile(file: Express.Multer.File): Promise<{
    isValid: boolean;
    error?: string;
    warnings?: string[];
  }> {
    const warnings: string[] = [];

    // 1. Basic file checks
    if (!file || !file.buffer) {
      return { isValid: false, error: 'No file provided or file is empty' };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }

    // 2. File extension check
    const fileExtension = this.getFileExtension(file.originalname);
    if (this.DANGEROUS_EXTENSIONS.includes(fileExtension.toLowerCase())) {
      return { isValid: false, error: 'File type not allowed for security reasons' };
    }

    // 3. MIME type validation
    if (!this.ALLOWED_TYPES[file.mimetype as keyof typeof this.ALLOWED_TYPES]) {
      return { isValid: false, error: `MIME type ${file.mimetype} is not allowed` };
    }

    // 4. File size validation
    const maxSize = this.MAX_SIZES[file.mimetype as keyof typeof this.MAX_SIZES];
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})` 
      };
    }

    // 5. Magic byte validation (file signature)
    const magicBytesValid = this.validateMagicBytes(file.buffer, file.mimetype);
    if (!magicBytesValid) {
      return { isValid: false, error: 'File content does not match declared MIME type' };
    }

    // 6. Content analysis for potential threats
    const contentAnalysis = this.analyzeFileContent(file.buffer);
    if (contentAnalysis.suspiciousContent) {
      return { isValid: false, error: 'File contains suspicious content' };
    }
    
    if (contentAnalysis.warnings.length > 0) {
      warnings.push(...contentAnalysis.warnings);
    }

    // 7. Filename sanitization check
    const filenameIssues = this.validateFilename(file.originalname);
    if (filenameIssues.length > 0) {
      warnings.push(...filenameIssues);
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate magic bytes against expected file signatures
   */
  private static validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const expectedSignatures = this.ALLOWED_TYPES[mimeType as keyof typeof this.ALLOWED_TYPES];
    if (!expectedSignatures) return false;

    return expectedSignatures.some(signature => {
      if (buffer.length < signature.length) return false;
      
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) return false;
      }
      return true;
    });
  }

  /**
   * Analyze file content for suspicious patterns
   */
  private static analyzeFileContent(buffer: Buffer): {
    suspiciousContent: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let suspiciousContent = false;

    // Convert buffer to string for analysis (first 1KB)
    const content = buffer.slice(0, 1024).toString('ascii', 0, Math.min(1024, buffer.length));

    // Look for suspicious patterns
    const suspiciousPatterns = [
      /<script[\s\S]*?>/i,  // Script tags
      /javascript:/i,       // JavaScript protocol
      /data:text\/html/i,   // HTML data URLs
      /vbscript:/i,         // VBScript
      /@import/i,           // CSS imports
      /expression\(/i,      // CSS expressions
      /eval\(/i,            // JavaScript eval
      /document\./i,        // DOM manipulation
      /window\./i,          // Window object access
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        suspiciousContent = true;
        break;
      }
    }

    // Check for embedded files or unusual content
    if (content.includes('PK')) {  // ZIP file signature
      warnings.push('File may contain embedded ZIP content');
    }

    if (content.includes('%PDF')) {  // PDF signature
      warnings.push('File may contain embedded PDF content');
    }

    return { suspiciousContent, warnings };
  }

  /**
   * Validate and sanitize filename
   */
  private static validateFilename(filename: string): string[] {
    const warnings: string[] = [];

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      warnings.push('Filename contains path traversal characters');
    }

    // Check for null bytes
    if (filename.includes('\x00')) {
      warnings.push('Filename contains null bytes');
    }

    // Check for control characters
    if (/[\x00-\x1f\x7f-\x9f]/.test(filename)) {
      warnings.push('Filename contains control characters');
    }

    // Check for excessively long filename
    if (filename.length > 255) {
      warnings.push('Filename is excessively long');
    }

    // Check for multiple file extensions
    const extensions = filename.split('.').slice(1);
    if (extensions.length > 1) {
      warnings.push('Filename contains multiple extensions');
    }

    return warnings;
  }

  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalFilename: string, userId: string): string {
    const extension = this.getFileExtension(originalFilename);
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const userHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
    
    return `${userHash}_${timestamp}_${randomBytes}${extension}`;
  }

  /**
   * Get file extension safely
   */
  private static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
      return '';
    }
    return filename.substring(lastDotIndex);
  }

  /**
   * Format file size for human readability
   */
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Sanitize file content (remove metadata, etc.)
   */
  static sanitizeImageFile(buffer: Buffer, mimeType: string): Buffer {
    // For now, return as-is. In production, you might want to:
    // 1. Strip EXIF data from JPEG files
    // 2. Re-encode images to remove potential embedded content
    // 3. Resize images to standard dimensions
    
    // This is a basic implementation - consider using libraries like 'sharp' for production
    return buffer;
  }

  /**
   * Create file hash for deduplication and integrity checks
   */
  static createFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Validate image dimensions (optional security check)
   */
  static validateImageDimensions(buffer: Buffer, mimeType: string): {
    isValid: boolean;
    width?: number;
    height?: number;
    error?: string;
  } {
    try {
      // Basic image dimension validation
      // For production, consider using 'image-size' library
      
      if (mimeType === 'image/png') {
        // PNG width and height are at bytes 16-23
        if (buffer.length < 24) {
          return { isValid: false, error: 'Invalid PNG file structure' };
        }
        
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        
        // Reasonable dimension limits
        if (width > 4096 || height > 4096 || width < 1 || height < 1) {
          return { isValid: false, error: 'Image dimensions out of acceptable range' };
        }
        
        return { isValid: true, width, height };
      }
      
      // For other formats, basic validation
      return { isValid: true };
      
    } catch (error) {
      return { isValid: false, error: 'Failed to analyze image dimensions' };
    }
  }
}

/**
 * Enhanced multer configuration with security features
 */
export const createSecureUploadConfig = (maxFileSize = 5 * 1024 * 1024) => {
  return {
    storage: require('multer').memoryStorage(),
    limits: {
      fileSize: maxFileSize,
      files: 1, // Only allow single file uploads
      fields: 5, // Limit number of form fields
      fieldNameSize: 100, // Limit field name length
      fieldSize: 1024 * 1024 // 1MB limit for text fields
    },
    fileFilter: async (req: Request, file: Express.Multer.File, cb: any) => {
      try {
        // Basic checks before processing
        if (!file.originalname) {
          return cb(new Error('Filename is required'));
        }

        // Check file extension
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        
        if (!extension || !allowedExtensions.includes(extension)) {
          return cb(new Error('Only JPEG, PNG, and WebP files are allowed'));
        }

        // Check MIME type
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new Error(`MIME type ${file.mimetype} is not allowed`));
        }

        cb(null, true);
      } catch (error) {
        cb(new Error('File validation failed'));
      }
    }
  };
};