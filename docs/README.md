# AnteLacus 项目文档中心

> 这里是 antelacus.com 项目的完整文档集合，包含美学设计、运营策略、内容管理和SEO优化等各个方面。

---

## 📚 文档列表

### 🎨 美学设计文档
- **[美学论文](AESTHETIC_THESIS.md)** - "活手稿"美学体系的哲学基础
- **[综合美学报告](COMPREHENSIVE_AESTHETIC_REPORT.md)** - 美学实现的技术细节与成果

### 🚀 运营策略文档
- **[品牌运营指南](brand-operating.md)** - 完整的品牌定位、SEO策略、内容矩阵和商业化路径

### 📝 内容管理文档
- **[内容发布流程](content-publishing.md)** - 文章、笔记、项目和视觉作品的发布指南

### 🔍 SEO优化文档
- **[SEO优化指南](seo-guide.md)** - SEO工具脚本和最佳实践
- **SEO检查脚本** (`scripts/seo-check.js`) - 自动化SEO配置验证
- **Sitemap提交指南** (`scripts/submit-sitemap.js`) - Google Search Console操作步骤
- **Open Graph图片生成器** (`scripts/generate-og-image.js`) - 社交媒体分享图片生成
- **Metadata验证脚本** (`scripts/validate-metadata.js`) - 页面元数据完整性检查

---

## 🎯 快速导航

### 新手上路
1. 阅读 **[美学论文](AESTHETIC_THESIS.md)** 了解项目美学理念
2. 查看 **[内容发布流程](content-publishing.md)** 学习如何发布内容
3. 参考 **[品牌运营指南](brand-operating.md)** 制定运营策略

### 日常维护
- **发布新内容** → 参考 `content-publishing.md`
- **SEO检查** → 运行 `npm run seo:check`
- **生成OG图片** → 运行 `npm run seo:og-image`
- **提交Sitemap** → 运行 `npm run seo:submit`

### 深度优化
- **美学调整** → 参考 `AESTHETIC_THESIS.md` 和 `COMPREHENSIVE_AESTHETIC_REPORT.md`
- **运营策略** → 参考 `brand-operating.md`
- **SEO优化** → 参考 `seo-guide.md` 和 `scripts/` 目录下的工具

---

## 🛠️ 实用脚本

### SEO相关
```bash
# 检查SEO配置
npm run seo:check

# 生成Open Graph图片
npm run seo:og-image

# 验证Metadata
npm run seo:validate

# 获取Sitemap提交指南
npm run seo:submit
```

### 内容验证
```bash
# 验证内容完整性
npm run validate:content
```

---

## 📋 文档维护原则

### 更新频率
- **美学文档**: 重大设计变更时更新
- **运营文档**: 每月审查和更新策略
- **内容指南**: 新增内容类型时更新
- **SEO文档**: 技术变更时同步更新

### 版本控制
- 所有文档变更都通过Git提交
- 重要更新在提交信息中说明变更原因
- 定期备份和归档历史版本

### 协作规范
- 文档修改前先讨论变更内容
- 保持文档的一致性和可读性
- 及时更新相关链接和引用

---

## 🔗 相关资源

### 外部工具
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics](https://analytics.google.com/)
- [Vercel Analytics](https://vercel.com/analytics)

### 项目链接
- [网站首页](https://antelacus.com)
- [GitHub仓库](https://github.com/antelacus/project-antelacus)
- [Vercel部署](https://vercel.com/dashboard)

---

*最后更新: 2025年1月* 