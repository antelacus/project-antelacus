# TRACK — visual-upgrade v2.4.0

## 一、范围与裁定

- 模式：standard · 目标：不同访客（视觉障碍、肢体障碍、前庭敏感、iPad / Android 触屏、纯键盘）都能使用网站全部功能，并在此约束之内按新论文《临湖》升级美学。
- 范围：
  1. 无障碍：公开页面与后台 `/admin` 以 WCAG 2.2 AA 为标准；先做基线审计，审计结论写进 REQ 作为美学的约束。验证深度：axe 自动检查入闸门且 0 违例；键盘走核心任务（读文章、搜索、看相册、切语言；后台加「写一篇并发布」）；Jason 的 iPhone / iPad 真机走同样任务；后台另做逐页人工审计（登录、总览、列表、编辑器四个页面模板）
  2. 美学升级：论文重写为《临湖》（`docs/aesthetic-thesis.md`），公开页面按它重做
  3. TD-019：关于页进数据库、改 Markdown（按语言多份，回退「请求语言 → 英文 → 任意」），`next-mdx-remote` 随之移除
  4. TD-020：删除 `eslint.config.mjs` 对三条 React Compiler 规则的降级，改写中修掉余下违例
  5. `docs/aesthetic-thesis.md` 改写为可执行的设计规则（字体角色、间距档、拒绝清单、审查顺序），代码片段删除；Vercel `design.md` 作参照样本，不作规范
  6. routing-slimdown REQ §6「外观与 `<head>` 不变」及其验收 §6-a 在本版正式退役（v2.3.0 已裁定）
- 明确不做：
  - 暗色模式：只有一种纸
  - 逐条人工核对全部成功准则；多套读屏软件（NVDA / TalkBack / VoiceOver）逐一测试
  - 减少动画（SC 2.3.3，AAA）
  - 按语言分别撰写的内容（内容仍是单一来源，关于页除外，见范围 3）
  - 路由、缓存、发布流程的结构改动——本版改外观与交互，不改数据流
- 全局约束（约束所有批次）：
  - 公开页面保持可缓存：规则在项目 `CLAUDE.md`「Routing and languages」，证据是运行中服务器的响应头
  - CSP 为「同源 + 内联」（content-publishing DESIGN §2）：新字体、脚本、样式一律自托管（`next/font`），不引外部 CDN
  - 缩放不得被禁：`src/app/site-metadata.ts` 的 `viewport` 保持允许缩放（WCAG 1.4.4）
  - The Floor：审计截图只落会话 scratchpad，不进仓库；后台页面的截图可能含未发布草稿，不外发
