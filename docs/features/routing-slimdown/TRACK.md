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
  - 2026-09-21 · `development` 分支退役：本版的 PR 直接合入 `main`，关版时删除该分支并改 `CLAUDE.md` 的分支约定 · Jason · 级联：REQ §5.5、Phase 6 boxes

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

**评审发现登记**（评审返回即原样登记，处置由 Jason 裁）

Codex 设计门（只读，xhigh，会话 `01a0c1f8-39fd-7ed1-b987-c8eaf35c8267`；评审对象 = `c7c1c8c` 的 DESIGN 与 REQ）：
- MUST-1：公开页面树仍因 `next-intl` 的 Provider 读请求头而保持动态，§5.3-a 不成立 —— status: open
- MUST-2：`decideLocaleRoute` 把未知的普通路径 308 走，而 REQ 规则 4 要求对原请求直接 404 —— status: open
- MUST-3：两份 `/sitemap.xml` 定义并存，`sitemap.ts` 才是生效的一份且在构建期访问 Supabase，「构建不依赖 Supabase」不成立 —— status: open
- MUST-4：笔记详情的数据缓存是 7200 秒，违反「直接改库最长一小时生效」 —— status: open
- MUST-5：删除顶层根布局后，metadata、viewport、全局 CSS、字体、公共外壳没有保全契约 —— status: open
- MUST-6：可复用闸门没有真正接上（无 `needs`），且权限方案会让检出失败（被调用方不能提升调用方的空权限）—— status: open
- MUST-7：§5.5-a 在设计里没有对应物，`CLAUDE.md` 现状必然不过 —— status: open
- SHOULD-1：「根目录的 middleware 不被注册」这一前提对 Next 15.5 不成立 —— status: open
- SHOULD-2：「形如语言标签」的判法预留掉了许多将来可能的栏目名（`/rss`、`/cv`、`/faq`）—— status: open
- SHOULD-3：Service Worker 的 24 小时说法过强：那是更新检查的行为，不是 HTTP 缓存上限 —— status: open
- SHOULD-4：D-4（OG 路径不被重定向）仍待核，需对构建后的服务实测 —— status: open
- 评审同时确认成立：D-1（`notFound()` 给出 404）、D-2（静态页不带 `no-store`）、D-3（`revalidateTag` 波及用到该标签的页面；首页、列表、标签页、搜索、sitemap 都经 `notes` 标签读取）、路由处理器不需要根布局、`next-intl` 插件不要求顶层布局、公开 Supabase 客户端不读 cookie。

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
