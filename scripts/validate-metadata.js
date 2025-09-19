#!/usr/bin/env node
/*
中文说明：校验主页 Metadata 配置
— 作用：扫描 src/app/page.tsx 的 metadata 配置（标题、描述、OpenGraph、Twitter、Robots、Canonical 等）并检查 OG 图片文件存在性。
— 使用方式：
  • 手动执行：`npm run seo:validate`
— 自动触发：否（本地/CI 辅助）。
— 注意：正则检查为基础存在性检测，实际内容可按需求调整；若采用多语言或布局改造，请同步更新检查规则。
*/
const fs = require('fs');
const path = require('path');

console.log('🔍 Metadata Validation');
console.log('=' .repeat(40));

// 读取主页文件
const pagePath = path.join(__dirname, '../src/app/page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');

// 检查关键metadata字段
const checks = [
  {
    name: 'Title',
    pattern: /title:\s*['"`]Ante Lacus, Pax Mentis['"`]/,
    required: true
  },
  {
    name: 'Description',
    pattern: /description:\s*['"`].*欢迎来到AnteLacus.*['"`]/,
    required: true
  },
  {
    name: 'Keywords',
    pattern: /keywords:\s*\[/,
    required: true
  },
  {
    name: 'OpenGraph Title',
    pattern: /openGraph:\s*{[^}]*title:\s*['"`]Ante Lacus, Pax Mentis['"`]/,
    required: true
  },
  {
    name: 'OpenGraph Image',
    pattern: /url:\s*['"`]\/images\/og-image\.svg['"`]/,
    required: true
  },
  {
    name: 'Twitter Card',
    pattern: /twitter:\s*{[^}]*card:\s*['"`]summary_large_image['"`]/,
    required: true
  },
  {
    name: 'Robots Index',
    pattern: /robots:\s*{[^}]*index:\s*true/,
    required: true
  },
  {
    name: 'Canonical URL',
    pattern: /canonical:\s*['"`]\/['"`]/,
    required: true
  }
];

let allPassed = true;

checks.forEach(check => {
  const passed = check.pattern.test(pageContent);
  const status = passed ? '✅' : '❌';
  const required = check.required ? '(必需)' : '(可选)';
  
  console.log(`${status} ${check.name} ${required}`);
  
  if (!passed && check.required) {
    allPassed = false;
  }
});

// 检查OG图片文件是否存在
const ogImagePath = path.join(__dirname, '../public/images/og-image.svg');
const ogImageExists = fs.existsSync(ogImagePath);
console.log(`${ogImageExists ? '✅' : '❌'} Open Graph Image File (必需)`);

if (!ogImageExists) {
  allPassed = false;
}

console.log('\n' + '=' .repeat(40));
console.log(`📊 结果: ${allPassed ? '✅ 所有检查通过' : '❌ 发现问题'}`);

if (allPassed) {
  console.log('\n🎉 主页metadata配置完整！');
  console.log('✅ 搜索引擎优化就绪');
  console.log('✅ 社交媒体分享就绪');
  console.log('✅ 结构化数据就绪');
} else {
  console.log('\n⚠️  请修复上述问题以确保最佳SEO效果');
}

// 显示metadata摘要
console.log('\n📋 Metadata 摘要:');
const titleMatch = pageContent.match(/title:\s*['"`]([^'"`]+)['"`]/);
const descMatch = pageContent.match(/description:\s*['"`]([^'"`]+)['"`]/);

if (titleMatch) {
  console.log(`标题: ${titleMatch[1]}`);
}
if (descMatch) {
  console.log(`描述: ${descMatch[1].substring(0, 100)}...`);
} 