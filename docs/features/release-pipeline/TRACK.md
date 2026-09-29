# TRACK — release-pipeline v2.5.0

## 一、范围与裁定

- 模式：standard · 目标：改动先在生产旁边的预发布站点上、用真实内容和真机验过，再把同一个产物晋升到生产；部署后自动核验，失败能一步退回。
- 范围（括号内为第三区的发现编号）：
  1. 镜像不含 `.env`；构建所需的公开值以构建参数进入（D-11）
  2. 构建一次、逐级晋升：CI 构建镜像，经部署 SSH 传到 VPS，预发布与生产用同一个镜像，VPS 不再构建（D-1、D-4、D-9）
  3. 预发布站点：同一台 VPS，走生产同一套 nginx + Cloudflare，访问控制 + `noindex`；读生产数据，不能写（TD-022、D-1、D-9）
  4. 部署后自动核验：经公网地址核对 served SHA、跑有库运行时套件；失败退回上一个镜像（D-3、D-4）
  5. 迁移闸门：部署前只读核对生产已有代码所需的迁移；`db-function-check.sh` 进 CI；迁移只做加法（先扩后缩）（D-2）
  6. 闸门去重：同一提交只跑一遍闸门；安装与运行时套件的重叠去掉（D-5、D-6）
  7. TD-021 的弱断言补强；后台检查补上上传、登出、其余内容类型（D-7）
  8. 手动清单自动化：打 tag、Cloudflare 缓存清除、Supabase Auth 设置核对（D-8）
  9. 耗时基线：闸门每个任务、每一步与部署各段的耗时可读出（D-10）
  10. 后台读取改走登录会话 + 行级权限（管理员可读草稿），写入仍只走 service-role；预发布因此可登录、可看草稿、不能写（Q5）
  11. 发布手册：`docs/DEPLOYMENT.md` 的「Deploy」一节扩成发布手册，只写要人或 Claude 动手、或要读结果做判断的步骤
- 明确不做：
  - CI 搬上 VPS（自托管 runner）：CI 留在 GitHub
  - 蓝绿 / 金丝雀发布、k8s、功能开关、独立 QA 环境
  - 对生产写数据的端到端测试
- 全局约束（约束所有批次）：
  - The Floor：镜像不含 `.env` 之前，镜像不离开 VPS（D-11；与定级无关）。预发布不持有 service-role 密钥。每个新令牌（Cloudflare 等）只进 GitHub secrets 或 VPS 的 `.env`，最小权限，逐个经 Jason 批准
  - 生产不中断：VPS 上的改动不得让生产停服；nginx 改动先 `nginx -t` 再 reload
  - 公开页面保持可缓存：规则在项目 `CLAUDE.md`「Routing and languages」
  - 生产数据库的迁移仍由人执行，机器只核对
- Phase 0 待核（外部约束，结论写进 DESIGN 的外部约束一节）：
  - VPS（已核）：6 核、内存 7.8 GiB（可用 5.0）、磁盘余 103 G、负载 0.5–0.8；Docker 29.8.1、Compose v5.5.1、nginx 1.24.0；端口 3000–3002 已占，3003 空闲；goodman 预发布没有 nginx 站点，只在 127.0.0.1:3001；每个站点只放行 Cloudflare IP（`cloudflare-ips.conf` + `deny all`）；源站证书为通配 `*.antelacus.com`，2040 年到期
  - 镜像仓库（已核）：GHCR 的存储与流量目前免费；CI 用 `GITHUB_TOKEN` + `packages: write` 推送；VPS 拉取私有镜像只能用 classic PAT，范围 `read:packages`
  - Cloudflare（已核）：Access 免费档可保护单个子域（自托管应用，DNS 在 Cloudflare 代理）；未过认证的请求到不了源站；CI 以 service token 的两个请求头通过，策略动作须为 Service Auth
  - Next（已核）：16.3.5 的 `writeStandaloneDirectory` 把构建时载入的 `.env`、`.env.production` 复制进 standalone；生产容器里确有 `/app/.env` 且含 service-role 那一行（只数了行，没读值）。`NEXT_PUBLIC_*` 构建时定型
  - Supabase（未定）：后台只用 `signInWithPassword`，文档只对会跳转的流程要求回调地址，推断预发布域名无需配置——以预发布上的一次真实登录为准；没有 service-role 密钥时后台能打开到什么程度，Phase 2 查代码
