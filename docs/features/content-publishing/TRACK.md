# TRACK — content-publishing v2.3.0

## 一、范围与裁定

- 模式：standard · 目标：清空 `docs/TECHNICAL_DEBT.md` 上全部未接受的债务，核心是让三种内容类型都能从后台发布、且数据库内容不再当代码执行。视觉升级不在本版。
- 范围（条目编号 = `docs/TECHNICAL_DEBT.md`；序号即建议的批次先后）：
  1. TD-005 依赖升级：Next 16（连带 React、`eslint-config-next`）、`next-intl` 4.14、`sharp` 0.35 —— 第一批，其余改动都建在新框架上，v2.2.0 的运行时验收顺带验一遍升级
  2. TD-006 数据库内容不再当代码执行（`next-mdx-remote` 6 禁 JS，或数据库内容改纯 Markdown）；容器以非 root 运行
  3. TD-001 发布入口：posts / projects / gallery 的后台增改与发布，含封面图与正文插图上传；按 slug 幂等保存、表单防重复提交（与 2 一起设计）
  4. TD-012 失败不再原样到访客：`error.tsx`、不存在的 slug 返回真 404、搜索 API 不回显数据库错误、后台保存动作的错误页
  5. TD-014 小项加固：base image、CSP/HSTS、`x-powered-by`、cookie `secure`、三个 XSS 汇点、canonical 域名、Supabase 注册开关核查
  6. TD-011 四份 repo 合一 + 共享行类型与工具；修 `src/lib/posts.ts` 的 `cache()`（loader 工厂不做）
  7. TD-016 测试补全：mapper 回退路径、sitemap 的语言展开与 XML 转义、`getSafeNextPath`
  8. TD-017 语言 cookie 由服务端写（绕开 Safari 7 天上限）
  9. TD-018 导航移出 `<main>`，内层 `<main>` 改 `<div>`
  10. TD-003 内容备份：VPS 上 cron 定时 `pg_dump` + 存储桶同步，落 VPS 数据目录
  11. TD-013 keepalive 与站点可用性接上死人开关服务（脚本成功即报平安，到点没报就告警）；同时覆盖「cron 停了」；备份任务也挂一个开关
- 明确不做：
  - 视觉升级 → v2.4.0（届时 REQ `routing-slimdown` §6「外观与 `<head>` 不变」及其验收测试 §6-a 正式退役）
  - 关于页进数据库 → v2.4.0（TD-019）：它是 JSX 排版的，改 Markdown 就是改外观
  - 视觉相关的重构不借 TD-011 夹带：合并 repo 与行类型是结构改动，不改渲染
- 全局约束（约束所有批次）：
  - 版本地板 / 依赖：Node 版本以 `Dockerfile` 的基础镜像为准，`check.yml` 与之同步；TD-005 后 `next` 钉在所升到的 16.x 精确版本
  - 不得漂移的精确值：支持的语言集合以 `src/i18n/routing.ts` 为唯一来源；规范域名 `https://www.antelacus.com`
  - Next 16 的已知约束（Phase 0 对 16.3.5 的干跑实测；开 DESIGN 时迁入其外部约束节）：`next lint` 已删除，`lint` 脚本与 `check.yml` 改为直接跑 `eslint`，且 `eslint-config-next` 16 只认 flat config（现有 `FlatCompat` 写法报循环引用）；`revalidateTag` 必须带第二个参数；`middleware` 文件约定弃用、需改名 `proxy`（构建清单里两个键都在，`check.yml` 的清单断言随之改）；`viewport` 的序列化顺序变了，§6-a 的基线要按裁定更新。其余：35 条单元测试、14/15 条运行时验收在 16 上不改即过，`globalNotFound` 仍为实验标志但可用
  - The Floor：`.env` 只在 VPS 上，本地与 CI 没有数据库；备份导出物是真实内容（含未发布草稿），只落 VPS 数据目录，不进仓库、PR 描述、日志
