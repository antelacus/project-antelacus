# antelacus.com 博客项目

## 一、项目简介

本项目为 antelacus.com 个人博客网站，旨在打造一个支持 Markdown 写作、图片发布、社交媒体内容同步的高可定制化博客平台。网站将部署在 Vercel，使用 Next.js 框架，绑定自有域名 www.antelacus.com。

### （一）项目目标与需求

- 方便编辑和发布内容（支持 Markdown 语法）
- 免费托管，自动化部署
- 可定制性强，后续可扩展
- 专注原创内容展示（专栏、闪念、视觉、实验室）
- 统一的视觉设计系统和用户体验
- （可选）支持移动端编辑/发布

### （二）技术选型

- **框架**：Next.js（React 生态，支持静态生成和高度定制）
- **部署平台**：Vercel（与 Next.js 深度集成，自动化部署）
- **代码托管**：GitHub
- **内容格式**：Markdown/MDX
- **域名**：antelacus.com（Cloudflare 保护）

---

## 二、项目架构说明

### （一）页面样式控制架构

#### 🎨 样式控制分工

**统一控制（`src/app/globals.css`）**：
- **全局颜色系统**：所有CSS变量（`--color-primary`、`--color-bg`等）
- **容器类**：`.container`、`.container-wide`、`.gallery-detail` 等布局容器
- **卡片基础样式**：`.card`、`.card-link`、卡片悬停效果
- **组件样式**：所有卡片组件的完整样式定义
- **响应式宽度**：`--width-*` 变量控制不同页面的宽度
- **背景色**：通过 `body` 和CSS变量全局统一

**页面独立控制**：
- **容器选择**：每个页面选择使用哪个容器类（`container` vs `gallery-detail` vs `homepage`）
- **特定布局**：如专栏页面的横向布局
- **个别间距**：一些特殊的 `marginTop`、`padding` 调整

#### 📐 样式控制细分

| 样式类型 | 控制位置 | 示例 |
|---------|---------|------|
| 背景色、主题色 | `globals.css` 统一 | `--color-bg`、`--color-primary` |
| 页面宽度 | `globals.css` 变量 + 页面选择容器类 | `container`(900px) vs `homepage`(1200px) |
| 卡片距顶部距离 | 容器类的 `padding` 统一控制 | `.container { padding: 1rem 1rem 2rem 1rem }` |
| 卡片基础样式 | `globals.css` 统一 | `.card`、`.card-title` 等 |
| 特殊布局 | 组件内部样式类 | `.post-list-card` 横向布局 |

### （二）卡片组件架构

#### 🃏 卡片实现方式

| 卡片类型 | 首页实现 | 专门页面实现 | 组件文件 | 样式特点 |
|---------|---------|-------------|----------|----------|
| **专栏** | `<PostCard>` 组件 | `<PostListCard>` 组件 | `PostCard.tsx` / `PostListCard.tsx` | 首页：竖向卡片；专栏页：横向列表 |
| **闪念** | `<NoteCard>` 组件 | `<NoteCard>` 组件 | `NoteCard.tsx` | 统一的标准卡片布局 |
| **视觉** | `<PhotoCard>` 组件 | `<PhotoCard>` 组件 | `PhotoCard.tsx` | 统一的视觉卡片布局 |
| **实验室** | `<ProjectCard>` 组件 | `<ProjectCard>` 组件 | `ProjectCard.tsx` | 统一的标准卡片布局 |

#### 🔧 组件设计原则

**PostCard vs PostListCard**：
- `PostCard`：用于首页瀑布流，竖向布局，完整信息展示
- `PostListCard`：用于专栏页面，横向布局，左文右图的列表形式

**NoteCard & PhotoCard & ProjectCard**：
- 统一使用，在首页和专门页面保持一致的视觉效果
- 支持内容截断和省略号显示

#### 🎯 架构优势

1. **可维护性**：样式集中管理，修改一处即可影响全局
2. **可扩展性**：组件化架构便于后续功能扩展
3. **一致性**：相同内容类型在不同页面保持视觉一致性
4. **灵活性**：支持不同页面的特殊布局需求
5. **性能**：组件复用减少代码重复，优化打包体积

