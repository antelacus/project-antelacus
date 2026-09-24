## 一、内容在哪里

四类内容（专栏、闪念、视觉、实验室）都存放在 Supabase：正文与元数据在 `content_items` 表，标签在 `content_tags` 与 `content_item_tags`，相册图片在 `gallery_images` 表，项目链接在 `project_links`。表结构以 `supabase/migrations/` 为准。图片本体在两个公开存储桶：相册照片历史上在 `gallery`，v2.3.0 起所有新上传（封面、插图、相册）在 `media`。「关于」页不属于这四类：每种语言一行，存在 `site_pages` 表，在 `/admin/pages/about` 编辑（只有文字，不上传图片）；某种语言没有自己的版本时显示英文版。

发布不需要重新部署：经后台保存或发布的内容，保存完成后的下一次访问即可见。

## 二、发布内容（站内后台）

1. 打开 `/admin/login`，用管理员邮箱登录。后台在手机浏览器上同样可用。
2. 在 `/admin` 选内容类型，或直接打开 `/admin/content/post`、`/admin/content/note`、`/admin/content/gallery`、`/admin/content/project`；点「New」，或点已有条目进入编辑。
3. 填写标题与 slug（只能是小写字母、数字、连字符；它就是地址，发布后改 slug 等于换地址）、摘要、写作语言、展示日期、标签（逗号分隔）。
4. 正文是 Markdown：支持 GFM（表格、任务列表、删除线、自动链接）与公式（`$…$`、`$$…$$`）。原始 HTML 与 JSX 不会被执行，只会原样显示为文字。「Preview」用的是公开页面同一套渲染。
5. 图片：正文里粘贴、拖入，或点「Insert image from device」从相册选，图片会上传到存储桶并以 `![](地址)` 插到光标处；专栏、闪念、实验室的封面用「Upload cover」；相册在「Photos」里一次选多张，可排序、写说明、勾选封面。上传前先填好 slug，它决定图片存放的文件夹。接受 JPEG、PNG、WebP、GIF、AVIF、HEIC，单张 20 MB 以内；照片（HEIC、JPEG）会被转成长边 2400px 以内的 JPEG 再存，截图类（PNG、WebP、GIF）原样保存。
6. 「Save draft」只存不公开；「Publish」后详情页、列表、首页、标签页、搜索与 sitemap 立即更新。已发布的条目按「Retract to draft」撤下，其详情地址即为 404。
7. 同一条目连续提交两次不会重复创建；保存中按钮会禁用。校验不过时错误显示在对应字段旁，已填内容不丢。

## 三、图片排版

一个段落里只放图片（一张或多张），它们会并排显示；图片的 `title` 会成为图注：

```markdown
![注意力](https://…/1.png "注意力机制") ![单头](https://…/2.png "单头注意力")
```

正文里不写布局，排版是渲染器的事。

## 四、展示与字段

* **样式 / 布局** → 全在 `src/app/globals.css`，一改全站生效；规则见 `docs/aesthetic-thesis.md`。
* **新增字段** → 放进 `extra_metadata`（无需改表），在该类型的映射函数（`src/lib/*-types.ts`）里读出并给默认值，再决定在哪里展示（列表行、详情页引首或尾纸）。旧内容保持兼容。
* **实验室的链接** → 只在详情页的尾纸展示，且只有 `repository`（查看源码）与 `demo`（查看演示）两种类型；`reference`、`other` 会保存但暂不展示。新增第一条链接时默认就是 `repository`。
* **发布时间** → 首次发布时写入（展示日期可覆盖），之后编辑不改它，撤回再发布保留原值；列表按它排序。

---

## 五、标题层级与中文写作规范

### （一）标题如何渲染

- 页面的一级标题（`h1`）是后台的「Title」字段，正文里的标题永远排在它之下。
- 正文里用到的最高一级标题渲染为二级（`h2`），更深的按相对层级顺延；跳级会被压平（`#` 下直接写 `###`，渲染出来仍是相邻两级）。所以正文从 `#` 还是 `##` 开始都一样，写起来顺手即可。
- 不要写 front-matter（`---` / `title: …` / `---`）：它不被解析，会显示成一条横线加一行文字。标题只填在「Title」里。
- 正文最高一级的标题有三个及以上时，文首会出现一个折叠的目录，列出这一级的标题。

### （二）中文编号体系

层级的逻辑靠编号表达，保持递进、不跳级：

```
最高一级   一、二、三……（主要章节）
第二级     （一）、（二）、（三）……
第三级     1、2、3……（要点）
第四级     （1）、（2）、（3）……（细节）
第五级     a、b、c……（补充，少用）
```

Notion 只支持三级标题：在 Notion 里写时保持三级以内，更细的层级用粗体或引用表示。

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
