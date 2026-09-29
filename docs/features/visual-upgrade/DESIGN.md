# DESIGN — visual-upgrade

## 1 引言
### 1.1 参考
- 需求：`docs/features/visual-upgrade/REQ.md`；美学规则：`docs/aesthetic-thesis.md`（本文件只写「怎么切、怎么接」，外观以论文为准）
- 仍然有效的上一版设计：`docs/features/routing-slimdown/DESIGN.md` §7–§8、`docs/features/content-publishing/DESIGN.md` §3–§7——本版只增不废，唯一修订是 content-publishing 不变量 17 的范围（§4）
### 1.2 术语
见 REQ §1.4。另：**形态组件**——《临湖》三种页面形态各自的呈现单元：窗、目录行、照片格。**条目**（`Entry`）——形态组件唯一认得的呈现类型（§2.2）。**界面闸门**——对一个带合成内容的本地实例跑的浏览器检查（§2.5）。

## 2 总体方案

### 2.1 页面清单
| 编号 | 页面 | 形态 | 对应 REQ § |
|------|------|------|-----------|
| P1 | `/[locale]` 首页 | 门 + 一窗主景（视觉大窗，专栏、闪念、实验室三扇文字窗） | 5.1、5.2-d/f/g |
| P2 | `/[locale]/{posts,notes,projects}` | 目录 | 5.1-d、5.2-f |
| P3 | `/[locale]/gallery` | 照片格 | 5.1 |
| P4 | `/[locale]/{posts,notes,projects,gallery}/[slug]` | 手卷：引首 → 折叠目录（≥3 个 `h2`）→ 画心 → 尾纸 + 终止符；相册另有查看器 | 5.1-c/f、5.2-h |
| P5 | `/[locale]/tags`、`/[locale]/tags/[id]` | 目录 | 5.1 |
| P6 | `/[locale]/about` | 手卷（尾纸只有「回到顶部」一行与终止符） | 5.3 |
| P7 | 404（未知路径：`global-not-found`；未知 slug、标签与没有版本的关于页：`[locale]/not-found`）、`[locale]/error` | 引首一段 + 回首页 | 5.1 |
| P8 | 搜索对话框（任何公开页打开） | 目录 | 5.1-c |
| P9 | `/admin/pages/about`、`/admin/pages/about/[locale]` | 后台：语言列表、纯文字编辑器 | 5.3-b、5.1-b |

