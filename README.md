# CCNPMM – Bài tập 2: Bảo mật API Module Register

> **Môn học**: Các Công Nghệ Phần Mềm Mới  
> **Yêu cầu**: Viết API và bảo mật API cho chức năng Register sử dụng Express.js, MySQL, kiến trúc 3 tầng với Validation, Rate Limiting và OTP kích hoạt qua mail.

---

## Công nghệ sử dụng

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| `express` | ^4.19 | Web framework – xây dựng REST API |
| `mysql2` | ^3.9 | Kết nối MySQL với Connection Pool |
| `bcryptjs` | ^2.4 | Hash mật khẩu (salt rounds = 12) |
| `express-validator` | ^7.1 | Validation dữ liệu đầu vào |
| `express-rate-limit` | ^7.3 | Rate Limiting – chống brute-force, spam |
| `nodemailer` | ^6.9 | Gửi email OTP |
| `dotenv` | ^16.4 | Quản lý biến môi trường |
| `nodemon` | ^3.1 | Tự động reload server khi phát triển |

---

## Kiến trúc 3 tầng

```
src/
├── routes/authRoutes.js        ← Tầng 1: Định nghĩa endpoints + gắn middleware
├── controllers/authController.js← Tầng 1: Nhận request, trả response
├── middlewares/
│   ├── validate.js             ← Middleware: Kiểm tra dữ liệu đầu vào
│   └── rateLimiter.js          ← Middleware: Giới hạn số lần gọi API
├── services/
│   ├── authService.js          ← Tầng 2: Logic đăng ký, hash password
│   └── otpService.js           ← Tầng 2: Tạo OTP, gửi mail, xác minh
├── models/
│   ├── userModel.js            ← Tầng 3: Truy vấn bảng users
│   └── otpModel.js             ← Tầng 3: Truy vấn bảng otps
├── config/
│   ├── db.js                   ← MySQL connection pool
│   └── mailer.js               ← Nodemailer transporter
└── app.js                      ← Entry point Express
```

---

## Cài đặt và chạy

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo file `.env`

```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ccnpmm_db

MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass
MAIL_FROM="No Reply <no-reply@collabbrain.com>"

OTP_EXPIRES_MINUTES=10
```

> **Gợi ý**: Dùng [Mailtrap.io](https://mailtrap.io) (miễn phí) để nhận email OTP khi test local mà không cần cài mail server thật.

### 3. Khởi tạo Database MySQL

Chạy script SQL trong file [`docs/Database_Schema.md`](./docs/Database_Schema.md):

```sql
CREATE DATABASE IF NOT EXISTS ccnpmm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ccnpmm_db;

CREATE TABLE users ( ... );  -- Xem chi tiết trong Database_Schema.md
CREATE TABLE otps  ( ... );
```

### 4. Chạy server

```bash
npm run dev     # Development (auto-reload với nodemon)
npm start       # Production
```

Kết quả khi khởi động thành công:

```
[App] ✅ Server running on http://localhost:3000
[DB]  ✅ MySQL connected successfully
[Mailer] ✅ Email transporter ready
```

---

## API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Mô tả | Rate Limit |
|--------|----------|-------|-----------|
| `GET` | `/health` | Kiểm tra server đang chạy | Không giới hạn |
| `POST` | `/api/auth/register` | Đăng ký tài khoản, gửi OTP | 5 req / 15 phút / IP |
| `POST` | `/api/auth/verify-otp` | Xác minh OTP, kích hoạt tài khoản | 3 req / 10 phút / IP |
| `POST` | `/api/auth/resend-otp` | Gửi lại OTP mới | 3 req / 10 phút / IP |

### Ví dụ: Đăng ký tài khoản

**Request**
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "password": "Test@12345"
}
```

**Response thành công `201`**
```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP kích hoạt tài khoản.",
  "data": { "email": "nguyenvana@example.com" }
}
```

### Ví dụ: Xác minh OTP

**Request**
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "nguyenvana@example.com",
  "otp": "483920"
}
```

**Response thành công `200`**
```json
{
  "success": true,
  "message": "Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập ngay.",
  "data": { "email": "nguyenvana@example.com", "status": "active" }
}
```

---

## Các lớp bảo mật

### 1. Input Validation (`express-validator`)
- `fullName`: 2–100 ký tự, không để trống
- `email`: đúng định dạng email, normalize
- `password`: ≥ 8 ký tự, phải có **chữ hoa**, **số** và **ký tự đặc biệt** (`!@#$%...`)
- `otp`: đúng **6 chữ số**

### 2. Rate Limiting (`express-rate-limit`)
- `/register`: tối đa **5 lần / 15 phút / IP** → chặn spam tạo tài khoản
- `/verify-otp`, `/resend-otp`: tối đa **3 lần / 10 phút / IP** → chặn brute-force OTP

### 3. Bảo mật Password (`bcryptjs`)
- Hash với `saltRounds = 12` trước khi lưu DB
- Không bao giờ lưu mật khẩu dạng plaintext

### 4. Bảo mật OTP
- OTP **6 chữ số ngẫu nhiên** (`crypto.randomInt`)
- **Hash SHA-256** trước khi lưu DB (không lưu plaintext)
- Hết hạn sau **10 phút**
- Tự động xóa khỏi DB sau khi xác minh thành công

---

## Test với Postman

Import file [`CollabBrain_BE.postman_collection.json`](./CollabBrain_BE.postman_collection.json) vào Postman, sau đó chạy theo thứ tự:

1. **Health Check** – kiểm tra server hoạt động
2. **Register – Send OTP** – đăng ký và nhận OTP qua email
3. **Register – Verify OTP** – điền OTP từ email vào biến `{{otp}}` rồi gửi
4. **Register – Resend OTP** – nếu OTP hết hạn

---

## Tài liệu chi tiết

| File | Nội dung |
|------|----------|
| [`ModuleRegister.md`](./ModuleRegister.md) | Tổng quan module, Use Case, Sequence Diagram |
| [`docs/API_Register.md`](./docs/API_Register.md) | Đặc tả đầy đủ request/response từng endpoint |
| [`docs/Security.md`](./docs/Security.md) | Chiến lược bảo mật: validation rules, rate limit, OTP policy |
| [`docs/Database_Schema.md`](./docs/Database_Schema.md) | DDL SQL bảng `users` và `otps` |