'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter cho POST /api/auth/register
 * Giới hạn: 5 request / 15 phút / IP
 * Mục đích: Chống spam đăng ký, bot tạo tài khoản hàng loạt
 */
const registerLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 phút
  max:            5,
  standardHeaders: true,  // Trả về headers RateLimit-* theo RFC 6585
  legacyHeaders:  false,  // Tắt X-RateLimit-* headers cũ
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu đăng ký từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.',
  },
});

/**
 * Rate Limiter cho POST /api/auth/verify-otp và /api/auth/resend-otp
 * Giới hạn: 3 request / 10 phút / IP
 * Mục đích: Chống brute-force OTP (tấn công dò mã)
 */
const otpLimiter = rateLimit({
  windowMs:       10 * 60 * 1000, // 10 phút
  max:            3,
  standardHeaders: true,
  legacyHeaders:  false,
  message: {
    success: false,
    message: 'Quá nhiều lần thử OTP. Vui lòng thử lại sau 10 phút.',
  },
});

module.exports = { registerLimiter, otpLimiter };