- 裁定（一行一条，只记「批了什么」）：
  - 2026-09-22 · 债务与视觉升级分两版：v2.3.0 清债、v2.4.0 视觉 · Jason · 级联：本 TRACK 范围与「明确不做」
  - 2026-09-22 · TD-002、TD-004 不是债务，删除：前者守护的风险与「数据库不可用」不可分，后者是代码可见的事实 · Jason · 级联：`TECHNICAL_DEBT`
  - 2026-09-22 · 关于页的内容进数据库，与其他类型同一发布入口；`/about` 不再读仓库文件 · Jason · 级联：REQ（待开）
  - 2026-09-22 · 推翻 v2.2.0 的三项「另开版本」裁定：TD-003、TD-013、Next 16 升级全部纳入 v2.3.0 · Jason · 级联：`TECHNICAL_DEBT` TD-003 / TD-005 / TD-013
  - 2026-09-22 · TD-003 用 VPS 上 cron 定时 `pg_dump` 加存储桶同步，数据库密码作为新秘密进 VPS 的 `.env` · Jason · 级联：DESIGN 外部约束（待开）
  - 2026-09-22 · 写入路径只有站内编辑器一条，不做本地文件 + 发布命令；控件用 CodeMirror 6，放在「进出都是 Markdown 字符串 + 一个上传函数」的窄接口后面；图片（封面、插图）全部进存储桶 · Jason · 级联：REQ、DESIGN（待开）
  - 2026-09-22 · 备份每日一次、保留 14 天、不出 VPS；告警走邮件，服务选 healthchecks.io · Jason · 级联：REQ §5.6、§5.7；DESIGN 外部约束（待开）
  - 2026-09-22 · 关于页进库后按语言可有多份、缺则回退（请求语言 → 英文 → 任意）；唯一含 JSX 的正文（三图并排）改写为 Markdown，并排与图注由渲染规则承担 · Jason · 级联：REQ §5.2、§5.3 规则 2
  - 2026-09-22 · DESIGN 四刀：后台编辑器只有一个（核心字段共用 + 按类型的附加面板）；Markdown 渲染是一个纯 JS 模块，公开页面与后台预览同一份；新图片进新桶 `media`，`gallery` 桶与其 URL 不动；四份 repo 合成一个按类型参数化的服务端 repo，四个映射函数与四个公开加载器保留 · Jason · 级联：DESIGN §2（待开）
  - 2026-09-22 · 关于页作为 `content_type` 的新枚举值 `page` 进 `content_items`，不另建表；CSP 取「同源 + 内联」一档，不用 nonce（严格档要放弃公开页面缓存）· Jason · 级联：DESIGN §2、§3（待开）
  - 2026-09-22 · 未知 slug：真 404 + 有界页面缓存（不读库、不留数据缓存、格式不合的在 proxy 层拦下），删除 `[locale]/loading.tsx` · Jason · 级联：REQ §5.4、§6；routing-slimdown REQ §6；DESIGN §3
  - 2026-09-22 · Codex 设计门 18 条：MUST-1 修（保存改为数据库函数一事务写入）；MUST-5 关于页推迟到 v2.4.0，推翻当天「关于页进数据库」的裁定，Batch 5 取消；MUST-2/3/4/6/7/8/9/10 与 SHOULD-11～16、NICE-17 采纳；NICE-18 接受 · Jason · 级联：REQ §1.2、§5.2、§5.3、§5.6；DESIGN §2、§4、§5、§6、§7；`TECHNICAL_DEBT` TD-019
  - 2026-09-22 · TD-013 用外部死人开关服务：脚本成功即 ping，缺席即告警；不在 VPS 上自建 · Jason · 级联：DESIGN 外部约束（待开）

## 二、批次

验收测试已写红：`tests/acceptance-content-publishing.test.ts`（单元）与 `tests/runtime/acceptance.runtime.mjs` 末段（运行时），每条 `todo` 标着它的批次；批次完成 = 它名下的标记去掉且全绿。