### （三）样式命名规范

#### 容器类命名
- `.container`：标准内容页面（900px宽度）
- `.container-wide`：宽内容页面（900px宽度）
- `.gallery-detail`：详情页面布局
- `.homepage`：首页瀑布流布局（1200px宽度）

#### 卡片相关命名
- `.card`：基础卡片样式
- `.card-link`：卡片链接包装
- `.post-list-*`：专栏列表卡片相关样式
- `.note-card`：闪念卡片样式
- `.photo-card`：视觉卡片样式
- `.project-card`：实验室项目卡片样式

### （四）图片资源管理架构

#### 📁 统一文件组织结构

**推荐的目录结构：**
```
public/images/                    # 统一的图片根目录
├── posts/                       # 专栏文章图片
│   ├── covers/                  # 封面图片
│   └── content/                 # 文章内容图片
│       └── {post-slug}/         # 按文章分组
├── notes/                       # 闪念笔记图片  
│   └── {note-slug}/             # 按笔记分组
├── gallery/                     # 视觉作品
│   ├── {album-name}/            # 按相册分组
│   └── {album-name}/
├── projects/                    # 实验室项目图片
│   └── {project-name}/          # 按项目分组
└── common/                      # 通用图片（logo、图标等）
    ├── logo-icon.svg
    ├── file.svg
    └── ...
```

#### 🎯 路径规范与优势

**路径命名规范：**
- 封面图：`/images/posts/covers/{slug}-cover.{ext}`
- 内容图：`/images/posts/content/{slug}/{description}.{ext}`
- 笔记图：`/images/notes/{slug}/image{number}.{ext}`
- 相册图：`/images/gallery/{album-name}/{original-filename}`
- 项目图：`/images/projects/{project-name}/{description}.{ext}`
- 通用图标：`/images/common/{icon-name}.svg`

**架构优势：**
1. **统一管理**：所有图片资源集中在 `/images` 下，避免根目录杂乱
2. **扩展友好**：支持多尺寸版本、WebP格式、CDN集成
3. **语义清晰**：路径即分类，便于理解和维护
4. **批量操作**：便于图片优化、压缩、格式转换等批量处理

### （五）统一标签管理系统

#### 标签架构设计

**全内容类型支持**：
- **专栏文章** (`PostMeta`)：`tags: string[]`
- **思维闪念** (`NoteMeta`)：`tags?: string[]`
- **视觉作品** (`PhotoMeta`)：`tags?: string[]`
- **实验室项目** (`ProjectMeta`)：`tags?: string[]`

**标签管理工具** (`src/lib/tags.ts`)：
- `getAllTags()`：获取全站所有标签
- `getTagStats()`：标签使用统计与内容类型分析
- `getContentByTag(tag)`：根据标签筛选全类型内容
- `getPopularTags(limit)`：热门标签排序
- `getRelatedTags(targetTag, limit)`：相关标签推荐

#### 标签系统特性

**🔄 跨内容类型聚合**：
- 统一时间线展示带标签的所有内容
- 支持按标签筛选专栏、闪念、视觉、实验室内容

**📊 智能标签统计**：
- 每个标签的使用频率分析
- 标签覆盖的内容类型统计
- 标签共现关系分析

**🎨 统一UI展示**：
- 所有卡片组件统一使用 `.tag` 样式类
- 条件渲染：仅在有标签时显示标签区域
- 与卡片设计风格完美融合

**🔍 扩展性设计**：
- 为未来搜索功能预留接口
- 支持标签规范化与验证
- 便于后续添加标签点击跳转功能

---

## 三、启动开发计划

- [x] 初始化项目文件夹和 README
- [x] 搭建 Next.js 框架
- [x] 配置 Vercel 自动部署
- [x] 推送到 GitHub
- [x] 域名绑定（www.antelacus.com）

---

## 四、主线开发计划（MVP）

