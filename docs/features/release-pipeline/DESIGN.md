# DESIGN — release-pipeline

## 1 引言
### 1.1 参考
- 需求：`docs/features/release-pipeline/REQ.md`；裁定、诊断发现与设计门发现：同目录 `TRACK.md`
- 继续有效的上一版设计：`docs/features/routing-slimdown/DESIGN.md` §7–§8（路由与缓存）；`docs/features/visual-upgrade/DESIGN.md` §2.5（界面闸门）
### 1.2 术语
见 REQ §1.4。另：
- **发布脚本**：在 VPS 上执行一次部署、回滚、清理的唯一入口（§2.1）。
- **状态文件**：VPS 上的一个文件，记录每个环境当前运行哪个镜像、哪些镜像在预发布上验过、生产保留了哪 5 个镜像（§5）。
- **键阶段**：Dockerfile 的第一个阶段。它把 Docker 实际使用的构建上下文复制进来，算出构建输入键（§2.1）。

## 2 总体设计

### 2.1 模块关系
| 模块 / 文件 | 单一职责 | 测试层级 |
|-------------|---------|----------|
| `.dockerignore`（改） | **构建输入的唯一定义**：不在这里排除的文件才进构建上下文。排除 `.env*`、`docs/`、`*.md`、`.github/`、`tests/` 等 | infra |
| `Dockerfile`（改） | 分三个阶段：键阶段 → 构建 → 运行。构建阶段的 `ARG` 只有 `NEXT_PUBLIC_*`。键写成镜像里的文件 `/app/BUILD_KEY`，不用环境变量，所以 `.env` 覆盖不了它 | infra |
| `scripts/release/build-key.mjs`（新） | 对一个目录里的全部文件，按「路径 + 内容哈希」排序后求哈希，再并入构建参数的名与值。它在键阶段里运行，读的是 Docker 复制进来的上下文，所以不用自己实现 `.dockerignore` 的匹配规则 | core |
| `scripts/release/migration-lint.mjs`（新） | 只看**顶层语句**，跳过函数体（`$$ … $$`）：<br>① 有没有破坏性语句（`drop table/column/schema/type/view`，包括 `if exists` 的写法；`truncate`；`rename`；`alter column … type`；顶层的 `delete from`），有就要求带收缩步标注 `-- contract: <删的是什么>, unused since v<X.Y.Z>`。重建触发器、策略、函数的 `drop … if exists` 不算破坏；<br>② 本次改动里有没有修改或删除已经进入 main 的迁移文件：已执行的迁移不可再改 | core |
| `scripts/release/decide.mjs`（新） | 发布时的纯判定：<br>- 保留哪 5 个镜像、要删哪些；<br>- 回滚目标：取上一个保留镜像，但要跳过收缩迁移之后已经不兼容的镜像；没有可用的目标就返回空；<br>- 预发布的环境文件有没有问题；<br>- 版本号是否变了（决定是否打 tag）；<br>- 哪些路径变了、要清哪些缓存；<br>- Auth 设置有没有问题；<br>- 仓库里哪些迁移在执行记录里找不到 | core |
| `scripts/release/release.sh`（新） | **发布脚本**，一个深模块。接口只有 `release.sh <staging\|production> deploy <键>`、`rollback [<键>]`、`status`、`adopt`（手动重建状态文件）。<br>内部依次：拿到该环境的锁（`flock`）→ 镜像不在就停下 → 核对迁移 → 在临时端口上试启动新镜像，健康了才动旧容器 → 旧容器改名、只停不删 → 新容器接管正式端口；起不来就把旧容器拉回来 → 更新状态文件 → 清理镜像。<br>预发布容器带内存、CPU、进程数和日志大小的上限。<br>它由 CI 经 SSH 通过标准输入执行，所以运行的永远是**被部署那个提交里的版本**，而不是 VPS 检出里的版本 | IO |
| `deploy/nginx/antelacus-site.conf`（新） | 生产与预发布**共用**的代理配置：缓冲、代理请求头、安全响应头 | infra |
| `deploy/nginx/www.antelacus.com.conf`（改）、`deploy/nginx/staging.antelacus.com.conf`（新） | 两个站点只在 `server_name`、上游端口和 `X-Robots-Tag` 上不同，其余都 `include` 共用的那份 | infra |
| `src/app/api/build/route.ts`（新） | 读 `/app/BUILD_KEY` 并报出；`no-store`，不被任何一层缓存 | IO |
| `.github/workflows/branch.yml`（新，取代 `check.yml`） | 非 main 分支的 push，以及手动指定一个 SHA：闸门 → 镜像 → 部署预发布 → 预发布检查 | infra |
| `.github/workflows/pr-checklist.yml`（新） | PR 打开、编辑、有新提交时运行：PR 描述里「已登录预发布看过后台」的框没勾，就变红。它是合并的必需检查，不跑闸门、不需要任何凭据 | infra |
| `.github/workflows/production.yml`（新，取代 `deploy.yml`） | main 的 push：晋升 → 核验 → 失败则回滚；核验通过后打 tag、清缓存、核对 Auth。另有手动回滚入口 | infra |
| `tests/runtime/acceptance.runtime.mjs`（改） | 请求可以带上 Access 的 service token（从环境变量读）；TD-021 的补强 | IO |
| `tests/runtime/release.runtime.mjs`（新） | 只有部署好的预发布或生产才能回答的检查（REQ §5.3-a/b/d、§5.5-b） | IO |
| `src/lib/server/admin-auth.ts`（改） | 管理员身份改读 `app_metadata.role`。读用 `getAdminReadClient`（登录会话），写用 `getAdminServiceRoleClient`（只在写入路径上） | core |
| `supabase/migrations/<ts>_admin_read.sql`（新） | `public.is_admin()`；给内容各表、`site_pages` 加「管理员可读全部」的策略 | IO |
| `docker-compose.yml`（删） | 容器参数只在发布脚本一处定义；运维查日志用 `docker logs antelacus` | — |

