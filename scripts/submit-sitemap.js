#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://antelacus.com';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

console.log('🚀 Google Search Console Sitemap Submission Guide');
console.log('=' .repeat(60));

console.log('\n📋 Step-by-step instructions:');
console.log('\n1️⃣  Access Google Search Console');
console.log('   • Go to: https://search.google.com/search-console');
console.log('   • Sign in with your Google account');

console.log('\n2️⃣  Add your property (if not already added)');
console.log('   • Click "Add property"');
console.log('   • Enter: ' + BASE_URL);
console.log('   • Choose verification method (DNS or HTML file)');

console.log('\n3️⃣  Submit your sitemap');
console.log('   • In the left sidebar, click "Sitemaps"');
console.log('   • Enter sitemap URL: ' + SITEMAP_URL);
console.log('   • Click "Submit"');

console.log('\n4️⃣  Request indexing for important pages');
console.log('   • Use "URL Inspection" tool');
console.log('   • Enter important page URLs one by one');
console.log('   • Click "Request Indexing" for each');

console.log('\n📊 Your current sitemap contains:');

// 读取并显示sitemap内容
const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const content = fs.readFileSync(sitemapPath, 'utf8');
  const urls = content.match(/<loc>(.*?)<\/loc>/g);
  
  if (urls) {
    urls.forEach((url, index) => {
      const cleanUrl = url.replace('<loc>', '').replace('</loc>', '');
      console.log(`   ${index + 1}. ${cleanUrl}`);
    });
  }
}

console.log('\n⏱️  Expected timeline:');
console.log('   • Sitemap processing: 1-2 days');
console.log('   • Initial indexing: 1-4 weeks');
console.log('   • Full indexing: 2-8 weeks');

console.log('\n🔍 Monitoring tips:');
console.log('   • Check "Coverage" report weekly');
console.log('   • Monitor "Performance" for search queries');
console.log('   • Review "URL Inspection" for indexing status');

console.log('\n📈 Additional recommendations:');
console.log('   • Create quality backlinks from relevant sites');
console.log('   • Share content on social media');
console.log('   • Keep content fresh and updated');
console.log('   • Optimize page load speed');

console.log('\n✅ Ready to submit! Your sitemap is properly configured.'); 