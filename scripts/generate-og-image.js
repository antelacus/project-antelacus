#!/usr/bin/env node
/*
中文说明：生成统一的 Open Graph 封面图
— 作用：在 public/images/ 下生成 og-image.svg，供页面 metadata 的 openGraph.images 使用，确保分享与预览一致性。
— 使用方式：
  • 手动执行：`npm run seo:og-image`
— 自动触发：否（按需生成或更新）。
— 注意：如需 PNG/JPEG，请在生成后自行转换；并在页面 metadata 中更新引用路径。
*/
const fs = require('fs');
const path = require('path');

console.log('🎨 Open Graph Image Generator');
console.log('=' .repeat(40));

// 创建Open Graph图片的SVG内容
const ogImageSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&amp;display=swap');
      .background { fill: #F9F8F6; }
      .text { font-family: 'Cormorant Garamond', serif; fill: #1E1E1D; }
      .title { font-size: 72px; font-weight: 600; }
      .subtitle { font-size: 32px; font-weight: 400; opacity: 0.8; }
      .seal { fill: #B42A1E; font-size: 24px; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect class="background" width="1200" height="630"/>
  
  <!-- Decorative elements -->
  <rect x="50" y="50" width="1100" height="530" fill="none" stroke="#1E1E1D" stroke-width="2" opacity="0.1"/>
  
  <!-- Main title -->
  <text x="600" y="250" class="text title" text-anchor="middle">AnteLacus</text>
  
  <!-- Subtitle -->
  <text x="600" y="320" class="text subtitle" text-anchor="middle">Ante Lacus, Pax Mentis</text>
  
  <!-- Motto (removed duplicate to keep single subtitle) -->
  
  <!-- Seal -->
  <text x="600" y="450" class="text seal" text-anchor="middle">■</text>
  
  <!-- Bottom line -->
  <line x1="200" y1="500" x2="1000" y2="500" stroke="#1E1E1D" stroke-width="1" opacity="0.3"/>
  
  <!-- URL -->
  <text x="600" y="550" class="text subtitle" text-anchor="middle" opacity="0.5" font-size="24px">antelacus.com</text>
</svg>`;

// 确保目录存在
const ogImageDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(ogImageDir)) {
  fs.mkdirSync(ogImageDir, { recursive: true });
}

// 写入SVG文件
const ogImagePath = path.join(ogImageDir, 'og-image.svg');
fs.writeFileSync(ogImagePath, ogImageSVG);

console.log('✅ Generated Open Graph image:');
console.log(`   📁 Location: ${ogImagePath}`);
console.log(`   🌐 URL: https://antelacus.com/images/og-image.svg`);
console.log('\n📋 Next steps:');
console.log('1. Update page.tsx to use the new OG image');
console.log('2. Test the image on social media platforms');
console.log('3. Consider converting to PNG for better compatibility');

// 更新建议
console.log('\n💡 Update your page.tsx metadata with:');
console.log('openGraph: {');
console.log('  images: [{');
console.log('    url: "/images/og-image.svg",');
console.log('    width: 1200,');
console.log('    height: 630,');
console.log('    alt: "Ante Lacus, Pax Mentis",');
console.log('  }],');
console.log('},'); 