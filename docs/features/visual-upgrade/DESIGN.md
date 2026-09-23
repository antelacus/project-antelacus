# DESIGN — visual-upgrade

## 1 引言
### 1.1 参考
- 需求：`docs/features/visual-upgrade/REQ.md`；美学规则：`docs/aesthetic-thesis.md`（本文件只写「怎么切、怎么接」，外观以论文为准）
- 仍然有效的上一版设计：`docs/features/routing-slimdown/DESIGN.md` §7–§8、`docs/features/content-publishing/DESIGN.md` §3–§7——本版只增不废，例外在 §3 末尾写明
### 1.2 术语
见 REQ §1.4。另：**形态组件**——《临湖》三种页面形态各自的呈现单元：窗、目录行、照片格。**界面闸门**——对一个带合成内容的本地实例跑的浏览器检查（§2.5）。

## 2 总体方案

### 2.1 页面清单
| 编号 | 页面 | 形态 | 对应 REQ § |
|------|------|------|-----------|
| P1 | `/[locale]` 首页 | 门 + 一窗主景（视觉大窗，专栏、闪念、实验室三扇文字窗） | 5.1、5.2-d/f/g |
| P2 | `/[locale]/{posts,notes,projects}` | 目录 | 5.1-d、5.2-f |
| P3 | `/[locale]/gallery` | 照片格 | 5.1 |
| P4 | `/[locale]/{posts,notes,projects,gallery}/[slug]` | 手卷：引首 → 折叠目录（≥3 个 `h2`）→ 画心 → 尾纸 + 终止符；相册另有查看器 | 5.1-c/f、5.2-h |
| P5 | `/[locale]/tags`、`/[locale]/tags/[id]` | 目录 | 5.1 |
| P6 | `/[locale]/about` | 手卷（无尾纸元数据，只有终止符） | 5.3 |
| P7 | 404（`global-not-found`）、`[locale]/error` | 引首一段 + 回首页 | 5.1 |
| P8 | 搜索对话框（任何公开页打开） | 目录 | 5.1-c |
| P9 | `/admin/pages/about`、`/admin/pages/about/[locale]` | 后台：语言列表、编辑器 | 5.3-b、5.1-b |