- 裁定（一行一条，只记「批了什么」）：
  - 2026-09-24 · 预发布站点放在生产旁边（仿 project-goodman），CI 留在 GitHub · Jason · 级联：本 TRACK 范围 3、明确不做
  - 2026-09-24 · 测试发布机制采用五层（本机 / CI / 预发布 / 生产 / 上线后）、构建一次逐级晋升、迁移先扩后缩、预发布读生产数据不能写 · Jason · 级联：REQ（待开）
  - 2026-09-24 · Codex 诊断的全部发现进本版，含 D-7、D-8、D-10，不拆版本 · Jason · 级联：本 TRACK 范围
  - 2026-09-24 · Codex 诊断返回的 4 条 MUST 与 D-11 定为 SHOULD；D-11 另作全局约束 · Jason · 级联：本 TRACK 第三区、全局约束
  - 2026-09-25 · REQ 盘问第一轮：镜像经部署 SSH 传到 VPS、不用镜像仓库，VPS 保留最近 5 个镜像；任何分支过闸门即上预发布，另可手动指定 SHA；生产跑预发布验过的同一产物，合并即晋升；预发布自动检查为合并必需；预发布后台按范围 10；部署后核验任一项失败即自动回滚，另有手动回滚；迁移在合并前由人执行到生产，缺迁移即拒绝部署，删除或改名须标为收缩步；上传在合成环境端到端测；本机只跑 lint、tsc、单元；预发布为 `staging.antelacus.com`，只对 Jason 与 CI 开放，`noindex`，常驻 · Jason · 级联：REQ（待开）、本 TRACK 范围 2、10
  - 2026-09-25 · REQ 盘问第二轮：合并前分支须与 main 同步（分支保护，由 Claude 经 `gh` 改，先给 Jason 看设置项）；闸门只在分支 push 上跑，PR 不另跑，main push 不跑闸门、不重建，直接晋升；预发布自动检查只做匿名访问，登录后的后台由 Jason 手动看，列为 PR 勾选项；部署成功且版本号变了即自动打 tag；只在分享图或 `public/images/` 变了时清 Cloudflare 缓存（令牌只有本站清缓存权限，待 Jason 批准）；部署后读 Auth 公开设置，注册开着即报警、不回滚；耗时写进运行摘要，版本收尾汇总进 TRACK；管理员身份改由 `app_metadata.role = admin` 表示，`SUPABASE_ADMIN_EMAILS` 退役 · Jason · 级联：REQ（待开）
  - 2026-09-28 · REQ 盘问第三轮：紧急修复同样走「闸门 → 预发布 → 合并」，不留旁路，止血靠手动回滚；最近一次备份超过 26 小时即拒绝部署带新迁移的版本（看 VPS 上备份文件的时间），迁移前手动补备份写进操作文档；盘问结束，Jason 复述机制通过 · Jason · 级联：REQ
  - 2026-09-28 · 生产迁移由 Claude 经 Supabase MCP 执行并核对，写进发布流程，不需要 Jason 逐次同意；MCP 拿掉只读（Claude 陈述过反对理由：写能力常驻于每个会话；先备份要靠 Claude 自觉），限本项目、限数据库与文档两组工具，免确认的只有迁移与只读核对工具；备份检查随之移到执行迁移之前（推翻第三轮中「部署时检查备份」：迁移早于部署，那时检查已晚）。配置改动被 Claude Code 的安全分类器拦下，由 Jason 亲手改 · Jason · 级联：REQ §1.2、§2、§3、§5.7、§6、§8；项目 `CLAUDE.md`、`docs/DEPLOYMENT.md`（配置到位后）
  - 2026-09-28 · REQ 定稿，Phase 1 关闭 · Jason · 级联：REQ
  - 2026-09-28 · 加发布手册：不另建文件，`docs/DEPLOYMENT.md` 做成手册；流水线建成后写，Phase 4 的真实发布完全照它执行 · Jason · 级联：本 TRACK 范围 11、REQ §1.2、§5.11
  - 2026-09-28 · DESIGN 审过；删掉 `docker-compose.yml`，容器参数只在发布脚本里定义 · Jason · 级联：DESIGN §2.1、本 TRACK Batch 4
  - 2026-09-29 · 仓库 Variables 存两个 `NEXT_PUBLIC_*` 公开值；Access 放行 antelacus@gmail.com；Cloudflare 的应用、策略、DNS 由 Claude 经 Cloudflare MCP 建，service token 由 Jason 在控制台建（密钥不进对话） · Jason · 级联：`docs/DEPLOYMENT.md`、DESIGN §8
  - 2026-09-29 · 私有仓库在 GitHub 免费档用不了分支保护；仓库改为公开（作品集），提交历史中的个人邮箱接受公开（Claude 讲明了关联身份的途径；Jason 确认该邮箱防护良好）。公开前检查：296 个提交 gitleaks 0 条；184 次运行日志的命中均为公开值、构建键或本地栈默认密钥 · Jason · 级联：DESIGN §8
  - 2026-09-29 · 分支保护按 Batch 5 的设置开启，管理员也不能绕过（Q16 不留旁路）；流水线自身坏到合不进修复时，在 GitHub 设置里临时关掉保护 · Jason · 级联：`docs/DEPLOYMENT.md`（Batch 8）
  - 2026-09-29 · 批 A：TD-025（未知条目的 404 是 Next 错误外壳，P2）本版内修——十个假设与 Codex 诊断之后未得可控修复，转 B：TD-025 留给 v2.5.1（先为文档外壳做设计再修）；本版收尾时 §5.4-a、§5.4-d 带指向 TD-025 的 todo，作为「版本不得带 todo 收尾」的一次例外 · Jason · 级联：TECHNICAL_DEBT TD-025、`tests/runtime/acceptance.runtime.mjs`
  - 2026-09-29 · 发布前审查的处置按 Claude 提议（第三区）；Codex 的发现经认可并修复后不再送审，由各自的回归测试或演练关闭——已改治理规则 §2 Gate cadence 与 §3（dotfiles `812b684`） · Jason · 级联：custom-conventions
  - 2026-09-29 · `/code-review` 的 R-1…R-10 按 Claude 提议处置（第三区）；修完即开版本 PR · Jason · 级联：本 TRACK 第三区
  - 2026-09-28 · Codex 设计门 15 条发现按 Claude 提议处置（第三区）；不在 CI 里放管理员账号，登录后的检查由 `pr-checklist` 强制打勾，重议条件写进 REQ §1.2；Phase 2 关闭 · Jason · 级联：DESIGN、REQ §1.2、§5.1、§5.4-d、§5.6-c、§5.7-d、§6