### 2.2 模块关系
| 模块 / 文件 | 单一职责 | 测试层级 |
|-------------|---------|----------|
| `src/lib/entry.ts`（新） | 呈现类型 `Entry = { type, slug, href, title, summary, date, tags, lang, cover?, coverAlt? }` 与四个适配器（专栏、闪念、相册、项目各自的领域对象 → `Entry`）；形态组件只认 `Entry`，搜索索引也直接输出它（去掉封面） | core |
| `src/lib/{photo,project}-types.ts`（改） | 映射带上 `lang`（取行的 `locale`），与专栏、闪念一致 | core |
| `src/app/api/search-index/route.ts`（改） | 直接输出 `Entry`（经四个适配器），去掉封面；搜索对话框不再另做映射 | IO |
| `src/components/Gate.tsx`（新，服务端） | 首页的门：名字（Cormorant）、终止符、格言（`lang="la"`） | UI |
| `src/components/Window.tsx`（新，共享） | 首页的一扇窗：类型名、标题、摘要、日期、语言、标签；`photo` 变体带一张照片 | UI |
| `src/components/CatalogRow.tsx`（新，共享） | 目录的一行：类型名（混排时）、标题、摘要、日期、语言、标签；标题链接与标签链接各自独立，不嵌套；列表页、标签页、搜索结果共用 | UI |
| `src/components/PhotoTile.tsx`（新，服务端） | 视觉列表的一格 | UI |
| `src/components/EndMark.tsx`（新，服务端） | 终止符；全站唯一使用朱砂的元素 | UI |
| `src/components/Colophon.tsx`（新，服务端） | 尾纸：写于、标签（链接到标签页）、语言；末行「回到顶部」（到导航）与有目录时的「目录」（`ContentsLink`，点开即展开），`EndMark` 在这一行末 | UI |
| `src/lib/page-ids.ts`（新） | 页面自身的固定 id（`main-content`、`site-nav`、`contents`、搜索对话框的两个）的唯一出处；正文标题 id 避开它们 | infra |
| `src/components/Toc.tsx`（新，服务端） | 折叠目录：`<details>`/`<summary>` + 锚点列表；条目少于 3 个时不渲染 | UI |
| `src/components/Nav.tsx`（重写，服务端） | 页首导航：站名（首页之外）与五个栏目链接 + 两个客户端小件；静止、不固定；不再渲染面包屑，面包屑的结构化数据移到详情页的服务端输出 | UI |
| `src/components/NavLinks.tsx`（新，客户端） | 栏目链接的 `aria-current`（`usePathname`） | UI |
| `src/components/SearchDialog.tsx`（新，客户端，取代 `SearchModal`） | 原生 `<dialog>`：以标题命名、有可见的关闭按钮；内层面板之外的点击才算点背景；一个常驻的 `role="status"` 区播报加载、无结果、失败，失败时另有「重试」按钮（重试不移走焦点）；结果用 `CatalogRow`；关闭后焦点回到触发按钮。⌘K / Ctrl+K 从页面任何位置打开（带修饰键，合 WCAG 2.1.4），关闭后焦点回到按下时所在的元素。只有一个输入框（标题、标签、摘要依次加权），不设类型、标签、年份、语言筛选器——标签与类型由标签页与栏目承担 | UI + core（筛选函数） |
| `src/lib/search-filter.ts`（新） | 搜索的纯筛选与排序 | core |
| `src/components/LanguageSwitch.tsx`（新，客户端） | `<details>` 里一组普通链接：`/api/locale?to=<语言>&next=<当前路径把首段换成目标语言>`（`usePathname`）；公开页面不带有意义的查询参数，故不保留查询 | UI |
| `src/components/SiteLink.tsx`（新，共享） | 站内链接的唯一出口：`next/link`，按当前语言加前缀，带 `transitionTypes={['page']}`（§2.4） | infra |
| `src/components/SkipLink.tsx`（重写，服务端） | 普通 `<a href="#main-content">`，无脚本 | infra |
| `src/components/PhotoViewer.tsx`（改） | 上一张 / 下一张按钮在触屏上也显示（覆盖 PhotoSwipe 在 `.pswp--touch` 下的隐藏）；纸墨配色、去文字阴影、静态的加载提示（覆盖其无限转圈）；关闭后焦点回到打开它的那张照片（自存引用）；辅助函数先声明后使用；可访问名称走文案 | UI |
| `src/lib/markdown/`（改） | 标题规整：正文里最高一级标题渲染为 `h2`，其余按相对层级顺延，跳级压平——页面的 `h1` 只属于引首；标题 `id` 稳定且唯一（重名加序号）；`renderMarkdownWithToc(source) → {content, toc}` 一次运行同时给出正文与目录，目录只取规整后的 `h2`，二者 id 必然一致 | core |
| `src/lib/home.ts`（新） | `selectWindows(byType) → HomeWindow[]`：每类最新一篇；窗没有封面字段，只有相册窗带 `image`（相册封面）；空类型不出窗、不补位 | core |
| `src/lib/page-locale.ts`（新） | `pickPageLocale(available, requested) → locale | null`：请求语言 → `en` → 按 `routing.ts` 语言表顺序的第一个；与数据返回顺序无关 | core |
| `src/lib/server/pages-repo.ts`（新） | `site_pages` 的全部读写：已发布版本（某 slug 的全部语言）、后台的语言列表与按（slug、语言）取、保存（按主键 upsert，后写覆盖先写；`updated_at` 由触发器写）；客户端由调用方传入 | IO |
| `src/lib/pages.ts`（重写） | 关于页的公开加载器：`getPage(slug, locale) → { lang, title, body } | null`，`lang` 是选中版本的语言、与 URL 无关；`hasPublishedPage(slug)` 供 sitemap；匿名、无 cookie 的客户端；一条缓存（该 slug 全部已发布版本）、标签 `PAGES_TAG`、半小时，与其他加载器同一方式；`PAGE_SLUGS` 是后台认得的页面清单 | IO |
| `src/lib/sitemap-entries.ts`（改） | 关于页只在至少一个版本已发布时列入（经 `pages.ts`） | core |
| `src/app/admin/(protected)/pages/**`（新） | 关于页的语言列表与编辑器：`MarkdownEditor` 的纯文字模式（`onUpload` 变为可选，缺省时不接受粘贴图片）+ `MarkdownPreview`；动作：管理员校验 → zod 校验（slug 只许 `about`，语言只许 `routing.ts` 中的）→ `savePageVersion` → `updateTag('pages')`；标签失效失败沿用上一版「已保存、最迟半小时更新」的提示 | IO |
| `src/app/[locale]/**/page.tsx`（改） | 按 §2.1 的形态组装；正文容器 `lang` = 条目写作语言，并带 `data-content`；每页恰一个 `h1`；详情页输出面包屑结构化数据 | UI |
| `src/app/globals.css`（重写） | 变量（五色、三种字体角色、间距）、基础排印、中文排印（`:lang(zh)` 下的两端对齐与字间均分）、形态组件的类、悬停（`@media (hover: hover) and (pointer: fine)`）与按下态、页面切换的 150ms 规则、PhotoSwipe 覆盖 | UI |
| `src/messages/*.json`（改） | 界面上的全部可访问名称、语言名、此前写死的中文 | infra |
| `supabase/migrations/<新>_site_pages.sql` | 表 `site_pages`（§2.6） | 由 `db-function-check` 覆盖 |
| `supabase/migrations/<新>_about_content.sql` | 五份关于页正文（由现有 MDX 改写为 Markdown，删去过时描述、加入格言释义），`on conflict do nothing` | Batch 2 的核对查询 |
| `scripts/db-function-check.sh`（改） | 增 `site_pages` 的角色检查：匿名读得到已发布、读不到草稿、写入被拒；服务端角色 upsert 成功 | infra |
| `supabase/config.toml`、`supabase/seed.sql`（新） | 本地栈的服务开关与项目 id；合成种子（§2.5） | infra |
| `tests/ui/*.ui.mjs`、`tests/ui/harness.mjs`、`tests/ui/manifest.mjs`（新）、`scripts/ui-check.sh`（新） | 界面闸门（§2.5） | acceptance |
| `tests/runtime/acceptance.runtime.mjs`（改） | 需要页面能渲染的断言（语言、关于页）移入界面闸门的运行（`RUNTIME_DB=1` 对本地栈）；无库任务只留重定向、404、响应头 | acceptance |
| `.github/workflows/check.yml`（改） | 删去从 `head-baseline.json` 读站点验证码的一行；新增任务 `ui`；`deploy.yml` 等它 | infra |
| `eslint.config.mjs`、`CLAUDE.md` | 删去三条规则的降级；CLAUDE.md 的搜索与关于页两句随实现更新（`tests/claude-md.test.ts` 要求点名的路径存在） | infra |

