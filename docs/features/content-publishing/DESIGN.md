# DESIGN — content-publishing

## 1 引言
### 1.1 参考
- 需求：`docs/features/content-publishing/REQ.md`
- 裁定：`docs/features/content-publishing/TRACK.md` 第一区
- 仍然有效的上一版设计：`docs/features/routing-slimdown/DESIGN.md` §7（不变量）、§8（外部约束）——本版只增不废
- 表结构：`supabase/migrations/`；行类型：`src/lib/server/database.types.ts`
- 外部文档：Next.js（`proxy` 文件约定、`error.tsx`、`notFound`、`revalidateTag`、`connection`、响应头）、Supabase（Storage、`ALTER TYPE … ADD VALUE`）、unified / remark / rehype、CodeMirror 6、healthchecks.io
### 1.2 术语
见 REQ §1.4。另：**类型描述表**——按内容类型登记「关联表、映射函数、缓存标签、公开栏目、后台附加面板」的一张表，前后台都从它取，是 TD-011 合并的落点。

## 2 总体设计

### 2.1 模块关系
| 模块 / 文件 | 单一职责 | 测试层级 |
|-------------|---------|----------|
| `src/lib/server/content-repo.ts`（新，取代四个 `*-repo.ts`） | 对 `content_items` 的全部读写，按类型参数化：已发布列表、已发布 slug 集合、按 slug 取已发布、后台列表、后台按（类型、slug）取、保存、改状态。**保存是一次 RPC**：数据库函数 `save_content_item(jsonb)` 在一个事务里写父行与全部关联表（标签、相册图、链接整体替换），有 `id` 则按 `id` 更新，否则按自然键 upsert；任一步失败整体回滚。数据库客户端由调用方传入，测试传假客户端 | core（参数组装与结果映射）；函数本身由对测试项目的集成测试覆盖 |
| `src/lib/content-types.ts`（新） | 类型描述表：每种类型的 select 关联片段、映射函数、缓存标签、公开栏目路径、后台附加面板名——**唯一来源** | infra |
| `src/lib/content-row.ts`（新） | 四个 `*-types.ts` 共用的基础行类型与三个辅助函数（元数据解析、日期择取、标签名提取） | core |
| `src/lib/{post,note,photo,project}-types.ts` | 四个映射函数，各自差异保留 | core |
| `src/lib/{posts,notes,gallery,projects}.ts` | 公开加载器，接口不变；每种类型一个缓存标签。专栏加载器的 `cache()` 包装移到模块顶层（现状每次调用新建一个，去重失效）。各加一个**已发布 slug 集合**的缓存读取（单条缓存、同标签） | IO |
| `src/lib/markdown/`（新） | `renderMarkdown(source)`：unified 管道——解析 → GFM → 数学 → 原始 HTML 节点转为文本节点（不丢不执行）→ 转 HTML 树 → 协议相对地址剥除 → **白名单净化**（`rehype-sanitize` 的默认 GitHub schema，它已含表格、任务列表与 remark-math 的 `math-inline`/`math-display`；`href` 协议只允许 `http`、`https`、`mailto`，`src` 只允许 `http`、`https`，相对路径放行）→ **图片段落规则**（段落里只有图片时转为 `div.image-row` 下的若干 `figure`，`title` 作 `figcaption`）→ KaTeX → React 节点。净化排在 KaTeX 与图片规则**之前**：净化器只看到 Markdown 自己生成的树，KaTeX 的输出与我们自己造的 figure 不必进白名单。不引 `server-only`，浏览器与服务端同一份 | core |
| `src/app/[locale]/{posts,notes,gallery,projects}/[slug]/page.tsx` | 用 `renderMarkdown`；`generateMetadata` 与页面都先查已发布 slug 集合，不在 → `notFound()`，不按 slug 读库；不再有自带 `<main>` 的「未找到」分支 | IO |
| `src/app/[locale]/about/page.tsx` | 不变：仓库里的 MDX 文件，`next-mdx-remote` 升到 6（安全通告）且不执行 JS；本版唯一的 MDX 使用者 | IO |
| `src/app/[locale]/error.tsx`、`src/app/admin/error.tsx`（新） | 站点风格 / 后台风格的错误页，不显示错误原文 | infra |
| `src/app/[locale]/loading.tsx` | 删除（§3：它使 `notFound()` 只能给 200） | — |
| `src/app/admin/(protected)/content/[type]/page.tsx`（新） | 某类型的条目列表 + 「新建」 | IO |
| `src/app/admin/(protected)/content/[type]/[slug]/page.tsx`（新） | 编辑器页（`slug` 为 `new` 时新建）；取代 `notes/page.tsx` | IO |
| `src/app/admin/(protected)/content/actions.ts`（新） | 服务端动作：保存（zod 校验 → 管理员校验 → repo → `revalidateTag(tag, 'max')` → 回编辑器）、改状态；取代 `notes/actions.ts` | IO |
| `src/app/api/admin/upload/route.ts`（新） | `POST` 上传图片的路由处理器（服务端动作的请求体上限 1 MB，路由处理器没有）：管理员校验 → `media.ts` → `{ url }` | IO |
| `src/components/admin/ContentEditor.tsx`（新，客户端） | 表单：核心字段 + 按类型描述表挂的附加面板；提交中禁用按钮；校验错误原位显示 | IO（浏览器实测） |
| `src/components/admin/MarkdownEditor.tsx`（新，客户端） | **窄接口**：`{ value, onChange, onUpload }`；内部是 CodeMirror 6 + Markdown 语言包，粘贴 / 拖入图片调 `onUpload` 并在光标处插入 `![](url)` | IO |
| `src/components/admin/MarkdownPreview.tsx`（新，客户端） | 调 `renderMarkdown`，套公开页面同一 `.prose` 样式 | infra |
| `src/components/admin/{GalleryImagesPanel,ProjectLinksPanel}.tsx`（新） | 附加面板：多图上传 / 排序 / 替代文字 / 选封面；链接列表 | IO |
| `src/lib/server/media.ts`（新） | 上传到桶 `media`：校验类型与大小（常量在此文件）、路径 `<类型>/<slug>/<随机前缀>-<文件名>`、返回公开 URL；只经管理员校验后的服务端客户端 | IO |
| `src/lib/structured-data.ts` | 增 `jsonLdScript(obj)`：`JSON.stringify` 后把 `<` 替换为 `\u003c`（JSON 里合法的转义），输出永不含 `</script`；六处 JSON-LD 输出改用它 | core |
| `src/components/PhotoViewer.tsx` | 详情区用 DOM API 与 `textContent` 构建，不再拼 HTML 字符串 | IO |
| `src/lib/site.ts`（新） | `SITE_ORIGIN = 'https://www.antelacus.com'`，全部 canonical / alternate / OG / JSON-LD / sitemap 地址由它拼；`src/` 内不再有别的站点域名字面量 | infra |
| `src/app/api/locale/route.ts`（新） | `GET /api/locale?to=<语言>&next=<站内路径>`：服务端写 `preferred_locale`（一年、`Secure`、`Lax`、`Path=/`），303 到 `next`，响应 `private, no-store`；`next` 经 `getSafeNextPath` 校验 | IO |
| `src/lib/supabase/{server,middleware}.ts` | 会话 cookie 显式传 `httpOnly: true`、`secure: true`、`sameSite: 'lax'`（站上没有浏览器端 Supabase 客户端，cookie 不需要脚本可读） | infra |
| `src/components/UtilityDropdown.tsx` | 语言项变成指向 `/api/locale?…` 的普通链接；不再写 `document.cookie` | IO |
| `src/components/SiteDocument.tsx`、`src/app/[locale]/layout.tsx`、两个 admin 布局 | `SiteDocument` 增 `nav` 插槽渲染在 `<main>` 之前；内层 `<main>` 改 `<div>` | infra |
| `src/proxy.ts`（由 `src/middleware.ts` 改名） | 内容不变；另对详情路径做 slug 格式判定（`[a-z0-9-]{1,80}`），不合格式的直接判「不存在」 | IO |
| `next.config.ts` | `poweredByHeader: false`；`headers()` 增 CSP（同源 + 内联）与 HSTS | infra |
| `Dockerfile`、`docker-compose.yml`、`.github/workflows/check.yml` | 基础镜像 `node:24-bookworm-slim`；`COPY --chown=node:node`，`.next/cache` 由 `node` 可写，再 `USER node`；CI 的 `node-version` 与之同步 | infra |
| `eslint.config.mjs`、`package.json` | flat config 直接引 `eslint-config-next`；`lint` 脚本改为 `eslint .` | infra |
| `scripts/backup.sh`、`scripts/sync-bucket.mjs`（新） | 每日：官方 postgres 容器跑 `pg_dump` → 数据目录；Node 脚本借服务端密钥把 `media`、`gallery` 两个桶同步：按文件夹递归、分页列全 → 下载到临时目录 → 本地计数与列表计数相等才换入 → 不等即失败；按天数清理；成功后 ping | infra |
| `scripts/supabase-keepalive.sh`、`scripts/site-check.sh`（新） | 成功 ping、失败 ping `/fail`；`site-check` 从 VPS 外部地址取首页，期望 200 | infra |
| `docs/DEPLOYMENT.md`、`docs/content-publishing.md` | 运维文档重写：cron 三行、恢复步骤、死人开关与注册开关的核对位置；发布手册改为按后台操作 | — |

