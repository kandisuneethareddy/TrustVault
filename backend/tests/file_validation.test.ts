import { describe, it, expect } from 'vitest';
import { FileValidator } from '../src/services/FileValidator';

describe('File Validation & Anti-Spoofing (Magic Bytes)', () => {
  it('FILE-01: Rejects executable .exe file immediately by extension', () => {
    const maliciousBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
    const result = FileValidator.validateFile('payload.exe', maliciousBuffer);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/Executable or script file extension/i);
  });

  it('FILE-02: Rejects file with .pdf extension containing non-PDF binary bytes (MIME spoofing)', () => {
    // Malicious executable disguised as a PDF
    const fakePdfBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF');
    const result = FileValidator.validateFile('contract.pdf', fakePdfBuffer);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/does not start with %PDF magic bytes/i);
  });

  it('FILE-03: Rejects text file with embedded null byte injection', () => {
    const nullByteBuffer = Buffer.from('Hello\x00World malicious payload');
    const result = FileValidator.validateFile('report.txt', nullByteBuffer);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/null byte injection/i);
  });

  it('FILE-04: Sanitizes directory traversal patterns in filenames', () => {
    const clean = FileValidator.sanitizeFileName('../../etc/shadow.txt');
    expect(clean).not.toContain('../');
    expect(clean).not.toContain('..\\');
    expect(clean).toBe('shadow.txt');
  });

  it('FILE-05: Accepts legitimate PDF with authentic %PDF magic header', () => {
    const authenticPdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
    const result = FileValidator.validateFile('legitimate_contract.pdf', authenticPdf);
    expect(result.isValid).toBe(true);
    expect(result.detectedMimeType).toBe('application/pdf');
    expect(result.sanitizedName).toBe('legitimate_contract.pdf');
  });
});
