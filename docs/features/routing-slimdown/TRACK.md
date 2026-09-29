# TRACK — routing-slimdown v2.5.1

## 一、范围与裁定

- 模式：standard（TD-025 要改已上线的根布局设计，需设计门）· 目标：把登记在册的四条技术债全部了结
- 范围：
  1. TD-025：带语言前缀的地址指向不存在的内容（未知栏目、未知条目或标签、格式不对的条目名）时，得到站点自己的 404 页，用地址的语言、不靠 JavaScript——routing-slimdown REQ §5.2 规则 8、§5.2-i；content-publishing REQ §5.4-a、§5.4-d 去掉 todo
  2. TD-026：`backup.sh` 的数据库密码与 service-role 密钥不出现在命令行或容器配置里——release-pipeline REQ §5.7-e
  3. TD-024：界面闸门缩短——axe 的四个上下文并行、界面检查分到两台机器，覆盖率核对跨任务合并——visual-upgrade REQ §5.5-c、§5.5-d
  4. TD-023：v2.5.1 发布后，从生产 `.env` 删掉 `SUPABASE_ADMIN_EMAILS`（收缩步）——release-pipeline REQ §5.8-e
- 明确不做：
  - 除 TD-025 所需之外的路由改动
  - 为界面闸门换测试框架或换 CI
- 全局约束（约束所有批次）：
  - 依赖：Next 钉在 `package.json`，与 `eslint-config-next` 同版
  - 公开页面保持可缓存：规则在项目 `CLAUDE.md`「Routing and languages」，证据只认运行中服务的响应头
  - `<html lang>` 取自地址（routing-slimdown DESIGN §7–§8 的前提），改根布局不得丢掉它
  - The Floor：闸门只用合成数据；生产 `.env` 的改动只删一行，不读其他值
- Phase 0 待核（外部约束，结论写进相应 DESIGN 的外部约束一节）：
  - Next 16.3.7（已核）：升级后界面闸门 35 过、运行时 22 过；§5.4-a/d 仍失败于语言断言，TD-025 未被框架修复
  - 生产基线（已核）：`/en/posts/<未知>` 为 404 + `<html id="__next_error__">`，无 `lang`、无标题；`/fr/posts/<格式不对>` 为站点的 404 页，但 `lang="en"`
- 裁定（一行一条，只记「批了什么」）：
  - 2026-09-29 · v2.5.1 了结 TD-023…TD-026 · Jason · 级联：本 TRACK 范围
  - 2026-09-29 · TD-024 两个办法都做（axe 并行 + 界面检查分机）；Claude 陈述过反对理由：触发条件未到，两者都增加闸门的复杂度与不稳定风险 · Jason · 级联：本 TRACK 范围 3
  - 2026-09-29 · TD-023 接受「回滚到 v2.4.1 时后台被锁、公开站点不受影响」，v2.5.1 发布后删 · Jason · 级联：本 TRACK 范围 4
  - 2026-09-29 · 本版文档归 routing-slimdown（上线后修订、契约不变，就地改） · Jason · 级联：本 TRACK
  - 2026-09-29 · TD-024 不设速度硬指标，耗时前后对比记进 TRACK；稳定 = 同一提交连续 5 次全绿 · Jason · 级联：visual-upgrade REQ §5.5-c/d
  - 2026-09-29 · 「已知语言 + 未知栏目」的英文 404 一并纳入：带语言前缀的 404 一律用那种语言 · Jason · 级联：routing-slimdown REQ §5.2 规则 8、§5.2-i；content-publishing REQ §5.4
  - 2026-09-29 · REQ 定稿，Phase 1 关闭 · Jason · 级联：各 REQ
  - 2026-09-29 · TD-025 走方案 A：由 proxy 在渲染之前判定 404、交给按地址语言输出的 `global-not-found`；页面的 `notFound()` 只作兜底。依据：`notFound()` 不经服务端渲染是 App Router 自 Next 14 起的已知缺陷（上游 #62228、#99287），15.5–16.4 canary 与 Vercel 自家站点均复现；Claude 先荐 B（等上游）后改荐 A · Jason · 级联：routing-slimdown DESIGN
  - 2026-09-29 · 不去上游发帖 · Jason

## 二、批次

验收测试在 Phase 2 写红，`todo` 标着批次：`tests/runtime/acceptance.runtime.mjs`（routing-slimdown §5.2-i、content-publishing §5.4-a/d）、`tests/acceptance-visual-upgrade.test.ts`（§5.5-c）、`tests/acceptance-release-pipeline.test.ts`（§5.7-e）。§5.5-d、§5.7-e 的实跑、§5.8-e 在第三区记证据。

