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

## 二、批次

批次在 Phase 2 设计定稿时切分。

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

**Phase 4 证据**：（Phase 4 填写）

**Phase 6 boxes**：Phase 4 收尾时写入。

## 四、Session-end pickup
