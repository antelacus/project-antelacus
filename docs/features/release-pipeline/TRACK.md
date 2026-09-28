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

## 二、批次

验收测试在 Phase 2 写红，每条 `todo` 标着它的批次；批次完成 = 它名下的标记去掉且全绿。所在位置：`tests/acceptance-release-pipeline.test.ts`（单元）、`tests/runtime/release.runtime.mjs`（对预发布或生产）、`tests/ui/admin.ui.mjs`（合成环境）。不是自动测试的判据在第三区记运行号或读出结果：§5.4-a/b、§5.6-a/b、§5.7-c 的执行记录、§5.10-a、§5.11-a。

### Batch 1 — 无密钥的产物
- 状态：open
- 范围：`.dockerignore`、`Dockerfile`、`scripts/release/build-key.mjs` + 测试 · 覆盖 REQ §5.1（镜像不含 `.env`；构建输入键）
- 验收判据：§5.1-a/b/c 去 todo 且绿；在本机用假 `.env` 构建一次，镜像里找不到标记
- 依赖：none

### Batch 2 — 迁移纪律
- 状态：open
- 范围：`scripts/release/migration-lint.mjs` + 测试、闸门接入；补登 5 条执行记录（Claude 经 MCP）· 覆盖 REQ §5.7（先扩后缩；执行记录）
- 验收判据：§5.7-a/c 去 todo 且绿；现有 7 条迁移全部通过 lint；`list_migrations` 列出 7 条
- 依赖：none

### Batch 3 — 后台读取与管理员身份
- 状态：open
- 范围：`<ts>_admin_read.sql`、`admin-auth.ts`、后台各页与动作、`admin/layout.tsx`、`supabase-env.ts`、`ui-check.sh`（合成管理员带 `role`）、`db-function-check.sh`（行级权限检查）、`.env.example` · 覆盖 REQ §5.8
- 验收判据：§5.8-a…d 去 todo 且绿；迁移先执行到生产、Jason 的账号标上 `role` 之后再 push 代码；`SUPABASE_ADMIN_EMAILS` 暂留在生产 `.env`，另登记 TD
- 依赖：Batch 2（lint 先守住这条迁移）

### Batch 4 — VPS 一侧
- 状态：open
- 范围：`scripts/release/release.sh`、`decide.mjs` + 测试、删 `docker-compose.yml`、`src/app/api/build/route.ts`、nginx 共用配置与预发布站点、`.env.staging`、Cloudflare DNS + Access（Jason 在控制台操作）· 覆盖 REQ §5.2、§5.3
- 验收判据：§5.2-a、§5.3-a/b/c 去 todo 且绿；手动把一个镜像部署到预发布，从手机能打开；实测传输耗时（DESIGN §10 Q2）
- 依赖：Batch 1

### Batch 5 — 工作流
- 状态：open
- 范围：`branch.yml`、`production.yml`，删除 `check.yml`、`deploy.yml`；运行时套件支持 Access；耗时摘要；分支保护（Claude 经 `gh` 改，先给 Jason 看）；PR 模板 · 覆盖 REQ §5.3-d、§5.4、§5.5-a/b/c、§5.9
- 验收判据：对应判据去 todo 且绿；§5.4-a/b 以分支保护的读出为证据
- 依赖：Batch 4

### Batch 6 — 回滚与发布后收尾
- 状态：open
- 范围：自动与手动回滚、打 tag、清缓存（先关闭 DESIGN §10 Q1）、Auth 核对；Cloudflare 清缓存令牌（Jason 批准）· 覆盖 REQ §5.5-d/e/f、§5.6
- 验收判据：对应判据去 todo 且绿；§5.6-a 在预发布上演练一次（证据）
- 依赖：Batch 5

### Batch 7 — 覆盖补强
- 状态：open
- 范围：`tests/runtime/acceptance.runtime.mjs`（TD-021）、`tests/ui/`（上传、登出、其余内容类型、关于页）、`supabase/config.toml` 与 `ui-check.sh`（打开存储服务）· 覆盖 REQ §5.10
- 验收判据：§5.10-a…d 去 todo 且绿；TD-021 每一条都有「植入 → 变红」的证据
- 依赖：Batch 3（后台读法已换）