### 2.2 模块关系
| 模块 / 文件 | 单一职责 | 测试层级 |
|-------------|---------|----------|
| `src/components/Gate.tsx`（新，服务端） | 首页的门：名字（Cormorant）、终止符、格言（`lang="la"`） | UI |
| `src/components/Window.tsx`（新，共享） | 首页的一扇窗：类型名、标题、摘要、日期、标签；`photo` 变体带一张照片 | UI |
| `src/components/CatalogRow.tsx`（新，共享） | 目录的一行：类型名（混排时）、标题、摘要、日期、标签；列表页、标签页、搜索结果共用 | UI |
| `src/components/PhotoTile.tsx`（新，服务端） | 视觉列表的一格 | UI |
| `src/components/EndMark.tsx`（新，服务端） | 终止符；全站唯一使用朱砂的元素 | UI |
| `src/components/Colophon.tsx`（新，服务端） | 尾纸：写于、标签（链接到标签页）、语言，末尾 `EndMark` | UI |
| `src/components/Toc.tsx`（新，服务端） | 折叠目录：`<details>`/`<summary>` + 锚点列表；条目少于 3 个时渲染为空 | UI |
| `src/components/Nav.tsx`（重写，服务端） | 页首导航：五个栏目链接 + 两个客户端小件；静止、不固定；不再渲染面包屑 | UI |
| `src/components/NavLinks.tsx`（新，客户端） | 栏目链接的 `aria-current`（需 `usePathname`） | UI |
| `src/components/SearchDialog.tsx`（新，客户端，取代 `SearchModal`） | 原生 `<dialog>`：打开时取 `/api/search-index`，内存筛选，结果用 `CatalogRow`；关闭时焦点回到触发按钮 | UI + core（筛选函数） |
| `src/lib/search-filter.ts`（新） | 搜索的纯筛选与排序（从 `SearchModal` 抽出） | core |
| `src/components/LanguageSwitch.tsx`（新，客户端） | 一组指向 `/api/locale?to=…&next=<当前路径>` 的普通链接，外包 `<details>` | UI |
| `src/components/SiteLink.tsx`（新，共享） | 站内链接的唯一出口：`next-intl` 的 `Link` + `transitionTypes={['page']}`（§2.4 页面切换） | infra |
| `src/components/SkipLink.tsx`（重写，服务端） | 普通 `<a href="#main-content">`，无脚本 | infra |
| `src/components/PhotoViewer.tsx`（改） | 查看器显示上一张 / 下一张按钮（2.5.7）；辅助函数先声明后使用（TD-020 `immutability`）；可访问名称走文案 | UI |
| `src/lib/markdown/`（改） | 标题生成稳定 `id`；新增 `extractToc(source) → {id, text}[]`（只取 `h2`），与渲染用同一个 slug 规则，二者 id 必然一致 | core |
| `src/lib/home.ts`（新） | `selectWindows(latestByType) → Window[]`：每类最新一篇，视觉取封面；空类型不出窗、不补位 | core |
| `src/lib/pages.ts`（重写） | 关于页的公开加载器：`getPage(slug, locale)`，缓存标签 `pages`；语言回退由 `pickPageLocale` 决定 | IO |
| `src/lib/page-locale.ts`（新） | `pickPageLocale(available, requested) → locale | null`：请求语言 → `en` → 任意（按固定顺序取第一个） | core |
| `src/lib/server/pages-repo.ts`（新） | `site_pages` 的全部读写：已发布版本列表、后台按（slug、语言）取、保存（按主键 upsert）；客户端由调用方传入 | IO |
| `src/app/admin/(protected)/pages/**`（新） | 关于页的语言列表与编辑器（复用 `MarkdownEditor`、`MarkdownPreview`）；动作：zod 校验 → 管理员校验 → `pages-repo.save` → `updateTag('pages')` | IO |
| `src/app/[locale]/**/page.tsx`（改） | 按 §2.1 的形态组装；详情页正文容器 `lang` = 条目写作语言；每页恰一个 `h1` | UI |
| `src/app/globals.css`（重写） | 变量（五色、三种字体角色、间距）、基础排印、中文排印（`:lang(zh)` 下的两端对齐与字间均分）、形态组件的类、悬停（`@media (hover: hover) and (pointer: fine)`）与按下态、页面切换的 150ms 规则 | UI |
| `src/messages/*.json`（改） | 界面上的全部可访问名称与此前写死的中文 | infra |
| `supabase/migrations/<新>_site_pages.sql` | 表 `site_pages`（§2.6）+ 读策略；以及五份关于页正文的数据迁移（由现有 MDX 转写为 Markdown，`on conflict do nothing`） | 由界面闸门与 `db-function-check` 覆盖 |
| `supabase/config.toml`、`supabase/seed.sql`（新） | 本地栈的服务开关；合成种子（§2.5） | infra |
| `tests/ui/*.ui.mjs`（新）、`scripts/ui-check.sh`（新） | 界面闸门（§2.5） | acceptance |
| `eslint.config.mjs` | 删去三条规则的降级 | infra |

删除：`PostCard`、`NoteCard`、`PhotoCard`、`ProjectCard`、`SearchModal`、`UtilityDropdown`、`TagList`（标签改为指向标签页的链接，不再经 `window` 事件打开搜索）、`src/content/pages/`、`next-mdx-remote`、`gray-matter`、`globals.css` 中的花园、瀑布流、呼吸、倾斜、墨色微变、纹理与暗色块、`Dockerfile` 中复制 `src/content` 的一行、`tests/runtime/fixtures/head-baseline.json` 与 §6-a 测试。

依赖方向：页面 → 加载器（`posts|notes|gallery|projects|pages`）→ repo → Supabase；页面 → 形态组件 → `SiteLink`；`markdown/`、`home.ts`、`page-locale.ts`、`search-filter.ts` 无内部依赖。形态组件不读数据、不持状态。