### Batch 1 — Next 16 与依赖
- 状态：done `3c03394`（§5.1-c 的闸门红灯实验待首次推送时做）
- 范围：`package.json`（`next` 16.x 钉死、`react`、`eslint-config-next`、`next-intl`、`sharp`；`lint` 脚本）、`eslint.config.mjs`（flat config）、`src/middleware.ts` → `src/proxy.ts`、`src/app/admin/(protected)/notes/actions.ts`（`revalidateTag` 第二参数）、`.github/workflows/check.yml`（eslint 直跑、清单断言的键、`npm audit --omit=dev` 步骤）、`tests/runtime/fixtures/head-baseline.json`（`viewport` 顺序）· 覆盖 REQ §5.1
- 验收判据：§5.1-a 去掉 todo；§5.1-b 既有单元与运行时验收全绿；§5.1-c 在分支上故意造一个 lint 错误，闸门红（记录运行号）；`npm audit --omit=dev` 报 0
- 依赖：none
- 证据（本地，闸门的每一步）：audit 0；lint 0 错误 25 警告（TD-020）；tsc 净；单元 54（36 过、18 todo）；假环境构建；运行时 23（15 过、8 todo）；关于页在 next-mdx-remote 6 下仍渲染 6 个分节。设计未预见、已处理：proxy 在 Next 16 不再进 `middleware-manifest.json`（DESIGN §3）；三条 React Compiler 规则打中 18 处旧代码（TD-020）

### Batch 2 — Markdown 渲染与容器
- 状态：done `3474505` + `de24915`（包未进 `package.json` 的修复，CI 拦下）
- 范围：`src/lib/markdown/`（新）、四个 `[slug]/page.tsx` 改用它、`next-mdx-remote` 升 6 且只剩关于页用、`Dockerfile`（`node:24`、`--chown`、`USER node`）、`check.yml`（`node-version: 24`）、`docker-compose.yml` 若需 · 覆盖 REQ §5.2-a/b/d、§5.5-d
- 验收判据：§5.2-a、§5.2-b（两条）、§5.2-d、§5.5-d 去掉 todo；本地构建后关于页与 404 页渲染正常；`id -u` 在容器内非 0 且首访能写缓存（本地 `docker compose up` 验）
- 依赖：Batch 1
- 证据：五条去掉 todo 全绿；本机 Docker（colima）构建镜像：容器内 uid 1000、Node 24.21，首访 `/fr/about` 200 并以 `node` 用户写出缓存文件；关于页在 next-mdx-remote 6 下 6 个分节；闸门运行 35694542351 绿

### Batch 3 — 结构合并与测试补全
- 状态：done `95faa07`
- 范围：`src/lib/content-row.ts`、`src/lib/content-types.ts`、`src/lib/server/content-repo.ts`（新，取代四个 `*-repo.ts`）、四个 `*-types.ts`、四个公开加载器（`cache()` 修正、已发布 slug 集合）、五个卡片与 `Nav` 的语言前缀改用一个 hook、`tests/fakes/supabase.ts`（新）、mapper 回退 / sitemap / `getSafeNextPath` 的测试 · 覆盖 REQ §5.10、§5.11
- 验收判据：§5.10-c、§5.10 去掉 todo；既有 mapper 快照测试全过；§5.11-a 的每个新用例经变异证明能红；§5.10-b 本地无数据库测不了列表页，改为：生产列表页的链接与标题摘要存为基线（`tests/runtime/fixtures/list-pages-baseline.json`），Phase 4 部署后对比
- 依赖：Batch 2
- 证据：单元 66（55 过、11 todo）；三处变异各红 1 条；四份 repo 与语言前缀表达式已消失（§5.10 测试）；运行时 23（15 过、8 todo）