删除：`PostCard`、`NoteCard`、`PhotoCard`、`ProjectCard`、`SearchModal`、`UtilityDropdown`、`TagList`（标签改为指向标签页的链接）、`src/content/pages/`、`next-mdx-remote`、`gray-matter`、`globals.css` 中的花园、瀑布流、呼吸、倾斜、墨色微变、纹理与暗色块、`Dockerfile` 中复制 `src/content` 的一行、`tests/runtime/fixtures/head-baseline.json` 与 §6-a 测试（其守护的标题、描述、规范地址、语言替代链接、分享图改由界面闸门逐项断言）。仓库文件在 Batch 2 的核对通过之后才删。

依赖方向：页面 → 加载器（`posts|notes|gallery|projects|pages`）→ repo → Supabase；页面 → `entry.ts` 适配 → 形态组件 → `SiteLink`；`markdown/`、`entry.ts`、`home.ts`、`page-locale.ts`、`search-filter.ts` 无内部依赖。形态组件不读数据、不持状态。

### 2.3 业务流程
- **读文章**：目录行 → 详情页。引首只有日期、标题、导语与封面；目录 ≥3 条时，引首之后出现折叠目录；尾纸列出写于、标签、语言，以终止符结束。
- **搜索**：「搜索」按钮 → `showModal()`：背景惰性、焦点落在输入框、Esc 或关闭按钮关闭；状态区依次播报「加载中」「共 N 条 / 无结果」或「载入失败」+ 重试。关闭 → 焦点回到按钮（显式保存触发元素，Safari 点击按钮时不给按钮焦点）；选中结果则导航，焦点随新页面。
- **切换语言**：「语言」`<details>` → 选一种 → `/api/locale` 写 cookie、303 到目标语言的同一路径。
- **相册**：照片格 → 详情页 → 查看器：方向键、按钮、滑动三种翻页；Esc 或关闭后焦点回到所点的照片。
- **后台改关于页**：语言列表 → 编辑 → 保存 → `updateTag('pages')` → 任何语言的下一次匿名访问即新（回退到英文的语言也是，因为缓存按 slug 一条）。
- **出错**：读库失败沿用上一版；关于页没有任何已发布版本 → 404，且不在 sitemap 里。

