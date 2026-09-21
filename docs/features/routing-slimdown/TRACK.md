# TRACK — routing-slimdown v2.2.0

## 一、范围与裁定

- 模式：standard · 目标：让语言路由真正生效、让公开页面可以被缓存，并删掉不再起作用的代码和检查，使每次改动都有自动闸门把关。
- 范围（条目编号 = `docs/TECHNICAL_DEBT.md`）：
  1. TD-009 部署前的 CI 闸门（lint、类型检查、测试、文档预算）——第一批做，此后每批都在闸门之下
  2. TD-016 中 `src/i18n/detect.ts` 两个纯函数的测试——改中间件之前先有保护
  3. TD-007 启用中间件（含：排除 OG 图片路由、不支持的语言前缀返回 404、删除 8 个重定向空壳页）
  4. TD-008 公开页面可缓存（`<html lang>` 的来源从 cookie 改为路由参数）
  5. TD-010 死代码、证明不了任何事的脚本、无人使用的依赖
  6. TD-015 `CLAUDE.md` 与现实对齐（含文档命名改为现行约定）
- 明确不做：
  - TD-006（数据库内容当代码执行）、TD-012（错误页与软 404）、TD-014（小项加固）→ v2.3.0
  - TD-011（四种内容类型的重复）→ 本版删完死代码后再评估，暂接受
  - TD-013、TD-003（告警无人读、无备份）→ 单独的运维版本
  - TD-005 余下五个需要跨大版本升级的依赖问题（其中 `next-intl`、`sharp` 的小升级若顺手可带，不为此开批次）
  - Next 16 升级
- 全局约束：
  - 版本地板 / 依赖：Node 版本以 `Dockerfile` 的基础镜像为准；`next` 钉在 15.5.25
  - 不得漂移的精确值：支持的语言集合以 `src/i18n/routing.ts` 为唯一来源；规范域名 `https://www.antelacus.com`
  - The Floor：本仓库无真实业务数据；`.env` 只在 VPS 上，本地没有，也不得进入提交或 PR 描述
- 裁定：
  - 2026-09-21 · 中间件选「启用」而非「删除」（保留按浏览器语言自动跳转）· Jason · 级联：TD-007
  - 2026-09-21 · 十二条扫描发现按上面「范围 / 明确不做」分入 v2.2.0、v2.3.0、接受三组 · Jason · 级联：TECHNICAL_DEBT
  - 2026-09-21 · 记住访客手动选择的语言（仅手动切换时记）· Jason · 级联：REQ §5.2 规则 2、7
  - 2026-09-21 · 后台发布立即可见；直接改库的仍最长一小时 · Jason · 级联：REQ §5.3
  - 2026-09-21 · 离线支持整体移除，`/sw.js` 换成自注销脚本长期保留 · Jason · 级联：REQ §5.4
  - 2026-09-21 · Codex 设计门十一条发现：十条采纳、SHOULD-1 驳回 · Jason · 级联：DESIGN 全篇
  - 2026-09-21 · REQ 增加「外观与 `<head>` 不变」一条要求（由 MUST-5 引出）· Jason · 级联：REQ §6
  - 2026-09-21 · `development` 分支退役：本版的 PR 直接合入 `main`，关版时删除该分支并改 `CLAUDE.md` 的分支约定 · Jason · 级联：REQ §5.5、Phase 6 boxes
  - 2026-09-21 · §6-a 多出的导航图片预加载（`link rel=preload as=image`）接受为允许的差异 · Jason · 级联：REQ §6、`tests/runtime/acceptance.runtime.mjs`
  - 2026-09-21 · 404 由 `route-decision` 判定（新增「不存在」结论），页面用 `global-not-found`：站点外壳、英文、无导航；文案采用默认稿 · Jason · 级联：DESIGN §2、§4、§6、§8，REQ §5.2 规则 4
  - 2026-09-21 · SkipLink 文案随页面语言（`utility.skip_to_content`）· Jason · 级联：`src/messages/*.json`

**Phase 0 记录**

