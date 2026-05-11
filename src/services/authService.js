'use strict';

/**
 * Tầng 2 – Business Logic Layer
 * authService.js: Logic nghiệp vụ đăng ký tài khoản
 */

const bcrypt     = require('bcryptjs');
const userModel  = require('../models/userModel');
const otpService = require('./otpService');

const SALT_ROUNDS = 12;

/**
 * Xử lý đăng ký tài khoản mới.
 * 1. Kiểm tra email đã tồn tại
 * 2. Hash password
 * 3. Tạo user với status = 'pending'
 * 4. Gửi OTP qua email
 *
 * @param {{ fullName: string, email: string, password: string }} data
 * @throws {Error} 'EMAIL_EXISTS' nếu email đã được đăng ký
 */
const register = async ({ fullName, email, password }) => {
  // Bước 1: Kiểm tra email trùng
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw Object.assign(new Error('EMAIL_EXISTS'), { code: 'EMAIL_EXISTS' });
  }

  // Bước 2: Hash password (bcrypt salt rounds = 12)
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Bước 3: Tạo user (status mặc định = 'pending')
  const userId = await userModel.createUser({ fullName, email, hashedPassword });

  // Bước 4: Tạo và gửi OTP qua email
  await otpService.sendOtp(userId, email, fullName);
};

module.exports = { register };
