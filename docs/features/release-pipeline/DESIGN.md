# DESIGN — release-pipeline

## 1 引言
### 1.1 参考
- 需求：`docs/features/release-pipeline/REQ.md`；裁定与诊断发现：同目录 `TRACK.md`
- 继续有效的上一版设计：`docs/features/routing-slimdown/DESIGN.md` §7–§8（路由与缓存）；`docs/features/visual-upgrade/DESIGN.md` §2.5（界面闸门）
### 1.2 术语
见 REQ §1.4。另：
- **发布脚本**：在 VPS 上执行一次部署、回滚、清理的唯一入口（§2.1）。
- **状态文件**：VPS 上记录每个环境当前运行哪个镜像、生产保留了哪 5 个镜像的文件（§5）。

## 2 总体设计

### 2.1 模块关系
| 模块 / 文件 | 单一职责 | 测试层级 |
|-------------|---------|----------|
| `.dockerignore`（改） | **构建输入的唯一定义**：不在这里排除的文件才进镜像，也才参与算构建输入键。排除 `.env*`、`docs/`、`*.md`、`.github/`、`tests/` 等 | infra |
| `Dockerfile`（改） | 公开值以 `ARG` 进入构建阶段，并把构建输入键写进镜像（环境变量 `BUILD_KEY`）；运行阶段不变 | infra |
| `scripts/release/build-key.mjs`（新） | 按 `.dockerignore` 列出构建上下文里的文件，对「路径 + 内容哈希」排序求哈希，再并入全部构建参数的名与值，得到构建输入键 | core |
| `scripts/release/migration-lint.mjs`（新） | 判定一条迁移是否带有破坏性语句（`drop table/column/schema`、`truncate`、`rename`、`alter column … type`、`delete from`），以及它是否带有收缩步标注。重建触发器、策略、函数的 `drop … if exists` 不算破坏 | core |
| `scripts/release/decide.mjs`（新） | 发布时的纯判定：保留哪 5 个镜像、要删哪些；版本号是否变了（决定是否打 tag）；哪些路径变了、要清哪些缓存；仓库里有哪些迁移在执行记录里找不到（按名称） | core |
| `scripts/release/release.sh`（新） | **发布脚本**，一个深模块。接口只有 `release.sh <staging\|production> deploy <键>`、`rollback [<键>]`、`status`。内部负责：载入镜像、核对迁移、换容器、本机健康检查、更新状态文件、清理镜像。由 CI 经 SSH 通过标准输入执行，所以运行的永远是**被部署那个提交里的版本**，而不是 VPS 检出里的版本 | IO |
| `deploy/nginx/antelacus-proxy.conf`（新） | 生产与预发布**共用**的代理配置：缓冲、代理请求头、安全响应头 | infra |
| `deploy/nginx/www.antelacus.com.conf`（改）、`deploy/nginx/staging.antelacus.com.conf`（新） | 两个站点只在 `server_name`、上游端口和 `X-Robots-Tag` 上不同，其余都 `include` 共用的那份 | infra |
| `src/app/api/build/route.ts`（新） | 报出 `BUILD_KEY`；`no-store`，不被任何一层缓存 | IO |
| `.github/workflows/branch.yml`（新，取代 `check.yml`） | 非 main 分支的 push 和手动指定 SHA：闸门 → 构建镜像 → 传给 VPS → 部署预发布 → 预发布检查 | infra |
| `.github/workflows/production.yml`（新，取代 `deploy.yml`） | main 的 push：晋升 → 核验 → 失败则回滚；核验通过后打 tag、清缓存、核对 Auth。另有手动回滚入口 | infra |
| `tests/runtime/acceptance.runtime.mjs`（改） | 请求可以带上 Access 的 service token（从环境变量读）；TD-021 的补强 | IO |
| `src/lib/server/admin-auth.ts`（改） | 管理员身份改读 `app_metadata.role`。读用 `getAdminReadClient`（登录会话），写用 `getAdminServiceRoleClient`（只在写入路径上） | core |
| `supabase/migrations/<ts>_admin_read.sql`（新） | `public.is_admin()`；给内容各表、`site_pages` 加「管理员可读全部」的策略 | IO |
| `docker-compose.yml`（删） | 容器参数只在发布脚本一处定义。见 §10 Q3 | — |

依赖方向：工作流 → 发布脚本 → 状态文件 / Docker。纯判定全放在 `decide.mjs`、`build-key.mjs`、`migration-lint.mjs` 里，发布脚本只做 IO。守住这一点的是：发布脚本里不出现任何判定逻辑，判定都去调用那三个模块；它们各有单元测试。