依赖方向：页面 → 加载器 → `content-repo` → Supabase；页面与后台 → `content-types`；`markdown/` 无内部依赖。后台动作 → `media.ts` / `content-repo` → 均只经 `admin-auth` 取客户端。

删除的文件：四个 `src/lib/server/*-repo.ts`、`src/app/admin/(protected)/notes/`、`src/app/[locale]/loading.tsx`、`src/lib/supabase/middleware.ts` 若随 `proxy` 改名合并。

### 2.2 数据流
发布：编辑器表单 → 服务端动作（zod 按类型校验）→ `requireAdminUser` → `content-repo.save` → 一次 RPC `save_content_item`：有 `id` 按 `id` 更新，否则按 `(content_type, locale, slug)` upsert；同一事务里标签、相册图（按 `sort_order` 重排）、链接整体替换；封面若不在提交的图片集合里则置空（映射函数已回落到第一张）；`published_at` 首次发布时写、之后不动 → `revalidateTag(<类型标签>, 'max')` → 303 回编辑器带 `saved=`。新建的第二次提交没有 `id`，走自然键，是更新。

图片：编辑器收到粘贴 / 拖入 / 选择 → `POST /api/admin/upload`（`FormData` 含文件与类型、slug）→ `media.ts` 校验并写桶 → 返回公开 URL → 编辑器在光标处插入 `![](url)`；封面与相册图同一接口，返回值写进各自字段。图片在页面上经 Next 图片优化（Supabase 域名已在 `remotePatterns`）。

