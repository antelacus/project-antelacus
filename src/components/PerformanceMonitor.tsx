"use client";
import { useEffect } from 'react';

/**
 * Performance Monitor Component
 * 
 * A silent guardian that watches over the Living Manuscript's performance,
 * ensuring our aesthetic vision doesn't compromise user experience.
 * 
 * This component:
 * - Tracks Core Web Vitals in production
 * - Monitors font loading performance
 * - Provides development insights
 * - Maintains the zen of performance optimization
 */

interface PerformanceMonitorProps {
  /** Whether to enable verbose logging in development */
  enableDevLogs?: boolean;
  /** Custom analytics endpoint for performance data */
  analyticsEndpoint?: string;
}

export default function PerformanceMonitor({ 
  enableDevLogs = true, 
  analyticsEndpoint 
}: PerformanceMonitorProps) {
  
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals
    const trackWebVitals = () => {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        const lcpValue = lastEntry.startTime;
        const lcpScore = lcpValue < 2500 ? 'good' : lcpValue < 4000 ? 'needs-improvement' : 'poor';
        
        if (enableDevLogs && process.env.NODE_ENV === 'development') {
          console.log(`🎭 LCP: ${lcpValue.toFixed(2)}ms (${lcpScore})`);
        }

        // Send to analytics in production
        if (analyticsEndpoint && process.env.NODE_ENV === 'production') {
          sendAnalytics('lcp', { value: lcpValue, score: lcpScore });
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value || 0;
          }
        }
        
        const clsScore = clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor';
        
        if (enableDevLogs && process.env.NODE_ENV === 'development') {
          console.log(`📐 CLS: ${clsValue.toFixed(4)} (${clsScore})`);
        }

        if (analyticsEndpoint && process.env.NODE_ENV === 'production') {
          sendAnalytics('cls', { value: clsValue, score: clsScore });
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Type assertion for PerformanceEventTiming
          const eventEntry = entry as PerformanceEntry & { processingStart?: number };
          if (eventEntry.processingStart !== undefined) {
            const fidValue = eventEntry.processingStart - entry.startTime;
            const fidScore = fidValue < 100 ? 'good' : fidValue < 300 ? 'needs-improvement' : 'poor';
            
            if (enableDevLogs && process.env.NODE_ENV === 'development') {
              console.log(`🖱️ FID: ${fidValue.toFixed(2)}ms (${fidScore})`);
            }

            if (analyticsEndpoint && process.env.NODE_ENV === 'production') {
              sendAnalytics('fid', { value: fidValue, score: fidScore });
            }
          }
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    };

    // Track font loading performance
    const trackFontLoading = () => {
      if (!document.fonts) return;

      const startTime = performance.now();
      
      document.fonts.ready.then(() => {
        const loadTime = performance.now() - startTime;
        
        if (enableDevLogs && process.env.NODE_ENV === 'development') {
          console.log(`✍️ Fonts loaded: ${loadTime.toFixed(2)}ms`);
        }

        // Check critical fonts
        const criticalFonts = [
          'Cormorant Garamond',
          'Source Serif 4', 
          'Source Han Serif'
        ];

        const fontStatus = criticalFonts.map(fontFamily => ({
          font: fontFamily,
          loaded: document.fonts.check(`16px "${fontFamily}"`)
        }));

        if (enableDevLogs && process.env.NODE_ENV === 'development') {
          fontStatus.forEach(({ font, loaded }) => {
            console.log(`📝 ${font}: ${loaded ? '✅' : '❌'}`);
          });
        }

        if (analyticsEndpoint && process.env.NODE_ENV === 'production') {
          sendAnalytics('font-loading', { 
            loadTime, 
            fonts: fontStatus 
          });
        }
      });
    };

    // Track page load performance
    const trackPageLoad = () => {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          firstByte: navigation.responseStart - navigation.fetchStart,
        };

        if (enableDevLogs && process.env.NODE_ENV === 'development') {
          console.log('🚀 Page Load Metrics:');
          console.log(`   DOM Ready: ${metrics.domContentLoaded.toFixed(2)}ms`);
          console.log(`   Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
          console.log(`   First Byte: ${metrics.firstByte.toFixed(2)}ms`);
        }

        if (analyticsEndpoint && process.env.NODE_ENV === 'production') {
          sendAnalytics('page-load', metrics);
        }
      });
    };

    // Send analytics data
    const sendAnalytics = async (metric: string, data: Record<string, unknown>) => {
      if (!analyticsEndpoint) return;

      try {
        await fetch(analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metric,
            data,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        if (process.env.NODE_ENV === 'development') {
          console.warn('Analytics failed:', error);
        }
      }
    };

    // Initialize all tracking
    trackWebVitals();
    trackFontLoading();
    trackPageLoad();

    if (enableDevLogs && process.env.NODE_ENV === 'development') {
      console.log('🎭 Living Manuscript performance monitoring active');
    }

    // Register service worker for offline capabilities
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          if (enableDevLogs) {
            console.log('🎭 Service Worker registered');
          }
        })
        .catch((error) => {
          if (enableDevLogs) {
            console.log('Service Worker registration failed:', error);
          }
        });
    }

  }, [enableDevLogs, analyticsEndpoint]);

  // This component renders nothing - it's a silent guardian
  return null;
}