- 裁定（一行一条，只记「批了什么」）：
  - 2026-09-23 · 无障碍与美学合为一个版本，先无障碍审计、后美学设计 · Jason · 级联：本 TRACK 范围
  - 2026-09-23 · 无障碍标准为 WCAG 2.2 AA 全量 · Jason · 级联：REQ（待开）
  - 2026-09-23 · 收窄上一条：以 AA 为标准，验证深度按范围 1 所列，不做逐条人工审计与多读屏测试 · Jason · 级联：本 TRACK 范围 1、明确不做
  - 2026-09-23 · 后台做逐页人工审计（推翻上一条中的「后台只做 axe + 键盘」）· Jason · 级联：本 TRACK 范围 1、明确不做
  - 2026-09-23 · 后台 `/admin` 纳入 AA 范围 · Jason · 级联：本 TRACK 范围 1、REQ（待开）
  - 2026-09-23 · 不做暗色模式 · Jason · 级联：本 TRACK 明确不做
  - 2026-09-23 · Vercel `design.md` 作参照样本不作规范；`aesthetic-thesis.md` 本版改写为可执行设计规则 · Jason · 级联：本 TRACK 范围 5
  - 2026-09-23 · 美学立场：古典中国内核、现代形式，内核放在结构里而非表面，元素只是载体；取转译不取摹形（似与不似之间）；核心检验为「指认测试」——访客能指着某一元素说「这是中国的部分」即失败 · Jason · 级联：`aesthetic-thesis.md`（待改写）
  - 2026-09-23 · 结构借鉴：计白当黑；手卷的分段（引首 / 画心 / 尾纸），内容静止、不做随滚动显现；元数据集中于文末尾纸，开头只留日期；印章落在文末；不做「后记随时间生长」· Jason · 级联：同上
  - 2026-09-23 · 首页任务是「这个人在写什么」；框景取最新内容、少于现有六项、不加「精选」类标注；传统色（朱砂、墨、宣纸、苔）保留 · Jason · 级联：同上
  - 2026-09-23 · 修正上一条：首页任务改为「这是一个什么样的人」，框景四类内容都放、数量减少 · Jason · 级联：同上
  - 2026-09-23 · 印章抽象为朱砂方块终止符（摆正、静止、无悬停）：首页名字旁与文末各一，全站唯一形态，指认测试无例外；首页之门为名字 + 格言 + 终止符，完全静止、无石刻阴影与逐字动画 · Jason · 级联：同上
  - 2026-09-23 · 格言中文释义沿用「临湖之前，心境平和」；首页只放拉丁文，释义放关于页；格言标 `lang="la"`；框景先试每类一项（共四扇），数量待构图时再议 · Jason · 级联：同上
  - 2026-09-23 · 材料层：Cormorant Garamond 只用于门（名字、格言）；标题与正文用 Source Serif 4 + 思源宋体；中文正文按中文排版习惯（行距约 1.9、两端对齐、一行约三十六字）；深度纯平，无阴影无上浮；苔 = 回应（悬停、选中），石 = 结构（代码块、引用块）；删除宣纸纹理 · Jason · 级联：同上
  - 2026-09-23 · 动效层：朱砂只属于作者（全站红色仅终止符），读者交互用墨与苔，焦点环用墨、选中态用墨底反白；动效只能回应读者的动作，页面自己从不动（无入场、无循环、无回弹）；悬停为纸→苔与标题墨色加深一步完成约 0.25 秒；页面切换为约 0.15 秒淡入淡出，浏览器不支持则直接切换；顶部导航静止、不固定、不自动隐藏 · Jason · 级联：同上
  - 2026-09-23 · 首页构图取「一窗主景」：最新视觉作品为大窗，专栏、闪念、实验室三扇文字窗在侧（Claude Design 画布方案 B）；文章与项目封面不上首页与列表页，只在文章页引首出现 · Jason · 级联：同上
  - 2026-09-23 · 三种页面三种形态：首页是门与窗，列表页是目录（视觉列表为照片网格例外），文章页是手卷；删去旧论文开篇的两对二元，只留「古典内核、现代形式」一个立场 · Jason · 级联：同上
  - 2026-09-23 · 长文目录放在引首之后、默认折叠（原生 `<details>`），不再放在功能菜单；美学更名「临湖」（英文 Ante Lacus），取书法「临而不摹」之义 · Jason · 级联：同上
  - 2026-09-23 · 新论文《临湖》定稿，含起草时补入的七处（三原则并入正文、悬停不藏信息、触屏按下反馈、照片细墨框、拒绝清单增项、审查顺序、格言一节）· Jason · 级联：`docs/aesthetic-thesis.md`
  - 2026-09-23 · REQ 定稿，Phase 1 关闭：目录门槛为 3 个及以上二级标题；闸门每次临时拉起 Docker 数据库并填入合成内容，查完即删，后台审计共用此环境 · Jason · 级联：REQ §5.2、§5.5
  - 2026-09-23 · Phase 2 三刀：关于页存新表（每行 = 页面 × 语言），不进 `content_items`（推翻 v2.3.0「作 `page` 类型进 `content_items`」：该法须加不可删的枚举值并放宽同类型 slug 唯一约束）；公开组件按三种形态重切（窗、目录行、照片格），服务端渲染、悬停交给 CSS、功能菜单删除、目录由渲染器生成、样式回 `globals.css`；闸门新增任务：本地 Supabase CLI 四服务 + 合成种子 + Playwright（作库，跑在 node:test 下）+ axe，另有同流程本地脚本 · Jason · 级联：DESIGN（待写）
  - 2026-09-23 · Codex 设计门处置：MUST 全修，SHOULD 全采纳（SHOULD-1 不做焦点遮挡检查、SHOULD-10 只扩到状态与首载），Jason 对处置表未提异议；窗与目录行显示写作语言；关于页编辑器纯文字、不上传图片；关于页五种语言的正文由 Claude 改写（删过时描述、加格言释义），Jason 审 · Jason · 级联：DESIGN §2、§4；REQ §5.1-i、§5.3、§7

## 二、批次

验收测试已写红：`tests/acceptance-visual-upgrade.test.ts`（单元）与 `tests/ui/*.ui.mjs`（浏览器），每条 `todo` 标着它的批次；批次完成 = 它名下的标记去掉且全绿。切分已随 Codex 设计门的处置定稿。