### 2.3 业务流程
- **读文章**：列表页的目录行 → 详情页。引首只有日期、标题、导语与封面；`extractToc` 得到 ≥3 条时，引首之后出现折叠目录；尾纸列出写于、标签、语言，以终止符结束。标签是去标签页的链接。
- **搜索**：导航的「搜索」按钮 → `showModal()`：背景惰性、焦点落在输入框、Esc 关闭；结果是目录行链接。关闭（Esc、点背景、选中结果前）→ 焦点回到按钮（显式保存触发元素的引用，Safari 点击按钮时不给按钮焦点）。索引取失败 → 对话框里一行文案，可重试。
- **切换语言**：导航的「语言」`<details>` 展开 → 选一种 → `/api/locale`（上一版契约不变）写 cookie、303 回同一路径的新语言版本。
- **相册**：照片格 → 详情页 → 查看器（PhotoSwipe）：方向键、按钮、滑动三种翻页；Esc 关闭后焦点回到所点的照片。
- **后台改关于页**：`/admin/pages/about` 列出每种语言的状态 → 编辑 → 保存 → `updateTag('pages')` → 下一次访问即新（§5.3-b）。
- **出错**：读库失败沿用上一版（裸 500 或站点错误页）；关于页一个版本都没有 → 404。

### 2.4 页面关系与路由
路由不变。三处交互的实现选择：
- **页面切换**：React 19.3 的 `<ViewTransition>`，`default="none"`，只对 `page` 类型的切换做 150ms 淡入淡出；`page` 类型只由 `SiteLink` 发出，所以浏览器前进后退、`router.refresh()` 不触发。不用 CSS `@view-transition { navigation: auto }`——它只作用于整页跳转，Next 的站内导航不触发它。包在布局还是每个页面上，Build 首批原型后定（§5 D-1）。
- **悬停**：只在 `(hover: hover) and (pointer: fine)` 下生效，触屏点击后不残留；触屏的按下态靠 `:active`（React 在根上注册了 `touchstart`，iOS 因此触发 `:active`）。
- **目录锚点**：`id` 在服务端随标题生成，页面不再在浏览器里扫描标题、写 `id`。

### 2.5 界面闸门
- 流程（`scripts/ui-check.sh`，本机与 CI 同一份）：确认 Docker 可用（本机按需 `colima start`，结束时恢复原状态）→ `supabase start`（CLI 版本钉死；只运行 db、auth、rest、kong）→ 迁移与 `seed.sql` 自动应用 → 经 auth 管理接口建合成管理员 → 以本地栈的地址与密钥构建并启动应用 → `node --test tests/ui/` → 拆除（`trap`，成功失败都执行）。
- 种子只含合成内容，每种模板至少一例：带封面与 ≥3 个 `h2` 的中文专栏、英文闪念、项目（两个链接）、两张图的相册、一篇草稿、关于页的 `en` 与 `zh-CN` 两个版本（用于回退判据）。图片取 `public/images/` 里已提交的文件。保存经 `save_content_item`，与后台同一路径。
- 测试：Playwright 作库、跑在 `node:test` 下；环境为桌面 Chromium、触屏 WebKit（iPhone 描述符）、触屏 Chromium（Pixel 描述符）、320px。文件：`a11y.ui.mjs`（§5.1-a/d/e/f/g）、`keyboard.ui.mjs`（§5.1-c）、`thesis.ui.mjs`（§5.2-a–f/h）、`admin.ui.mjs`（§5.1-b）。每个文件先断言它访问的页面数与环境数非零并打印（§5.5-a）。
- 脚本拒绝 `BASE_URL` 不是本机地址的运行——界面闸门永不对生产。
- CI：`check.yml` 新增任务 `ui`，与现有任务并行；`deploy.yml` 等它通过。

### 2.6 持久化数据
- 新表 `site_pages`：`slug text`、`locale text`、`title text not null`、`body_markdown text not null`、`status content_status_enum not null default 'draft'`、`updated_at timestamptz`；主键 `(slug, locale)`；RLS：匿名只读 `published`，写入只经服务端密钥。既有表与约束一个不改。
  - 不把关于页作为 `page` 类型放进 `content_items`：须加一个删不掉的枚举值、放宽同类型 slug 唯一约束，并在搜索索引、sitemap、栏目一致性测试等六处加特例。
- 数据迁移：五份现有关于页正文转写为 Markdown（联系方式由图标网格改为链接列表），每语言一行，`published`；格言释义并入各语言版本。