### 2.4 页面关系与路由
路由不变。
- **页面切换**：React 19.3 的 `<ViewTransition>`，`default="none"`，只对 `page` 类型做 150ms 淡入淡出；`page` 只由 `SiteLink` 发出，前进后退、`router.refresh()`、首次加载不触发。不用 CSS `@view-transition { navigation: auto }`——它只作用于整页跳转。包在每个页面上（`PageTransition`，经 `Catalog`、`Article` 或页面自身），不包在布局上：布局跨导航常驻，进出永不触发（Next 16 随包文档 view-transitions 指南）。
- **悬停**：只在 `(hover: hover) and (pointer: fine)` 下生效，触屏点击后不残留；触屏的按下态靠 `:active`。悬停只改底色与墨色深浅，不显示新信息。
- **目录锚点**：`id` 在服务端随标题生成，页面不在浏览器里扫描标题。

### 2.5 界面闸门
- **流程**（`scripts/ui-check.sh`，本机与 CI 同一份）：先装好清理（`trap` 覆盖正常退出、中断、终止；保留原失败码）→ Docker 不在时本机 `colima start`，并记下是本次启动的 → 本项目的本地栈已在运行则拒绝（拆除会清掉它的数据）→ `supabase start`（CLI 为钉死版本的开发依赖；`config.toml` 固定项目 id 与端口；只运行 db、auth、rest、kong）→ 迁移与 `seed.sql` 自动应用 → **后端边界**：环境变量只取自 `supabase status -o env`，清掉继承的 Supabase 变量，断言 API 地址是 `127.0.0.1` 后才建管理员 → 经 auth 管理接口建合成管理员 → 清空并构建到独立目录（`next.config.ts` 的 `distDir` 由 `NEXT_DIST_DIR` 覆盖；目录里的 Turbopack 构建缓存与数据缓存会跨运行残留）并在 `localhost` 上启动 → 各步都有就绪期限 → 跑测试 → 清理：停应用进程、`supabase stop --no-backup`（只停本次启动的栈；不留卷，下次从空库重放迁移与种子）、只停本次启动的 colima。
- **种子**（合成内容，走与后台同一的 `save_content_item`；`site_pages` 先清空再插入合成行）：带封面、标签与 ≥3 个 `h2` 的中文专栏；只有 2 个 `h2` 的英文闪念；带封面与两个链接的项目；两张图的相册；一篇草稿；关于页 `en`、`zh-CN` 已发布、`es` 为草稿。图片取 `public/images/` 已提交的文件。关于页回退到「任意」与「一个都没有」两种情形由单元与 IO 测试负责。
- **测试**：Playwright 作库、跑在 `node:test` 下，显式列出文件、同一进程运行（`*.ui.mjs` 不在 Node 的默认发现规则里；对账要读其他文件记下的结果）。环境：桌面 Chromium、触屏 WebKit（iPhone）、触屏 Chromium（Pixel）、平板 WebKit（触屏 820 宽）、320px、200% 放大（桌面 640 宽）。200% 放大以 640 CSS 像素宽、2 倍像素比模拟，而非浏览器缩放：1280 宽放大一倍即 640 CSS 像素，这正是 WCAG 1.4.10 重排检查的做法，Playwright 也没有真正的缩放。`manifest.mjs` 列出「模板 × 环境 × 状态」：状态（搜索打开、查看器打开、目录展开、悬停、聚焦）是模板的变体，遍历模板的检查因此自动覆盖各状态；静止即载入完成的一刻，不另等待（首载）。每次 axe 运行记下它判定的组合，`coverage.ui.mjs` 排在最后与清单逐项对账，缺一项即失败（§5.5-a）：静止部分自 Batch 1 起生效，状态部分在状态的入口都存在后（Batch 5）生效。入口尚未建成的状态在清单里标 `pending`（写明由哪一批建成）：入口不存在时跳过并在对账输出里列出，入口一存在即照常检查；状态对账在 Batch 5 去 todo 后，任何跳过都会让闸门变红。检查前先断言页面身份：状态码、有 `<main>`、种子标题在 `<main>` 里、没有破图、状态已进入（入口不存在即刻失败，不等超时）、后台页面已登录。`h1` 的个数与层级是 §5.1-g 自己的判据，不作身份条件。
- **不空转**：每次运行都在四种环境里各植入一个无名按钮，axe 须报出它——检查失灵时闸门变红。§5.5-b 的分支实验（源码里造一个无名按钮、记下变红的运行号、删分支）要在 §5.1-a 去掉 todo 之后才可能变红，故在 Batch 6 做。
- 界面测试（`tests/ui/harness.mjs`）拒绝 `BASE_URL` 不在本机回环地址白名单的运行——界面闸门永不对生产。合成管理员的凭据只在脚本进程内，不进构建产物与日志。
- **分机**（`UI_SHARD`）：界面检查按文件分成两份——`public`（公开页的无障碍检查）与 `admin`（后台、键盘、美学；美学检查不调 axe，按耗时放在这边）——在两台机器上各自拉起本地栈、构建、跑自己那份；具体归属在 `manifest.mjs` 的 `SHARDS` 里，唯一来源。覆盖对账随之分开：`public` 核对「模板 × 环境」的组合，`admin` 核对后台模板；两份合起来必须正好是全部组合——单元测试断言 `SHARDS` 的划分无遗漏、无重叠，每个 `*.ui.mjs` 恰属一份。植入违例的自检两份都跑。不设 `UI_SHARD`（本机）时一次跑全部、核对全部；设了却不是已知的份名，或选出的文件、要核对的组合为空，脚本立即失败——拼错的矩阵值不能让一台机器空跑成绿。有库的运行时套件只在 `admin` 那份跑。
  - 不跨机器合并覆盖结果：那要多一个下载两份产物再对账的任务；按文件划分后，每份的对账只依赖自己跑过的检查，合并无从出错。
