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
  - 2026-09-24 · §5.5-b 的分支实验移到 Batch 6：§5.1-a 去 todo 之前，源码里的违例无从让闸门变红；此前由每次运行植入的无名按钮证明检查不空转 · Jason · 级联：本 TRACK Batch 1、Batch 6
  - 2026-09-24 · 搜索只保留一个输入框（标题、标签、摘要依次加权），删去类型、标签、年份、语言筛选器与三种排序；标签与类型由标签页与栏目承担 · Jason · 级联：DESIGN §2.2 SearchDialog
  - 2026-09-24 · Codex 发布前审查处置：P-1…P-5、P-3、C-1…C-11、C-13、C-19、C-20、C-S2 修；C-12、C-14…C-18、C-21、C-22 记为一条 TECHNICAL_DEBT；C-S1 接受（640 CSS 像素即 1280×200% 的重排检查标准做法）；修后对标题与搜索两个任务重跑 Codex · Jason · 级联：本 TRACK 第三区、TECHNICAL_DEBT、DESIGN §2.5
  - 2026-09-24 · 标题 id 不加前缀（Codex 复审 SHOULD：id 可成为 window 上的命名属性）予以接受：内容只由管理员撰写；命名属性不遮蔽 window 既有属性；站内脚本不读未声明的全局；目录链接保持可读 · Jason · 级联：`src/lib/markdown/headings.ts` 注释
  - 2026-09-24 · 搜索复审的 MUST 修复后不再重跑 Codex（新测试覆盖该情形；避免门→MUST→修→再门的无尽尾巴）；Codex 门至此关闭 · Jason · 级联：本 TRACK 第三区
  - 2026-09-24 · 真机检查后的设计调整：导航仍不跟随读者（不固定）；尾纸末行加「回到顶部 · 目录」，终止符移到这一行末尾；搜索加快捷键——Jason 定为 a（`/`）+ b，Claude 以 WCAG 2.1.4（单字符快捷键须可关闭或重映射，A 级）为由改用 ⌘K / Ctrl+K，Jason 确认 · Jason · 级联：论文「二」「五」、REQ §5.2、DESIGN §2.2
  - 2026-09-24 · 首页格言在各语言下都是拉丁文（此前误取各语言文案的译文，修复为常量） · Jason（重申既有裁定） · 级联：`Gate.tsx`、五份文案
  - 2026-09-24 · 首页终止符从名字旁移到格言右侧（推翻 2026-09-23「首页名字旁与文末各一」中的首页位置）：两处都读作「写完了」 · Jason · 级联：论文「二」「五」、`Gate.tsx`
  - 2026-09-24 · §5.2-i 全部模板按审查顺序签收 · Jason · 级联：本 TRACK 第三区
  - 2026-09-24 · 首页终止符与格言整体居中（不把方块挂在居中之外）；§5.1-h 通过 · Jason · 级联：本 TRACK 第三区
  - 2026-09-24 · `/code-review`（PR #11）十条发现全部修复 · Jason · 级联：本 TRACK 第三区

## 二、批次

验收测试已写红：`tests/acceptance-visual-upgrade.test.ts`（单元）与 `tests/ui/*.ui.mjs`（浏览器），每条 `todo` 标着它的批次；批次完成 = 它名下的标记去掉且全绿。切分已随 Codex 设计门的处置定稿。

### Batch 1 — 界面闸门
- 状态：done（`d56ce65`，CI 35874205263）
- 范围：`supabase/config.toml`、`supabase/seed.sql`、`scripts/ui-check.sh`、`tests/ui/harness.mjs` 与 `manifest.mjs`、`next.config.ts`（`distDir` 可覆盖）、`tests/runtime/` 有库断言移入、`package.json`（playwright、@axe-core/playwright、`test:ui`）、`check.yml` 任务 `ui`、`deploy.yml` 等它 · 覆盖 REQ §5.5
- 验收判据：§5.5-a 去 todo；本机 `scripts/ui-check.sh` 跑通且拆干净；每次运行植入的无名按钮在四种环境里都被 axe 报出；其余 UI 测试此时照常为 todo。§5.5-b 的分支实验移到 Batch 6（见第一区裁定）
- 依赖：none

