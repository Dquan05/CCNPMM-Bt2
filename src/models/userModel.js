'use strict';

/**
 * Tầng 3 – Data Access Layer
 * userModel.js: Thao tác CRUD với bảng `users`
 */

const pool = require('../config/db');

/**
 * Tìm user theo email.
 * @param {string} email
 * @returns {object|null} user record hoặc null nếu không tìm thấy
 */
const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
};

/**
 * Tạo user mới với status = 'pending'.
 * @param {{ fullName: string, email: string, hashedPassword: string }} data
 * @returns {number} insertId của user vừa tạo
 */
const createUser = async ({ fullName, email, hashedPassword }) => {
  const [result] = await pool.execute(
    `INSERT INTO users (full_name, email, password, status)
     VALUES (?, ?, ?, 'pending')`,
    [fullName, email, hashedPassword]
  );
  return result.insertId;
};

/**
 * Kích hoạt tài khoản (status pending → active).
 * @param {number} userId
 */
const activateUser = async (userId) => {
  await pool.execute(
    "UPDATE users SET status = 'active' WHERE id = ?",
    [userId]
  );
};

module.exports = { findByEmail, createUser, activateUser };