## 二、批次

验收测试在 Phase 2 写红，每条 `todo` 标着它的批次；批次完成 = 它名下的标记去掉且全绿。所在位置：`tests/acceptance-release-pipeline.test.ts`（单元）、`tests/runtime/release.runtime.mjs`（对预发布或生产）、`tests/ui/admin.ui.mjs`（合成环境）。不是自动测试的判据在第三区记运行号或读出结果：§5.4-a/b、§5.6-a/b、§5.7-c 的执行记录、§5.10-a、§5.11-a。

### Batch 1 — 无密钥的产物
- 状态：done `2e981db`
- 范围：`.dockerignore`、`Dockerfile`、`scripts/release/build-key.mjs` + 测试 · 覆盖 REQ §5.1（镜像不含 `.env`；构建输入键）
- 验收判据：§5.1-a/b/c 去 todo 且绿；在本机用假 `.env` 构建一次，镜像里找不到标记
- 依赖：none

### Batch 2 — 迁移纪律
- 状态：done `85d0f06`
- 范围：`scripts/release/migration-lint.mjs` + 测试（含「已执行不可再改」）、闸门接入；查清 DESIGN §10 Q4；补登 5 条执行记录（Claude 经 MCP）· 覆盖 REQ §5.7（先扩后缩；执行记录）
- 验收判据：§5.7-a/c/d 去 todo 且绿；现有 7 条迁移全部通过 lint；`list_migrations` 列出 7 条
- 依赖：none

### Batch 3 — 后台读取与管理员身份
- 状态：done `e5f55ba`
- 范围：`<ts>_admin_read.sql`、`admin-auth.ts`、后台各页与动作、`admin/layout.tsx`、`supabase-env.ts`、`ui-check.sh`（合成管理员带 `role`）、`db-function-check.sh`（行级权限检查）、`.env.example` · 覆盖 REQ §5.8
- 验收判据：§5.8-a…d 去 todo 且绿；迁移先执行到生产、Jason 的账号标上 `role` 之后再 push 代码；`SUPABASE_ADMIN_EMAILS` 暂留在生产 `.env`，另登记 TD
- 依赖：Batch 2（lint 先守住这条迁移）

### Batch 4 — VPS 一侧
- 状态：done — CI 首次部署预发布（36518886837）；Jason 用手机登录预发布与后台，文章与后台正常（真机判据；Supabase 在预发布域名下的登录与 `app_metadata` 角色实测生效）
- 范围：`scripts/release/release.sh`、`decide.mjs` + 测试、删 `docker-compose.yml`、`src/app/api/build/route.ts`、nginx 共用配置与预发布站点、`.env.staging`、Cloudflare DNS + Access（Jason 在控制台操作）· 覆盖 REQ §5.2、§5.3
- 验收判据：§5.2-a、§5.3-a/b/c 去 todo 且绿；手动把一个镜像部署到预发布，从手机能打开；实测传输耗时（DESIGN §10 Q2）
- 依赖：Batch 1

### Batch 5 — 工作流
- 状态：done — 三个工作流跑通（36518886837）；分支保护已开（§5.4-a/b 证据见第三区）；`production.yml` 的首跑是 Phase 4 的真实发布
- 范围：`branch.yml`、`production.yml`、`pr-checklist.yml`，删除 `check.yml`、`deploy.yml`；运行时套件支持 Access；耗时摘要；分支保护（Claude 经 `gh` 改，先给 Jason 看）；PR 模板 · 覆盖 REQ §5.1-c、§5.3-d、§5.4、§5.5-a/b/c、§5.9
- 验收判据：对应判据去 todo 且绿；§5.4-a/b 以分支保护的读出为证据
- 依赖：Batch 4

### Batch 6 — 回滚与发布后收尾
- 状态：done `b6b0bac` — 回滚在预发布上演练（第三区）；打 tag、清缓存、Auth 核对的首跑是 Phase 4 的真实发布；`CF_PURGE_TOKEN` 由 Jason 创建（只有本站清缓存权限）
- 范围：自动与手动回滚、打 tag、清缓存（先关闭 DESIGN §10 Q1）、Auth 核对；Cloudflare 清缓存令牌（Jason 批准）· 覆盖 REQ §5.5-d/e/f、§5.6（含 §5.6-c 回滚兼容）
- 验收判据：对应判据去 todo 且绿；§5.6-a 在预发布上演练一次（证据）
- 依赖：Batch 5

