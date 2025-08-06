#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://antelacus.com';

// 检查sitemap.xml
function checkSitemap() {
  const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const content = fs.readFileSync(sitemapPath, 'utf8');
    const urls = content.match(/<loc>(.*?)<\/loc>/g);
    console.log('✅ Sitemap found with', urls.length, 'URLs');
    return true;
  } else {
    console.log('❌ Sitemap not found');
    return false;
  }
}

// 检查robots.txt
function checkRobots() {
  const robotsPath = path.join(__dirname, '../public/robots.txt');
  if (fs.existsSync(robotsPath)) {
    const content = fs.readFileSync(robotsPath, 'utf8');
    if (content.includes('Sitemap:')) {
      console.log('✅ Robots.txt found with sitemap reference');
      return true;
    } else {
      console.log('⚠️  Robots.txt found but missing sitemap reference');
      return false;
    }
  } else {
    console.log('❌ Robots.txt not found');
    return false;
  }
}

// 检查页面元数据
function checkPageMetadata() {
  const pages = [
    'src/app/page.tsx',
    'src/app/about/page.tsx',
    'src/app/posts/page.tsx',
    'src/app/notes/page.tsx',
    'src/app/projects/page.tsx',
    'src/app/gallery/page.tsx'
  ];

  let allGood = true;
  pages.forEach(page => {
    const pagePath = path.join(__dirname, '..', page);
    if (fs.existsSync(pagePath)) {
      const content = fs.readFileSync(pagePath, 'utf8');
      if (content.includes('title') || content.includes('description')) {
        console.log(`✅ ${page} has metadata`);
      } else {
        console.log(`⚠️  ${page} missing metadata`);
        allGood = false;
      }
    }
  });
  return allGood;
}

// 主检查函数
function runSEOCheck() {
  console.log('🔍 Running SEO Check for', BASE_URL);
  console.log('=' .repeat(50));
  
  const sitemapOk = checkSitemap();
  const robotsOk = checkRobots();
  const metadataOk = checkPageMetadata();
  
  console.log('=' .repeat(50));
  console.log('📋 Summary:');
  console.log(`Sitemap: ${sitemapOk ? '✅' : '❌'}`);
  console.log(`Robots.txt: ${robotsOk ? '✅' : '❌'}`);
  console.log(`Page Metadata: ${metadataOk ? '✅' : '❌'}`);
  
  if (sitemapOk && robotsOk) {
    console.log('\n🎉 Basic SEO setup looks good!');
    console.log('Next steps:');
    console.log('1. Submit sitemap to Google Search Console');
    console.log('2. Request indexing for important pages');
    console.log('3. Monitor coverage in Search Console');
  } else {
    console.log('\n⚠️  Some SEO issues found. Please fix them first.');
  }
}

runSEOCheck(); 