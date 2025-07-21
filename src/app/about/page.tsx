export const metadata = {
  title: '关于本站 | antelacus.com',
  description: '关于 antelacus.com 博客和站长的介绍。',
};

export default function AboutPage() {
  return (
    <main>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>关于本站</h1>
      <p style={{ color: 'var(--color-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
        antelacus.com 是一个专注于技术、生活与思考的个人博客，旨在记录成长、分享开发经验与见解。
      </p>
      <section style={{ marginBottom: '1.2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>关于站长</h2>
        <p style={{ color: 'var(--color-text)' }}>
          你好！我是 antelacus，一名热爱编程与写作的开发者，喜欢探索新技术、记录生活点滴。
        </p>
      </section>
      <section>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>联系方式</h2>
        <ul style={{ color: 'var(--color-text)', fontSize: '1em' }}>
          <li>邮箱：hi@antelacus.com</li>
          <li>GitHub：<a href="https://github.com/antelacus" target="_blank" rel="noopener noreferrer">antelacus</a></li>
        </ul>
      </section>
    </main>
  );
} 