### Batch 7 — 覆盖补强
- 状态：done `a59fad1` — §5.4-a/d 按裁定带 TD-025 的 todo（v2.5.1 去掉）
- 范围：`tests/runtime/acceptance.runtime.mjs`（TD-021）、`tests/ui/`（上传、登出、其余内容类型、关于页）、`supabase/config.toml` 与 `ui-check.sh`（打开存储服务）· 覆盖 REQ §5.10
- 验收判据：§5.10-a…d 去 todo 且绿；TD-021 每一条都有「植入 → 变红」的证据
- 依赖：Batch 3（后台读法已换）

### Batch 8 — 发布手册
- 状态：in-progress — `docs/DEPLOYMENT.md` 的「Release, step by step」已写；§5.11-a 由 Phase 4 的真实发布证明
- 范围：`docs/DEPLOYMENT.md`、项目 `CLAUDE.md` 的 Commands 与部署段落 · 覆盖 REQ §5.11
- 验收判据：§5.11-a 由 Phase 4 的真实发布来证明
- 依赖：Batch 6

## 三、门与发布

**评审发现登记**（Phase 0 诊断，在两次 Codex 门的额度之外；Codex xhigh，只读；全文 `codex resume 01a0d3e0-220e-75b3-8f5e-04d4ca150604`；引文已逐条对源核实；D-11 为 Claude 实测）：
- D-1 · SHOULD（Codex 原定 MUST）：生产拓扑（镜像、VPS `.env`、nginx、Cloudflare）不在任何检查路径上 —— status: open → 范围 2、3
- D-2 · SHOULD（原 MUST）：生产迁移手动执行、无闸门；`db-function-check.sh` 不在任何工作流里 —— status: open → 范围 5
- D-3 · SHOULD（原 MUST）：部署成功只代表 `localhost:3002/` 有响应；生产运行时套件靠手动 —— status: open → 范围 4
- D-4 · SHOULD（原 MUST）：没有应用回滚；健康检查失败只打印日志 —— status: open → 范围 2、4
- D-5 · SHOULD：同一提交的闸门跑多遍（分支 push、PR、main 上 `Check` 与 `Deploy` 调用各一遍） —— status: open → 范围 6
- D-6 · SHOULD：两个任务各自 `npm ci`；不读库的运行时子集被有库全量覆盖。（第二次构建不是冗余：`NEXT_PUBLIC_*` 构建时定型，换后端须重建） —— status: open → 范围 6。更正：「被有库全量覆盖」不成立——§5.4-b/c（数据库不可达）只在不连库时运行；Batch 5 删掉该子集，Batch 7 已加回 `check` 任务
- D-7 · SHOULD：TD-021 的弱断言；后台界面清单只有 4 个模板，上传、登出、其余内容类型无检查 —— status: open → 范围 7
- D-8 · SHOULD：Auth 设置、Cloudflare 缓存清除、打 tag 靠手动；post-merge 钩子只提醒 —— status: open → 范围 8
- D-9 · SHOULD（部分待核）：预发布与生产同机的隔离与容量；本地栈 ES256 与生产可能的 HS256 登录行为不同 —— status: open → 范围 2、3，待核项见第一区
- D-10 · NICE：没有按步骤的耗时基线 —— status: open → 范围 9
- D-11 · SHOULD：Next standalone 输出复制 `.env`，`Dockerfile` 把它带进最终镜像，含 service-role 密钥（假 `.env` 本机构建实测；JS 文件中无密钥） —— status: open → 范围 1