依赖方向：工作流 → 发布脚本 → 状态文件 / Docker。纯判定全放在 `decide.mjs`、`build-key.mjs`、`migration-lint.mjs` 里，发布脚本只做 IO。守住这一点的是：发布脚本里不出现任何判定逻辑，判定都去调用那三个模块；它们各有单元测试。

### 2.2 数据流
```
push 分支 ─► branch.yml
  ├─ check：lint · tsc · 单元 · 构建（占位值）· proxy 已注册 · 迁移 lint · db-function-check
  ├─ ui：本地 Supabase 栈（开存储服务）+ 界面检查 + 有库运行时套件
  └─ image：键阶段算出键 → VPS 上已有 antelacus:<键>？
        ├─ 有：跳过构建和传输（同一个键永不重建）
        └─ 没有：docker build（只带 NEXT_PUBLIC_*）→ 断言镜像里没有 .env 和标记
                 → docker save | gzip | ssh ─► VPS: docker load
  三项都绿 ─► staging-check（部署、检查、回滚在同一个任务里，中间插不进别的部署）
        release.sh staging deploy <键> ─► 预发布容器 :3003
        └─► 经 https://staging.antelacus.com（带 service token）
              构建标识 = 键 · 有库运行时套件 · 经 SSH 比对线上 nginx 与仓库
              通过 → 状态文件记下「这个键的这个镜像 ID 在预发布上验过」
              ═► 合并的必需检查，与 pr-checklist 一起

合并 PR ─► main push ─► production.yml（不跑闸门，只跑键阶段来算键）
  └─► release.sh production deploy <键>
        （镜像不存在，或它的镜像 ID 没在预发布上验过 → 拒绝）
        └─► verify：经 https://www.antelacus.com  构建标识 = 键 · 有库运行时套件
              ├─ 失败 ─► release.sh production rollback ─► 核对构建标识 + 冒烟 ─► 运行为红
              └─ 通过 ─► 版本号变了则打 tag
                         相关路径变了则清缓存，清完再取一次确认是新的
                         Auth 核对（红也不回滚）
```
「同一个产物」由三件事共同保证：
1. 分支必须与 main 同步才能合并，所以合并提交的构建上下文和分支最后一次提交相同，键也相同；
2. 同一个键永不重建，所以一个键在 VPS 上只对应一个镜像 ID；
3. 生产只接受在预发布上验过的镜像 ID。