- **各环境并行**：`visit()` 对不同环境（浏览器上下文）并行打开，同一环境内的模板仍逐个进行；失败照旧汇总报出。同一页面的检查仍只在一个上下文里，互不共享状态。有副作用的后台检查（保存、发布、上传）只用一个环境，因此仍然串行。
- CI：`branch.yml` 的 `ui` 任务按 `UI_SHARD` 开两个（矩阵），`staging-check` 等两个都通过；也以 `RUNTIME_DB=1` 对本地栈跑 `tests/runtime/`（见上）。

### 2.6 持久化数据
- 新表 `site_pages`：`slug text`、`locale text`、`title text not null`、`body_markdown text not null`、`status content_status_enum not null default 'draft'`、`updated_at timestamptz not null default now()`（更新时由与 `content_items` 同一个触发器写）；主键 `(slug, locale)`；RLS：匿名只读 `published`；匿名与登录角色只有 `select` 权限，写入只授予服务端角色（它绕过 RLS）。语言与 slug 的取值由后台动作校验，不在库里约束（语言表的唯一来源是 `routing.ts`）。并发编辑后写覆盖先写，接受。
  - 不把关于页作为 `page` 类型放进 `content_items`：须加一个删不掉的枚举值、放宽同类型 slug 唯一约束，并在搜索索引、sitemap、栏目一致性测试等六处加特例。