### Batch 2 — 关于页进库
- 状态：done——正文 Jason 已审；两条迁移 2026-09-24 已在 Supabase 执行，核对查询通过（5 行：en、es、fr、zh-CN、zh-HK，全部 published，标题与正文长度皆大于 0）
- 范围：两条迁移（表、改写后的五份正文）、`db-function-check.sh` 角色检查、`sitemap-entries.ts`、`pages-repo.ts`、`pages.ts`、`page-locale.ts`、`about/page.tsx`、`/admin/pages/**`；删 `src/content/pages/`、`next-mdx-remote`、`gray-matter` · 覆盖 REQ §5.3
- 验收判据：§5.3-a/b/c 去 todo；上线前在 Supabase 执行迁移并跑核对查询；Jason 审中英文正文；`db-function-check.sh` 仍绿
- 依赖：Batch 1

### Batch 3 — 材料与三种形态
- 状态：done——Jason 已看首页与一个列表页（2026-09-24）
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
- 状态：done
- 范围：`Nav`、`NavLinks`、`SearchDialog`、`search-filter.ts`、`LanguageSwitch`、`SkipLink`、`<ViewTransition>`（关闭 D-1）；删 `UtilityDropdown`、`SearchModal`、`TagList`、四张旧卡片 · 覆盖 REQ §5.1-c/e/g、§5.2-b/e
- 验收判据：上列 §-id 去 todo 且绿
- 依赖：Batch 4
- 执行中的调整：搜索只保留一个输入框（见第一区裁定）；原生模态对话框 Tab 会越出、搜索框里 Esc 先被用于清空，二者按 WAI-ARIA 模式手动处理；`use-locale-prefix.ts` 与旧样式的遗留段随使用者一并删除；D-1 关闭（每页包 `PageTransition`）

### Batch 6 — 收口
- 状态：done
- 范围：可访问名称全部走文案、404 与错误页、后台四模板的 AA 修正、`eslint.config.mjs` 去降级、退役 §6-a 与 `head-baseline.json`、`globals.css` 残余清理 · 覆盖 REQ §5.1-a/b/f/i、§5.4-a
- 验收判据：全部 todo 去除且绿；后台逐页人工审计记录写进第三区；§5.5-b 在临时分支上造一个无名按钮，闸门红（记运行号）后删分支
- 依赖：Batch 5
- 执行中的调整：§5.1-i 的 1.4.12 判定改为逐行比对文字与裁切容器（原判定把轮播隐藏的屏外图片算作文字截断）；退役 §6-a 的替代断言发现首页从无规范地址与语言替代链接、详情页无规范地址，一并补上；`list-digest.mjs` 与其 v2.3.0 基线（列表页已重做，基线失去意义）删除

### 基线审计的余项
每条基线发现都已成为 REQ §5.1 / §5.2 的验收判据（发现全文在提交 `cd700d3` 的本文件里）。判据之外还剩：
- 2.5.7：查看器的上一张 / 下一张按钮 → Batch 4 已在触屏 WebKit 确认
- 1.4.12 文字间距 → §5.1-i 入闸门，全绿；zh-HK / es / fr 页面 → 清单新增三个模板，全部检查通过；图上文字 → 重做后没有叠在图上的文字（查看器计数在纸底上）
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