### Batch 1 — 界面闸门
- 状态：done（`d56ce65`，CI 35874205263）
- 范围：`supabase/config.toml`、`supabase/seed.sql`、`scripts/ui-check.sh`、`tests/ui/harness.mjs` 与 `manifest.mjs`、`next.config.ts`（`distDir` 可覆盖）、`tests/runtime/` 有库断言移入、`package.json`（playwright、@axe-core/playwright、`test:ui`）、`check.yml` 任务 `ui`、`deploy.yml` 等它 · 覆盖 REQ §5.5
- 验收判据：§5.5-a 去 todo；本机 `scripts/ui-check.sh` 跑通且拆干净；每次运行植入的无名按钮在四种环境里都被 axe 报出；其余 UI 测试此时照常为 todo。§5.5-b 的分支实验移到 Batch 6（待 Jason 确认）：§5.1-a 在那之前是 todo，源码里的违例让闸门变红无从发生
- 依赖：none

### Batch 2 — 关于页进库
- 状态：done——正文 Jason 已审；两条迁移 2026-09-24 已在 Supabase 执行；核对查询的结果待 Jason 回报（合并前）
- 范围：两条迁移（表、改写后的五份正文）、`db-function-check.sh` 角色检查、`sitemap-entries.ts`、`pages-repo.ts`、`pages.ts`、`page-locale.ts`、`about/page.tsx`、`/admin/pages/**`；删 `src/content/pages/`、`next-mdx-remote`、`gray-matter` · 覆盖 REQ §5.3
- 验收判据：§5.3-a/b/c 去 todo；上线前在 Supabase 执行迁移并跑核对查询；Jason 审中英文正文；`db-function-check.sh` 仍绿
- 依赖：Batch 1

### Batch 3 — 材料与三种形态
- 状态：代码完成、闸门绿；待 Jason 看首页与一个列表页（截图已发，`UI_SERVE=1 npm run test:ui` 可本机亲看）
- 范围：`globals.css` 重写（变量、排印、中文排印、形态类）、`Gate`、`Window`、`CatalogRow`、`PhotoTile`、`EndMark`、`SiteLink`、`entry.ts`、相册与项目映射带 `lang`、搜索索引带 `lang`、`home.ts`；首页、列表页、标签页、视觉列表 · 覆盖 REQ §5.1-d、§5.2-a/c/d/f/g
- 验收判据：上列 §-id 去 todo 且绿；Jason 在本地看首页与一个列表页
- 依赖：Batch 1
- 执行中的调整：§5.2-a/c/d 对全部页面判定，旧导航与详情页因此须先无朱砂、无 Cormorant、无阴影——`SkipLink` 提前在本批重写（原属 Batch 5），旧 `Nav` 只做机械替换（Batch 5 整体重写）；搜索、查看器、目录三个状态的入口尚未建成，清单标 `pending`（Batch 4/5），入口缺失时跳过并在对账输出列出

### Batch 4 — 手卷
- 状态：done（查看器上一张 / 下一张按钮已在触屏 WebKit 截图中确认）
- 范围：`markdown/`（标题 id、`extractToc`）、`Toc`、`Colophon`、四种详情页与关于页的引首与尾纸、正文容器 `lang`、面包屑结构化数据、`PhotoViewer` 与其样式覆盖 · 覆盖 REQ §5.2-h、§5.1-c（相册）
- 验收判据：上列 §-id 去 todo 且绿；查看器有上一张 / 下一张按钮
- 依赖：Batch 3
- 执行中的调整：项目页引首不再显示状态与星数（论文：引首只有日期、标题、导语与封面），源码与演示链接移入尾纸；查看器去掉自制的信息浮层（地点、时间已在页面上）与打开 / 关闭动画（动画期间按键被忽略，Esc 会丢）；`TagList` 已无使用者，提前删除

### Batch 5 — 导航、搜索、语言、页面切换
- 状态：open
- 范围：`Nav`、`NavLinks`、`SearchDialog`、`search-filter.ts`、`LanguageSwitch`、`SkipLink`、`<ViewTransition>`（关闭 D-1）；删 `UtilityDropdown`、`SearchModal`、`TagList`、四张旧卡片 · 覆盖 REQ §5.1-c/e/g、§5.2-b/e
- 验收判据：上列 §-id 去 todo 且绿
- 依赖：Batch 4

