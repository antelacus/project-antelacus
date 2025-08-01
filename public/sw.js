// Service Worker for the Living Manuscript
// Implements intelligent caching that respects our aesthetic philosophy

const CACHE_NAME = 'living-manuscript-v1';
const STATIC_CACHE_NAME = 'living-manuscript-static-v1';

// Resources to cache immediately (critical for first paint)
const CRITICAL_RESOURCES = [
  '/',
  '/posts',
  '/notes', 
  '/gallery',
  '/projects',
  '/about',
  // Critical CSS and fonts will be cached by browser cache headers
];

// Resources to cache on demand
const CACHE_STRATEGIES = {
  // Images: Cache first, then network (they rarely change)
  images: /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i,
  
  // Fonts: Cache first (immutable once loaded)
  fonts: /\.(woff|woff2|ttf|otf)$/i,
  
  // CSS/JS: Network first (for updates), then cache
  assets: /\.(css|js)$/i,
  
  // API/Content: Network first, cache as fallback
  content: /\/(api|posts|notes|gallery|projects)/,
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🎭 Living Manuscript: Service Worker installing');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🎭 Living Manuscript: Service Worker activating');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      
      // Take control immediately
      self.clients.claim(),
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  // Determine caching strategy based on resource type
  if (CACHE_STRATEGIES.images.test(url.pathname)) {
    // Images: Cache first
    event.respondWith(cacheFirst(request));
  } else if (CACHE_STRATEGIES.fonts.test(url.pathname)) {
    // Fonts: Cache first (they're immutable)
    event.respondWith(cacheFirst(request));
  } else if (CACHE_STRATEGIES.assets.test(url.pathname)) {
    // CSS/JS: Network first with quick fallback
    event.respondWith(networkFirstQuick(request));
  } else if (url.origin === self.location.origin) {
    // Same-origin requests: Smart caching
    event.respondWith(smartCache(request));
  }
  // Cross-origin requests are not cached (CDN handles it)
});

// Cache-first strategy (for images, fonts)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🎭 Cache-first failed:', error);
    return new Response('Resource unavailable', { status: 503 });
  }
}

// Network-first with quick timeout (for CSS/JS)
async function networkFirstQuick(request) {
  try {
    // Quick network attempt (3 seconds max)
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 3000)
      )
    ]);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🎭 Network-first quick fallback to cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Resource unavailable', { status: 503 });
  }
}

// Smart caching for pages and content
async function smartCache(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback - offline page
    if (request.destination === 'document') {
      return caches.match('/offline.html') || 
             new Response(`
               <html>
                 <head><title>离线状态</title></head>
                 <body style="
                   font-family: serif;
                   background: #F9F8F6;
                   color: #1E1E1D;
                   padding: 2rem;
                   text-align: center;
                 ">
                   <h1>思绪暂时离线</h1>
                   <p>请检查网络连接后重试</p>
                 </body>
               </html>
             `, { 
               headers: { 'Content-Type': 'text/html' }
             });
    }
    
    return new Response('Resource unavailable', { status: 503 });
  }
}

// Background sync for analytics and performance data
self.addEventListener('sync', (event) => {
  if (event.tag === 'performance-sync') {
    event.waitUntil(syncPerformanceData());
  }
});

async function syncPerformanceData() {
  // Sync any cached performance data when connection is restored
  console.log('🎭 Living Manuscript: Syncing performance data');
}