### （一）基础架构搭建 ✅
- [x] 初始化 Next.js 项目和 Vercel 部署
- [x] 配置域名绑定（www.antelacus.com）
- [x] 设计内容结构与文件组织方式
- [x] Next.js 15 动态路由 params Promise 化兼容

### （二）内容管理系统 ✅
- [x] Markdown/MDX 渲染引擎
- [x] 四类内容类型：专栏、闪念、视觉、实验室
- [x] 统一标签管理系统：跨全站内容类型的标签架构
- [x] 内容校验系统：Zod + ts-node 数据完整性验证
- [x] 默认值与字段可选处理，旧内容向前兼容

### （三）视觉设计系统 ✅
- [x] 地中海风情色彩方案（西班牙弗拉门戈热情主题）
- [x] 响应式宽度系统：差异化页面宽度策略
- [x] 统一卡片设计系统：PostCard / NoteCard / PhotoCard / ProjectCard
- [x] 现代化UI组件库：导航、面包屑、标签等

### （四）首页与布局系统 ✅
- [x] Masonry 瀑布流首页：智能3列响应式布局
- [x] 统一内容聚合流：四类内容按时间排序展示
- [x] 专门页面布局：专栏横向列表、其他标准卡片
- [x] 移动端响应式优化

### （五）视觉作品功能 ✅
- [x] 文件夹管理：公共目录照片批量上传
- [x] PhotoSwipe 5 图片浏览器：专业级图片浏览体验
- [x] 照片网格与 Lightbox：双指缩放、手势切换、单击显示信息
- [x] 智能封面图选择：自动使用第一张照片

### （六）用户体验优化 ✅
- [x] 内容预览优化：智能截断、省略号提示
- [x] 界面简化：移除重复标题，优化空白布局
- [x] About 页面：联系方式、项目展示、个人简介
- [x] SEO 优化与 404 页面

### （七）性能优化 ✅ 🚀
- [x] **链接预获取**：所有卡片组件启用 `prefetch={true}` 激进预获取策略
- [x] **图片优化**：全面使用 Next.js Image 组件，支持 WebP/AVIF 自动转换
- [x] **数据缓存**：React cache + Next.js unstable_cache 双重缓存系统
- [x] **缓存策略**：文章列表缓存1小时，单篇文章缓存2小时
- [x] **加载性能**：首次点击从1秒降至200-300ms，重复访问接近瞬时

### （八）资源管理优化 ✅ 📁
- [x] **图片资源重构**：统一迁移到 `/public/images/` 目录，按内容类型分类管理
- [x] **路径规范化**：建立清晰的图片路径命名规范，便于维护和扩展
- [x] **MDX兼容性修复**：解决Notion迁移内容的图片引用、数学公式、HTML标签问题
- [x] **响应式图片展示**：支持并列图片布局，移动端自适应换行

### （九）已移除功能（技术债务清理）
- [x] ~~社交媒体内容同步（X / Instagram 选定帖子）~~ - 已移除，专注原创内容

---

## 五、未来开发计划

- [ ] 🔍 **标签检索功能**：分页面标签筛选，在专栏/闪念/视觉/实验室页面中分别筛选当前页面中某个标签下的所有内容
- [ ] 🔎 **搜索功能**：分页面关键词搜索，在不同页面中搜索包含关键词的标题、摘要和内容
- [ ] 🌍 **多语言界面支持**：英语和法语界面，支持界面语言切换和多语言内容管理

---

## 六、内容发布流程

> 以下指南帮助你记住如何为 4 类内容添加文件，以及修改模板时的影响范围。

### （一）发布步骤

**Posts / Notes / Projects 通用流程：**
1. 在 `src/content/<posts|notes|projects>/` 新建 `.mdx` 文件
2. 填写对应 front-matter 字段（见下表）
3. 写正文内容
4. `git add && commit && push`，Vercel 自动部署

**视觉作品专用流程：**
1. 在 `public/images/gallery/` 创建照片文件夹：`YYYY-MM-DD-theme-name`
2. 将照片文件放入文件夹（建议按数字顺序命名：01.jpg, 02.jpg...）
3. 在 `src/content/gallery/` 新建对应的 `.mdx` 文件
4. 设置 `imageFolder` 字段指向照片文件夹名
5. `git add && commit && push`，Vercel 自动部署

