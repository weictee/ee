# File hướng dẫn tải về và chạy nhanh

## Cách 1: Tải ZIP trực tiếp từ GitHub
1. Mở trang repo trên GitHub.
2. Bấm **Code** → **Download ZIP**.
3. Giải nén, mở terminal trong thư mục project.

Sau đó chạy:
```bash
cp .env.example .env
npm install
npm run deploy
npm start
```

Mở thêm terminal thứ 2 để chạy dashboard:
```bash
npm run dashboard
```

---

## Cách 2: Tự tạo gói ZIP từ source hiện tại
Project có sẵn script đóng gói:
```bash
npm run pack
```

Sau khi chạy xong sẽ có file:
- `release/discord-ticket-suite.zip`

Bạn chỉ cần gửi file ZIP đó cho người khác tải về.

---

## Lưu ý bắt buộc trước khi chạy
- Sửa file `.env` theo mẫu `.env.example`.
- Trong Discord Developer Portal cần cấu hình OAuth callback đúng:
  - `http://localhost:3000/auth/callback`