**评审发现登记**（Codex 发布前审查，xhigh，五个任务，2026-09-24；引文已逐条对源核实；处置见第一区裁定；修后对标题与搜索两任务重跑 Codex）：
- 关于页回退与缓存（`pages.ts`、`page-locale.ts`）：无发现。`site_pages` 两条迁移：无发现（角色行为 Codex 沙箱无 Docker 未跑，本机 `db-function-check.sh` 已覆盖）
- P-1 MUST 标题 id 可能与页面既有 id 重复（脚注 `user-content-*`、搜索对话框的 `search-title` / `search-field`）—— status: fixed（页面 id 集中于 `page-ids.ts` 并保留；树中既有 id 保留；修时另见 Batch 4 回归：脚注标题被改 id、`aria-describedby` 失去目标；与 v2.3.0 起的旧错：清洗器二次加前缀，脚注链接从未可用——一并修复）
- P-2 MUST 只有图片的标题得出空文字的目录链接 —— status: fixed（取图片 alt；无文字者不进目录）
- P-3 SHOULD 含 KaTeX 的标题，目录文字是 MathML 与源码的拼接（如 `x2x^2x2`）—— status: fixed（目录文字在 KaTeX 之前记下，即公式源码）
- P-4 MUST 搜索「重试」按下即卸载，焦点落到页面 —— status: fixed（失败过则重试期间按钮保留；成功后焦点移到搜索框；新测试拦截请求验证）
- P-5 MUST 选中搜索结果后导航，焦点不随新页面 —— status: fixed（导航后焦点移到新页面的 `<main>`，结果即本页时立即移；新测试按 Enter 验证）
- C-1…C-11 MUST 本版验收测试的漏洞：搜索不走到结果（C-1）、相册不验证翻页（C-2）、§5.1-f 不查链接与格言 `lang`（C-3）、状态与后台模板无身份文字（C-4）、§5.2-e 只查文章页（C-5）、§5.2-f 靠两个文件名（C-6）、§5.2-h 不查项目与相册（C-7）、§5.3-a 只测纯函数（C-8）、§5.3-b 不测新增语言（C-9）、§5.4-a 规则被删也过（C-10）、§5.5-a 不查 `push` 触发（C-11）—— status: fixed（C-3 另查出两处：首页窗与照片格的链接未标写作语言、标签索引的标签名未标为标签——已补）
- C-12…C-22 MUST 运行时套件的浅断言：C-13 可缓存、C-19 元数据、C-20 CSP 属本版 REQ §6；其余引用的是 routing-slimdown / content-publishing 的 §-id（Codex 按本版 REQ 误读编号），属旧版测试 —— status: C-13、C-19、C-20 fixed（C-13 另查出标签详情页每次请求都渲染、不可缓存，已补空的 `generateStaticParams`）；其余入 TECHNICAL_DEBT TD-021
- C-S1 SHOULD 200% 放大以 640 宽 + 2 倍像素模拟，非浏览器缩放；C-S2 SHOULD 朱砂与 Cormorant 检查不看伪元素、只看首个字体 —— status: C-S1 accepted（理由写入 DESIGN §2.5），C-S2 fixed
- 复审（标题）：MUST 无；SHOULD 标题 id 可成 window 命名属性 —— status: accepted（见第一区裁定）。复审（搜索）：MUST 结果即本页时，`dialog.close()` 的 close 事件晚于同步代码到达，`onClose` 又把焦点送回搜索按钮 —— status: fixed（关闭时焦点去向只由 `onClose` 一处决定；新测试覆盖结果即本页）