## 3 入口
- **Jason / Claude**：push 分支；在 GitHub 上合并 PR；手动运行 `branch.yml` 并指定 SHA（重新部署预发布）；手动运行 `production.yml` 的回滚（可选一个保留的键）。
- **Claude**：
  - 生产迁移（项目 `CLAUDE.md` 的规则）；
  - Batch 3 推代码前，用 SQL 核对 Jason 的账号已经标上 `role`；
  - nginx 站点配置有变化时，经 root SSH 放到服务器上，先 `nginx -t` 再 reload；
  - 状态文件损坏时运行 `release.sh production adopt`。
- **cron**（不变）：保活、备份、站点检查。

## 4 模块间契约
- **构建输入键**：64 位十六进制串，由键阶段输出。`build-key.mjs` 也能直接在一个目录上运行，供测试使用。
- **发布脚本**：
  - 参数不对 → 退出码 2；
  - 锁被占用、镜像不存在、镜像 ID 没在预发布上验过、缺迁移、预发布环境文件里出现 service-role 密钥、状态文件损坏（生产）、没有可用的回滚目标 → 退出码 1，并打印一行原因；
  - 成功 → 退出码 0，最后一行打印 `serving <键>`。
- **`GET /api/build`**：`200`，`{"key":"<键>"}`，`cache-control: no-store`。
- **Access**：CI 的请求带 `CF-Access-Client-Id`、`CF-Access-Client-Secret` 两个请求头。两个运行时套件在环境变量 `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` 存在时自动带上。
- **后台读写**：
  - 读 = `getAdminReadClient()`：要求管理员，返回登录会话的客户端；
  - 写 = `getAdminServiceRoleClient()`：要求管理员，并且要有密钥；
  - 没有密钥时，写入动作返回 `Read-only environment — not saved.`，不抛异常。

## 5 持久化数据
- **VPS 状态文件** `/home/deploy/.local/state/antelacus/releases.json`：
  ```
  { staging: {key, imageId, sha},
    verified: {<键>: <镜像 ID>},
    production: {key, imageId, sha, version},
    kept: [{key, imageId, sha, version}] }
  ```
  `kept` 里最多 5 项，新的在前。只由发布脚本在持锁时写，写的时候先写临时文件再改名，避免写一半。
- **锁**：每个环境一个锁文件，放在状态文件同目录；GitHub 那边另用 `concurrency` 分组，同一个环境的运行排队执行。
- **镜像**：`antelacus:<键>`。保留的是 `kept` 里的镜像，外加预发布正在用的那个。
- **迁移执行记录**：`supabase_migrations.schema_migrations`（Supabase 的标准表）。`statements` 列存着执行时的 SQL 原文，等于去掉末尾换行的文件内容。部署前的核对按 `name` 找记录，再比对内容哈希：没有记录，或者内容不同，都拒绝部署。
- **管理员身份**：`auth.users.raw_app_meta_data.role = 'admin'`。

## 6 异常流
全部 fail-closed：拿不准就不部署，因为不部署的代价只是晚一点上线。
- **新镜像在临时端口上起不来** → 旧容器从头到尾没动过，退出码 1。
- **切换时新容器起不来** → 把旧容器改回原名重新启动，退出码 1。
- **预发布部署失败** → 预发布保持原样，`staging-check` 不会变绿，PR 无法合并。
- **生产的镜像不存在，或镜像 ID 没在预发布上验过** → 拒绝部署，生产不动。
- **生产核验失败** → 回滚到 `decide.mjs` 给出的目标，再核验一次：
  - 没有可用的目标：不自动回滚，运行为红，由人来处理；
  - 再核验也失败：运行为红，保持在回滚后的状态，不再自动来回切换。
- **状态文件缺失或损坏** → 拒绝生产的部署、回滚和清理，由 Claude 运行 `adopt` 从正在运行的容器重建它；预发布照常部署。
- **Auth 核对失败** → 单独一个任务变红，生产不动。
- **清缓存、打 tag 失败** → 任务变红，生产不动。这两项可以手动补做。