渲染：页面 → 加载器（缓存、标签）→ `renderMarkdown` → HTML。详情页的 `generateMetadata` 与页面体都先查**已发布 slug 集合**（单条缓存），不在集合 → `notFound()`，不按 slug 读库、不留按 slug 的数据缓存；在集合 → 按 slug 取（缓存）→ 渲染。

失败：读库或渲染抛错 → `[locale]/error.tsx`（状态 500）；后台动作抛错 → `admin/error.tsx`；保存已成功而 `revalidateTag` 抛错 → 动作捕获后仍 303 回编辑器带 `saved=…&stale=1`，编辑器提示「已保存，页面最迟半小时更新」。

### 2.3 后台页面
| 页面 | 说明 | REQ § |
|------|------|-------|
| `/admin` | 四种类型的入口与各自条目数 | 5.3 |
| `/admin/content/<类型>` | 列表：标题、slug、状态、更新时间；「新建」 | 5.3 |
| `/admin/content/<类型>/<slug>` | 编辑器：核心字段、附加面板、预览、存草稿 / 发布 / 撤回 | 5.3 |

公开页面清单不变。

## 3 外部系统约束
上一版 §8 全部仍然成立，以下为本版新学到的（Phase 0 与 Phase 2 的实测，对象 Next 16.3.5）：
- **Next 16**：`next lint` 已删除；`eslint-config-next` 16 只提供 flat config，`FlatCompat` 包装它报循环引用错误。`lint` 脚本与闸门直接跑 `eslint`。
- **Next 16**：`revalidateTag` 必须带第二个参数（缓存配置名）。
- **Next 16**：`middleware` 文件约定弃用，文件与导出函数都改名 `proxy`，运行时固定为 Node；行为不变。改名后 `middleware-manifest.json` 的两个键都为空，登记在 `functions-config-manifest.json` 的 `functions['/_middleware']`（带 matcher），闸门断言读这里。
- **Next 16**：`viewport` 的属性序列化顺序变了（`user-scalable` 移到 `viewport-fit` 之前）；`<head>` 基线随之更新，routing-slimdown REQ §6 增列这一允许的差异。
- **Next 16**：`globalNotFound` 仍是实验标志，行为同 15.5。
- **Next**：`[locale]/loading.tsx` 存在时，详情页里的 `notFound()` 返回 **200**（占位已先流出）；删除它后返回 404。故本版删除该文件；将来要加载动画，放在页面内部、slug 判定之后的 Suspense 边界里。
- **Next**：ISR 页面（`generateStaticParams` 返回空数组）里 `notFound()` 的结果**也会被缓存**：每个未知 slug 在磁盘留下一组页面缓存文件，按时限重新验证但不删除。在 `notFound()` 之前调用 `connection()` 试图让这次渲染变为动态，结果是 500。因此「未知 slug 不留任何缓存」在保持详情页可缓存的前提下做不到；本版做到的是：不读库、不留数据缓存、格式不合的 slug 在 `proxy` 层直接 404 不渲染，页面缓存条目随部署（镜像重建）清空。
- **Next**：`error.tsx` 是客户端组件，只在客户端导航或水合后接管；一个「首访生成、之后缓存」的页面在**生成阶段**出错（读库失败），框架直接回 21 字节的纯文本 500，不经任何边界，`global-error.tsx` 也不经。`generateMetadata` 更在边界之外（本版让它读库失败时退回布局默认值）。在保持页面可缓存的前提下，服务端渲染失败时访客只能拿到状态码正确、不带原文的裸 500；站点风格的错误页只在站内导航时出现。REQ §5.4-b 的「正文是站点的错误页」因此收窄（DESIGN §9 D-4）。
- **remark-rehype**：默认不传递原始 HTML 节点（直接丢弃）。REQ 要求「原样作为文字显示」，故管道里加一个把 `html` 节点改为 `text` 节点的小插件。
- **Supabase Storage**：桶的公开读取是桶级设置；写入只经服务端密钥，不开匿名写策略。
- **Supabase**：免费档项目一周无请求即暂停；`pg_dump` 客户端主版本须与服务端一致（用官方 postgres 镜像跑）。直连地址只有 IPv6，VPS 若无 IPv6 须走 Supavisor 连接池的会话模式端口——`DATABASE_URL` 的取法在 Batch 开工时对 VPS 实测后写进运维文档（待核）。
- **Safari**：脚本写的 cookie 最长 7 天；服务端 `Set-Cookie` 不受此限。
- **healthchecks.io**：每个检查一个 ping 地址；`/fail` 后缀立即告警；周期与宽限期在服务端设置。免费档 20 个检查。
- **Cloudflare**：原样转发源站响应头；它自己也能加 HSTS，本版在应用层加，Cloudflare 侧保持不动以免两处不一致。
- **iOS Safari / sharp**：文件选择框可从相册取图，HEIC 原样上传即可——Next 图片优化用的 sharp 带 libheif，能解码 HEIC 并以 WebP 送出；不做浏览器端转码或压缩，原图存桶。

