# TRACK — content-publishing v2.3.0

## 一、范围与裁定

- 模式：standard · 目标：清空 `docs/TECHNICAL_DEBT.md` 上全部未接受的债务，核心是让三种内容类型都能从后台发布、且数据库内容不再当代码执行。视觉升级不在本版。
- 范围（条目编号 = `docs/TECHNICAL_DEBT.md`；序号即建议的批次先后）：
  1. TD-005 依赖升级：Next 16（连带 React、`eslint-config-next`）、`next-intl` 4.14、`sharp` 0.35 —— 第一批，其余改动都建在新框架上，v2.2.0 的运行时验收顺带验一遍升级
  2. TD-006 数据库内容不再当代码执行（`next-mdx-remote` 6 禁 JS，或数据库内容改纯 Markdown）；容器以非 root 运行
  3. TD-001 发布入口：posts / projects / gallery 与关于页的后台增改与发布，含封面图与正文插图上传；按 slug 幂等保存、表单防重复提交（与 2 一起设计）
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
  - 2026-09-22 · TD-013 用外部死人开关服务：脚本成功即 ping，缺席即告警；不在 VPS 上自建 · Jason · 级联：DESIGN 外部约束（待开）

## 二、批次

批次在 Phase 2（DESIGN 过 Codex 设计门、验收测试写红）结束时切出；此前本区为空。

## 三、门与发布

**评审发现登记**（Codex 设计门 · 部署前门；评审返回即原样登记，处置由 Jason 裁）：
- 尚无评审。

**Phase 4 证据**：尚未到达。

**Phase 6 boxes**（请求 PR 之前写好——合并 ≠ 发布）：
- [ ] CHANGELOG 条目
- [ ] TECHNICAL_DEBT 定稿（已解决的删除，不留墓碑；TD-002、TD-004 留）
- [ ] 用户文档（`docs/content-publishing.md` 改为按后台发布，SQL 一节退役）· README 仍然属实
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
