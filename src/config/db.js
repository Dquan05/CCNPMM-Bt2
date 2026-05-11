'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Tầng 3 – Data Access Layer
 * MySQL connection pool sử dụng mysql2/promise
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ccnpmm_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Kiểm tra kết nối khi khởi động
pool.getConnection()
  .then(conn => {
    console.log('[DB] ✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] ❌ MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