## 7 不变量
1. 构建输入键只取决于 Docker 实际使用的构建上下文和构建参数 —— `build-key` 单元测试加键阶段（§5.1-b）。
2. 同一个键永不重建；生产运行的镜像 ID 一定在预发布上验过 —— 发布脚本核对状态文件里的 `verified`。
3. 镜像里没有 `.env*`，也没有标记密钥；构建参数只有 `NEXT_PUBLIC_*` —— image 任务在构建上下文里放一个带标记的假 `.env`，构建后断言镜像里找不到；静态测试检查 `ARG`（§5.1-a）。这个检查每次都真的放了一个假文件，所以不会空转。另外 CI 里根本没有 service-role 密钥，它无从进入镜像。
4. 任何部署路径都不在 VPS 上构建应用 —— 静态测试扫描工作流和发布脚本（§5.1-c）。
5. 生产与预发布的 nginx 只在允许的三处不同 —— 静态测试比较两个站点文件；`staging-check` 经 SSH 比对线上配置和仓库。
6. 预发布不持有 service-role 密钥 —— 发布脚本启动预发布容器前检查环境文件，出现密钥就拒绝启动（§5.3-c）。
7. service-role 客户端只出现在写入路径上 —— 在 `service-role-guard.test.ts` 的基础上扩展（§5.8-d）。
8. 仓库里每条迁移在生产都有执行记录，迁移名不重复，已执行的迁移不再修改 —— 发布脚本核对记录；迁移名唯一和「不可再改」由闸门守住，部署前再比对内容哈希（§5.7-b/c/d）。
9. 回滚目标与数据库兼容：收缩迁移之后，早于它所标版本的镜像不会被选为回滚目标 —— `decide.mjs` 单元测试（§5.6-c）。
10. 公开页面保持可缓存 —— 沿用 routing-slimdown 的运行时检查；`/api/build` 是唯一新增的 `no-store` 路由，而且它不在 `[locale]` 之下。

## 8 外部系统约束
- **Next 16.3.5**：standalone 输出会复制构建时载入的 `.env`、`.env.production`；`NEXT_PUBLIC_*` 在构建时写死，CSP 的 `img-src` 和 `images.remotePatterns` 也读它（`next.config.ts`）。所以镜像只能对应一个 Supabase 项目。
- **Cloudflare**：
  - 源站只放行 Cloudflare 的 IP，证书为通配符 `*.antelacus.com`；
  - HTML 页面不被缓存（`cf-cache-status: DYNAMIC`），被缓存的只有 `/og.png` 和 `/images/`（一天），所以经公网核验读到的就是新容器；
  - Access 免费档就能保护单个子域，CI 用 service token 通过，策略动作必须是 Service Auth；团队域名 `antelacus-ci.cloudflareaccess.com`，登录方式为邮箱验证码；
  - service token 的 Client Secret 只在创建时出现一次：由 Jason 在控制台创建并直接填进 GitHub，不经过 API，免得它进入对话；
  - 免费档可以按前缀清缓存，所以 `/og.png` 的各语言路由不必逐个列出；
  - `goodman.antelacus.com` 和本站在同一个 zone 里，所以「清除全部缓存」会连带清掉它。
- **Supabase**：
  - 迁移执行记录按**执行时刻**编号，和文件名的时间戳不同，所以按名称匹配；
  - 执行记录的 `statements` 存着 SQL 原文（整条迁移为一个元素），等于去掉末尾换行的文件内容；7 条已全部登记，内容与仓库一致；
  - `list_tables` 给的行数是统计估计值，核对要用精确计数；
  - `GET /auth/v1/settings` 是公开接口，只凭公开密钥就返回 `disable_signup`、`mailer_autoconfirm`；
  - 后台只用密码登录，预发布域名不需要配置回调地址（在预发布上实际登录过）；
  - JWT 里的 `app_metadata` 要等下次刷新令牌才会更新：改完角色要重新登录。撤销角色后，旧令牌在过期前（默认一小时）仍然有效。
- **VPS**：
  - 6 核，内存可用 5 GiB，端口 3000–3002 已占用，3003 空闲，临时端口从 3004 起；
  - deploy 用户读不了证书，也改不了 nginx，这两件事要用 root；deploy 用户能读 `/etc/nginx/sites-enabled/`；
  - `DATABASE_URL` 是会话池（session pooler）连接串，因为直连地址只有 IPv6；
  - 防火墙对 SSH 限频（`ufw LIMIT`：同一地址 30 秒内第 6 次新连接被丢弃，客户端要重试半分钟），所以 CI 每个任务只做一次 keyscan、所有 `ssh vps` 复用一条连接（`.github/actions/vps`）。限频是有意保留的；
  - 从 GitHub 的机器把镜像传到 VPS 只要十几秒，不需要只传变化层。