### Batch 6 — 收口
- 状态：open
- 范围：可访问名称全部走文案、404 与错误页、后台四模板的 AA 修正、`eslint.config.mjs` 去降级、退役 §6-a 与 `head-baseline.json`、`globals.css` 残余清理 · 覆盖 REQ §5.1-a/b/f/i、§5.4-a
- 验收判据：全部 todo 去除且绿；后台逐页人工审计记录写进第三区；§5.5-b 在临时分支上造一个无名按钮，闸门红（记运行号）后删分支
- 依赖：Batch 5

### 基线审计的余项
每条基线发现都已成为 REQ §5.1 / §5.2 的验收判据（发现全文在提交 `cd700d3` 的本文件里）。判据之外还剩：
- 2.5.7：查看器须显示上一张 / 下一张按钮 → Batch 4 验收时人工确认
- 1.4.12 文字间距、zh-TW / es / fr 页面、图上文字对比度：基线未查，Batch 6 用界面闸门补查
- iOS 真机：首页卡片点一次即进入（已验，无需处理）

## 三、门与发布

**评审发现登记**（Codex 设计门，xhigh，DESIGN + REQ；全文 `codex resume 01a0cdaf-3b88-7542-b16b-b37c6e0c2a38`；引文已逐条对源核实）：
- MUST-1 `node --test tests/ui/` 不发现 `*.ui.mjs`，空跑可能通过 —— status: fixed `8ef2e28`（DESIGN）
- MUST-2 「页面数非零」不证明覆盖矩阵；种子未保证标签与项目封面；§5.5-b 无流程 —— status: fixed `8ef2e28`（DESIGN）
- MUST-3 关于页数据迁移把真实内容带进合成库，回退判据失效；`save_content_item` 写不了 `site_pages` —— status: fixed `8ef2e28`（DESIGN）
- MUST-4 删除计划漏了三个消费者：`check.yml` 读 `head-baseline.json`、无库运行时套件要 `/about` 返回 200、CLAUDE.md 点名 `SearchModal` —— status: fixed `8ef2e28`（DESIGN）
- MUST-5 语言链接的 `next` 若为当前路径，会写入新语言却回到旧语言 —— status: fixed `8ef2e28`（DESIGN）
- MUST-6 写作语言没有贯通：相册与项目的映射丢了 `locale`，搜索索引缺 `lang`；窗与目录行未显示语言 —— status: fixed `8ef2e28`（DESIGN）
- MUST-7 REQ §7 仍写「存于既有内容表」；`updateTag('pages')` 违反继承的不变量 17 —— status: fixed `8ef2e28`（DESIGN）
- MUST-8 §5.3-b「下一次访问即新」没有决定性的测试 —— status: fixed `8ef2e28`（DESIGN）
- MUST-9 搜索的加载、失败、无结果没有状态播报（4.1.3）—— status: fixed `8ef2e28`（DESIGN）
- MUST-10 PhotoSwipe 自带样式在触屏隐藏箭头、有文字阴影与无限转圈 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-1 缺 200% 放大、平板、文字间距（1.4.12）、焦点遮挡的检查 —— status: fixed `8ef2e28`（DESIGN），焦点遮挡检查不做：导航静止后无固定元素
- SHOULD-2 本机地址不等于本地后端：须断言后端来自新起的栈 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-3 拆除的归属：独立项目 id、只关自己启动的 colima、保留原失败码 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-4 `site_pages` 的 `updated_at`、语言校验、授权与角色测试 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-5 数据迁移须先于部署执行并核对五份齐全，再删仓库文件 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-6 正文里的 `#` 会造成第二个 `h1`、跳级；目录 id 须唯一 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-7 目录行等共享组件需要统一的呈现类型与适配器；标题与标签链接不可嵌套 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-8 面包屑 JSON-LD 的去留；关于页全撤回时 sitemap 仍列出它 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-9 对话框需可见的关闭按钮、背景点击判定、查看器焦点回到所点照片 —— status: fixed `8ef2e28`（DESIGN）
- SHOULD-10 朱砂与动效检查要覆盖悬停、聚焦、展开等状态与首载瞬间 —— status: fixed `8ef2e28`（DESIGN），只扩到悬停、聚焦、展开、对话框各状态与首载
- SHOULD-11 关于页编辑器复用 `MarkdownEditor` 时上传接口不认 `page` —— status: fixed `8ef2e28`（DESIGN）
- NICE-1 关于页原文描述了已删除的功能菜单与旧美学 —— status: fixed `8ef2e28`（Batch 2 改写，Jason 审）

