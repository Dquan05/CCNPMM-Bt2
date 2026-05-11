'use strict';

/**
 * Tầng 1 – Presentation Layer
 * authRoutes.js: Định nghĩa routes + gắn middlewares
 *
 * Thứ tự middleware trên mỗi route:
 *   1. Rate Limiter  → chống brute-force / spam
 *   2. Validator     → kiểm tra dữ liệu đầu vào
 *   3. Controller    → xử lý logic
 */

const express        = require('express');
const router         = express.Router();

const { registerLimiter, otpLimiter }                          = require('../middlewares/rateLimiter');
const { registerRules, otpRules, resendOtpRules,
        handleValidationErrors }                               = require('../middlewares/validate');
const { register, verifyOtp, resendOtp }                       = require('../controllers/authController');

// POST /api/auth/register
router.post(
  '/register',
  registerLimiter,
  registerRules,
  handleValidationErrors,
  register
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  otpLimiter,
  otpRules,
  handleValidationErrors,
  verifyOtp
);

// POST /api/auth/resend-otp
router.post(
  '/resend-otp',
  otpLimiter,
  resendOtpRules,
  handleValidationErrors,
  resendOtp
);

module.exports = router;