**示例：**
```
public/images/gallery/2025-01-22-sunset/
  ├── 01.jpg  ← 封面图（第一张照片）
  ├── 02.jpg
  └── 03.jpg

src/content/gallery/2025-01-22-sunset.mdx:
---
title: "日落时分"
date: "2025-01-22"
imageFolder: "2025-01-22-sunset"
location: "杭州·西湖"
---
```

### （二）必填字段快速对照

| 类型 | 目录 | 必填字段 | 内容说明 |
| ---- | ---- | -------- | -------- |
| Post | posts | `title` `date` | 专栏 - 原创长文 |
| Note | notes | `title` `date` | 闪念 - 原创短思考 |
| Photo| gallery | `title` `date` `imageFolder` | 视觉 - 原创摄影作品集 |
| Project | projects | `name` `description` `repo` | 实验室 - 技术项目 |

> 其他字段如 `cover`、`tags`、`caption`、`summary`、`location` 均为可选，组件内部有默认处理。

### （三）修改模板的流程

* **样式 / 布局** → 只改 `src/components/*Card.tsx` 等组件，一改全站生效。
* **新增字段**
  1. 在相应 `lib/*.ts` 中把字段设为可选并给默认。
  2. 在 Card 组件里决定如何展示。
  3. 仅在新内容的 front-matter 中填该字段即可；旧文件保持兼容。

### （四）内容校验脚本

运行 `npm run validate:content`（已在 `package.json` scripts 中配置），执行 `scripts/validate-content.ts`：

```bash
npx ts-node scripts/validate-content.ts
```

若缺必填字段将报错并返回非 0 状态码，可在 CI 中使用。

---

## 七、备查信息

### （一）地中海风情颜色方案系统

本博客采用地中海四国风情的颜色方案系统，每套方案都体现了不同国家地中海地区的独特文化与色彩美学。

#### 当前使用方案
- **🇪🇸 西班牙 · 弗拉门戈热情**：深沉赤土色配火红撞色，展现安达卢西亚的热情

#### 备用方案
- **🇫🇷 法国 · 蔚蓝海岸优雅**：深蓝基调配薰衣草紫，体现普罗旺斯的精致
- **🇮🇹 意大利 · 文艺复兴深沉**：橄榄绿配温暖橙，展现托斯卡纳的文艺底蕴
- **🇬🇷 希腊 · 圣托里尼纯净**：经典蓝白配天空蓝，体现爱琴海的纯净

#### 方案切换
所有颜色方案保存在 `src/styles/color-schemes.ts` 中，包含：
- 完整的明暗模式配色
- CSS变量生成函数
- 文化背景说明
- 使用示例

要切换方案，只需：
1. 从 `color-schemes.ts` 导入目标方案
2. 使用 `generateCSSVariables()` 生成 CSS 变量
3. 替换 `globals.css` 中的相应变量

### （二）Markdown层级与中文写作规范

#### 📚 Markdown标题层级支持

**技术层面：**
```markdown
# 一级标题 (H1)
## 二级标题 (H2)  
### 三级标题 (H3)
#### 四级标题 (H4)
##### 五级标题 (H5)
###### 六级标题 (H6)
```

Markdown标准支持1-6级标题，对应HTML的`<h1>`到`<h6>`标签。

#### 🎯 一级标题（#）的使用场景

**✅ 适合使用一级标题的场景：**

**1. 独立文档/长篇内容**
```markdown
# 深度学习完整教程        ← 整个教程的总标题
## 第一章：基础概念        ← 章节
### 一、神经网络原理       ← 节
#### （一）感知机模型     ← 小节
```

**2. 技术文档/API文档**
```markdown
# React Hook 使用指南     ← 文档主标题
## useState Hook         ← 主要功能
### 基本用法             ← 具体说明
#### 示例代码           ← 细节
```