- 反馈收件箱：N/A —— 本项目没有 `docs/FEEDBACK.md`，个人站点无外部使用者反馈渠道。
- 债务册复读：TD-001…TD-016 已读；TD-001…TD-004 为既有条目，本版不涉及。
- 工具包：已装（`scripts/check_doc_budget.py`、`.githooks/post-merge`），`core.hooksPath=.githooks`。非空转证明（在 `6e96dbf` 上）：装好即绿 → 往本文件放入一条 11 行的批次条目，检查器退出码 1 并指出行号 → `git checkout` 复原后回绿；工具包自带 13 个测试通过；钩子报出本文件 9 个未勾方框。接入 CI 属于第 1 批。
- 本版要碰的外部系统（其硬约束在 Phase 2 写入 DESIGN 的「外部系统约束」一节，此处只列清单）：
  - Next.js 对 `middleware.ts` 位置的要求（应用在 `src/app` 下时必须与之同级）
  - 访客浏览器里已安装的 Service Worker（`public/sw.js` 以一年不可变缓存下发；删除它需要一个会自我注销的版本）
  - Cloudflare（默认不缓存 HTML；页面变为可缓存后实际行为需实测）
  - nginx（`proxy_buffering off`；源站只接受 Cloudflare 的 IP）
  - VPS 上的 Docker 构建（构建期需要 Supabase 可达——sitemap 预渲染）
  - GitHub Actions（`ubuntu-latest` 将迁移到 Ubuntu 26；部署用户名与密钥同值，日志里 `deploy` 字样会被打码）

## 二、批次

验收测试已写红（`2ae10fb`）：`npm test` 里 17 个 `todo`，按批次转正——某批完成 = 去掉它名下测试的 `todo` 标记且全绿；`npm run test:runtime` 需要一个运行中的服务。关版条件之一：`todo 0`。

### Batch 1 — 部署闸门
- 状态：done `dac7cc0`
- 范围：`.github/workflows/check.yml`（新，可被调用：lint、`tsc`、`npm test`、文档预算 + 工具包测试）、`.github/workflows/deploy.yml`（`check` 任务调用它并声明 `contents: read`，`deploy` 任务 `needs: check`）· 覆盖 REQ §5.1
- 验收判据：§5.1-a 一个带类型错误的临时 PR，其闸门运行为红；§5.1-b `deploy.yml` 里 `deploy` 依赖 `check`，且本批的 PR 运行里闸门为绿
- 依赖：none
- 备注：构建、中间件清单断言、运行时验收这三步在 Batch 3 加入闸门——在那之前它们必然为红
- 证据：绿——运行 35565503630（32 个测试：15 过、17 todo；预算 4 份；工具包 13 个测试）；红——临时 PR #3 的运行 35565619395 停在 `tsc`，报出故意放入的类型错误，后续步骤跳过，PR 已关闭、分支已删。`deploy` 对 `check` 的依赖由解析 `deploy.yml` 得到；它在 `main` 上的第一次真实运行发生在本版合并时

### Batch 2 — 路由规则（纯函数）
- 状态：done `740c787`
- 范围：`src/i18n/routing.ts`（加公开栏目清单）、`src/i18n/detect.ts`（`mapLanguageTag` 按主标签匹配）、`src/i18n/route-decision.ts`（新）· 覆盖 REQ §5.2 规则 1–4、7
- 验收判据：`tests/acceptance-locale-route.test.ts` 七条与 `invariant 4` 去掉 `todo` 后全绿；严格 TDD，一次一条
- 证据：八个 `todo` 转正（`npm test`：23 过、0 败、9 todo）；§5.2-d、§5.2-g 去掉标记即绿，已用变异补证——改回按前缀匹配则 d、e 红，去掉栏目清单则 b、g 红
- 依赖：Batch 1

### Batch 3 — 中间件与根布局搬迁
- 状态：done `de54775`（另有 `01cefea`：`/og.png` 的印章由文字改为色块——字体里没有该字形，分享图上原是缺字方框）
- 范围：`src/middleware.ts`（移入并改为薄壳，排除 `og.png` 后缀）；`src/app/site-metadata.ts`、`src/components/SiteDocument.tsx`（新）；`src/app/[locale]/layout.tsx`、`src/app/admin/layout.tsx` 成为根布局；详情页实现搬入 `[locale]`，全部页面 `setRequestLocale`，详情页 `generateStaticParams` 返回空；删除顶层布局、顶层 not-found、重定向空壳；`src/app/sitemap.ts` → `src/lib/sitemap-entries.ts`；八处写死的语言列表改读 `routing.ts`；闸门加入构建 + 清单断言 + 运行时验收（本地子集）· 覆盖 REQ §5.2、§5.3-a、§6-a
- 验收判据：`invariant 2a / 2b / 3` 转正；对本地构建的服务 `npm run test:runtime` 全绿（不读数据库的子集）；闸门里构建在假环境变量下完成且清单含中间件入口
- 依赖：Batch 2
- 证据（CI）：闸门运行 35571620126 为绿，新加的构建、清单断言、运行时验收三步首次在 GitHub 上执行；日志计数与本地一致（单元 32：26 过、6 todo；运行时 12：11 过、1 todo）
- 证据（本地，假环境变量，删 `.next` 后构建 → `next start`）：`npm test` 26 过、0 败、6 todo（`invariant 2a / 2b / 3` 由红转绿）；构建无数据库完成，清单入口 `["/"]`；运行时 12 条：11 过、1 todo（§5.4-c，Batch 5）；§6-a 在裁定后转绿（两页 28、35 项全同）；`/essays` 等五个地址 404 且不再需要数据库；20 个垃圾地址不留缓存、不读库（实验中测得）。§5.3-a 先红后绿：`/en/about` 由 `no-store` 变为 `s-maxage` + `HIT`，`/admin/login` 为 `no-store`
- 设计未预见、已按实测处理（见 DESIGN §8）：`loading.tsx` 移入 `[locale]`；`[locale]` 布局导出空的 `generateStaticParams`；`UtilityDropdown` 去掉 `useSearchParams`
- `locales` 的顺序改为语言菜单的顺序（`es` 在 `fr` 前），菜单外观不变