- **GitHub**：
  - 必需检查按**任务名**匹配，所以 `staging-check` 和 `pr-checklist` 这两个任务名一旦定下就不能改；
  - 分支保护可以要求分支与 main 同步；私有仓库在免费档上用不了分支保护（也用不了规则集），所以仓库是公开的；设置为：必需 `staging-check` 与 `pr-checklist`、分支须同步、必须经 PR、管理员也不能绕过、禁止强推与删除；
  - 用 `GITHUB_TOKEN` 打 tag 需要 `contents: write`；
  - 推送 tag 不会触发 `branches` 过滤的工作流。
- **Docker**：29.8.1。

## 9 其他设计
- **后台读取的先扩后缩**：
  - 本版的迁移只加 `is_admin()` 和策略（扩），在代码之前执行，Jason 的账号同时标上 `role`；
  - 新代码不再读 `SUPABASE_ADMIN_EMAILS`，但生产 `.env` 里暂时保留这个变量，这样回滚到 v2.4.1 时后台照样能用；
  - 到下一版确认不会再回滚到 v2.4.1 之后，再把它从 `.env` 删掉（缩）。这一项登记进 TECHNICAL_DEBT。
- **过渡期的已知限制**：预发布上如果回滚到本版之前的镜像，后台打不开（旧代码读取靠 service-role，而预发布没有它）。只影响预发布，本版发布后就不再出现，接受。
- **登录后的检查**：不在 CI 里放管理员账号。Jason 在预发布上手动看，由 `pr-checklist` 强制打勾。重议条件见 REQ §1.2。
- **预发布的缓存**：预发布有自己的 `unstable_cache`，生产保存之后，预发布最多晚半小时看到变化。这可以接受，手册里写明即可。
- **耗时读数**：每个工作流最后一步用 `gh api` 取本次运行各任务、各步骤的耗时，写进 `$GITHUB_STEP_SUMMARY`（需要 `actions: read`）。发布脚本各段的耗时由它自己打印。
- **不用镜像仓库**（REQ §1.2）：经 SSH 传输已经够快；用镜像仓库的话，要么把镜像公开，要么让 VPS 持有 classic 令牌，而这种令牌能读账号下全部私有镜像。
- **备份不把密钥放上命令行**（REQ §5.7-e）：`scripts/backup.sh` 的 `pg_dump` 与 `release.sh` 的 `psql` 同一做法——`pgConnection` 拆出不带密码的地址和一行 pgpass，pgpass 写进只本用户可读的临时文件、挂进容器，用完即删。存储镜像的容器同理：service-role 密钥写进临时文件挂进去，`sync-bucket.mjs` 从 `SUPABASE_SERVICE_ROLE_KEY_FILE` 读。不用 `-e` 或 `--env-file`：环境变量会出现在 `docker inspect` 里。
- **手册跟着流程一起改**：改变发布流程的批次（Batch 4、5、6），在同一个批次里更新 `docs/DEPLOYMENT.md` 里对应的部分；Batch 8 只做通读和 Phase 4 的实跑。

## 10 开放设计问题
N/A —— 当前没有开放问题。

## 11 验收判据的归属
| REQ § | 在哪里验证 |
|-------|-----------|
| 5.1-a/b/c、5.2-a、5.3-c、5.4-c/d、5.5-a/c/d/e/f、5.6-c、5.7-a/b/c/d、5.8-d、5.9-a/b/c | `tests/acceptance-release-pipeline.test.ts`（单元），另加 image 任务里的标记检查（5.1-a） |
| 5.3-a/b/d、5.5-b | `tests/runtime/release.runtime.mjs`，由 `staging-check` 和 `verify` 任务运行 |
| 5.8-a/b/c、5.10-b/c/d | `tests/ui/admin.ui.mjs`，由界面闸门运行 |
| 5.4-a/b | 证据：分支保护的读出，记进 TRACK 第三区 |
| 5.6-a/b | 证据：在预发布上演练自动回滚和手动回滚的运行号 |
| 5.7-c 的执行记录 | 证据：`list_migrations` 的读出；此后每次部署由 `release.sh` 按名称与内容哈希逐条核对，缺一条或改过一条即拒绝（单元测试只查名称唯一） |
| 5.10-a | 证据：TD-021 每一条「植入 → 变红」的运行号 |
| 5.11-a | 证据：Phase 4 真实发布的记录 |