**3. 项目README文件**
```markdown
# project-antelacus     ← 项目名称
## 项目简介             ← 主要章节
### 技术选型            ← 子章节
```

**❌ 不适合使用一级标题的场景：**

**1. 博客文章**
```markdown
❌ 错误用法：
# LLM学习笔记           ← 这会比文章标题还大
## 核心概念            

✅ 正确用法：
---
title: "LLM学习笔记"    ← front-matter作为文章标题
---
## 一、核心概念         ← 从二级开始
### （一）基本原理      
```

**2. 短篇笔记**
```markdown
❌ 避免：
# 今日思考            ← 过于突出

✅ 推荐：
---
title: "今日思考"      ← front-matter
---
## 主要观点           ← 从二级开始
```

#### 📖 中文写作层级对应关系

**传统文书层级：**
```
中文传统                    →    Markdown建议
─────────────────────────────────────────
篇/卷                      →    # (仅限长篇文档)
章                         →    ## 
节                         →    ###
条/款                      →    ####
项                         →    #####
目                         →    ######
```

**现代写作实践：**
```
应用场景                    →    起始层级
─────────────────────────────────────────
书籍/长篇教程               →    # 开始
博客文章                   →    ## 开始  
学习笔记                   →    ## 开始
技术文档                   →    # 或 ## 开始
项目README                 →    # 开始
```

#### 🎨 层级使用最佳实践

**根据内容长度选择：**

**短篇内容（< 5000字）：**
```markdown
---
title: "文章标题"
---
## 一、主要内容          ← 从二级开始
### （一）具体论述
#### 1. 详细要点
##### （1）细节说明
```

**中篇内容（5000-15000字）：**
```markdown
---
title: "深度指南"
---
# 完整指南标题           ← 可以使用一级
## 第一部分：基础
### 一、核心概念
#### （一）基本原理
```

**长篇内容（>15000字）：**
```markdown
# 完整教程系列           ← 系列标题
## 第一册：入门篇        ← 册/卷
### 第一章：基础概念      ← 章
#### 一、核心原理        ← 节
##### （一）基本概念     ← 条/款
```

#### 💡 核心原则总结

**标题层级选择：**
1. **短篇内容**：front-matter + 从`##`开始
2. **长篇内容**：可以使用`#`作为总标题
3. **保持层级逻辑**：不跳级，循序渐进
4. **符合中文习惯**：使用传统编号系统

**中文编号体系：**
```
## 一、二、三...（主要章节）
### （一）、（二）、（三）...（分章节）
#### 1、2、3...（要点）
##### （1）、（2）、（3）...（细节）
###### a、b、c...（补充说明，少用）
```

**Notion迁移建议：**
- **Notion写作**：保持三级以内，用粗体、引用标记层级
- **MDX迁移**：使用查找替换批量转换格式
- **层级验证**：确保编号逻辑递进，无跳级

#### 🌍 英语写作Markdown层级指引

**英语vs中文写作差异：**

| 方面 | 中文写作 | 英语写作 |
|------|----------|----------|
| **编号习惯** | 一、二、三... / （一）、（二）、（三）... | 1. 2. 3. / Part I, II, III / Chapter 1, 2, 3 |
| **层级深度** | 偏好深层级（4-6级常见） | 偏好浅层级（2-4级为主） |
| **标题风格** | 简洁直接，常用名词短语 | 动作导向，常用动词或疑问句 |
| **结构逻辑** | 严格等级制，重视序号 | 内容导向，重视意义 |

#### 📝 英语技术文档标准结构

**API文档/技术指南：**
```markdown
# Getting Started with React Hooks    ← 文档总标题
## Quick Start                        ← 快速开始
### Installation                      ← 安装
### Basic Example                     ← 基础示例
## Core Concepts                      ← 核心概念
### useState Hook                     ← 具体Hook
#### Declaring State Variables        ← 使用方法
#### Reading State                    ← 读取状态
#### Updating State                   ← 更新状态
### useEffect Hook                    ← 另一个Hook
## Advanced Guide                     ← 高级指南
### Performance Optimization          ← 性能优化
### Custom Hooks                      ← 自定义Hooks
```

