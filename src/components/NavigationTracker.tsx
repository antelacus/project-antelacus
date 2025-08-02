"use client";
import Link from 'next/link';
import { ReactNode } from 'react';

interface NavigationTrackerProps {
  href: string;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

/**
 * Client-side wrapper for navigation links that tracks navigation from homepage
 * to trigger the orchestrated animation sequence
 */
export default function NavigationTracker({ 
  href, 
  className, 
  children, 
  'aria-label': ariaLabel 
}: NavigationTrackerProps) {
  const handleClick = () => {
    // Only set navigatedFromHome flag when clicking from homepage
    if (window.location.pathname === '/') {
      sessionStorage.setItem('navigatedFromHome', 'true');
    }
  };

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}