**评审发现登记**（Codex 设计门，xhigh，DESIGN + REQ；全文 `codex resume 01a0e604-0b26-71d3-9222-40fea1e2dde4`；引文已逐条对源核实）：
- G-M1 · MUST：构建输入键不是产物的身份——同一个键重建会得到不同的镜像（基础镜像、npm 下载），标签会被覆盖；`BUILD_KEY` 作为环境变量可被 `.env` 覆盖 —— status: fixed `0609c26`：同一个键永不重建；生产只接受预发布验过的镜像 ID；键写成镜像里的文件（DESIGN §2.2、§7-2；REQ §5.1）
- G-M2 · MUST：nginx 与环境文件不在产物里；「线上 nginx 与仓库一致」没有写明机制；登录后的检查不强制 —— status: fixed `0609c26`：写明经 SSH 比对线上 nginx；登录后的检查由 `pr-checklist` 强制（DESIGN §2.1、§7-5；REQ §5.4-d）
- G-M3 · MUST：核验经过 CDN、清缓存在核验之后，可能验到旧应用 —— status: fixed `0609c26`：只补「清完缓存再取一次」；HTML 不被缓存写进外部约束（DESIGN §2.2、§8）
- G-M4 · MUST：发布状态没有并发锁；`kept[1]` 缺失时无定义；状态损坏仍允许部署 —— status: fixed `0609c26`：每个环境一把锁 + GitHub 串行；无回滚目标不自动回滚；状态损坏拒绝生产部署，`adopt` 重建（DESIGN §5、§6）
- G-M5 · MUST：固定端口的单容器先换后检，候选镜像起不来时旧容器已经没了 —— status: fixed `0609c26`：临时端口试启动，旧容器只停不删，失败即恢复（DESIGN §2.1、§6）
- G-M6 · MUST：收缩迁移之后，回滚到仍依赖被删对象的保留镜像会出错 —— status: fixed `0609c26`：收缩步标注带版本，更早的镜像不作回滚目标（DESIGN §7-9；REQ §5.6-c）
- G-M7 · MUST：角色没写成功或令牌未刷新时后台被锁；预发布回滚到旧镜像时后台读不了 —— status: fixed `0609c26`：推代码前 SQL 核对角色；登录检查由 `pr-checklist` 强制；预发布回滚到旧镜像时后台打不开，接受（DESIGN §3、§9）
- G-M8 · MUST：按名称匹配迁移，放过了「已执行后又被改过」的迁移 —— status: fixed `0609c26`：已进入 main 的迁移不可再改，闸门检查；执行记录是否存 SQL 原文待查（DESIGN §7-8、§10 Q4；REQ §5.7-d）
- G-M9 · MUST：假 `.env` 标记检查证明不了真实密钥不在镜像里；分支工作流持有 Access token，作用域未说明 —— status: fixed `0609c26`：构建参数只有 `NEXT_PUBLIC_*`；CI 里没有 service-role；Access token 的风险接受（DESIGN §7-3；REQ §5.1-a、§6）
- G-M10 · MUST：若干判据（§5.4-c、§5.6-a/b、§5.7-c、§5.11-a）在设计里没有归属；`DEPLOYMENT.md` 仍写着在 VPS 上构建 —— status: fixed `0609c26`：DESIGN §11 判据归属表；手册随 Batch 4–6 同步改（DESIGN §9、§11）
- G-S1 · SHOULD：迁移 lint 会误报函数体里的 `delete from`（`save_content_item`）；放宽 `drop … if exists` 又会放过 `drop table if exists` —— status: fixed `0609c26`：只看顶层语句，跳过函数体；`drop table if exists` 仍算破坏（DESIGN §2.1；REQ §5.7-a 测试）
- G-S2 · SHOULD：预发布容器没有内存、CPU、进程数上限 —— status: fixed `0609c26`：预发布容器设内存、CPU、进程数、日志上限（DESIGN §2.1）
- G-S3 · SHOULD：清缓存方式未定（即 DESIGN §10 Q1） —— status: fixed `0609c26`：维持 DESIGN §10 Q1，Batch 6 开工前查清
- G-S4 · SHOULD：自己实现 `.dockerignore` 的匹配，未必与 Docker 的语义一致 —— status: fixed `0609c26`：键由 Docker 的键阶段在实际上下文上算，不自己实现匹配（DESIGN §2.1）
- G-N1 · NICE：Auth 公开设置接口的前提应列进开放问题 —— status: fixed `0609c26`：列为 DESIGN §10 Q3

