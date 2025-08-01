/**
 * Skip Link Component for Enhanced Accessibility
 * 
 * Provides keyboard users a way to skip navigation and jump directly to main content.
 * Hidden by default, appears when focused with Tab key.
 * Styled to match the "Living Manuscript" aesthetic.
 */

"use client";

export default function SkipLink() {
  const handleSkipToMain = () => {
    const mainElement = document.getElementById('main-content');
    if (mainElement) {
      mainElement.focus();
      mainElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkipToMain}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: 'var(--color-seal)',
        color: 'var(--color-paper)',
        padding: '8px 16px',
        borderRadius: '4px',
        textDecoration: 'none',
        fontWeight: '500',
        fontSize: '14px',
        zIndex: 1000,
        transition: 'top 0.3s ease',
        border: '2px solid var(--color-seal)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '6px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      跳转到主要内容
    </a>
  );
}