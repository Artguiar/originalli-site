import {DatabaseSync} from 'node:sqlite';
import {mkdir, readdir, readFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {createHash} from 'node:crypto';
import {dataDir, migrationsDir} from './paths.mjs';

export async function openDatabase(path = join(dataDir, 'originalli.sqlite')) {
  if (path !== ':memory:') await mkdir(dirname(path), {recursive: true});
  const sqlite = new DatabaseSync(path, {timeout: 5000});
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  sqlite.exec('CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, hash TEXT NOT NULL, applied_at TEXT NOT NULL)');
  try {
    for (const name of (await readdir(migrationsDir)).filter(name => name.endsWith('.sql')).sort()) {
      const sql = await readFile(join(migrationsDir, name), 'utf8');
      const hash = createHash('sha256').update(sql).digest('hex');
      const applied = sqlite.prepare('SELECT hash FROM app_migrations WHERE name=?').get(name);
      if (applied) {
        if (applied.hash !== hash) throw new Error(`Migração já aplicada foi modificada: ${name}`);
        continue;
      }
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        sqlite.exec(sql);
        sqlite.prepare('INSERT INTO app_migrations VALUES(?,?,?)').run(name, hash, new Date().toISOString());
        sqlite.exec('COMMIT');
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  } catch (error) { sqlite.close(); throw error; }
  function prepare(sql, args = []) {
    return {
      bind(...values) { return prepare(sql, values); },
      async first() { return sqlite.prepare(sql).get(...args) || null; },
      async all() { return {results: sqlite.prepare(sql).all(...args)}; },
      async run() { return {success: true, meta: sqlite.prepare(sql).run(...args)}; },
      execute() { return sqlite.prepare(sql).run(...args); }
    };
  }
  return {
    sqlite, prepare,
    async batch(statements) {
      // No await inside a transaction: other HTTP requests cannot interleave writes.
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map(statement => ({success: true, meta: statement.execute()}));
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    close() { sqlite.close(); }
  };
}
