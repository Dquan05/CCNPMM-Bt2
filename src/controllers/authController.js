'use strict';

/**
 * Tầng 1 – Presentation Layer
 * authController.js: Nhận request, gọi service, trả response
 */

const authService = require('../services/authService');
const otpService  = require('../services/otpService');

// ── Error code → HTTP status mapping ──────────────────────

const ERROR_MAP = {
  EMAIL_EXISTS:    { status: 409, message: 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.' },
  NOT_FOUND:       { status: 404, message: 'Không tìm thấy tài khoản với email này.' },
  ALREADY_ACTIVE:  { status: 409, message: 'Tài khoản này đã được kích hoạt. Vui lòng đăng nhập.' },
  OTP_INVALID:     { status: 400, message: 'Mã OTP không chính xác.' },
  OTP_EXPIRED:     { status: 400, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại OTP.' },
};

const handleServiceError = (err, res) => {
  const mapped = ERROR_MAP[err.code];
  if (mapped) {
    return res.status(mapped.status).json({ success: false, message: mapped.message });
  }
  console.error('[Controller] Unexpected error:', err);
  return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi phía server. Vui lòng thử lại sau.' });
};

// ── Controllers ───────────────────────────────────────────

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới → gửi OTP qua email
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    await authService.register({ fullName, email, password });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP kích hoạt tài khoản.',
      data: { email },
    });
  } catch (err) {
    return handleServiceError(err, res);
  }
};

/**
 * POST /api/auth/verify-otp
 * Xác minh OTP → kích hoạt tài khoản
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    await otpService.verifyOtp(email, otp);

    return res.status(200).json({
      success: true,
      message: 'Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập ngay.',
      data: { email, status: 'active' },
    });
  } catch (err) {
    return handleServiceError(err, res);
  }
};

/**
 * POST /api/auth/resend-otp
 * Gửi lại OTP cho tài khoản chưa kích hoạt
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    await otpService.resendOtp(email);

    return res.status(200).json({
      success: true,
      message: 'Mã OTP mới đã được gửi đến email của bạn.',
    });
  } catch (err) {
    return handleServiceError(err, res);
  }
};

module.exports = { register, verifyOtp, resendOtp };
