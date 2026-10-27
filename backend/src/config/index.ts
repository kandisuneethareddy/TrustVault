import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'trustvault-super-secret-master-signing-key-32bytes-min!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  
  // Storage encryption key (AES-256-GCM requires 32 bytes)
  // In production, load from KMS / Vault / environment variable
  STORAGE_ENCRYPTION_KEY: Buffer.from(
    (process.env.STORAGE_ENCRYPTION_KEY || 'trustvault_aes_256_master_key_12345678').padEnd(32, '0').slice(0, 32),
    'utf-8'
  ),

  // Storage paths
  STORAGE_DIR: path.resolve(__dirname, '../../vault_storage'),
  DB_PATH: path.resolve(__dirname, '../../trustvault.db'),

  // Security limits
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB max per file
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.json'],

  // Genesis Hash for tamper-evident blockchain-style audit ledger
  AUDIT_GENESIS_PREV_HASH: '0000000000000000000000000000000000000000000000000000000000000000',
};
