// import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container" style={{ 
      textAlign: 'center', 
      marginTop: '6rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <h1 style={{ fontSize: '2.2rem', color: 'var(--color-secondary)', marginBottom: '1.2rem' }}>404 - 页面未找到</h1>
      <p style={{ color: 'var(--color-text)', marginBottom: '2rem' }}>
        你访问的页面不存在或已被删除。
      </p>
    </main>
  );
} 