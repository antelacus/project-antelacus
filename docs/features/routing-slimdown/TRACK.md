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
  - 2026-09-21 · 分支沿用现状：`feat/routing-slimdown` 从 `development` 切出，版本 PR 合入 `main`（合入即部署），随后 `development` 快进对齐 · Claude 提议，待 Jason 追认

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

批次在 Phase 2（设计完成、验收测试写红之后）切分。

## 三、门与发布

**评审发现登记**（Codex 设计门 · 部署前门）：尚无。

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
- [ ] **关版（最后一项）**：未了事项各归其位 → `git mv TRACK.md TRACK_v2.2.0.md`

## 四、Session-end pickup
