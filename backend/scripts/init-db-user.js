#!/usr/bin/env node

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ override: true });

function getEnv(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === null || String(v).trim() === '' ? fallback : v;
}

function requireEnv(name) {
  const v = process.env[name];
  if (v === undefined || v === null || String(v).trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(v);
}

function validateDbName(dbName) {
  const name = String(dbName || '').trim();
  if (!name) throw new Error('DB_NAME is required');
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error('DB_NAME must contain only letters, numbers, underscore');
  }
  return name;
}

function escapeIdentifier(name) {
  return `\`${String(name).replace(/`/g, '``')}\``;
}

function escapeUser(user) {
  return String(user).replace(/'/g, "''");
}

async function main() {
  const host = getEnv('DB_HOST', 'localhost');
  const port = Number(getEnv('DB_PORT', '3306'));

  const adminUser = getEnv('DB_ADMIN_USER', 'root');
  const adminPassword = getEnv('DB_ADMIN_PASSWORD', '');

  const appUser = requireEnv('DB_USER');
  const appPassword = requireEnv('DB_PASWORD');
  const dbName = validateDbName(getEnv('DB_NAME', 'acadia_connect'));

  const conn = await mysql.createConnection({
    host,
    port,
    user: adminUser,
    password: adminPassword,
    multipleStatements: false,
    timezone: 'Z',
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(dbName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    // Create user if missing (works on MySQL 8+ and MariaDB)
    await conn.query(`CREATE USER IF NOT EXISTS '${escapeUser(appUser)}'@'localhost' IDENTIFIED BY '${escapeUser(appPassword)}'`);

    // Ensure password is set to match .env (for cases where user already existed)
    // MySQL: ALTER USER ... IDENTIFIED BY ... ; MariaDB supports it as well.
    await conn.query(`ALTER USER '${escapeUser(appUser)}'@'localhost' IDENTIFIED BY '${escapeUser(appPassword)}'`);

    await conn.query(`GRANT ALL PRIVILEGES ON ${escapeIdentifier(dbName)}.* TO '${escapeUser(appUser)}'@'localhost'`);
    await conn.query('FLUSH PRIVILEGES');

    console.log(`Ensured DB user '${appUser}' has privileges on ${dbName}.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  const message = err && err.message ? err.message : String(err);
  console.error('Failed to init DB user:', message);

  if (err && (err.code === 'ER_ACCESS_DENIED_ERROR' || /Access denied/i.test(message))) {
    console.error('');
    console.error('This script needs an ADMIN MySQL/MariaDB login (root or another user with CREATE USER/GRANT).');
    console.error('Provide it via env vars (recommended: do this temporarily in PowerShell):');
    console.error("  $env:DB_ADMIN_USER='root'");
    console.error("  $env:DB_ADMIN_PASSWORD='<your-root-password>'");
    console.error('  npm run db:init-user');
    console.error('');
    console.error('Then you can reset schema/seed and start the server:');
    console.error('  npm run db:reset');
    console.error('  npm start');
  }
  process.exit(1);
});
