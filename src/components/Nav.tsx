"use client";
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

export default function Nav() {
  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Link href="/" className="logo-brand">
          <Image 
            src="/logo-icon.svg" 
            alt="AnteLacus Logo" 
            width={24} 
            height={24} 
            className="logo-icon"
          />
          <span className="brand-name">AnteLacus</span>
        </Link>
        <nav className="nav-links" style={{ flex: 1 }}>
          <Link href="/posts" style={{ marginRight: '1rem' }}>长内容</Link>
          <Link href="/notes" style={{ marginRight: '1rem' }}>灵感速记</Link>
          <Link href="/gallery" style={{ marginRight: '1rem' }}>相册</Link>
          <Link href="/projects" style={{ marginRight: '1rem' }}>项目</Link>
          <Link href="/about" style={{ marginRight: '1rem' }}>关于</Link>
        </nav>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <a href="mailto:me@antelacus.com" className="email-btn" aria-label="发送邮件">📧</a>
          <a href="https://github.com/antelacus" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://x.com/antelacus110787" target="_blank" rel="noopener noreferrer">X</a>
          <a href="https://instagram.com/antelacus" target="_blank" rel="noopener noreferrer">Ins</a>
        </div>
      </div>
    </header>
  );
} 