### Batch 4 — 新鲜度与语言记忆
- 状态：done `11d070b`
- 范围：`src/app/admin/(protected)/notes/actions.ts`（保存后 `revalidateTag('notes')`）、`src/lib/{posts,notes,gallery,projects}.ts`（详情缓存 7200 → 3600）、`src/components/UtilityDropdown.tsx`（手动切换时写 `preferred_locale`）· 覆盖 REQ §5.3-b、§5.2 规则 7
- 与开批时的设想不同：保存动作原本就经 `src/lib/server/note-revalidation.ts` 使 `notes` 标签失效，另带二十余条按路径的失效（其中数条指向已不存在的页面）。读笔记的页面都经该标签取数，故只留标签失效、内联进动作，辅助文件删除
- 证据：`acceptance §5.3-b`、`§5.3 detail data` 转正（`npm test` 28 过、0 败、4 todo）；闸门运行 35572362235 为绿，计数与本地一致
- 证据（浏览器，本地构建，`Accept-Language: en-US`）：打开 `/fr/about?ref=keepme` 不产生 cookie → 菜单切到简体：地址 `/zh-CN/about?ref=keepme`（查询串保留），cookie `preferred_locale=zh-CN`、`Path=/`、`Secure`、`Lax`、365 天 → 访问 `/about` 落在 `/zh-CN/about` → 直接打开 `/fr/about` 仍为法语。用 `/about` 代替 `/`：本地首页读不了库
- 未验证（只能上线后做）：REQ §5.3-b 的实测——发布一篇测试笔记，随即访问其详情页与笔记列表
- 依赖：Batch 3

### Batch 5 — 瘦身与文档对齐
- 状态：done `5d7a163`（27 个文件，+85 / −1859）
- 范围：删除 `tests/acceptance-slimdown.test.ts` 的 `REMOVED_FILES` 所列文件、五个 `npm` 脚本、依赖 `ts-node`/`image-size`/`next-tweet`、`src/lib/tags.ts` 的四个无人调用的导出；`public/sw.js` 换成自注销脚本；删 `next.config.ts` 的 `.css|.js` 缓存规则；重写 `CLAUDE.md`；核对 README · 覆盖 REQ §5.4、§5.5
- 删前核对（按导入关系）：15 个文件里 10 个无人导入；`PerformanceMonitor` 由 `SiteDocument` 挂载（已摘除）；四个 `Client*Card` 由首页使用，是纯转手，首页改用原组件
- 证据：`npm test` 32 过、**todo 0**；运行时 12 过、todo 0；闸门运行 35572995773 为绿，计数一致。`/sw.js` 响应头 `public, max-age=0`，构建产物中无注册 Service Worker 的代码。`tests/claude-md.test.ts` 经变异证明能红（塞入假路径即红，按哈希原样复原）
- 证据（浏览器）：预置缓存 `living-manuscript-v1` 后注册 `/sw.js` → 缓存清空、注册消失。这是全新安装的路径；**覆盖旧脚本的路径只能上线后验**（用一个装过旧 Service Worker 的浏览器）
- README：数据流、标签、搜索、路由、分支五处按现状改写；图片目录一节核对属实
- 候选，待 Jason 裁定：`SiteDocument` 里两条手写的字体预加载（`/fonts/*.woff2`）指向不存在的文件，线上同为 404；字体实际由 `next/font` 自托管并自带预加载。删除会改 `<head>`，需在 REQ §6 增一条允许的差异
- 本版之外、待 Jason 定去向：`docs/content-publishing.md` 整篇仍是 MDX 时代的发布流程；`public/images/og-image.svg` 的生成脚本已删，仅 `docs/site-operating.md` 还提到它；各 `og.png` 以一年不可变缓存下发，上线后 `/og.png` 需在 Cloudflare 清一次缓存，修好的印章才看得到
- 依赖：Batch 3