### Batch 1 — 按语言的 404 文档
- 状态：open
- 范围：`src/components/LocaleShell.tsx`（新）、`src/app/[locale]/layout.tsx`、`src/app/global-not-found.tsx`、`src/i18n/route-decision.ts`（「不存在」带语言；未知栏目、多余层级由它判）、`src/proxy.ts`（语言请求头）+ 测试 · 覆盖 routing-slimdown §5.2 规则 8 的「未知栏目、格式不对」、content-publishing §5.4-d；关闭 DESIGN §10 Q1
- 验收判据：§5.4-d 去 todo 且绿；§5.2-i 的无库部分（`/fr/no-such-section`、`/fr/posts/Bad_Slug`）为法语、服务端文档；公开页面仍可缓存（响应头）
- 依赖：none

### Batch 2 — 内容索引与 proxy 判定
- 状态：open
- 范围：`src/app/api/route-index/route.ts`（新）、`route-decision.ts`（`lookup`、`isPublished`）、`src/proxy.ts`（回环取索引，失败放行）、DESIGN §7-10 的新测试；TECHNICAL_DEBT 登记本结构为已接受的临时方案（退役条件：上游修好）、删 TD-025 · 覆盖 §5.2-i 全部、content-publishing §5.4-a
- 验收判据：§5.2-i、§5.4-a 去 todo 且绿（界面闸门，有库）；索引不可达时存在的内容照常 200；20 个未知 slug 不增加数据库读取（§5.4-d 原判据）
- 依赖：Batch 1

### Batch 3 — 界面闸门分机与并行
- 状态：open
- 范围：`tests/ui/manifest.mjs`（`SHARDS`、`requiredCoverage`、`coverageFor` 移入）、`tests/ui/harness.mjs`（环境并行）、`tests/ui/coverage.ui.mjs`（按份对账）、`scripts/ui-check.sh`（`UI_SHARD`）、`.github/workflows/branch.yml`（矩阵）、删 TD-024 · 覆盖 visual-upgrade §5.5-c/d
- 验收判据：§5.5-c 去 todo 且绿；每份各植入违例一次变红（运行号）；同一提交连续 5 次全绿；推送到预发布验过的耗时前后对比记入第三区
- 依赖：none（与 Batch 1、2 可并行，合并时后到者重跑）

### Batch 4 — 备份的密钥
- 状态：open
- 范围：`scripts/backup.sh`、`scripts/sync-bucket.mjs`（`SUPABASE_SERVICE_ROLE_KEY_FILE`）+ 测试；`docs/DEPLOYMENT.md` 的备份段；删 TD-026 · 覆盖 release-pipeline §5.7-e
- 验收判据：§5.7-e 去 todo 且绿；VPS 上实跑一次 `backup.sh`，期间采样 `ps` 与 `docker inspect` 不含两个密钥（在 VPS 上比对、只回报次数），产出转储与存储镜像
- 依赖：none

## 三、门与发布

**评审发现登记**：（设计门之后）

**Phase 4 证据**：（Phase 4 填写）

**Phase 6 boxes**（合并 ≠ 发布）：
- [ ] 版本 PR：Claude 开 PR、跑 `/code-review` 并登记处置 → Jason 审结构与范围后合并
- [ ] 真实发布：*Production* 全绿，公网构建标识 = 合并提交的键，打出 `v2.5.1`
- [ ] 收缩步（release-pipeline §5.8-e）：删生产 `.env` 与 `.env.staging` 里的 `SUPABASE_ADMIN_EMAILS`（只删这一行、不读其他值）→ 两个环境 `restart` → Jason 登录生产后台并保存一次 → 删 TD-023
- [ ] CHANGELOG 条目
- [ ] TECHNICAL_DEBT 定稿：TD-023…TD-026 删除；Batch 2 的临时方案在册
- [ ] 常新文档扫尾：各 REQ / DESIGN 与交付一致；项目 `CLAUDE.md`（Routing and languages 一节的 404 规则）、README 仍属实
- [ ] FEEDBACK 扫尾 · 路线图
- [ ] 各门读数：运行次数 / 改变了输出的拦截次数
- [ ] 文档预算为绿 · 记忆修剪
- [ ] **关版（最后一项）**：未了事项各归其位 → `git mv TRACK.md TRACK_v2.5.1.md`
