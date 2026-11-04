import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';

export interface StoredFileMetadata {
  storageKey: string;
  checksumSha256: string;
  encryptionIv: string;
  encryptionTag: string;
  fileSize: number;
}

export class StorageService {
  private static getFilePath(storageKey: string): string {
    return path.join(CONFIG.STORAGE_DIR, `${storageKey}.enc`);
  }

  /**
   * Encrypts and persists file buffer to disk using AES-256-GCM.
   */
  public static async encryptAndStore(fileBuffer: Buffer): Promise<StoredFileMetadata> {
    const storageKey = uuidv4();
    const iv = crypto.randomBytes(12); // Recommended 96-bit IV for AES-GCM
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const cipher = crypto.createCipheriv('aes-256-gcm', CONFIG.STORAGE_ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    const tag = cipher.getAuthTag();

    const targetPath = this.getFilePath(storageKey);
    await fs.promises.writeFile(targetPath, encrypted);

    return {
      storageKey,
      checksumSha256: checksum,
      encryptionIv: iv.toString('hex'),
      encryptionTag: tag.toString('hex'),
      fileSize: fileBuffer.length,
    };
  }

  /**
   * Reads and decrypts file buffer using AES-256-GCM and verifies checksum.
   */
  public static async retrieveAndDecrypt(
    storageKey: string,
    ivHex: string,
    tagHex: string,
    expectedChecksum: string
  ): Promise<Buffer> {
    const targetPath = this.getFilePath(storageKey);
    if (!fs.existsSync(targetPath)) {
      throw new Error('Encrypted file storage object not found');
    }

    const encryptedData = await fs.promises.readFile(targetPath);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', CONFIG.STORAGE_ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    // Verify SHA-256 integrity
    const actualChecksum = crypto.createHash('sha256').update(decrypted).digest('hex');
    if (actualChecksum !== expectedChecksum) {
      throw new Error('Cryptographic checksum mismatch! File content may have been corrupted or tampered with.');
    }

    return decrypted;
  }

  /**
   * Securely removes encrypted file from vault storage.
   */
  public static async removeFile(storageKey: string): Promise<void> {
    const targetPath = this.getFilePath(storageKey);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
  }
}