## 三、门与发布

**评审发现登记**（评审返回即原样登记，处置由 Jason 裁）

Codex 设计门（只读，xhigh，会话 `01a0c1f8-39fd-7ed1-b987-c8eaf35c8267`；评审对象 = `c7c1c8c` 的 DESIGN 与 REQ）：
- MUST-1：公开页面树仍因 `next-intl` 的 Provider 读请求头而保持动态，§5.3-a 不成立 —— status: 采纳 → 已改 DESIGN
- MUST-2：`decideLocaleRoute` 把未知的普通路径 308 走，而 REQ 规则 4 要求对原请求直接 404 —— status: 采纳 → 已改 DESIGN
- MUST-3：两份 `/sitemap.xml` 定义并存，`sitemap.ts` 才是生效的一份且在构建期访问 Supabase，「构建不依赖 Supabase」不成立 —— status: 采纳 → 已改 DESIGN
- MUST-4：笔记详情的数据缓存是 7200 秒，违反「直接改库最长一小时生效」 —— status: 采纳 → 已改 DESIGN
- MUST-5：删除顶层根布局后，metadata、viewport、全局 CSS、字体、公共外壳没有保全契约 —— status: 采纳 → 已改 DESIGN
- MUST-6：可复用闸门没有真正接上（无 `needs`），且权限方案会让检出失败（被调用方不能提升调用方的空权限）—— status: 采纳 → 已改 DESIGN
- MUST-7：§5.5-a 在设计里没有对应物，`CLAUDE.md` 现状必然不过 —— status: 采纳 → 已改 DESIGN
- SHOULD-1：「根目录的 middleware 不被注册」这一前提对 Next 15.5 不成立 —— status: 驳回——实测相反，评审读到的是过期的 `.next`（见下方实测）
- SHOULD-2：「形如语言标签」的判法预留掉了许多将来可能的栏目名（`/rss`、`/cv`、`/faq`）—— status: 采纳 → 由 MUST-2 的栏目清单一并解决
- SHOULD-3：Service Worker 的 24 小时说法过强：那是更新检查的行为，不是 HTTP 缓存上限 —— status: 采纳 → 已改 DESIGN
- SHOULD-4：D-4（OG 路径不被重定向）仍待核，需对构建后的服务实测 —— status: 采纳 → 已改 DESIGN
- 评审同时确认成立：D-1（`notFound()` 给出 404）、D-2（静态页不带 `no-store`）、D-3（`revalidateTag` 波及用到该标签的页面；首页、列表、标签页、搜索、sitemap 都经 `notes` 标签读取）、路由处理器不需要根布局、`next-intl` 插件不要求顶层布局、公开 Supabase 客户端不读 cookie。

设计门后的实测（隔离工作树 `985cd5a`，假环境变量，`next build` 后 `next start`；`sitemap.ts` 改为普通模块以便构建跑完；只有关于页不读数据库，故以它为对象）：
- 中间件位置：除文件位置外完全相同的两次构建——在仓库根目录，清单入口为 `[]`；在 `src/`，为 `['/']` 且路由表出现 `ƒ Middleware`。⇒ SHOULD-1 不成立；评审读到的是工作树里一份 2025-12 的旧 `.next`（已删除）。
- 移入 `src/` 后中间件的现行代码：`/about`+`Accept-Language: fr` → 308 `/fr/about`；`/zh-tw/about` → 308 `/zh-HK/about`；**`/essays` → 308 `/es`**；**`/og.png` → 308 `/en/og.png`**。⇒ REQ §5.2 规则 3 的陷阱与 SHOULD-4（D-4）均为真。
- 静态化：根布局不读 cookie 后，构建的路由表把关于页标为 `●`，**但运行时它与首次访问生成的 `/fr/about` 的响应头都是 `no-store`**；在 `[locale]` 布局里加 `setRequestLocale(locale)` 后，二者都变为 `s-maxage=…`，首次 `MISS`、再次 `HIT`。⇒ MUST-1 成立；且**构建的路由表不能作为「可缓存」的证据，只有运行时的响应头可以**。
- 去掉 `sitemap.ts` 这个构建期路由后，构建在没有 Supabase 的情况下完成。⇒ MUST-3 的方向可行。

**Phase 4 证据**：尚无。

