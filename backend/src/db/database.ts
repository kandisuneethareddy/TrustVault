import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export class SQLiteAdapter {
  private db: SqlJsDatabase;
  private dbPath?: string;
  private inTransaction: boolean = false;

  constructor(db: SqlJsDatabase, dbPath?: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  public saveToDisk(): void {
    if (this.dbPath && !this.inTransaction) {
      try {
        const data = this.db.export();
        fs.writeFileSync(this.dbPath, Buffer.from(data));
      } catch (err) {
        console.error('Failed to persist database to disk:', err);
      }
    }
  }

  public exec(sql: string): void {
    this.db.run(sql);
    this.saveToDisk();
  }

  public pragma(_pragmaStr: string): void {
    try {
      this.db.run(`PRAGMA ${_pragmaStr}`);
    } catch {}
  }

  public transaction<T>(fn: () => T): () => T {
    return () => {
      this.inTransaction = true;
      this.db.run('BEGIN TRANSACTION');
      try {
        const result = fn();
        this.db.run('COMMIT');
        this.inTransaction = false;
        this.saveToDisk();
        return result;
      } catch (err) {
        try {
          this.db.run('ROLLBACK');
        } catch {}
        this.inTransaction = false;
        throw err;
      }
    };
  }

  public prepare(sql: string) {
    const adapter = this;

    function normalizeParams(args: any[]): any {
      if (args.length === 0) return [];
      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0]) && !(args[0] instanceof Buffer)) {
        // Named parameter object
        const obj = args[0];
        const res: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
          const val = v === undefined ? null : v;
          res[`@${k.replace(/^[@:$]/, '')}`] = val;
          res[`:${k.replace(/^[@:$]/, '')}`] = val;
          res[`$${k.replace(/^[@:$]/, '')}`] = val;
        }
        return res;
      }
      return args.map(arg => (arg === undefined ? null : arg));
    }

    return {
      get(...args: any[]): any {
        const params = normalizeParams(args);
        const stmt = adapter.db.prepare(sql);
        try {
          stmt.bind(params);
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },

      all(...args: any[]): any[] {
        const params = normalizeParams(args);
        const stmt = adapter.db.prepare(sql);
        const rows: any[] = [];
        try {
          stmt.bind(params);
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          return rows;
        } finally {
          stmt.free();
        }
      },

      run(...args: any[]): RunResult {
        const params = normalizeParams(args);
        const stmt = adapter.db.prepare(sql);
        try {
          stmt.bind(params);
          stmt.step();
          adapter.saveToDisk();
          return {
            changes: adapter.db.getRowsModified(),
            lastInsertRowid: 0,
          };
        } finally {
          stmt.free();
        }
      },
    };
  }

  public close(): void {
    this.saveToDisk();
    this.db.close();
  }
}

let dbInstance: SQLiteAdapter | null = null;
let sqlJsModule: any = null;

export async function initDatabase(dbPath?: string): Promise<SQLiteAdapter> {
  if (!sqlJsModule) {
    sqlJsModule = await initSqlJs();
  }

  const targetPath = dbPath || CONFIG.DB_PATH;
  const dbDir = path.dirname(targetPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  let sqlDb: SqlJsDatabase;
  if (fs.existsSync(targetPath)) {
    const fileBuffer = fs.readFileSync(targetPath);
    sqlDb = new sqlJsModule.Database(fileBuffer);
  } else {
    sqlDb = new sqlJsModule.Database();
  }

  const adapter = new SQLiteAdapter(sqlDb, targetPath);

  // Initialize schema
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    adapter.exec(schemaSql);
  }

  // Ensure vault storage directory exists
  if (!fs.existsSync(CONFIG.STORAGE_DIR)) {
    fs.mkdirSync(CONFIG.STORAGE_DIR, { recursive: true });
  }

  if (!dbPath) {
    dbInstance = adapter;
  }

  return adapter;
}

export function getDatabase(): SQLiteAdapter {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call await initDatabase() first.');
  }
  return dbInstance;
}

export function setDatabaseInstance(adapter: SQLiteAdapter): void {
  dbInstance = adapter;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