**学术/教程风格：**
```markdown
# Introduction to Machine Learning    ← 总标题
## Part I: Foundations               ← 部分标题
### Chapter 1: Basic Concepts        ← 章节
#### 1.1 What is Machine Learning?   ← 小节编号
#### 1.2 Types of Learning           ← 小节编号
### Chapter 2: Algorithms            ← 章节
#### 2.1 Supervised Learning         ← 小节编号
#### 2.2 Unsupervised Learning       ← 小节编号
## Part II: Applications             ← 部分标题
### Chapter 3: Real-world Examples   ← 章节
```

#### 📖 英语博客文章层级模式

**问题解决型文章：**
```markdown
---
title: "How to Build a React Component Library"
---
## Why Build Your Own Component Library?    ← 为什么（问题背景）
## Getting Started                          ← 开始行动
### Setting Up the Project                  ← 项目设置
### Choosing the Right Tools                ← 工具选择
## Building Core Components                 ← 核心构建
### Button Component                        ← 具体组件
#### Design Requirements                    ← 设计要求
#### Implementation                         ← 实现
### Form Components                         ← 具体组件
## Testing and Documentation                ← 测试文档
## Publishing and Distribution              ← 发布分发
## Conclusion                               ← 结论
```

**深度分析型文章：**
```markdown
---
title: "Understanding React's Reconciliation Algorithm"
---
## Overview                                 ← 概述
## The Problem React Solves                ← 问题陈述
## How Reconciliation Works                 ← 工作原理
### Virtual DOM Comparison                  ← 虚拟DOM比较
### Diffing Algorithm                       ← 差异算法
### Commit Phase                           ← 提交阶段
## Performance Implications                 ← 性能影响
### Keys and Performance                    ← Keys与性能
### Common Pitfalls                        ← 常见陷阱
## Best Practices                          ← 最佳实践
## Further Reading                         ← 延伸阅读
```

#### 🎯 英语标题写作最佳实践

**动作导向的标题：**
```markdown
✅ 推荐：
## Getting Started with Next.js
## Building Your First Component  
## Deploying to Production
## Troubleshooting Common Issues

❌ 避免：
## Next.js Introduction
## Component Construction
## Production Deployment
## Issue Solutions
```

**疑问句引导：**
```markdown
✅ 适合教学文章：
## What is React?
## Why Choose TypeScript?
## How Does SSR Work?
## When to Use useEffect?

✅ 适合问题解决：
## Having Trouble with Installation?
## Need to Optimize Performance?
## Want to Add Authentication?
```

**编号系统选择：**
```markdown
📚 学术/教程风格：
## Part I: Fundamentals
### Chapter 1: Introduction
#### 1.1 Background
#### 1.2 Objectives

🔧 实用指南风格：
## Step 1: Setup
## Step 2: Configuration  
## Step 3: Implementation

💡 概念解释风格：
## Core Concepts
### Component Lifecycle
### State Management
### Event Handling
```

#### 📱 英语移动端优化考虑

**简化标题层级：**
```markdown
移动端友好写法：
## Quick Setup          ← 简短直接
### Install             ← 动词开头  
### Configure           ← 动词开头
### Deploy              ← 动词开头

避免冗长标题：
❌ ## Comprehensive Step-by-Step Installation and Configuration Guide
✅ ## Installation Guide
```

#### 🔄 中英文混合文档建议

**双语博客项目：**
```markdown
# Project Documentation              ← 项目名可保持英文
## 一、项目简介 (Project Overview)    ← 重要章节双语
### （一）目标与需求 (Goals & Requirements)
### （二）技术选型 (Tech Stack)
## 二、开发指南 (Development Guide)
### （一）环境搭建 (Environment Setup)
#### Installation Steps             ← 技术细节可纯英文
#### Configuration                  ← 技术细节可纯英文
```

**技术文档国际化：**
```markdown
## API Reference                    ← 技术术语保持英文
### Authentication                  ← 专业术语英文
#### 认证流程说明 (Auth Flow)       ← 解释性内容中文
### Data Models                     ← 专业术语英文  
#### 数据结构定义 (Data Structures) ← 解释性内容中文
```

