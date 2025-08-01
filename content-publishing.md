# antelacus.com 博客项目

## 一、内容发布流程

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