**评审发现登记**（`/code-review` PR #11，high，同模型整版审查；已逐条对源核实；Jason 裁定全部修复）：
- R-1 MUST 查看器关闭后焦点总回到第一张：PhotoSwipe 在设置 `currIndex` 之前派发 `beforeOpen`（photoswipe.esm.js 6604 / 6623）—— status: open（改读 `pswp.options.index` 或于 `firstUpdate` 记下；测试打开第二张）
- R-2 MUST 后台新建稿的草稿缓存只在首次读取时填入：客户端导航回到新建页后恢复空稿并覆盖真稿（TD-020 修法引入）—— status: open（写 sessionStorage 时同步更新缓存）
- R-3 MUST 任意不存在的标签返回 200 且被缓存（C-13 补缓存后放大）—— status: open（未知标签 404；运行时测试改取真实存在的标签）
- R-4 SHOULD 按 ⌘/Ctrl 点结果（新标签页打开）也关闭对话框，焦点落空并残留 `navigation` 标记 —— status: open
- R-5 SHOULD 全局快捷键对无 `key` 的键盘事件调用 `toLowerCase` 会抛错（自动填充）—— status: open
- R-6 SHOULD `ui-check.sh` 启动与退出时 `supabase stop --no-backup` 会抹掉开发者已在跑的本项目本地栈 —— status: open（已有栈在跑则拒绝运行）
- R-7 NICE 正文走两遍 Markdown 管道（`extractToc` + `renderMarkdown`）—— status: open（一次运行同时返回正文与目录）
- R-8 NICE 搜索索引路由另有一套类型映射，并下发无用的 `locale`、`cover` —— status: open（路由直接输出 `Entry`，删 `SearchIndexItem` 与 `fromSearchItem`）
- R-9 NICE `tags.ts` 的 `getTagStats` 仍用旧 `ContentMeta`，`items` 填了不读 —— status: open（改用 `Entry` 适配器）
- R-10 SHOULD CLAUDE.md「Styling」仍点名已删除的 `.content-container-wide` 与 `.card` / `.card-link` / `.tag` —— status: open

**Phase 4 证据**（2026-09-24 齐备）：
- 真实内容：新版本以生产的两个公开值（只读，不含 service-role）本机构建，遍历站点地图 215 页、五种语言，套用闸门全部规则——axe 0、唯一 h1、无跳级、320px 无横向溢出、朱砂只在终止符、目录链接皆有目标、正文带语言，全过。其间发现并修复：宽的 KaTeX 公式在 320px 撑出页面（公式块内部横向滚动；种子文章加入长公式作回归）。相册封面经本机代理的假 IP（198.18.0.0/15）被 Next 图片优化器按 SSRF 防护拒绝——本机网络所致，生产同一图片 200
- 1.4.12 判定再修一处：像素级隐藏的读屏文字（KaTeX 的 MathML 副本）不算截断
- Jason 真机（iPhone、iPad，局域网访问上述真实内容构建）走读文章、搜索、相册、切换语言：通过。据此调整三处——首页格言误显示各语言译文（改为拉丁文常量，测试查文字）；尾纸末行加「回到顶部 · 目录」、终止符移到其末；加 ⌘K / Ctrl+K 搜索（均见第一区裁定）
- §5.2-i：Jason 按审查顺序逐模板签收，全部通过；首页终止符移到格言右侧（第一区裁定）
- §5.1-h：Jason 在本地合成栈只用键盘完成登录、新建、存草稿、发布：通过
- Codex 发布前审查：五个任务 + 两个复审，全部 MUST 已修，门关闭（第一区裁定）
- 最终树：本机界面闸门 27/27、axe 静止 68/68、有库运行时 23/23、单元 100、lint 0 警告

**Batch 证据**：
- Batch 1：本机 `scripts/ui-check.sh` 退出 0——axe 判定静止组合 56/56，植入按钮四环境皆报出，有库运行时套件 23/23；colima、栈、应用均已拆除。浏览器检查约 83 秒。CI：运行 35874205263，`check` 与 `ui` 皆绿，`ui` 同样 56/56、23/23
- Batch 6：全部 todo 去除且绿——单元 96 过、0 todo；本机界面闸门 21/21、axe 静止 68/68、有库运行时 23/23；lint 0 错误 0 警告（三条 React Compiler 规则恢复为错误）。CI：运行 35951479538，`check` 与 `ui` 皆绿
- Batch 5：§5.1-c（搜索、语言）、§5.1-e、§5.1-g、§5.2-b、§5.2-e 与状态对账去 todo 且绿，清单无 pending；§5.1-a 与 §5.1-f 虽仍标 Batch 6，本机已全绿；不变量 19 单元测试入库；本机界面闸门静止 56/56、有库运行时 23/23；单元 95 过；lint 0 错误 0 警告。CI：运行 35948300146，`check` 与 `ui` 皆绿
- Batch 4：§5.1-c（相册）、§5.2-h 去 todo 且绿，查看器与目录两个状态不再 pending；不变量 20 单元测试入库；本机界面闸门 axe 静止 56/56、有库运行时 23/23；单元 89 过。CI：运行 35944160020，`check` 与 `ui` 皆绿
- Batch 3：§5.1-d、§5.2-a/c/d/f/g 去 todo 且绿；本机界面闸门 axe 静止 56/56、有库运行时 23/23；单元 85 过。修正：闸门构建前清空 `.next-ui`（其中的 Turbopack 构建缓存曾让一次运行判定了上一次的 CSS）。320px 横向溢出 15px 全部来自旧导航，归 Batch 5（§5.1-e）。CI：运行 35939295184，`check` 与 `ui` 皆绿
- Batch 2：§5.3-a、§5.3-b、§5.3-c 去 todo 且绿；本机界面闸门 axe 56/56、有库运行时套件 23/23；`db-function-check.sh` 全过（含 `site_pages` 角色与迁移重跑保留后台修改）。CI：运行 35878664909，`check` 与 `ui` 皆绿