**Phase 6 boxes**：
- [ ] CHANGELOG 条目
- [ ] TECHNICAL_DEBT 定稿（已解决的删除，不留墓碑）
- [ ] README 仍然属实
- [ ] 常新文档扫尾（REQ / DESIGN / `CLAUDE.md` 与交付一致）
- [ ] tag
- [ ] 生产部署 + 核对 served SHA
- [ ] 各门读数：运行次数 / 改变了输出的拦截次数
- [ ] 文档预算为绿 · 记忆修剪
- [ ] `development` 分支删除（本地与远端）
- [ ] **关版（最后一项）**：未了事项各归其位 → `git mv TRACK.md TRACK_v2.2.0.md`

## 四、Session-end pickup

### Session-end pickup (2026-09-21)

**Working tree state at session close**:
- Branch: `feat/routing-slimdown`. HEAD (parent of the `/pause` commit landing this pickup): `075b047`（本 pickup 的初稿；其前 `94e0be5` 补了运行时验收的头注，`ef4f146` 把 Batch 2 记入 TRACK；代码侧最后一笔是 `740c787`）
- Working tree: clean；分支与 `origin` 一致

**Where work stands**:
- Phase 0–2 ✅；Phase 3 🔲 in-progress —— Batch 1、2 done，**当前批次：Batch 3**（尚未动手）。范围、裁定见第一区，批次与证据见第二区，不在此复述。
- Batch 3 是本版风险最大的一批（动每个页面的最外层）。动手前必读：第三区「设计门后的实测」四条——尤其「构建的路由表不是可缓存的证据」与「现行中间件代码移入 `src/` 后会把 `/essays`、`/og.png` 重定向」——以及 DESIGN §2、§4、§7、§8。
- 本地验证 Batch 3 的办法写在 `tests/runtime/acceptance.runtime.mjs` 头注里（假环境变量构建 → `next start` → `npm run test:runtime`）。不读数据库的页面只有关于页与后台登录页；其余页面的运行时验收只能在部署后对生产跑（`RUNTIME_DB=1`）。

**Test / lint state**: green —— `npm test` 32 个：23 过、0 败、9 `todo`（Batch 3–5 名下）；`tsc` 干净；lint 0 错误（8 个既有警告）；文档预算 4 份全绿；CI 闸门最近一次运行 35565842412 为绿。

**Reconciliation (对账)**: 本 TRACK 的第一份 pickup，无前一份可对。本会话散落的事项去向：
- 运行时验收的假环境变量配方 — ⌂ rehomed（`tests/runtime/acceptance.runtime.mjs` 头注）
- 工具包安装说明缺 `__pycache__/` 忽略项与非 Python 项目的 CI 写法 — ⌂ rehomed（dotfiles `templates/kit/INSTALL.md`，`fb46e44`）
- Codex：`task --help` 会被当成任务执行；xhigh 设计评审实耗 45 分钟；评审期间不得动工作树 — ⌂ rehomed（记忆 `reference_codex_plugin_usage`、`feedback_codex_rescue_is_thin_forwarder`）
- 「用 `todo` 标记让验收测试先红而闸门保持可用」这一做法是否写进 governor 的 Phase 2 — → carried（关版的记忆修剪/晋升时提请裁定）

**First action for next session**: 在 `feat/routing-slimdown` 上开始 Batch 3，第一步：`git mv middleware.ts src/middleware.ts`，把它改写成 DESIGN §2.2 的薄壳——排除名单含「以 `/og.png` 结尾的任何路径」；`/admin`、`/auth` → `updateSupabaseSession`；其余读 cookie `preferred_locale` 后执行 `decideLocaleRoute`，`redirect` 用 308 且保留查询串。随后按第二区 Batch 3 的范围继续；每一步后跑 `npm test && npx tsc --noEmit`，整批收尾时去掉 `invariant 2a / 2b / 3` 的 `todo`，并把构建 + 清单断言 + 运行时验收加进 `.github/workflows/check.yml`。

**Decisions awaiting Project Lead**: 无阻塞首个动作的事项。一件不属于本版、需要 Jason 本人去做的核查：在 Supabase 控制台确认已关闭开放注册或要求邮箱确认（`docs/TECHNICAL_DEBT.md` TD-014）。

**Reference state** (verify before relying on):
- Relevant memory items: `lesson-evidence-scope.md`、`lesson-checks-and-gates.md`（本版多次用到）；`shell-command-gotchas.md`（本机 zsh：通配、分词、`grep` 是 ugrep）
- Suite size at the last green run: 23 passed · 9 todo
- 线上为 `v2.1.4`（`a36453b`）；本分支尚未开版本 PR；`development` 分支按裁定在关版时删除，现与 `main` 一致