### Batch 4 — 发布入口：四种类型
- 状态：done `60e01c5`（浏览器全流程待 Phase 4 对真实数据库做）
- 范围：`supabase/migrations/`（桶 `media`、部分唯一索引、`save_content_item`）、`src/lib/server/media.ts`、`src/app/api/admin/upload/route.ts`、`src/lib/content-slug.ts`、`src/app/admin/(protected)/content/`（列表、编辑器页、`actions.ts`）、`src/components/admin/{ContentEditor,MarkdownEditor,MarkdownPreview,GalleryImagesPanel,ProjectLinksPanel}.tsx`、删 `admin/(protected)/notes/`、`src/app/admin/(protected)/page.tsx` · 覆盖 REQ §5.3、§7
- 验收判据：§5.3-b（两条）、§5.3 规则 4、§5.3-g、§5.3 标签失效 去掉 todo；`save_content_item` 的集成测试（D-3 定环境）过；§5.3-a/c/d/e 在本地对一个测试用 Supabase 项目走一遍并记录（或上线后对生产，见第三区）；iOS Safari 实测 HEIC 与大图，关闭 DESIGN D-1；`docs/content-publishing.md` 前四节重写
- 依赖：Batch 3
- 证据：五条去掉 todo 全绿（单元 65：59 过、6 todo）；`scripts/db-function-check.sh` 18 项全过（本机 postgres 17 容器）；构建与运行时验收绿；未登录上传 401、编辑器页 307 到登录。D-1 关闭（HEIC 直接接受，sharp 解码）、D-3 关闭（本机容器）

### Batch 5 — 失败处理与真 404
- 状态：done `5a502f0`（§5.4-b 的措辞待裁：DESIGN D-4）
- 范围：`src/app/[locale]/error.tsx`、`src/app/admin/error.tsx`（新）、删 `src/app/[locale]/loading.tsx`、四个详情页（`generateMetadata` 与页面体都经 slug 集合 → `notFound()`）、`src/i18n/route-decision.ts` 与 `routing.ts`（详情路径的 slug 格式判定）、`src/app/api/search-index/route.ts`、`content/actions.ts`（`revalidateTag` 抛错后的 `stale=1`）· 覆盖 REQ §5.4
- 验收判据：§5.4-d（单元）、§5.4 占位删除、运行时 §5.4-b/c/d 去掉 todo；§5.4-a 上线后对生产跑；本地假环境下 20 个格式合规的未知 slug 不产生 `.next/cache` 数据条目（构建目录计数）
- 依赖：Batch 3
- 证据：单元 66（62 过、4 todo）；运行时 23（18 过、5 todo）：格式不合的 slug 404、搜索接口不回显、读库失败 500 无原文；`generateMetadata` 在边界外的事实与「缓存页生成失败只能裸 500」记入 DESIGN §3

### Batch 6 — 加固、语言 cookie、跳转链接
- 状态：done `b21ce99`
- 范围：`next.config.ts`（CSP、HSTS、`poweredByHeader`）、`src/lib/supabase/{server,middleware}.ts`（cookie 选项）、`src/lib/structured-data.ts`（`jsonLdScript`）与六处调用、`src/components/PhotoViewer.tsx`、`src/lib/seo.ts`（`SITE_ORIGIN`）与十处字面量、`src/app/api/locale/route.ts`（新）、`src/components/UtilityDropdown.tsx`、`src/components/SiteDocument.tsx`、`src/app/[locale]/layout.tsx`、两个 admin 布局 · 覆盖 REQ §5.5-a/b/c、§5.8、§5.9
- 验收判据：§5.5-b（两条）、§5.5-c、§5.8-a（单元）；运行时 §5.5-a、§5.5-c、§5.8-a、§5.9-a 去掉 todo；浏览器下 CSP 无报错（公式、相册查看器、搜索、后台编辑器各开一次）；routing-slimdown §5.2-h 仍绿
- 依赖：Batch 5
- 证据：单元 66 全绿（todo 0）；运行时 22 过、todo 1（§5.4-a 待数据库）；浏览器（Playwright）打开关于页与登录页，CSP 零违规；响应头实测含 CSP、HSTS，无 `x-powered-by`；`<head>` 基线按 §5.5-c 更新为 www

