'use strict';

const { body, validationResult } = require('express-validator');

// ──────────────────────────────────────────────
// Validation rules cho POST /api/auth/register
// ──────────────────────────────────────────────
const registerRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 100 }).withMessage('Họ tên phải từ 2 đến 100 ký tự'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email quá dài'),

  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
    .matches(/[A-Z]/).withMessage('Mật khẩu phải có ít nhất 1 chữ hoa')
    .matches(/[0-9]/).withMessage('Mật khẩu phải có ít nhất 1 chữ số')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
];

// ──────────────────────────────────────────────
// Validation rules cho POST /api/auth/verify-otp
// ──────────────────────────────────────────────
const otpRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .normalizeEmail(),

  body('otp')
    .trim()
    .notEmpty().withMessage('Mã OTP không được để trống')
    .isNumeric().withMessage('Mã OTP chỉ chứa chữ số')
    .isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải đúng 6 chữ số'),
];

// ──────────────────────────────────────────────
// Validation rules cho POST /api/auth/resend-otp
// ──────────────────────────────────────────────
const resendOtpRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .normalizeEmail(),
];

/**
 * Middleware xử lý lỗi validation.
 * Gọi sau các rule arrays trong route definition.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(e => ({
        field:   e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = {
  registerRules,
  otpRules,
  resendOtpRules,
  handleValidationErrors,
};