## 3 外部系统约束
上两版 §8 / §3 全部仍然成立，以下为本版新学到的（Phase 2 实测与查证，对象 Next 16.3.5、React 19.3、Supabase CLI 2.117.0）：
- **React 19.3**：`<ViewTransition>` 稳定，Next 16 App Router 无需配置；旧的 `experimental.viewTransition` 已不存在。浏览器不支持时 React 直接提交、不动画。它会关掉根的整页过渡，只有被包裹的内容淡入淡出。所有 transition 都会触发它（含前进后退、`router.refresh()`），故用 `default="none"` + 类型限定。过渡期间须 `::view-transition { pointer-events: none }`，否则点击丢失。
- **`<dialog>` + `showModal()`**（Chrome 37 / Safari 15.4 / Firefox 98）：惰性背景、Esc、焦点移入、Tab 不出对话框为浏览器自带。焦点归还：Safari 点击按钮不给按钮焦点，须自存触发元素引用；对话框须在 `close()` 之后再卸载。点背景关闭的 `closedby="any"` Safari 不支持，用「点击目标是对话框本身」的处理代替。iOS 背景滚动须另锁（`body:has(dialog[open])`）。
- **`<details>`**：键盘与读屏原生；`<summary>` 里不放标题元素；去掉默认三角时须保留另一种可见的展开状态。
- **中文排印 CSS**：`text-autospace` 默认关闭、须显式开启（Chrome 140 / Safari 18.4 / Firefox 145）；`text-justify: inter-character` Safari 不支持，且用在西文上会拉开词内字母——只作用于 `:lang(zh)`；`text-spacing-trim` 仅 Chrome；`hanging-punctuation` 仅 Safari；`line-break: strict` 全支持。不支持处一律被忽略。这些规则靠 `lang` 生效，故正文容器必须带条目的写作语言。
- **Supabase CLI 本地栈**：`-x` 排除的镜像仍会被拉取；`[realtime] enabled=false` 才真正不拉 realtime。`[storage]` 关掉时，迁移 `20260922100000_media_bucket.sql` 失败（它只判断 `storage` schema 存在，而空 schema 由 postgres 镜像自带、表由 storage-api 建）——因此 `[storage]` 保持开启并 `-x storage-api`，多拉约 244 MB。不改这条已在生产执行过的迁移。Kong 必须保留（它把 `sb_` 密钥换成角色）。本地栈用 ES256 与 `sb_` 密钥，生产可能用旧的 HS256——登录行为不与生产逐位相同。`NEXT_PUBLIC_*` 与 CSP 在构建时定型，换后端必须重新构建。冷启动约 150 秒（含拉镜像），热启动约 25 秒（本机 colima 2 核 4 GB）；CI 用时未实测。
- **`@axe-core/playwright`**：须对 `browser.newContext()` 的页面使用，`browser.newPage()` 不行。
- **Next 图片**：`remotePatterns` 与 `isAllowedImageUrl` 只接受 `https` 的 Supabase 域名，本地栈是 `http://127.0.0.1`——种子图片因此用站内 `/images/` 路径。

## 4 其他
- **不变量（接 content-publishing §7 编号）**：
  18. 朱砂色的变量只在终止符的样式规则里被引用；Cormorant 的变量只在门的样式规则里被引用（测试，读 `globals.css`）。
  19. 公开组件里没有 `onMouseEnter`/`onMouseLeave`，没有带颜色的内联样式（测试，读源码）。
  20. `extractToc` 给出的每个 `id` 都出现在同一源文渲染结果的某个 `h2` 上（测试）。
  21. `site_pages` 的写入只经 `admin-auth` 给出的客户端（沿用既有的密钥出口测试）。
  22. 依赖里没有 `next-mdx-remote`、`gray-matter`，`src/content/` 不存在（测试，§5.3-c）。
- **测试层级**：core（strict TDD）——`extractToc` 与标题 id、`selectWindows`、`pickPageLocale`、`search-filter`；IO（契约先行）——`pages-repo`、`pages.ts`、后台动作；UI——界面闸门四个文件即 REQ 的验收测试；infra 不单测。
- **兼容**：以 Chrome、Safari（含 iOS）、Firefox 近两年的版本为准；不支持的新特性（页面切换、部分中文排印）按 §3 优雅退化，不写替代实现。

## 5 开放设计问题
- D-1 `<ViewTransition>` 包在 `[locale]/layout.tsx` 的 `{children}` 外一次，还是每个 `page.tsx` 里各包一次：前者一处改动，但布局跨导航常驻，`update` 触发是否成立待原型；Batch 1 实测后关闭，结论写进 §2.4。