#### 💡 英语写作核心原则

**层级设计原则：**
1. **读者导向**：标题应该回答读者的问题
2. **行动导向**：多用动词，指导具体行动
3. **层级扁平**：避免过深嵌套，保持2-4级
4. **逻辑清晰**：按时间顺序、重要性或复杂度组织

**标题命名规范：**
- **二级标题**：主要功能或概念（Getting Started, Core Concepts）
- **三级标题**：具体步骤或组件（Installation, Button Component）
- **四级标题**：详细说明或属性（Configuration Options, Props API）

**国际化考虑：**
- **技术术语**：保持英文原版（API, Component, Hook）
- **解释说明**：可用中文辅助理解
- **标题结构**：遵循目标语言的阅读习惯

### （三）博客开发方式对比与选型说明

#### 主要方式对比

| 方式                   | 易编辑 | 可定制 | 免费 | 移动端 | 社交同步 | Notion同步 |
|------------------------|--------|--------|------|--------|----------|------------|
| 静态博客+托管          | ★★★    | ★★★    | ★★★  | ★★     | ★★       | ★（需配置） |
| 现成博客平台           | ★★★    | ★      | ★★   | ★★★    | ★★       | ☆          |
| Notion+第三方生成器    | ★★★    | ★★     | ★★   | ★★★    | ★        | ★★★        |
| 低代码/无代码平台      | ★★★    | ★      | ★     | ★★★    | ★★       | ★★         |
| 纯手写/自研            | ★      | ★★★    | ★★★  | ★      | ★★★      | ★          |

#### Next.js 与主流静态博客生成器对比

| 生成器   | 语言/生态 | 上手难度 | 主题/插件 | 可定制性 | 适合场景         | 备注           |
|----------|-----------|----------|-----------|----------|------------------|----------------|
| Next.js  | React/JS  | ★★★★     | ★★        | ★★★★     | 博客+复杂网站    | 全能，需JS基础  |
| Hexo     | Node.js   | ★★       | ★★★★      | ★★       | 纯博客           | 中文生态好      |
| Hugo     | Go        | ★★★      | ★★★★      | ★★★      | 博客/文档/大站点 | 生成极快        |
| Jekyll   | Ruby      | ★★★      | ★★★       | ★★       | 博客             | GitHub Pages原生|
| Astro    | 多框架    | ★★★      | ★★★       | ★★★★     | 博客/文档/官网   | 新一代，极快    |

**最终选型说明**：尽管 Next.js 上手有一定门槛，但其极高的可定制性和强大的生态（React/MDX）非常适合个人博客的长期发展和功能扩展。结合 Vercel 的无缝部署体验，是本项目在综合考量下的最佳选择。

---

## 八、文档维护说明

### （一）README更新原则
- **实时性**：记录项目开发的每一步进展
- **完整性**：包含遇到的问题与解决方案
- **规范性**：遵循本文档制定的Markdown层级规范
- **实用性**：为后续开发和内容创作提供准确指导

### （二）层级规范遵循
本README严格按照"### （二）Markdown层级与中文写作规范"中制定的标准执行：
- **项目主标题**：使用一级标题（#）
- **主要章节**：使用二级标题配中文数字（## 一、二、三...）
- **子章节**：使用三级标题配括号中文数字（### （一）、（二）、（三）...）
- **具体内容**：使用四级标题，可配emoji或数字（#### 🎯 标题）

### （三）双语写作指引应用
项目现在提供完整的中英文写作规范：
- **中文内容**：遵循传统文书层级，使用中文数字编号系统
- **英文内容**：采用动作导向标题，保持层级扁平化
- **混合文档**：技术术语保持英文，解释性内容可用中文
- **移动端优化**：两种语言都考虑简化标题，提升阅读体验

---

> 本文档将持续更新，记录项目开发的每一步进展、遇到的问题与解决方案，并为后续的**中英文**内容创作和项目维护提供完整的规范指导。 