## 4 模块间契约
- `renderMarkdown(source: string): ReactNode` —— 纯函数，不抛错（解析失败的片段按文字显示）；同一输入在浏览器与服务端产出同一树。
- `content-repo`：`listPublished(type)`、`getPublished(type, slug)`、`listPublishedSlugs(type)`、`listAdmin(type)`、`getAdmin(type, locale, slug)`、`save(type, input)`、`setStatus(type, locale, slug, status)`；第一个参数之外一律通过类型描述表取差异；客户端作为参数传入。
- 类型描述表条目：`{ type, tag, section, relations: string, map: (row) => Domain, extras: 'gallery-images' | 'project-links' | null }`。
- `save_content_item(payload jsonb) returns content_items`：`payload` = 父行字段 + `tags: text[]` + `images: {storage_path, public_url, alt_text, sort_order}[]` + `links: {label, url, link_type}[]`；只对服务端角色授权，匿名角色不可调用。
- `POST /api/admin/upload`（`multipart/form-data`：`file`、`type`、`slug`）→ `200 { url }` 或 `4xx { error }`（用户可读文案）；未登录 401。
- `MarkdownEditor` props：`{ value: string; onChange(next: string): void; onUpload(file: File): Promise<string> }`。
- 缓存标签：`posts`、`notes`、`gallery`、`projects`；写入方在写成功后 `revalidateTag(tag, 'max')`。测试：每个动作使失效的标签 = 类型描述表里该类型的标签；首页、搜索索引、sitemap 只经四个加载器读。
- cookie `preferred_locale`：只由 `/api/locale` 写、只由 `proxy` 读（上一版契约不变，写方换了）。
- 环境变量（VPS `.env` 新增）：`DATABASE_URL`（备份用）、`ANTELACUS_DATA_DIR`、`HC_PING_KEEPALIVE`、`HC_PING_BACKUP`、`HC_PING_SITE`。