**§5.5-b**：临时分支 `probe/v2.4.0-5.5b-nameless-button` 在 `Nav` 里放一个无名按钮，CI 运行 35950131054 的 `ui` 任务因 `button-name` 失败（`check` 绿）；分支已删。

**后台逐页人工审计**（2026-09-24，本地合成栈，axe 之外的判定；登录、总览、列表、编辑器四个模板，另加关于页的语言列表与编辑器）：
- 已修：页面标题各不相同（2.4.2，原来全是「Admin | AnteLacus」）；总览卡片的 h2 改为类型名、计数降为正文（2.4.6，原来四个 h2 都是「1 published」）；列表与编辑器里的内容标注写作语言（3.1.2）；CodeMirror 编辑区有可见的墨色焦点环（2.4.7）与可访问名称（4.1.2，axe 报出）
- 已查无问题：320px 无横向溢出（1.4.10）；无小于 24px 的目标（2.5.8）；每个输入都有标签（3.3.2）；登录失败以 `role="alert"` 播报、保存结果以 `role="status"` 播报（4.1.3）；键盘顺序与页面顺序一致，跳转链接在首位（2.4.1、2.4.3）
- 接受：`datetime-local` 在 Chromium 里是 7 个 Tab 停点、其中日历按钮无自绘焦点环——浏览器原生控件；空的必填项由浏览器原生校验提示（3.3.1）
- 键盘走「写一篇并发布」（§5.1-h）：Jason 走过，通过（见 Phase 4 证据）


**Phase 6 boxes**：
- [x] 生产 Supabase 执行两条迁移并核对（Batch 2）
- [ ] 版本 PR：`/code-review` 发现登记并处置完毕 → Jason 审结构与范围 → 合并（即部署）
- [ ] CHANGELOG v2.4.0 条目
- [ ] TECHNICAL_DEBT 定稿（TD-021 在册）；README 仍属实
- [ ] 活文档清点：REQ、DESIGN、`docs/aesthetic-thesis.md`、CLAUDE.md 与上线内容一致
- [ ] 部署后：线上 SHA 与合并提交一致；对生产跑 `BASE_URL=https://www.antelacus.com RUNTIME_DB=1 npm run test:runtime`
- [ ] tag `v2.4.0`
- [ ] 路线图 / 下一版 Phase 0 的输入（本版无 FEEDBACK 登记）
- [ ] 闸门读数：每道闸门的运行次数 / 改变了输出的拦截次数
- [ ] 文档预算绿（`scripts/check_doc_budget.py`）；memory 清理
- [ ] 验收触发登记：线上一次真实访问（读文章、搜索、看相册、切语言）无异常
- [x] 本机清理：`.env.prod-check` 已删除（Jason，2026-09-24）
- [ ] Clash 脚本里 `+.supabase.co` 一行的去留（Jason 定；备份 `sK5xH7G8Nriz.js.bak-2026-09-24`）
- [ ] TRACK 关闭——最后一项：未结事项迁出后 `git mv TRACK.md TRACK_v2.4.0.md`

## 四、Session-end pickup