### Batch 7 — 备份与告警
- 状态：done `5250348`（VPS 侧：`DATABASE_URL`、三个 ping 地址进 `.env`、cron 三行——上线时做，见第三区）
- 范围：`scripts/backup.sh`、`scripts/sync-bucket.mjs`、`scripts/site-check.sh`（新）、`scripts/supabase-keepalive.sh`（ping）、`.env.example`（五个新变量）、`docs/DEPLOYMENT.md` 重写（cron 三行、恢复步骤、注册开关与死人开关的核对位置）· 覆盖 REQ §5.6、§5.7
- 验收判据：`backup.sh` 对本地 postgres 容器干跑成功（`pg_restore --list` 可读）；`sync-bucket.mjs` 对测试桶跑通；healthchecks.io 三个检查建好、ping 地址进 VPS `.env`；§5.6-a/b、§5.7-a/b/c 上线后验（第三区）
- 依赖：none（可与 4–6 并行）
- 证据：本机一次性 postgres 容器上 `backup.sh` 产出可读转储（`pg_restore --list` 5 张表），桶步骤失败时整体 FAILED；`sync-bucket.mjs` 的分页与差量计划有单元测试（68 全绿）

## 三、门与发布

**评审发现登记**（Codex 设计门 · 部署前门；评审返回即原样登记，处置由 Jason 裁）：

Codex 设计门（只读，xhigh，任务 `task-muc4c5ws-s6ei46`，会话 `01a0c72c-3f22-7622-b520-30b6a12894bd`，24 分钟；对象 = `68ad804`+工作树的 DESIGN 与 REQ）。十八条引文均已对过源码，一致：
- MUST-1：保存未指明为一个事务：父行 upsert 后关联表整体替换（先删后插），并发或中途失败会留下半替换的标签 / 图 / 链接 —— status: 采纳（修）→ 已改 DESIGN §2、§4、§5
- MUST-2：改 slug 的语义未定义：按自然键 upsert 新 slug 不会删旧行，旧地址仍在列表与 sitemap 里 —— status: 采纳 → 已改 REQ §5.3 规则 3、DESIGN §2.2
- MUST-3：数据模型允许同一 slug 在不同写作语言各一行，而公开查询不带语言（`maybeSingle`）：两行即报错或任意取胜 —— status: 采纳 → 已改 DESIGN §5（部分唯一索引）、REQ 规则 4
- MUST-4：`generateMetadata` 先于页面按 slug 读库，未知 slug 仍会查库并留数据缓存，违反 §5.4-d —— status: 采纳 → 已改 DESIGN §2
- MUST-5：关于页正文以 JSX / HTML 写成（`<section className=…>`、`<svg>`…），REQ「唯一含 JSX 的正文是一篇专栏」不成立；按「原样作文字显示」迁入会把标记显示出来 —— status: 采纳 → 关于页推迟到 v2.4.0（REQ §1.2、TD-019）
- MUST-6：服务端动作的请求体默认上限 1 MB（`action-handler.js:478`），20 MB 的图片到不了 `media.ts` —— status: 采纳 → 上传改路由处理器（DESIGN §2、§4）
- MUST-7：`USER node` 而不改 `/app` 属主，运行时写 `.next/cache` 会 `EACCES`，首访渲染与重新验证失败（推断）—— status: 采纳 → 已改 DESIGN §2
- MUST-8：DESIGN 自相矛盾：§2.2 写 `revalidateTag(<标签>)` 单参数，§3 写必须两个参数 —— status: 采纳 → 已改 DESIGN
- MUST-9：JSON-LD 转义写成了空操作（文本里 `\u003c` 的反斜杠丢失，读作「把 `<` 转为 `<`」）—— status: 采纳 → 已改 DESIGN §2、§7
- MUST-10：会话 cookie 未指定选项（`@supabase/ssr` 默认 `httpOnly: false`）；`/api/locale` 契约缺 `private, no-store` —— status: 采纳 → 已改 DESIGN §2
- SHOULD-11：净化白名单太含糊，KaTeX 属性与内联样式、`figure`、任务列表的 `input`、`data:` / `//host` 等协议均无明确规则与测试 —— status: 采纳 → 已改 REQ §5.2、DESIGN §2
- SHOULD-12：`page` 的单一来源不完整：zod 枚举与插入 schema 也要加；frontmatter 到列的映射未定 —— status: 随 MUST-5 消失（无 `page`）
- SHOULD-13：相册封面与图片集合不绑定：删掉被选中的图后 `cover_image_url` 悬空 —— status: 采纳 → REQ 规则 10
- SHOULD-14：桶同步未指明递归、分页、临时目录换入、事后计数，可能「成功」却漏文件 —— status: 采纳 → 已改 DESIGN §2
- SHOULD-15：缓存标签契约没有覆盖全类型全消费者的测试 —— status: 采纳 → DESIGN §4、§7
- SHOULD-16：`<main>` 唯一的不变量只在两条地址上测 —— status: 采纳 → DESIGN §7
- NICE-17：草稿 / 发布的 `published_at` 语义未定：撤回再发布会重排序 —— status: 采纳 → REQ 规则 9
- NICE-18：备份没有一致性边界：`pg_dump` 与桶同步之间的写入可能一边有一边无 —— status: 接受 → REQ §5.6「不做」
- 评审确认成立：自然键唯一约束存在；服务端密钥只经 `admin-auth`；四个加载器各自标签且首页 / 列表 / 标签页 / 搜索 / sitemap 都经它们读；路由按整段比较、语言重定向已 `private, no-store`；Supabase 图片域名已在 `remotePatterns`；三个 XSS 汇点与十处裸域名字面量属实
- 待核（实现后）：`proxy.ts` 的导出函数名与清单键；`DATABASE_URL` 走直连还是连接池；iOS HEIC；CodeMirror 的 CSP 需求；同构渲染的树一致性与包体积

