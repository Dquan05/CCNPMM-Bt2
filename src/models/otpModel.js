'use strict';

/**
 * Tầng 3 – Data Access Layer
 * otpModel.js: Thao tác CRUD với bảng `otps`
 */

const pool = require('../config/db');

/**
 * Tạo (hoặc cập nhật) bản ghi OTP cho user.
 * Dùng INSERT ... ON DUPLICATE KEY UPDATE để xử lý resend OTP.
 * @param {number} userId
 * @param {string} hashedOtp  - SHA-256 hash của OTP plaintext
 * @param {Date}   expiresAt  - Thời điểm hết hạn
 */
const createOtp = async (userId, hashedOtp, expiresAt) => {
  await pool.execute(
    `INSERT INTO otps (user_id, hashed_otp, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       hashed_otp = VALUES(hashed_otp),
       expires_at = VALUES(expires_at),
       created_at = NOW()`,
    [userId, hashedOtp, expiresAt]
  );
};

/**
 * Tìm OTP record theo userId.
 * @param {number} userId
 * @returns {object|null}
 */
const findByUserId = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM otps WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
};

/**
 * Xóa OTP record theo userId.
 * Gọi sau khi xác minh thành công hoặc khi OTP hết hạn.
 * @param {number} userId
 */
const deleteByUserId = async (userId) => {
  await pool.execute(
    'DELETE FROM otps WHERE user_id = ?',
    [userId]
  );
};

module.exports = { createOtp, findByUserId, deleteByUserId };
