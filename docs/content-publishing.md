## 一、发布步骤

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

---

## 二、必填字段快速对照

| 类型 | 目录 | 必填字段 | 内容说明 |
| ---- | ---- | -------- | -------- |
| Post | posts | `title` `date` | 专栏 - 原创长文 |
| Note | notes | `title` `date` | 闪念 - 原创短思考 |
| Photo| gallery | `title` `date` `imageFolder` | 视觉 - 原创摄影作品集 |
| Project | projects | `name` `description` `repo` | 实验室 - 技术项目 |

> 其他字段如 `cover`、`tags`、`caption`、`summary`、`location` 均为可选，组件内部有默认处理。

---

## 三、修改模板的流程

* **样式 / 布局** → 只改 `src/components/*Card.tsx` 等组件，一改全站生效。
* **新增字段**
  1. 在相应 `lib/*.ts` 中把字段设为可选并给默认。
  2. 在 Card 组件里决定如何展示。
  3. 仅在新内容的 front-matter 中填该字段即可；旧文件保持兼容。

---

## 四、内容校验脚本

运行 `npm run validate:content`（已在 `package.json` scripts 中配置），执行 `scripts/validate-content.ts`：

```bash
npx ts-node scripts/validate-content.ts
```

若缺必填字段将报错并返回非 0 状态码，可在 CI 中使用。

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
