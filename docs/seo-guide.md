# SEO 优化文档

> 这里是 antelacus.com 项目的 SEO 优化相关文档和工具集合。

---

## 🛠️ SEO 工具脚本

### 自动化检查工具

#### 1. SEO 配置检查 (`scripts/seo-check.js`)
**用途**: 验证网站的基本SEO配置完整性
**运行**: `npm run seo:check`

**检查项目**:
- ✅ Sitemap 文件存在性和URL数量
- ✅ Robots.txt 配置和sitemap引用
- ✅ 页面Metadata配置完整性
- ✅ 提供SEO状态总结报告

#### 2. Metadata 验证 (`scripts/validate-metadata.js`)
**用途**: 深度验证页面metadata配置
**运行**: `npm run seo:validate`

**验证项目**:
- ✅ Title 和 Description 配置
- ✅ Open Graph 和 Twitter Cards
- ✅ 关键词和作者信息
- ✅ 结构化数据标记
- ✅ 提供详细的配置报告

#### 3. Open Graph 图片生成 (`scripts/generate-og-image.js`)
**用途**: 自动生成社交媒体分享图片
**运行**: `npm run seo:og-image`

**功能**:
- 🎨 生成 1200x630 像素的SVG图片
- 📝 包含网站名称、标语和印章
- 🎯 使用项目品牌色彩和字体
- 📁 自动保存到 `public/images/og-image.svg`

#### 4. Sitemap 提交指南 (`scripts/submit-sitemap.js`)
**用途**: 提供Google Search Console操作指南
**运行**: `npm run seo:submit`

**内容**:
- 📋 详细的Search Console操作步骤
- 🔗 当前sitemap包含的所有URL列表
- ⏱️ 预期时间线和里程碑
- 📊 监控和优化建议

---

## 📊 SEO 监控指标

### Core Web Vitals 目标
- **LCP (最大内容绘制)**: < 2.0s
- **CLS (累积布局偏移)**: < 0.08
- **FID (首次输入延迟)**: < 80ms

### 技术SEO指标
- **Sitemap URL数量**: 16个页面
- **页面加载速度**: < 1.5s
- **移动端友好性**: 100%
- **无障碍访问**: WCAG 2.1 AA标准

### 内容SEO指标
- **Meta Description长度**: 80-150字符
- **Title长度**: 50-60字符
- **关键词密度**: 自然分布
- **内部链接**: 合理分布

---

## 🔍 Google 收录优化

### 提交策略
1. **新内容发布后24小时内**提交到Search Console
2. **重要页面更新后**重新请求索引
3. **定期批量提交**sitemap.xml

### 预期时间线
- **Sitemap处理**: 1-2天
- **初始索引**: 1-4周
- **完整索引**: 2-8周

### 监控要点
- 每周检查Search Console报告
- 监控索引覆盖率和错误
- 分析搜索表现和点击率
- 跟踪关键词排名变化

---

## 📝 最佳实践

### 页面优化
- 每个页面都有唯一的title和description
- 使用语义化的HTML结构
- 优化图片alt文本和文件名
- 确保移动端友好性

### 内容优化
- 创建高质量、原创内容
- 使用自然的关键词分布
- 建立内部链接网络
- 定期更新和扩展内容

### 技术优化
- 保持快速的加载速度
- 实现响应式设计
- 优化URL结构
- 配置结构化数据

---

## 🔗 相关资源

### 外部工具
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics](https://analytics.google.com/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

### 项目文档
- [品牌运营指南](../operations/brand-operating.md) - 完整的SEO策略
- [内容发布流程](../content/content-publishing.md) - 内容优化指南
- [美学设计文档](../aesthetic/) - 用户体验优化

---

*最后更新: 2025年1月* 