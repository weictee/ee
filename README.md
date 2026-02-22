# Discord Ticket Bot + Dashboard (Node.js)

Hệ thống đầy đủ gồm:
- **Discord Bot (discord.js v14)**: ticket qua **button/select menu**, lifecycle **Claim/Close/Reopen/Delete**, transcript HTML, log đầy đủ.
- **Web Dashboard (Express + EJS)**: đăng nhập Discord OAuth2, chọn server có quyền Manage Server, chỉnh ticket config + embed trực quan, live preview, Save/Apply.
- **Database JSON**: lưu config từng guild, embed và ticket đang mở (multi-server).

## 1) Kiến trúc thư mục

```bash
.
├── bot/
│   ├── index.js
│   ├── deploy-commands.js
│   ├── handlers/
│   │   ├── embedFactory.js
│   │   └── ticketHandler.js
│   └── utils/
│       └── transcript.js
├── dashboard/
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── dashboard.js
│   ├── views/
│   │   ├── index.ejs
│   │   ├── servers.ejs
│   │   └── guild.ejs
│   └── public/style.css
├── database/
│   ├── models/store.js
│   └── data/
│       ├── guild-configs.json
│       └── tickets.json
├── config.js
├── .env.example
└── package.json
```

## 2) Tính năng theo yêu cầu

### Discord Bot
- Panel ticket dùng **select menu** phân loại: mua hàng, bảo hành, hỗ trợ.
- Chống mở nhiều ticket:
  - lock theo user khi đang tạo ticket.
  - kiểm tra ticket đang mở trong database.
- Tạo channel riêng, phân quyền user + staff.
- Trong ticket có nút:
  - Claim
  - Close
  - Reopen
  - Delete
- Transcript **HTML** khi delete ticket.
- Logging đầy đủ các action: created/claimed/closed/reopened/deleted.

### Embed panel edit live
- Embed có: title, description, color, author, footer, banner, thumbnail.
- Có button edit ngay trên Discord panel:
  - Edit basic info
  - Edit author
  - Edit footer
  - Edit images
- Dùng **Modal** để sửa và lưu realtime vào DB.

### Dashboard web
- Login bằng Discord OAuth2.
- Danh sách server user có quyền **Manage Server**.
- Trang quản lý ticket config:
  - categoryId
  - staffRoleId
  - logChannelId
  - panelChannelId
  - ticket format
- Trang chỉnh embed + preview realtime kiểu Discord.
- Nút:
  - **Save**: lưu DB JSON
  - **Apply**: bot gửi panel embed mới lên Discord channel

### Security
- Middleware yêu cầu đăng nhập.
- Kiểm tra quyền admin server theo danh sách guild từ OAuth.
- Validate màu embed (`#RRGGBB`).
- Session cookie httpOnly.

## 3) Cài đặt

```bash
npm install
cp .env.example .env
```

Điền đủ thông số trong `.env`, đặc biệt OAuth:
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `OAUTH_REDIRECT_URI` (đặt đúng trong Discord Developer Portal)

## 4) Chạy hệ thống

Deploy slash command:
```bash
npm run deploy
```

Chạy bot:
```bash
npm start
```

Chạy dashboard:
```bash
npm run dashboard
```

## 5) Flow sử dụng
1. Chạy `/ticket` trong Discord để gửi panel.
2. User chọn loại ticket từ select menu.
3. Bot tạo ticket channel riêng.
4. Staff claim/close/reopen/delete.
5. Delete sẽ xuất transcript HTML và gửi log.
6. Admin vào dashboard chỉnh cấu hình/embed, save và apply lại panel.


## 6) Tạo file ZIP để gửi/tải về

Nếu bạn muốn đóng gói thành 1 file để tải/chia sẻ nhanh:

```bash
npm run pack
```

File tạo ra tại:
- `release/discord-ticket-suite.zip`

Hoặc xem file hướng dẫn nhanh: `TAI_VE_VA_CHAY.md`.
