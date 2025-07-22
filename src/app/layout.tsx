import './globals.css';
import React from 'react';
import Nav from '../components/Nav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Nav />
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
