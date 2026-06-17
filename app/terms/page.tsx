import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều khoản Dịch vụ — Nect Lite by GameNect',
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 'var(--app-max-width)', margin: '0 auto', padding: '32px 20px', fontFamily: 'Outfit, sans-serif', background: 'var(--bg-surface)', minHeight: '100dvh' }}>
      <a href="/login" style={{ color: 'var(--accent)', display: 'block', marginBottom: 24, fontSize: '0.875rem' }}>
        ← Quay lại
      </a>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
        Điều khoản Dịch vụ
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 32 }}>
        Cập nhật lần cuối: Tháng 6, 2026 | Nect Lite by GameNect
      </p>

      {[
        {
          title: '1. Chấp nhận điều khoản',
          body: 'Bằng cách sử dụng Nect Lite, bạn đồng ý tuân thủ các điều khoản này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.',
        },
        {
          title: '2. Điều kiện sử dụng',
          body: 'Bạn phải từ 18 tuổi trở lên để sử dụng Nect Lite. Bạn chịu trách nhiệm về tất cả hoạt động trong tài khoản của mình.',
        },
        {
          title: '3. Nội dung người dùng',
          body: 'Bạn không được đăng nội dung vi phạm pháp luật, xúc phạm, hoặc vi phạm quyền riêng tư của người khác. Chúng tôi có quyền xóa nội dung vi phạm.',
        },
        {
          title: '4. Cấm sử dụng',
          body: 'Nghiêm cấm giả mạo danh tính người khác, gửi spam, quấy rối người dùng khác, hoặc sử dụng dịch vụ cho mục đích thương mại trái phép.',
        },
        {
          title: '5. Quyền sở hữu trí tuệ',
          body: 'Tất cả nội dung, thiết kế và tính năng của Nect Lite thuộc sở hữu của GameNect. Nội dung bạn đăng thuộc quyền sở hữu của bạn.',
        },
        {
          title: '6. Chấm dứt tài khoản',
          body: 'Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản vi phạm điều khoản mà không cần báo trước.',
        },
        {
          title: '7. Liên hệ',
          body: 'Mọi thắc mắc về điều khoản, vui lòng liên hệ: support@gamenect.app',
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
