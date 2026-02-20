import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

function getMigrationsDir(): string {
  return path.join(process.cwd(), 'migrations');
}

function extractVersion(fileName: string): string {
  const match = fileName.match(/^(\d+)/);
  if (!match) {
    throw new Error(`Invalid migration file name: ${fileName}`);
  }
  return match[1];
}

export async function runMigrations(): Promise<void> {
  const migrationsDir = getMigrationsDir();
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345678',
    database: process.env.DB_NAME || 'comic_universe',
    multipleStatements: true,
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT version FROM schema_migrations'
    );
    const executed = new Set(rows.map((row) => row.version));

    for (const file of files) {
      const version = extractVersion(file);
      if (executed.has(version)) {
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');

      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query(
          'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
          [version, file]
        );
        await connection.commit();
        console.log(`Applied migration ${file}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    await connection.end();
  }
}