**批次证据**：
- Batch 1（`2e981db`，本机 Docker）：只改文档键不变、改代码键变、重算一致；植入标记构建后镜像无 `.env`、无标记；拿掉 `.env*` 排除后检查报红（`/app/.env`、`/app/.env.production`），证明不空转
- Batch 2（`85d0f06`）：lint 对现有 7 条全过；改一条已执行的迁移、加一条未标注的删列，各报红（退出码 1）；5 条执行记录补登后 `list_migrations` 列出 7 条，每条存的 SQL 与文件（去掉末尾换行）md5 一致（§5.7-c 证据）
- Batch 3（`e5f55ba`）：`db-function-check` 的 §5.8-a 全绿，`is_admin()` 对谁都放行时报红；本机界面闸门 32 过（含 §5.8-a/b/c），运行时 24 过；生产：备份 1 小时 20 分内，`admin_read` 执行并核对（记录内容哈希一致、6 条策略、函数在），唯一用户经邮箱哈希比对确认后标上 `role`；TD-023 登记
- Batch 4（进行中）：线上生产站点文件与仓库改动前一致；nginx 装上共用片段与预发布站点后 `nginx -t` 通过、reload 后生产 200；首次在 VPS 运行 `release.sh`：迁移核对通过（名称 + 内容哈希），arm64 镜像在临时端口起不来被拒、预发布未动（G-M5 生效）；从笔记本传 104 MB 镜像 16 秒；§5.3-a：不带凭据访问预发布 `/en`、`/api/build`、`/admin/login` 均 302 到 `antelacus-ci.cloudflareaccess.com` 登录页
- Batch 5（运行 36515820414 → 36518886837）：前四次各拦下一个真问题，全部修复——① `db-function-check` 探测到 Postgres 初始化用的临时服务器（改走 TCP）；② Google Fonts 偶发取不到字体致构建失败（重跑恢复，再现即登记债务）；③ 键的输出目录混进构建上下文，镜像内的键与标签不符，被 `release.sh` 的构建标识核对拒绝、预发布未动（改到 `$RUNNER_TEMP`，image 任务另加「镜像内键 = 标签」检查，删掉 VPS 上标签不符的镜像）；④ 健康检查被 Docker 端口代理的连接重置骗过（改为自循环）；⑤ `docker --env-file` 保留 dotenv 引号，预发布读库页面全 500——生产 `.env` 同样带引号，未修即会在切换时打垮生产（改为规范化后交给 Docker；另加 `restart`）。第五次：镜像复用未重建（同键不重建），预发布部署、`staging-check`（§5.3-a/b/d、有库运行时 24 项、线上 nginx 一致、记为已验过）全绿
- §5.4-a/b：main 的分支保护读出——必需检查 `staging-check`、`pr-checklist`，strict（须同步），须经 PR，`enforce_admins` 开，禁止强推与删除
- §5.6-b 手动回滚（预发布，演练分支 `rehearsal/rollback`，已删）：在新键 `1ed105f9…` 上点名退回 `fdb36a84…`，6 秒，报出的构建标识一致，被退下的镜像移出可回滚列表
- §5.6-a 自动回滚（运行 36535649445）：第三个键部署成功、§5.3-d 通过，故意失败的检查报红，`staging-rollback` 5 秒内退回 `fdb36a84…`，运行为红；生产全程未动
- 耗时：SSH 慢是 VPS 防火墙的频率限制（`ufw LIMIT`：30 秒内同一地址第 6 次新连接被丢弃），限制保留，改为每个任务一次 keyscan、一条复用连接——`image` 82→17 秒、部署预发布 79→8 秒、预发布检查 95→22 秒，推送到「预发布验过」9.5→7.2 分（36529993385 → 36538068187）；关键路径只剩界面闸门（约 6.6 分），浏览器已缓存。axe 并行与界面闸门分机并行未做，收益与成本见 TECHNICAL_DEBT
- Batch 7（`a59fad1`，36542412260）：TD-021 九处补强各经「正常为绿、植入即红」（C-12/14/15/16/17/18/21×2 对假站点，C-22 对单元输入）；存储上传端到端（§5.10-b）、登出（§5.10-c）、后台各类型与关于页入清单，axe 判定 68→76 个组合（§5.10-d）。新覆盖找出两处：项目链接行的 `select` 无名称（axe `select-name`，已修）；未知条目的 404 是 Next 裸错误文档（TD-025，P2，十个假设已排除，Codex 诊断中）。浏览器缓存命中但只省约 2 秒——装系统库（50 秒）才是大头

**Phase 4 证据**：（Phase 4 填写）

**评审发现登记**（Codex 发布前审查，xhigh，最终树；J1 `release.sh`+`decide.mjs`、J2 `production.yml`+`.github/actions/vps`、J3 `admin_read.sql`+`admin-auth.ts`、J4 REQ 对验收测试；引文已抽核）：
- J1-F01 · MUST：预发布与生产各持一把锁，却读写同一个状态文件 —— status: fixed：一把全局锁，拿不到则等待——演练 R4：两次 restart 同时发起，B 在 A 结束后才开始
- J1-F02 · MUST：切换成功后写状态失败，`promote` 红而不核验、不回滚 —— status: fixed：状态写成功才删旧容器，写失败即恢复——演练 R2：临时文件位置放目录，写失败后切换前的同一个容器恢复服务
- J1-F03 · MUST：停掉旧容器后改名失败，生产停着 —— status: fixed：停止或改名失败都把旧容器拉回来——未演练（改名失败无法在 VPS 上安全制造）；恢复路径与 R2 共用
- J1-F04 · MUST：中断后重试会先删掉唯一的旧容器 —— status: fixed：切换前先修复中断留下的现场——演练 R1：旧容器停掉并改名、原名空缺，restart 先恢复再切换
- J1-F05 · MUST：旧容器在公网核验前就被删，回滚用当前 `.env` 重建，`.env` 改坏时退不回 —— status: accepted：`.env` 改坏时退回旧镜像也修不好；改回 `.env` 再 `restart`（手册第 9 步）
- J1-F06 · MUST：回滚的收缩步取自发布包里的迁移，而非生产已执行的记录 —— status: fixed：收缩步取自生产的执行记录，读不到才退回发布包并警告——演练 R6：回滚无警告
- J1-F07 · MUST：回滚不比对保留镜像的镜像 ID —— status: fixed：回滚比对镜像 ID——演练 R5：标签改指别的镜像后回滚被拒
- J1-F08 · MUST：`if` 里调用 `run_container`，环境文件转换失败被吞掉 —— status: fixed：显式检查环境文件转换，读不了、转出为空都拒绝——演练 R3：权限 000 与只有注释两种，预发布未动
- J1-F09 · SHOULD：状态文件损坏时预发布会把它覆盖掉 —— status: fixed：状态损坏时两个环境都拒绝——演练 R7：损坏文件原样保留
- J1-F10 · SHOULD：自动回滚只看上一个镜像，不继续找兼容的 —— status: fixed：按序找第一个兼容的保留镜像——§5.6-c 单元测试加「版本倒挂」一例
- J1-F11 · SHOULD：已验列表挤掉后，生产 `restart` 被拒 —— status: fixed：restart 的镜像等于生产当前记录的那个时不查已验列表——未演练（只有生产走这条）
- J2-M1 · MUST：分支代码拿得到部署密钥 —— status: accepted：只有 Jason 能推分支；fork 的 PR 拿不到 Secrets；风险在 Phase 6 写进 REQ §6
- J2-M2 · MUST：手动回滚可以从任意分支触发，用那个分支的脚本与迁移 —— status: fixed：手动回滚只在 main 上触发，并检出 main——§5.6-a 测试
- J2-M3 · MUST：`verify` 被取消时不回滚 —— status: fixed：`verify` 只要不是 success 就回滚——§5.6-a 测试
- J2-S1 · SHOULD：没有兼容的回滚目标时坏镜像留在线上（REQ 已写明） —— status: accepted：REQ §5.6 已定（没有目标时不自动回滚，运行为红）
- J3-SEC01…04 · SHOULD：撤销角色后旧令牌到期前仍可读草稿；应用与 RLS 对角色的判断在重新登录前不一致；畸形声明报错而非判否；内容表的写权限依赖 Supabase 默认授予（待核） —— status: accepted：单管理员站点；SEC-04 的写权限在生产上一直正常
- J4-RP001 · MUST：§5.11-a 尚无证据 —— status: open → Phase 4 的真实发布
- J4-RP002 · MUST：§5.7-c 的单元测试只查名称唯一 —— status: accepted：每次部署都按名称与内容哈希逐条核对执行记录，缺一条或改过一条即拒绝——持续生效；Phase 6 写进 DESIGN §11
- J4-RP003…009 · SHOULD：§5.4-a/b 无仓库内检查；§5.3-b 在非预发布运行时被跳过；§5.10-b「页面上加载」是可选断言；§5.10-d 只查清单成员；§5.9-c 只查变量名；§5.5-e 未断言精确集合；过时的 todo 注释 —— status: RP004 fixed（工作流以 staging/production 运行的静态检查）；RP005 fixed（存储桶返回图片、预览渲染出该地址的 `<img>`；浏览器加载在合成环境受 CSP 所限——存储为 http、CSP 只放行 https）；RP007 fixed（格式化程序的测试）；RP008 fixed（精确集合）；RP009 fixed（过时注释删除）；RP003、RP006 accepted（分支保护读出为证；各后台页面由 axe 检查真实打开）
- J4-RP010 · NICE：沙盒里 `mkdtemp` 无权限 —— status: accepted：沙盒权限，与代码无关