### Batch 8 — 发布手册
- 状态：open
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
- D-6 · SHOULD：两个任务各自 `npm ci`；不读库的运行时子集被有库全量覆盖。（第二次构建不是冗余：`NEXT_PUBLIC_*` 构建时定型，换后端须重建） —— status: open → 范围 6
- D-7 · SHOULD：TD-021 的弱断言；后台界面清单只有 4 个模板，上传、登出、其余内容类型无检查 —— status: open → 范围 7
- D-8 · SHOULD：Auth 设置、Cloudflare 缓存清除、打 tag 靠手动；post-merge 钩子只提醒 —— status: open → 范围 8
- D-9 · SHOULD（部分待核）：预发布与生产同机的隔离与容量；本地栈 ES256 与生产可能的 HS256 登录行为不同 —— status: open → 范围 2、3，待核项见第一区
- D-10 · NICE：没有按步骤的耗时基线 —— status: open → 范围 9
- D-11 · SHOULD：Next standalone 输出复制 `.env`，`Dockerfile` 把它带进最终镜像，含 service-role 密钥（假 `.env` 本机构建实测；JS 文件中无密钥） —— status: open → 范围 1

**评审发现登记**（Codex 设计门，xhigh，DESIGN + REQ；全文 `codex resume 01a0e604-0b26-71d3-9222-40fea1e2dde4`；引文已逐条对源核实）：
- G-M1 · MUST：构建输入键不是产物的身份——同一个键重建会得到不同的镜像（基础镜像、npm 下载），标签会被覆盖；`BUILD_KEY` 作为环境变量可被 `.env` 覆盖 —— status: open
- G-M2 · MUST：nginx 与环境文件不在产物里；「线上 nginx 与仓库一致」没有写明机制；登录后的检查不强制 —— status: open
- G-M3 · MUST：核验经过 CDN、清缓存在核验之后，可能验到旧应用 —— status: open（前提与事实不符：HTML 为 `cf-cache-status: DYNAMIC`，只有分享图与 `/images/` 被缓存）
- G-M4 · MUST：发布状态没有并发锁；`kept[1]` 缺失时无定义；状态损坏仍允许部署 —— status: open
- G-M5 · MUST：固定端口的单容器先换后检，候选镜像起不来时旧容器已经没了 —— status: open
- G-M6 · MUST：收缩迁移之后，回滚到仍依赖被删对象的保留镜像会出错 —— status: open
- G-M7 · MUST：角色没写成功或令牌未刷新时后台被锁；预发布回滚到旧镜像时后台读不了 —— status: open
- G-M8 · MUST：按名称匹配迁移，放过了「已执行后又被改过」的迁移 —— status: open
- G-M9 · MUST：假 `.env` 标记检查证明不了真实密钥不在镜像里；分支工作流持有 Access token，作用域未说明 —— status: open
- G-M10 · MUST：若干判据（§5.4-c、§5.6-a/b、§5.7-c、§5.11-a）在设计里没有归属；`DEPLOYMENT.md` 仍写着在 VPS 上构建 —— status: open
- G-S1 · SHOULD：迁移 lint 会误报函数体里的 `delete from`（`save_content_item`）；放宽 `drop … if exists` 又会放过 `drop table if exists` —— status: open
- G-S2 · SHOULD：预发布容器没有内存、CPU、进程数上限 —— status: open
- G-S3 · SHOULD：清缓存方式未定（即 DESIGN §10 Q1） —— status: open
- G-S4 · SHOULD：自己实现 `.dockerignore` 的匹配，未必与 Docker 的语义一致 —— status: open
- G-N1 · NICE：Auth 公开设置接口的前提应列进开放问题 —— status: open

**Phase 4 证据**：（Phase 4 填写）

**Phase 6 boxes**：Phase 4 收尾时写入。

## 四、Session-end pickup
