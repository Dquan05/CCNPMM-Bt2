'use strict';

const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Cấu hình Nodemailer transporter
 * Dùng Mailtrap cho môi trường development
 * Thay MAIL_HOST/PORT/USER/PASS bằng Gmail SMTP cho production
 */
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port:   parseInt(process.env.MAIL_PORT) || 587,
  secure: false, // true nếu dùng port 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Xác minh cấu hình khi khởi động
transporter.verify((err) => {
  if (err) {
    console.error('[Mailer] ❌ Email transporter error:', err.message);
  } else {
    console.log('[Mailer] ✅ Email transporter ready');
  }
});

module.exports = transporter;
