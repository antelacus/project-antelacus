## 一、内容在哪里

四类内容（专栏、闪念、视觉、实验室）都存放在 Supabase：正文与元数据在 `content_items` 表，标签在 `content_tags` 与 `content_item_tags`，相册图片在 `gallery_images` 表与名为 `gallery` 的公开存储桶，项目链接在 `project_links`。表结构以 `supabase/migrations/` 为准。只有「关于」页仍是仓库里的文件（`src/content/pages/about/`）。

发布不需要重新部署。经站内后台发布的内容立即可见；直接改数据库的内容最长一小时后可见（页面与数据各缓存一小时）。

| 类型 | `content_type` | 发布方式 |
| ---- | -------------- | -------- |
| 闪念 | `note` | 站内后台 `/admin/notes` |
| 专栏 | `post` | Supabase 控制台（尚无后台编辑器） |
| 实验室 | `project` | Supabase 控制台（尚无后台编辑器） |
| 视觉 | `gallery` | Supabase 控制台 + 存储桶（尚无后台编辑器） |

---

## 二、发布闪念（站内后台）

1. 打开 `/admin/login`，用管理员邮箱登录。
2. 进入 `/admin/notes`，填写标题、slug、正文（MDX），可选：摘要、标签（逗号分隔）、展示日期、封面地址。
3. 「保存草稿」只存不公开；「发布」后详情页、闪念列表、首页、标签页与搜索立即更新。

---

## 三、发布专栏、实验室、视觉（Supabase 控制台）

在 Supabase 控制台的 SQL Editor 中执行。一条内容要在站上出现，必须满足：`status = 'published'`，且 `slug` 在同类型同 `locale` 内唯一。`published_at` 决定排序；页面上显示的日期依次取 `extra_metadata.displayDate` → `published_at` → `updated_at`。

### （一）专栏

```sql
with item as (
  insert into public.content_items
    (content_type, slug, title, summary, body_markdown, status, published_at, locale, cover_image_url, extra_metadata)
  values
    ('post', 'my-post-slug', '标题', '一句话摘要', $md$
正文写在这里，MDX 语法，从二级标题开始。
$md$,
     'published', now(), 'zh-CN', null, '{"displayDate": "2026-01-31"}')
  returning id
), tag as (
  insert into public.content_tags (name, slug) values ('随笔', '随笔')
  on conflict (slug) do update set name = excluded.name
  returning id
)
insert into public.content_item_tags (content_item_id, tag_id)
select item.id, tag.id from item, tag;
```

- `locale` 是文章的写作语言（页面上显示为语言标记），不影响它出现在哪些语言的站点上——每种语言都展示同一篇。
- 封面 `cover_image_url` 两种来源都可以：Supabase 存储桶里的公开地址（无需部署）；或仓库 `public/images/posts/` 下的文件，写成 `/images/posts/…`（需要提交并部署）。
- 标签的 `slug` 是其名称的小写形式（后台保存闪念时也是这样写的），同名标签全站共用一行。
- 多个标签：对每个标签重复 `tag` 与最后一条 `insert`，或先发布、再单独补标签。

### （二）实验室

与专栏相同，`content_type` 改为 `'project'`，`title` 即项目名，`summary` 即项目描述。仓库与演示地址写进 `project_links`：

```sql
insert into public.project_links (content_item_id, label, url, link_type)
select id, 'GitHub', 'https://github.com/owner/repo', 'repository'
from public.content_items where content_type = 'project' and slug = 'my-project-slug';
```

`link_type` 可取 `repository`、`demo`、`reference`、`other`。`extra_metadata` 可带 `status`（项目状态文字）与 `star`（数字）。

### （三）视觉

1. 在存储桶 `gallery` 中新建与 slug 同名的文件夹，上传照片，建议按 `01.jpg`、`02.jpg` 命名。
2. 新建相册条目：同专栏的 `insert`，`content_type` 为 `'gallery'`，`summary` 即相册说明，`extra_metadata` 可带 `location`、`displayDate`。
3. 为每张照片登记一行，`sort_order` 决定顺序；未设 `cover_image_url` 时第一张即封面：

```sql
insert into public.gallery_images (content_item_id, storage_path, public_url, alt_text, sort_order)
select id, 'my-album-slug/01.jpg',
       'https://<项目>.supabase.co/storage/v1/object/public/gallery/my-album-slug/01.jpg',
       '照片说明', 1
from public.content_items where content_type = 'gallery' and slug = 'my-album-slug';
```

### （四）修改与撤下

- 修改：`update public.content_items set … where content_type = … and slug = …;`
- 撤下：把 `status` 改回 `'draft'`。删除条目会连带删除它的标签关联、图片登记与链接；存储桶里的文件需另行删除。
- 两者都在一小时内生效。

---

## 四、展示与字段

* **样式 / 布局** → 只改 `src/components/` 下对应的 Card 组件，一改全站生效。
* **新增字段** → 放进 `extra_metadata`（无需改表），在该类型的映射函数（`src/lib/` 下的 `*-types.ts`）里读出并给默认值，再在 Card 组件里决定如何展示。旧内容保持兼容。

---

## 五、Markdown层级与中文写作规范

### （一）Markdown标题层级支持

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
notion仅支持1-3级标题，建议仅使用1-3级标题写作。

### （二）一级标题（#）的使用场景

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

### （三）中文写作层级对应关系

**传统文书层级：**
```
中文传统                    →    Markdown建议
──────────────────────────────────────────
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
──────────────────────────────────────────
书籍/长篇教程               →    # 开始
博客文章                   →    ## 开始  
学习笔记                   →    ## 开始
技术文档                   →    # 或 ## 开始
项目README                 →    # 开始
```

### （四）层级使用最佳实践

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

### （五）核心原则总结

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

---

## 六、英语写作Markdown层级指引

**英语vs中文写作差异：**

| 方面 | 中文写作 | 英语写作 |
|------|----------|----------|
| **编号习惯** | 一、二、三... / （一）、（二）、（三）... | 1. 2. 3. / Part I, II, III / Chapter 1, 2, 3 |
| **层级深度** | 偏好深层级（4-6级常见） | 偏好浅层级（2-4级为主） |
| **标题风格** | 简洁直接，常用名词短语 | 动作导向，常用动词或疑问句 |
| **结构逻辑** | 严格等级制，重视序号 | 内容导向，重视意义 |

### （一）英语写作核心原则

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
- **解释说明**：可用中文辅助解释
- **标题结构**：遵循目标语言的阅读习惯

### （二）英语技术文档标准结构

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

### （三）英语博客文章层级模式

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

### （四）英语标题写作最佳实践

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

### （五）英语移动端优化考虑

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

---

## 七、中英文混合文档建议

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