### 2.2 数据流
```
push 分支 ─► branch.yml
  ├─ check：lint · tsc · 单元 · 构建（占位值）· proxy 已注册 · 迁移 lint · db-function-check
  ├─ ui：本地 Supabase 栈（开存储服务）+ 界面检查 + 有库运行时套件
  └─ image：算构建输入键 → docker build（生产公开值）→ 断言镜像里没有 .env
        └─ 三项都绿 ─► docker save | gzip | ssh ─► VPS: docker load  antelacus:<键>
              └─► release.sh staging deploy <键> ─► 预发布容器 :3003
                    └─► staging-check：经 https://staging.antelacus.com（带 service token）
                          构建标识 = 键 · 有库运行时套件 · 线上 nginx 与仓库一致
                          ═► 合并的必需检查

合并 PR ─► main push ─► production.yml（不跑闸门、不构建）
  └─► 算合并提交的键 ─► release.sh production deploy <键>（镜像不存在则拒绝）
        └─► verify：经 https://www.antelacus.com  构建标识 = 键 · 有库运行时套件
              ├─ 失败 ─► release.sh production rollback ─► 再核验 ─► 运行为红
              └─ 通过 ─► 版本号变了则打 tag · 相关路径变了则清缓存 · Auth 核对（红也不回滚）
```
「同一个产物」靠的是：分支必须与 main 同步才能合并，所以合并提交的构建上下文和分支最后一次提交相同，键也相同。键又只由构建上下文和构建参数决定（不变量 1）。

## 3 入口
- **Jason / Claude**：push 分支；在 GitHub 上合并 PR；手动运行 `branch.yml` 并指定 SHA（重新部署预发布）；手动运行 `production.yml` 的回滚（可选一个保留的键）。
- **Claude**：生产迁移（项目 `CLAUDE.md` 的规则）；nginx 站点配置有变化时，经 root SSH 放到服务器上，先 `nginx -t` 再 reload。
- **cron**（不变）：保活、备份、站点检查。

## 4 模块间契约
- **构建输入键**：64 位十六进制串。`build-key.mjs` 在 CI 和测试里都能跑，只读工作区，不读 git 历史。
- **发布脚本**：参数不对 → 退出码 2；镜像不存在、缺迁移、环境文件里出现 service-role 密钥（预发布）→ 退出码 1，并打印一行原因；成功 → 退出码 0，最后一行打印 `serving <键>`。
- **`GET /api/build`**：`200`，`{"key":"<键>"}`，`cache-control: no-store`。
- **Access**：CI 的请求带 `CF-Access-Client-Id`、`CF-Access-Client-Secret` 两个请求头。运行时套件在环境变量 `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` 存在时自动带上。
- **后台读写**：读 = `getAdminReadClient()`，要求管理员、返回登录会话的客户端；写 = `getAdminServiceRoleClient()`，要求管理员，并且要有密钥。没有密钥时，写入动作返回 `Read-only environment — not saved.`，不抛异常。

## 5 持久化数据
- **VPS 状态文件** `/home/deploy/.local/state/antelacus/releases.json`：`{ staging: {key, sha}, production: {key, sha, version}, kept: [{key, sha, version}] }`，`kept` 里最多 5 项，新的在前。只由发布脚本写，写的时候先写临时文件再改名，避免写一半。
- **镜像**：`antelacus:<键>`，保留的是 `kept` 里的镜像，外加预发布正在用的那个。
- **迁移执行记录**：`supabase_migrations.schema_migrations`（Supabase 的标准表），按 `name` 匹配。
- **管理员身份**：`auth.users.raw_app_meta_data.role = 'admin'`。

## 6 异常流
全部 fail-closed：拿不准就不部署，因为不部署的代价只是晚一点上线。
- 预发布部署失败（镜像没载入、缺迁移、健康检查失败）→ 预发布保持原样，`staging-check` 不会变绿，PR 无法合并。
- 生产找不到这个键的镜像 → 拒绝部署，生产不动（REQ §5.5）。
- 生产核验失败 → 回滚到 `kept[1]` 并再核验一次。再核验也失败 → 运行为红，保持在回滚后的状态，由人来处理，不再自动来回切换。
- Auth 核对失败 → 单独一个任务变红，生产不动。
- 清缓存、打 tag 失败 → 任务变红，生产不动。这两项可以手动补做。
- 状态文件缺失或损坏 → 发布脚本拒绝执行生产的回滚和清理（不知道哪些镜像是保留的），部署仍可进行，并重建状态文件。

