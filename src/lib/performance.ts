/**
 * Performance Monitoring for the Living Manuscript
 * 
 * This module provides performance tracking that aligns with our aesthetic philosophy:
 * - Monitor Core Web Vitals to ensure smooth user experience
 * - Track font loading performance for consistent typography
 * - Measure animation performance for fluid interactions
 * - Provide insights without compromising the user experience
 */

// Core Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Track Largest Contentful Paint (LCP)
  const observeLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      // Good LCP is < 2.5s, needs improvement if > 4s
      const lcpScore = lastEntry.startTime < 2500 ? 'good' : 
                      lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor';
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎭 Living Manuscript LCP: ${lastEntry.startTime.toFixed(2)}ms (${lcpScore})`);
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  };

  // Track Cumulative Layout Shift (CLS)
  const observeCLS = () => {
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value || 0;
        }
      }
      
      // Good CLS is < 0.1, needs improvement if > 0.25
      const clsScore = clsValue < 0.1 ? 'good' : 
                      clsValue < 0.25 ? 'needs-improvement' : 'poor';
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📐 Living Manuscript CLS: ${clsValue.toFixed(4)} (${clsScore})`);
      }
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  };

  // Track First Input Delay (FID) / Interaction to Next Paint (INP)
  const observeInteraction = () => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Type assertion for PerformanceEventTiming
        const eventEntry = entry as PerformanceEntry & { processingStart?: number };
        if (eventEntry.processingStart !== undefined) {
          const delay = eventEntry.processingStart - entry.startTime;
          
          // Good FID is < 100ms, needs improvement if > 300ms
          const fidScore = delay < 100 ? 'good' : 
                          delay < 300 ? 'needs-improvement' : 'poor';
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🖱️ Living Manuscript Interaction: ${delay.toFixed(2)}ms (${fidScore})`);
          }
        }
      }
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  };

  // Initialize all observers
  observeLCP();
  observeCLS();
  observeInteraction();
}

// Font loading performance tracking
export function trackFontLoading() {
  if (typeof window === 'undefined' || !document.fonts) return;

  const startTime = performance.now();
  
  document.fonts.ready.then(() => {
    const loadTime = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✍️ Living Manuscript Fonts loaded in: ${loadTime.toFixed(2)}ms`);
    }
    
    // Check if critical fonts are loaded
    const criticalFonts = [
      'Cormorant Garamond',
      'Source Serif 4',
      'Source Han Serif',
    ];
    
    criticalFonts.forEach(fontFamily => {
      const isLoaded = document.fonts.check(`16px "${fontFamily}"`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 ${fontFamily}: ${isLoaded ? '✅ loaded' : '❌ fallback'}`);
      }
    });
  });
}

// Animation performance tracking
export function trackAnimationPerformance() {
  if (typeof window === 'undefined') return;

  let frameCount = 0;
  let lastTime = performance.now();
  
  function measureFPS() {
    const currentTime = performance.now();
    frameCount++;
    
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      
      if (process.env.NODE_ENV === 'development' && fps < 55) {
        console.log(`🎬 Living Manuscript FPS: ${fps} (may affect smooth animations)`);
      }
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  }
  
  requestAnimationFrame(measureFPS);
}

// Resource loading performance
export function trackResourceLoading() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
      'TCP Connection': navigation.connectEnd - navigation.connectStart,
      'Request': navigation.responseStart - navigation.requestStart,
      'Response': navigation.responseEnd - navigation.responseStart,
      'DOM Processing': navigation.domContentLoadedEventStart - navigation.responseEnd,
      'Resource Loading': navigation.loadEventStart - navigation.domContentLoadedEventStart,
      'Total Load Time': navigation.loadEventEnd - navigation.fetchStart,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Living Manuscript Performance Metrics:');
      Object.entries(metrics).forEach(([name, value]) => {
        console.log(`   ${name}: ${value.toFixed(2)}ms`);
      });
    }
  });
}

// Initialize all performance tracking
export function initializePerformanceTracking() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  trackWebVitals();
  
  // Track font loading
  trackFontLoading();
  
  // Track animation performance
  trackAnimationPerformance();
  
  // Track resource loading
  trackResourceLoading();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🎭 Living Manuscript performance tracking initialized');
  }
}