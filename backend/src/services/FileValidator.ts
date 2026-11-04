import path from 'path';
import { CONFIG } from '../config';

export interface ValidationResult {
  isValid: boolean;
  sanitizedName: string;
  detectedMimeType: string;
  error?: string;
}

export class FileValidator {
  private static readonly DANGEROUS_EXTENSIONS = new Set([
    '.exe', '.dll', '.so', '.dylib', '.bat', '.cmd', '.ps1', '.sh', '.bash',
    '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.msc', '.jar', '.com',
    '.scr', '.hta', '.cpl', '.ins', '.isp', '.reg', '.html', '.htm', '.svg',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl'
  ]);

  /**
   * Validates file upload: checks extension, magic bytes, size, and sanitizes filename.
   */
  public static validateFile(originalName: string, buffer: Buffer): ValidationResult {
    // 1. Check file size
    if (!buffer || buffer.length === 0) {
      return { isValid: false, sanitizedName: '', detectedMimeType: '', error: 'File is empty' };
    }

    if (buffer.length > CONFIG.MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        sanitizedName: '',
        detectedMimeType: '',
        error: `File size exceeds the allowed limit of ${CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
      };
    }

    // 2. Sanitize filename (prevent path traversal, null bytes, reserved names)
    const sanitizedName = this.sanitizeFileName(originalName);
    if (!sanitizedName) {
      return { isValid: false, sanitizedName: '', detectedMimeType: '', error: 'Invalid or prohibited file name' };
    }

    // 3. Check file extension against dangerous extensions and allowed list
    const ext = path.extname(sanitizedName).toLowerCase();
    if (this.DANGEROUS_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        sanitizedName,
        detectedMimeType: '',
        error: `Security violation: Executable or script file extension '${ext}' is strictly prohibited`,
      };
    }

    if (!CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        sanitizedName,
        detectedMimeType: '',
        error: `File extension '${ext}' is not permitted. Allowed: ${CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    // 4. Magic Byte (Binary Signature) Verification
    const magicResult = this.verifyMagicBytes(buffer, ext);
    if (!magicResult.isValid) {
      return {
        isValid: false,
        sanitizedName,
        detectedMimeType: '',
        error: magicResult.error || 'File header does not match declared extension (possible MIME spoofing)',
      };
    }

    return {
      isValid: true,
      sanitizedName,
      detectedMimeType: magicResult.mimeType,
    };
  }

  /**
   * Robust filename sanitization stripping traversal patterns, special characters, and null bytes.
   */
  public static sanitizeFileName(rawName: string): string {
    if (!rawName) return 'unnamed_file';
    
    // Strip path elements (both UNIX and Windows)
    let clean = path.basename(rawName);
    
    // Remove null bytes and non-printable characters
    clean = clean.replace(/[\x00-\x1F\x7F]/g, '');

    // Replace any potentially hazardous characters
    clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Prevent hidden files (starting with dot) or dot-only names
    if (clean.startsWith('.')) {
      clean = 'doc' + clean;
    }

    // Check Windows reserved names
    const baseWithoutExt = path.parse(clean).name.toUpperCase();
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(baseWithoutExt)) {
      clean = `vault_${clean}`;
    }

    return clean.slice(0, 255); // Max 255 chars
  }

  /**
   * Inspects binary header signatures against extension to block MIME spoofing.
   */
  private static verifyMagicBytes(buffer: Buffer, ext: string): { isValid: boolean; mimeType: string; error?: string } {
    // PDF signature: %PDF- (hex: 25 50 44 46)
    if (ext === '.pdf') {
      const isPdf = buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
      if (!isPdf) return { isValid: false, mimeType: '', error: 'Invalid PDF: File does not start with %PDF magic bytes' };
      return { isValid: true, mimeType: 'application/pdf' };
    }

    // Office Open XML (DOCX, XLSX) & ZIP: PK\x03\x04 (hex: 50 4B 03 04)
    if (ext === '.docx' || ext === '.xlsx') {
      const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
      if (!isZip) return { isValid: false, mimeType: '', error: `Invalid ${ext.toUpperCase()}: Missing standard ZIP/OOXML container header` };
      const mime = ext === '.docx' 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      return { isValid: true, mimeType: mime };
    }

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (ext === '.png') {
      const isPng = buffer.length >= 8 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
        buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A;
      if (!isPng) return { isValid: false, mimeType: '', error: 'Invalid PNG: Corrupted or spoofed PNG magic header' };
      return { isValid: true, mimeType: 'image/png' };
    }

    // JPEG signature: FF D8 FF
    if (ext === '.jpg' || ext === '.jpeg') {
      const isJpg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      if (!isJpg) return { isValid: false, mimeType: '', error: 'Invalid JPEG: Missing standard JPEG SOI marker' };
      return { isValid: true, mimeType: 'image/jpeg' };
    }

    // Plain text / CSV / JSON
    if (ext === '.txt' || ext === '.csv' || ext === '.json') {
      // Disallow null bytes or binary control characters in text files
      for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
        const byte = buffer[i];
        if (byte === 0x00) {
          return { isValid: false, mimeType: '', error: `Malicious binary content detected in plain text file '${ext}' (null byte injection)` };
        }
      }
      const mime = ext === '.csv' ? 'text/csv' : ext === '.json' ? 'application/json' : 'text/plain';
      return { isValid: true, mimeType: mime };
    }

    return { isValid: false, mimeType: '', error: `Unsupported file format: ${ext}` };
  }
}

