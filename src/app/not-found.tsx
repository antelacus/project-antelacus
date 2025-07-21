import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ textAlign: 'center', marginTop: '6rem' }}>
      <h1 style={{ fontSize: '2.2rem', color: 'var(--color-secondary)', marginBottom: '1.2rem' }}>404 - 页面未找到</h1>
      <p style={{ color: 'var(--color-text)', marginBottom: '2rem' }}>
        很抱歉，你访问的页面不存在或已被删除。
      </p>
      <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: '1.1rem' }}>
        返回首页
      </Link>
    </main>
  );
} 