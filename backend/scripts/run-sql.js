#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// In local dev on Windows it's common to have DB_* vars set globally.
// For this script, prefer the backend/.env values.
dotenv.config({ override: true });

function getEnv(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === null || String(v).trim() === '' ? fallback : v;
}

function hasEnv(name) {
  const v = process.env[name];
  return !(v === undefined || v === null || String(v).trim() === '');
}

function resolveSqlFilePath(arg) {
  const input = arg && String(arg).trim() ? String(arg).trim() : '';
  const defaultPath = path.resolve(__dirname, '..', 'sql', '000_drop_and_recreate.sql');
  if (!input) return defaultPath;

  // Allow relative paths from backend/ (cwd) or absolute paths.
  const asGiven = path.resolve(process.cwd(), input);
  if (fs.existsSync(asGiven)) return asGiven;

  // Allow shorthand like "backend/sql/001_schema.sql" when run from repo root.
  const fromBackendDir = path.resolve(__dirname, '..', input);
  if (fs.existsSync(fromBackendDir)) return fromBackendDir;

  return asGiven;
}

async function main() {
  const args = process.argv.slice(2);
  const arg = args[0];
  const wantsHelp = args.includes('--help') || args.includes('-h');
  const wantsAdmin = args.includes('--admin');

  if (wantsHelp) {
    const defaultPath = path.resolve(__dirname, '..', 'sql', '000_drop_and_recreate.sql');
    console.log('Run a SQL file against MariaDB/MySQL using backend/.env credentials.');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/run-sql.js [path/to/file.sql] [--admin]');
    console.log('');
    console.log('Options:');
    console.log('  --admin    Use DB_ADMIN_USER/DB_ADMIN_PASSWORD instead of DB_USER/DB_PASSWORD');
    console.log('');
    console.log('Defaults:');
    console.log(`  If no file is provided, runs: ${defaultPath}`);
    process.exit(0);
  }

  const sqlFile = resolveSqlFilePath(arg);

  if (!fs.existsSync(sqlFile)) {
    console.error(`SQL file not found: ${sqlFile}`);
    process.exit(1);
  }

  const host = getEnv('DB_HOST', 'localhost');
  const port = Number(getEnv('DB_PORT', '3306'));

  const adminAvailable = hasEnv('DB_ADMIN_USER') || hasEnv('DB_ADMIN_PASSWORD');
  const useAdminCreds = wantsAdmin || adminAvailable;

  const user = useAdminCreds ? getEnv('DB_ADMIN_USER', getEnv('DB_USER', 'root')) : getEnv('DB_USER', 'root');
  const password = useAdminCreds ? getEnv('DB_ADMIN_PASSWORD', getEnv('DB_PASWORD', '')) : getEnv('DB_PASWORD', '');

  const sql = fs.readFileSync(sqlFile, 'utf8');

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    // Important: allow running a whole .sql file containing many statements.
    multipleStatements: true,
    // Keep timestamps consistent with the app (UTC).
    timezone: 'Z',
  });

  try {
    await conn.query(sql);
    console.log(`Executed SQL successfully: ${sqlFile}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Failed to execute SQL:', err && err.message ? err.message : err);
  process.exit(1);
});
