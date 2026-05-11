'use strict';

/**
 * Tầng 2 – Business Logic Layer
 * otpService.js: Tạo OTP, gửi email, xác minh OTP
 */

const crypto     = require('crypto');
const userModel  = require('../models/userModel');
const otpModel   = require('../models/otpModel');
const transporter = require('../config/mailer');
require('dotenv').config();

// ── Helper ──────────────────────────────────────────────────

/** Tạo OTP ngẫu nhiên 6 chữ số */
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

/** Hash OTP bằng SHA-256 trước khi lưu DB */
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

/** Tính thời điểm hết hạn */
const getExpiresAt = () => {
  const minutes = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};

// ── Email Template ───────────────────────────────────────────

const buildOtpEmailHtml = (fullName, otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #3b82f6;">Xác nhận đăng ký tài khoản</h2>
    <p>Xin chào <strong>${fullName}</strong>,</p>
    <p>Mã OTP xác nhận tài khoản của bạn là:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        ${otp}
      </span>
    </div>
    <p style="color: #6b7280; font-size: 13px;">
      Mã có hiệu lực trong <strong>10 phút</strong>.<br>
      <strong>KHÔNG</strong> chia sẻ mã này với bất kỳ ai.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 12px;">
      Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
    </p>
  </div>
</body>
</html>
`;

// ── Public API ───────────────────────────────────────────────

/**
 * Tạo OTP, lưu DB (hash), gửi email cho user.
 * @param {number} userId
 * @param {string} email
 * @param {string} fullName
 */
const sendOtp = async (userId, email, fullName) => {
  const otp       = generateOtp();
  const hashed    = hashOtp(otp);
  const expiresAt = getExpiresAt();

  // Lưu OTP đã hash vào DB (INSERT hoặc UPDATE nếu resend)
  await otpModel.createOtp(userId, hashed, expiresAt);

  // Gửi email
  await transporter.sendMail({
    from:    process.env.MAIL_FROM || 'no-reply@collabbrain.com',
    to:      email,
    subject: '[CollabBrain] Mã xác nhận đăng ký tài khoản',
    html:    buildOtpEmailHtml(fullName, otp),
  });
};

/**
 * Xác minh OTP người dùng nhập.
 * Kích hoạt tài khoản nếu OTP đúng và chưa hết hạn.
 * @param {string} email
 * @param {string} otp  - OTP plaintext từ người dùng
 * @throws {Error} 'NOT_FOUND' | 'ALREADY_ACTIVE' | 'OTP_INVALID' | 'OTP_EXPIRED'
 */
const verifyOtp = async (email, otp) => {
  // Tìm user
  const user = await userModel.findByEmail(email);
  if (!user) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  if (user.status === 'active') throw Object.assign(new Error('ALREADY_ACTIVE'), { code: 'ALREADY_ACTIVE' });

  // Tìm OTP record
  const record = await otpModel.findByUserId(user.id);
  if (!record) throw Object.assign(new Error('OTP_INVALID'), { code: 'OTP_INVALID' });

  // Kiểm tra hết hạn
  if (new Date() > new Date(record.expires_at)) {
    await otpModel.deleteByUserId(user.id);
    throw Object.assign(new Error('OTP_EXPIRED'), { code: 'OTP_EXPIRED' });
  }

  // So sánh hash
  if (hashOtp(otp) !== record.hashed_otp) {
    throw Object.assign(new Error('OTP_INVALID'), { code: 'OTP_INVALID' });
  }

  // Kích hoạt tài khoản & xóa OTP
  await userModel.activateUser(user.id);
  await otpModel.deleteByUserId(user.id);
};

/**
 * Gửi lại OTP cho tài khoản pending.
 * @param {string} email
 * @throws {Error} 'NOT_FOUND' | 'ALREADY_ACTIVE'
 */
const resendOtp = async (email) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  if (user.status === 'active') throw Object.assign(new Error('ALREADY_ACTIVE'), { code: 'ALREADY_ACTIVE' });

  await sendOtp(user.id, user.email, user.full_name);
};

module.exports = { sendOtp, verifyOtp, resendOtp };
