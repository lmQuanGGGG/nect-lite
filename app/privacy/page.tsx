import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính sách riêng tư — Nect Lite by GameNect',
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 'var(--app-max-width)', margin: '0 auto', padding: '32px 20px', fontFamily: 'Outfit, sans-serif', background: 'var(--bg-surface)', minHeight: '100dvh' }}>
      <a href="/login" style={{ color: 'var(--accent)', display: 'block', marginBottom: 24, fontSize: '0.875rem' }}>
        ← Quay lại
      </a>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
        Chính sách Riêng tư
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 32 }}>
        Cập nhật lần cuối: Tháng 6, 2026 | Nect Lite by GameNect
      </p>

      {[
        {
          title: '1. Thông tin chúng tôi thu thập',
          body: 'Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký, bao gồm email, tên, ngày sinh, giới tính và ảnh. Chúng tôi cũng thu thập thông tin về cách bạn sử dụng ứng dụng.',
        },
        {
          title: '2. Cách chúng tôi sử dụng thông tin',
          body: 'Thông tin của bạn được sử dụng để cung cấp và cải thiện dịch vụ, ghép đôi với người dùng khác, và gửi thông báo liên quan đến tài khoản.',
        },
        {
          title: '3. Chia sẻ thông tin',
          body: 'Chúng tôi không bán thông tin cá nhân của bạn. Thông tin hồ sơ của bạn có thể được hiển thị cho người dùng khác trong ứng dụng theo cài đặt quyền riêng tư của bạn.',
        },
        {
          title: '4. Bảo mật',
          body: 'Chúng tôi sử dụng Firebase Security Rules và mã hóa để bảo vệ dữ liệu của bạn.',
        },
        {
          title: '5. Quyền của bạn',
          body: 'Bạn có thể xem, cập nhật hoặc xóa thông tin cá nhân của mình bất cứ lúc nào trong phần cài đặt hồ sơ.',
        },
        {
          title: '6. Liên hệ',
          body: 'Nếu bạn có câu hỏi về chính sách này, vui lòng liên hệ: support@gamenect.app',
        },
      ].map((s) => (
        <section key={s.title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {s.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{s.body}</p>
        </section>
      ))}
    </div>
  );
}