**评审发现登记**（`/code-review` high，`main...feat/release-pipeline`，同模型，整版一次；按 Claude 提议处置，第一区裁定）：
- R-1 · MUST：`.dockerignore` 排除了 `Dockerfile`，只改 Dockerfile 时键不变，改动永不构建上线 —— status: fixed：Dockerfile 进构建上下文——§5.1-b 加断言，旧 `.dockerignore` 下报红
- R-2 · MUST：`pruneImages` 删掉别的运行刚载入、尚未部署的镜像 —— status: fixed：只清理构建于 6 小时之前的镜像，取不到时间的保留——单元测试；预发布演练中只清掉 5 天前无人引用的标签
- R-3 · MUST：`staging` 与 `staging-check` 分成两个任务，中间可插入别的分支部署，检查核对错镜像、回滚掉别人的部署 —— status: fixed：部署、检查、回滚合成一个 `staging-check` 任务——静态测试；证据在推送后的 *Branch* 运行
- R-4 · SHOULD：回滚后用 main 最新的运行时套件检查旧镜像，回滚成功也报红 —— status: fixed：回滚后只核对构建标识 + 三个地址的冒烟——静态测试
- R-5 · SHOULD：同分支新推送取消正在切换预发布的运行，预发布短暂停服 —— status: accepted：只影响预发布；R-6 修好后下一次运行自动修复
- R-6 · MUST：两个容器都在时 `reconcile` 默认新容器是好的而删掉旧的——由修 F04 时引入 —— status: fixed：以状态文件记录的镜像为准，两个都不是则拒绝——演练 R8：未记录的新容器与已记录的旧容器并存，restart 先恢复旧容器再切换；已记录的容器旁留一个过期的 `-previous`，restart 删掉它后照常切换；生产全程 200
- R-7 · MUST：`DATABASE_URL`（含密码）出现在 `docker run` 命令行上，`ps`/`docker inspect` 可见；`db_url` 自写解析 —— status: fixed：密码经只本用户可读的 pgpass 临时文件交给 `psql`，URL 由 `dockerEnv` 解析（`pgConnection` 单元测试）——演练 R8 中迁移核对经此读到记录；`backup.sh` 登记为 TD-026
- R-8 · SHOULD：`CLAUDE.md` 仍写管理员是 `SUPABASE_ADMIN_EMAILS` 里的邮箱 —— status: fixed（暂停时随手修，T0 文件会误导下一次会话）
- R-9 · SHOULD：几处 `JSON.parse` 未包 try-catch（项目规则） —— status: fixed：`release.sh`、`timings.mjs`、`production.yml` 共 6 处包上 try-catch
- R-10 · SHOULD：`retention()` 的删除列表无人使用，与 `pruneImages` 重复，§5.2-a 测的正是它 —— status: fixed：`retention()` 删除，`afterDeploy` 自己截取五个；§5.2-a 改测 `afterDeploy` + `pruneImages`