- 上线顺序：两条迁移按运维文档先在 Supabase 执行，跑核对查询（五行、全部 `published`、标题与正文非空），通过后再合并部署；「渲染无报错」由单元测试对迁移文件里的五份正文判定。数据迁移遇冲突保留已有行、核对查询把它列出来由 Jason 看。

## 3 外部系统约束
上两版 §8 / §3 全部仍然成立，以下为本版新学到的（Phase 2 实测与查证，对象 Next 16.3.5、React 19.3、Supabase CLI 2.117.0、PhotoSwipe 5.4.4）：
- **React 19.3**：`<ViewTransition>` 稳定，Next 16 App Router 无需配置；旧的 `experimental.viewTransition` 已不存在。浏览器不支持时 React 直接提交、不动画。它会关掉根的整页过渡，只有被包裹的内容淡入淡出。所有 transition 都会触发它（含前进后退、`router.refresh()`），故用 `default="none"` + 类型限定。过渡期间须 `::view-transition { pointer-events: none }`，否则点击丢失。
- **`<dialog>` + `showModal()`**（Chrome 37 / Safari 15.4 / Firefox 98）：惰性背景、Esc、焦点移入为浏览器自带；但 Tab 越过最后一个控件时焦点会离开对话框、去往浏览器自身界面（Batch 5 实测），故按 WAI-ARIA 模态对话框模式手动首尾循环。焦点归还：Safari 点击按钮不给按钮焦点，须自存触发元素；对话框须在 `close()` 之后再卸载。`closedby="any"` Safari 不支持。iOS 背景滚动须另锁（`body:has(dialog[open])`）。对话框自带的焦点管理不播报之后出现的状态文字（4.1.3 须另设状态区）。
- **`<details>`**：键盘与读屏原生；`<summary>` 里不放标题元素；去掉默认三角时须保留另一种可见的展开状态。
- **中文排印 CSS**：`text-autospace` 默认关闭、须显式开启（Chrome 140 / Safari 18.4 / Firefox 145）；`text-justify: inter-character` Safari 不支持，且用在西文上会拉开词内字母——只作用于 `:lang(zh)`；`text-spacing-trim` 仅 Chrome；`hanging-punctuation` 仅 Safari；`line-break: strict` 全支持。不支持处一律被忽略。这些规则靠 `lang` 生效，故正文容器必须带条目的写作语言。
- **PhotoSwipe 5.4.4 自带样式**：`.pswp--touch` 下隐藏左右箭头；计数器有文字阴影；黑底；加载指示是无限旋转动画。只在脚本里开按钮不够，须由站点样式覆盖。默认把焦点还给打开前的活动元素，不一定是所点的照片。
- **Supabase CLI 本地栈**：`-x` 排除的镜像仍会被拉取；`[realtime] enabled=false` 才真正不拉 realtime。`[storage]` 关掉时迁移 `20260922100000_media_bucket.sql` 失败（它只判断 `storage` schema 存在，空 schema 由 postgres 镜像自带、表由 storage-api 建）——因此 `[storage]` 保持开启并 `-x storage-api`，多拉约 244 MB；不改这条已在生产执行过的迁移。Kong 必须保留（它把 `sb_` 密钥换成角色）。本地栈用 ES256 与 `sb_` 密钥，生产可能用旧的 HS256——登录行为不与生产逐位相同。`NEXT_PUBLIC_*` 与 CSP 在构建时定型，换后端必须重新构建。冷启动约 150 秒（含拉镜像），热启动约 25 秒（本机 colima 2 核 4 GB）。CI 的 `ui` 任务约 7 分钟：装浏览器 1、起栈（拉镜像）1.5、构建 0.6、浏览器检查 3.5。
- **Node 测试运行器**：`node --test <目录>` 只发现默认命名规则的文件，`*.ui.mjs` 不在其中。默认每个文件一个子进程，文件间不共享模块状态；`--test-isolation=none` 才在同一进程里按列出的顺序运行。
- **`next start` 与本机地址**：代理对未知路径的 404 由服务器向 `localhost:<端口>/404/unmatched` 自取；绑在 `127.0.0.1` 时，Mac 上 `localhost` 先解析为 `::1`，这类请求挂起约 30 秒后 500。故界面闸门绑定并访问 `localhost`。
- **`distDir`**：换了目录，`next build` 会把 `<distDir>/types` 写进 `tsconfig.json` 的 `include`；这两行随仓库提交，否则每次闸门运行都弄脏工作区。
- **Playwright WebKit**：与 Safari 一样，Tab 跳过链接，要 `Alt+Tab`。
- **`@axe-core/playwright`**：须对 `browser.newContext()` 的页面使用，`browser.newPage()` 不行。
- **Next 图片**：`remotePatterns` 与 `isAllowedImageUrl` 只接受 `https` 的 Supabase 域名，本地栈是 `http://127.0.0.1`——种子图片因此用站内 `/images/` 路径。

