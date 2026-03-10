const mysql = require('mysql2/promise');

function getDatabaseConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASWORD || '',
    database: process.env.DB_NAME || 'acadia_connect',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    namedPlaceholders: true,
    timezone: 'Z',
  };
}

const pool = mysql.createPool(getDatabaseConfig());

module.exports = pool;