**Phase 4 自查发现**（Claude，写 Phase 6 清单时）：
- S-1 · SHOULD：新流程不再更新 VPS 上的检出，cron 运行的 `backup.sh` 等会与仓库脱节 —— status: fixed：`production.yml` 新增 `checkout` 任务，核验通过后快进检出——证据在真实发布
- S-2 · SHOULD：`~/.cache/antelacus-release/` 下的发布包只增不减 —— status: fixed：`release.sh` 部署或回滚后只留最近 10 个——证据在下一次部署

**Phase 6 boxes**（合并 ≠ 发布）：
- [ ] 切换准备（合并前，Claude）：`release.sh production adopt` 收编 compose 起的容器（旧镜像记为 legacy，留作回滚目标）；生产 nginx 站点文件换成共用片段写法，`nginx -t`、reload，公网 200 与安全头照旧；核对生产 `.env` 仍有 `SUPABASE_ADMIN_EMAILS`（TD-023）
- [ ] 版本 PR：Claude 开 PR、跑 `/code-review` 并登记处置 → Jason 审结构与范围后合并
- [ ] 真实发布完全照 `docs/DEPLOYMENT.md` 执行（§5.11-a）：*Production* 全绿（promote、verify、tag、purge、auth），公网构建标识 = 合并提交的键，打出 `v2.5.0`
- [ ] Jason 重新登录生产后台：新读法下看得到草稿、保存成功
- [ ] CHANGELOG 条目
- [ ] TECHNICAL_DEBT 定稿：TD-021、TD-022 删除；TD-023、TD-024、TD-025 在册
- [ ] 常新文档扫尾：REQ / DESIGN 与交付一致；项目 `CLAUDE.md`、README 仍属实
- [ ] FEEDBACK 扫尾 · 路线图（v2.5.1 = TD-025）
- [ ] 各门读数：运行次数 / 改变了输出的拦截次数
- [ ] 文档预算为绿 · 记忆修剪
- [ ] **关版（最后一项）**：未了事项各归其位 → `git mv TRACK.md TRACK_v2.5.0.md`

## 四、Session-end pickup

### Session-end pickup (2026-09-29)

**Working tree state at session close**:
- Branch: `feat/release-pipeline`. HEAD (parent of the `/pause` commit landing this pickup): `6320e32`（登记 `/code-review` 发现；`CLAUDE.md` 按角色写管理员）
- Working tree: clean

**Where work stands**:
- Phase 0–3 ✅；Batch 1–8 见第二区（全部 done / Batch 8 待真实发布）。Phase 4 🔲：Codex 发布前审查已处置并修复（第三区 J1–J4，演练 R1–R7）；`/code-review` 的 10 条已登记（第三区 R-1…R-10），**待 Jason 处置**
- 已提议的处置：R-5 接受，R-8 已修，其余修（各配回归测试或演练，按治理规则不再送审）。R-6 是修 J1-F04 时引入的
- 之后：切换准备（Phase 6 清单第一项：`release.sh production adopt`——已修为合并进现有状态并在副本上演练过；生产 nginx 站点换共用片段写法；核对 `.env` 仍有 `SUPABASE_ADMIN_EMAILS`）→ 经 Jason 同意开版本 PR → Jason 照 `docs/DEPLOYMENT.md` 合并，真实发布即 §5.11-a 证据

**Test / lint state**: green — lint 0、tsc 0、单元 141 过；本机界面闸门 35 过、运行时 22 过 + 2 todo（TD-025，裁定例外）；CI `5ec3d52` 全绿

**Reconciliation (对账)** — 本版此前没有 pickup，无旧条目

**First action for next session**: 请 Jason 对第三区 R-1…R-10 的提议处置表态；认可后依次修 R-1、R-2、R-3、R-4、R-6、R-7、R-9、R-10（R-7 另把 `backup.sh` 的同样写法登记为 TD），每条带回归测试或预发布演练，推送后看 *Branch* 运行全绿。

**Decisions awaiting Project Lead**:
1. `/code-review` 发现的处置（第三区 R-1…R-10 各条的「提议」）
2. 修完之后，同意开版本 PR

**Reference state** (verify before relying on):
- 记忆：`feedback-reply-in-chinese.md`（中文答复）· `feedback-vps-reachable.md`（`ssh vps-deploy` 可用）· `reference-mac-proxy-fake-ip.md`
- 预发布跑 `antelacus:1a79ad9b…`（已验过）；生产仍是 compose 起的 v2.4.1 容器 `antelacus`，**状态文件里还没有生产条目**（adopt 未在真文件上运行）
- 没有进行中的 Codex 任务；VPS 上 `~/.cache/antelacus-release/` 有一个 `manual-p4` 手工演练包，可删
- 界面闸门约 6.4 分，推送到预发布验过约 7 分；数字见第三区耗时一条