## 7 不变量
1. 构建输入键只取决于构建上下文（由 `.dockerignore` 定义）和构建参数 —— `build-key` 单元测试（§5.1-b）。
2. 镜像里没有 `.env*`，也没有标记密钥 —— image 任务在构建上下文里放一个带标记的假 `.env`，构建后断言镜像里找不到（§5.1-a）。这个检查每次运行都真的放了一个假文件，所以不会空转。
3. 任何部署路径都不在 VPS 上构建 —— 静态测试扫描工作流和发布脚本（§5.1-c）。
4. 生产与预发布的 nginx 只在允许的三处不同 —— 静态测试比较两个站点文件；`staging-check` 比较线上配置和仓库。
5. 预发布不持有 service-role 密钥 —— 发布脚本在启动预发布容器前检查环境文件，出现密钥就拒绝启动（§5.3-c）。
6. service-role 客户端只出现在写入路径上 —— 在 `service-role-guard.test.ts` 的基础上扩展（§5.8-d）。
7. 仓库里每条迁移在生产都有执行记录，而且迁移名不重复 —— 发布脚本核对；迁移名唯一由单元测试守住。
8. 公开页面保持可缓存 —— 沿用 routing-slimdown 的运行时检查；`/api/build` 是唯一新增的 `no-store` 路由，而且它不在 `[locale]` 之下。

## 8 外部系统约束
- **Next 16.3.5**：standalone 输出会复制构建时载入的 `.env`、`.env.production`；`NEXT_PUBLIC_*` 在构建时写死，CSP 的 `img-src` 和 `images.remotePatterns` 也读它（`next.config.ts`）。所以镜像只能对应一个 Supabase 项目。
- **Cloudflare**：
  - 源站只放行 Cloudflare 的 IP，证书为通配符 `*.antelacus.com`；
  - Access 免费档就能保护单个子域，CI 用 service token 通过，策略动作必须是 Service Auth；
  - 清缓存的方式在免费档上是否可用见 §10 Q1；
  - `goodman.antelacus.com` 和本站在同一个 zone 里，所以「清除全部缓存」会连带清掉它。
- **Supabase**：
  - 迁移执行记录按**执行时刻**编号，和文件名的时间戳不同，所以按名称匹配；
  - 已有记录只有前 2 条，后 5 条要补登；
  - `list_tables` 给的行数是统计估计值，核对要用精确计数；
  - `GET /auth/v1/settings` 是公开接口，返回 `disable_signup`、`mailer_autoconfirm`；托管版是否只凭公开密钥就放行，Batch 4 实测；
  - 后台只用密码登录，预发布域名推断不需要配置回调地址，以预发布上的一次真实登录为准；
  - JWT 里的 `app_metadata` 要等下次刷新令牌才会更新：改完角色要重新登录。
- **VPS**：
  - 6 核，内存可用 5 GiB，端口 3000–3002 已占用，3003 空闲；
  - deploy 用户读不了证书，也改不了 nginx，这两件事要用 root；
  - `DATABASE_URL` 是会话池（session pooler）连接串，因为直连地址只有 IPv6。
- **GitHub**：
  - 必需检查按**任务名**匹配，所以 `staging-check` 这个任务名一旦定下就不能改；
  - 分支保护可以要求分支与 main 同步；
  - 用 `GITHUB_TOKEN` 打 tag 需要 `contents: write`；
  - 推送 tag 不会触发 `branches` 过滤的工作流。
- **Docker**：29.8.1，Compose v5.5.1。

## 9 其他设计
- **后台读取的先扩后缩**：
  - 本版的迁移只加 `is_admin()` 和策略（扩），在代码之前执行，Jason 的账号同时标上 `role`。
  - 新代码不再读 `SUPABASE_ADMIN_EMAILS`，但生产 `.env` 里暂时保留这个变量，这样回滚到 v2.4.1 时后台照样能用。
  - 到下一版确认不会再回滚到 v2.4.1 之后，再把它从 `.env` 删掉（缩）。这一项登记进 TECHNICAL_DEBT。
- **预发布的缓存**：预发布有自己的 `unstable_cache`，生产保存之后，预发布最多晚半小时看到变化。这可以接受，文档里写明即可。
- **耗时读数**：每个工作流最后一步用 `gh api` 取本次运行各任务、各步骤的耗时，写进 `$GITHUB_STEP_SUMMARY`（需要 `actions: read`）。发布脚本各段的耗时由它自己打印。
- **不用镜像仓库**，因为仓库是私有的，VPS 拉取私有镜像只能用 classic 令牌，而它能读账号下全部私有镜像（REQ §1.2）。

## 10 开放设计问题
- Q1 **清缓存用哪种方式**：按文件清（所有档都有）还是按前缀清（免费档是否可用待查）？`/og.png` 有多种语言的路由，按文件清就要列全它们的地址。Batch 4 开工前查清。
- Q2 **从 GitHub 的机器传 130 MB 到 VPS 要多久**：Batch 2 实测。太慢的话，就改成只传镜像的变化层。
- Q3 **删掉 `docker-compose.yml`**：容器参数只在发布脚本里定义，一件事只有一个存放处。代价是运维时不能再用 `docker compose logs`，改用 `docker logs antelacus`。需要 Jason 裁定。