## 5 持久化数据
- 迁移一：桶 `media`（公开读，写入只经服务端密钥）。
- 迁移二：部分唯一索引 `(content_type, slug)`——同一类型内 slug 不分写作语言唯一，公开查询按 slug 不带语言即成立；现有约束 `(content_type, locale, slug)` 保留作 upsert 冲突键。
- 迁移三：函数 `save_content_item(jsonb)`（§4）。
- 行类型与映射函数不变。

## 6 异常流
- 表单校验失败 → 动作返回字段级错误，编辑器原位显示，输入保留（不重定向）。
- 关联表写入失败 → 整个 RPC 回滚，正文也不落库；编辑器显示错误，输入保留。
- 上传失败（类型、大小、桶错误）→ 编辑器提示，正文不变。
- 保存时数据库错误 → 抛到 `admin/error.tsx`，带「重试」链接回编辑器；输入丢失是可接受的，因为保存前浏览器端已有草稿在表单里——编辑器把正文暂存于 `sessionStorage`，重试时恢复。
- 未登录调用任何动作 → `requireAdminUser` 重定向到登录（现状）。
- 读库失败 → `[locale]/error.tsx`，500；`/api/search-index` → `{ error: 'unavailable' }`，500。
- 未知 slug → 404（§3 的边界）；格式不合的 slug → `proxy` 判「不存在」。
- keepalive / 备份失败 → ping `/fail`；缺席 → 服务端超时告警。

## 7 不变量（新增，接上一版 §7 编号）
9. 唯一能拿到服务端密钥的仍是 `admin-auth`（既有测试保持）；新增：`media.ts` 与 `content-repo` 的写函数不自行创建客户端（语法检查）。
10. `Dockerfile` 基础镜像的 Node 主版本 = `check.yml` 的 `node-version`（测试）。
11. 站点域名的字面量只出现在 `src/lib/site.ts` 一处，裸域名一处都没有（测试）。
12. `src/` 内没有 `document.cookie` 写入（测试）。
13. 每个公开页与后台页恰有一个 `<main>`，`<nav>` 在其外（运行时验收：首页、一个列表页、关于页、登录页；有数据库时再加一个详情页）。
14. 响应头：CSP、HSTS 存在，`x-powered-by` 不存在（运行时验收）。
15. `renderMarkdown` 对含脚本、表达式、JSX、import 的输入不产生 `<script>`、不求值；`[x](javascript:…)` 与 `![](javascript:…)` 不产生带该协议的 `href`/`src`（测试）。
16. `content-repo.save` 对同一自然键连续两次调用是两次同名 RPC，假客户端里只剩一行（假客户端测试）；`jsonLdScript` 的输出不含 `</script`（测试）。
17. 每个后台动作使失效的标签等于类型描述表里的标签（语法树测试）。

## 8 其他设计
- CSP 字符串：`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://<supabase 域名>; font-src 'self'; connect-src 'self' https://<supabase 域名>; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`。Supabase 域名从环境变量取。
- 图片上限：单张 20 MB，类型 JPEG / PNG / WebP / GIF / AVIF / HEIC / HEIF（`src/lib/server/media.ts`）。
- 备份保留 14 天；cron：keepalive 每 6 小时、备份每日 03:00、站点检查每 10 分钟。
- 后台旧路由 `/admin/notes` 删除，不留重定向（后台无外部链接）。
- `docs/content-publishing.md` 第五至七节（Markdown 写作规范）保留，前四节重写。

## 9 开放设计问题
- D-1 关闭：HEIC 直接接受（§3）；iPhone 上的实际上传在 Phase 4 对生产做。
- D-3 关闭：`scripts/db-function-check.sh` 在本机的 postgres 17 容器里应用全部迁移并做 18 项检查（Docker 经 colima）。
- D-4 REQ §5.4-b「数据库不可达时正文是站点的错误页」与「详情页可缓存」不能同时成立（§3）；拟改为「状态 500、不含数据库原文；站点风格错误页限站内导航」——待 Jason 裁定。
