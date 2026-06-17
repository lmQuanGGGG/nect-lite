# Nect Lite (GameNect Web PWA)

Nect Lite là phiên bản Web Progressive Web App (PWA) gọn nhẹ của nền tảng **GameNect**, được thiết kế để kết nối cộng đồng game thủ một cách nhanh chóng và trực quan nhất. 

Với phong cách thiết kế **Neo-brutalism** độc đáo, giao diện của Nect Lite mang lại cảm giác mạnh mẽ, trẻ trung, màu sắc nổi bật với các đường viền đậm (bold borders) và hiệu ứng đổ bóng cứng đặc trưng.

## 🚀 Tính Năng Nổi Bật (Key Features)

- **Giao diện Neo-brutalism:** Phong cách thiết kế cá tính, tối ưu hóa trải nghiệm người dùng (UX) hiện đại nhưng không hề nhàm chán.
- **Tìm kiếm đồng đội (Matching):** Vuốt để kết nối (Swipe-to-Match) với những game thủ có chung sở thích và tựa game yêu thích.
- **Moments (Bản tin):** Chia sẻ các khoảnh khắc highlight, cập nhật trạng thái và tương tác (react) với bài đăng của bạn bè.
- **Trò chuyện trực tuyến (Real-time Chat):** Hệ thống nhắn tin tức thời được trợ lực bởi Firebase, giúp giữ liên lạc với đồng đội mượt mà.
- **Thuê Mentor:** Tìm kiếm và đặt lịch với các cao thủ (Mentors) để leo rank hoặc cải thiện kỹ năng.
- **PWA (Progressive Web App):** Hỗ trợ cài đặt Nect Lite trực tiếp vào màn hình chính của điện thoại hoặc máy tính như một ứng dụng native thực thụ.

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **UI/Library:** [React 18](https://react.dev/)
- **Backend/Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore Database, Cloud Storage)
- **Styling:** Vanilla CSS kết hợp các utility Neo-brutalism tự xây dựng (`globals.css`)
- **PWA:** `next-pwa`

## 💻 Hướng Dẫn Cài Đặt (Getting Started)

**1. Clone dự án về máy:**
```bash
git clone https://github.com/lmQuanGGGG/nect-lite.git
cd nect-lite
```

**2. Cài đặt các gói thư viện (Dependencies):**
```bash
npm install
```

**3. Cấu hình biến môi trường:**
- Copy file `.env.example` thành `.env.local`
- Điền các thông tin API key của Firebase và RAWG vào file `.env.local`.

**4. Khởi chạy máy chủ phát triển (Development Server):**
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để trải nghiệm Nect Lite!

## 📜 Giấy phép (License)
Dự án được phát triển bởi đội ngũ GameNect.