**Phase 4 证据**：尚未到达。

**Phase 6 boxes**（请求 PR 之前写好——合并 ≠ 发布）：
- [ ] CHANGELOG 条目
- [ ] TECHNICAL_DEBT 定稿（已解决的删除，不留墓碑；TD-002、TD-004 留）
- [ ] 用户文档（`docs/content-publishing.md` 改为按后台发布，SQL 一节退役；关于页一节说明仍是仓库文件）· README 仍然属实
- [ ] 常新文档扫尾（REQ / DESIGN / `CLAUDE.md` 与交付一致；`CLAUDE.md` 的架构节按 TD-011 后的形状改写）
- [ ] tag
- [ ] 生产部署 + 核对 served SHA
- [ ] 上线后：`BASE_URL=https://www.antelacus.com RUNTIME_DB=1 npm run test:runtime` 全绿
- [ ] 上线后：后台发布一篇测试 post / project / gallery 项，随即可见，再撤下（TD-001 的真实输入）
- [ ] 上线后：备份实际跑一次，把导出恢复进一个空的测试项目、站点能读出内容（TD-003）；让 keepalive 停跑一个周期，死人开关的告警到达（TD-013）
- [ ] 各门读数：运行次数 / 改变了输出的拦截次数——含文档预算检查：v2.2.0 定下的退役触发是「v2.3.0 整版仍为 0 次拦截则改为只在关版时跑」
- [ ] 文档预算为绿 · 记忆修剪（v2.2.0 提请晋升的「按前缀匹配代替按段匹配」教训：核实是否已写入通用记忆）
- [ ] **关版（最后一项）**：未了事项各归其位 → `git mv TRACK.md TRACK_v2.3.0.md`

## 四、Session-end pickup