**Batch 证据**：
- Batch 1：本机 `scripts/ui-check.sh` 退出 0——axe 判定静止组合 56/56，植入按钮四环境皆报出，有库运行时套件 23/23；colima、栈、应用均已拆除。浏览器检查约 83 秒。CI：运行 35874205263，`check` 与 `ui` 皆绿，`ui` 同样 56/56、23/23
- Batch 4：§5.1-c（相册）、§5.2-h 去 todo 且绿，查看器与目录两个状态不再 pending；不变量 20 单元测试入库；本机界面闸门 axe 静止 56/56、有库运行时 23/23；单元 89 过。CI：（待填）
- Batch 3：§5.1-d、§5.2-a/c/d/f/g 去 todo 且绿；本机界面闸门 axe 静止 56/56、有库运行时 23/23；单元 85 过。修正：闸门构建前清空 `.next-ui`（其中的 Turbopack 构建缓存曾让一次运行判定了上一次的 CSS）。320px 横向溢出 15px 全部来自旧导航，归 Batch 5（§5.1-e）。CI：运行 35939295184，`check` 与 `ui` 皆绿
- Batch 2：§5.3-a、§5.3-b、§5.3-c 去 todo 且绿；本机界面闸门 axe 56/56、有库运行时套件 23/23；`db-function-check.sh` 全过（含 `site_pages` 角色与迁移重跑保留后台修改）。CI：运行 35878664909，`check` 与 `ui` 皆绿

**Phase 4 证据**：（Phase 4 起）

**Phase 6 boxes**：Phase 4 收尾时写入。

## 四、Session-end pickup

### Session-end pickup (2026-09-23)

**Working tree state at session close**:
- Branch: `feat/visual-upgrade`（已推送）。HEAD（本 `/pause` 提交的父提交）：`1fca3ef`（TRACK 第一区措辞随《临湖》更名）
- Working tree: clean

**Where work stands**:
- Phase 0–2：✅ done。Phase 1 产出 `docs/aesthetic-thesis.md`（《临湖》）与 REQ；Phase 2 产出 DESIGN，Codex 设计门 10 MUST / 11 SHOULD / 1 NICE 全部在 DESIGN 中处置（第三区登记）；验收测试已写红（第二区开头）
- Phase 3：🔲 未开始 —— 当前批次 Batch 1（界面闸门），范围与判据见第二区
- 会话 scratchpad 里有 Phase 2 实测留下的草稿（本地栈 `config.toml`、`seed.sql`、`pw/a11y.mjs`、基线审计 `a11y/audit.mjs`），随会话消失，不可依赖；实测得到的约束已写进 DESIGN §3

**Test / lint state**: `npm test` 76 条：71 过、0 败、5 todo；`tsc` 净；lint 0 错误 31 警告（TD-020 的降级规则与几处未用 import，Batch 6 清）

**Reconciliation (对账)**: 本会话无上一份 pickup（v2.4.0 首个会话）。

**First action for next session**: 开 Batch 1——按 DESIGN §2.5 写 `supabase/config.toml`（项目 id、只开 db/auth/rest/kong、`[realtime] enabled=false`、`[storage]` 开启）与 `supabase/seed.sql`，再写 `scripts/ui-check.sh` 与 `tests/ui/harness.mjs`、`manifest.mjs`（API 以 `tests/ui/*.ui.mjs` 里的调用为准：`visit`、`visitAdmin`、`axe`、`anonymousHtml`、`TEMPLATES`、`ADMIN_TEMPLATES`、`CONTEXTS`、`SEED`、`BASE`）；本机跑通后接 `check.yml` 任务 `ui`。

**Decisions awaiting Project Lead**:
1. 无阻塞项。Jason 对 Codex 处置表未逐条表态，按「无异议」记入裁定；他可随时推翻其中任一条。

**Reference state** (verify before relying on):
- Relevant memory items: `feedback-aesthetic-consulting.md` —— 审美问题以顾问式对话、真实内容的对照图来谈；`feedback-push-without-asking.md` —— 推送无须确认
- Suite size at the last green run: 71 passed（5 todo）
- 外部状态：colima 已停，本地栈镜像约 3.4 GB 缓存在 colima 磁盘里（Jason 可要求清理）；Claude artifacts：字体对照页 https://claude.ai/artifact/MZUWx8i4xDDwGronL6755P、首页构图画布 https://claude.ai/artifact/3ZRrUNaYaA2wAMD6Dy36m2（Batch 3 的构图参照为其方案 B）；Supabase CLI 实测版本 2.117.0（Batch 1 钉版本前再核）