## 4 其他
- **修订的不变量**：content-publishing 17 改为「每个后台动作使失效的标签等于类型描述表里该类型的标签；页面动作使失效的是 `pages`」（语法树测试随之扩范围）。
- **不变量（接 content-publishing §7 编号）**：
  18. 朱砂色只出现在终止符上、Cormorant 只出现在门里——由界面闸门在静止、悬停、聚焦、展开、对话框打开各状态下的计算样式判定（含伪元素）；`globals.css` 里二者的变量各只被一条规则引用（测试）。
  19. 公开组件里没有 `onMouseEnter`/`onMouseLeave`，没有带颜色的内联样式（测试，读源码）。
  20. 同一次渲染里，目录的每个 `id` 恰对应渲染结果里一个 `h2`，且全文 `id` 唯一；渲染结果没有 `h1`、没有跳级（测试：多个 `#`、跳级、重名、只有标点的标题、两个与三个 `h2` 的边界）。
  21. `site_pages` 的写入只经 `admin-auth` 给出的客户端（沿用既有的密钥出口测试）。
  22. 依赖里没有 `next-mdx-remote`、`gray-matter`，`src/content/` 不存在（测试，§5.3-c）。
  23. 四类条目经适配器得到的 `Entry` 都带非空 `lang` 与正确的 `href`（测试）。
  24. 版本关闭时，验收文件里没有 `todo` 标记（Phase 6 方框里跑一次 grep）。
- **测试层级**：core（strict TDD）——`entry.ts`、标题规整与目录、`selectWindows`、`pickPageLocale`、`search-filter`、sitemap 的关于页条件；IO（契约先行）——`pages-repo`、`pages.ts`、后台动作、`site_pages` 角色；UI——界面闸门即 REQ 的验收测试；infra 不单测。
- **兼容**：以 Chrome、Safari（含 iOS）、Firefox 近两年的版本为准；不支持的新特性（页面切换、部分中文排印）按 §3 优雅退化，不写替代实现。

## 5 开放设计问题
N/A —— D-1 已关闭，结论在 §2.4。
