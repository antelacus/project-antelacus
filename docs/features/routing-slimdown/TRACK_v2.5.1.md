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
  - 2026-09-29 · 设计门 20 条发现按 Claude 提议处置（第三区）；Phase 2 关闭 · Jason · 级联：routing-slimdown DESIGN §4、§6；visual-upgrade DESIGN §2.5；release-pipeline DESIGN §9
  - 2026-09-29 · S-1（应用容器拿到数据库密码）本版修：运维任务的变量不进应用容器 · Jason · 级联：release-pipeline DESIGN §9、`.env.example`
  - 2026-09-30 · 发布前审查 22 条按 Claude 提议处置（第三区）；P1-M2、P2-M2、P2-S1 经实测不成立（Next 交给页面的参数未解码） · Jason
  - 2026-09-30 · `/code-review` 10 条按 Claude 提议处置（第三区）；修完开版本 PR · Jason
  - 2026-09-30 · GitGuardian 对 `5972e40` 的「通用密码」报告为误报（测试里编造的值，VPS 上比对与真实密钥均不同），Jason 已在 GitGuardian 关闭；测试值改为 example.com 上的假值 · Jason
  - 2026-09-30 · CI 暂不再提速（5 分钟可接受） · Jason
  - 2026-09-30 · 生产 `.env` 及其备份改为 600 · Jason · 级联：`docs/DEPLOYMENT.md` 首次设置

## 二、批次

验收测试在 Phase 2 写红，`todo` 标着批次：`tests/runtime/acceptance.runtime.mjs`（routing-slimdown §5.2-i、content-publishing §5.4-a/d）、`tests/acceptance-visual-upgrade.test.ts`（§5.5-c）、`tests/acceptance-release-pipeline.test.ts`（§5.7-e）。§5.5-d、§5.7-e 的实跑、§5.8-e 在第三区记证据。

### Batch 1 — 按语言的 404 文档
- 状态：done `24235e4` — 本机无库构建上 §5.4-d 去 todo、§5.2-i 无库部分通过；DESIGN §10 Q1 已答（导航照常渲染）
- 范围：`src/components/LocaleShell.tsx`（新）、`src/app/[locale]/layout.tsx`、`src/app/global-not-found.tsx`、`src/i18n/route-decision.ts`（「不存在」带语言；未知栏目、多余层级由它判）、`src/proxy.ts`（语言请求头）+ 测试 · 覆盖 routing-slimdown §5.2 规则 8 的「未知栏目、格式不对」、content-publishing §5.4-d；关闭 DESIGN §10 Q1
- 验收判据：§5.4-d 去 todo 且绿；§5.2-i 的无库部分（`/fr/no-such-section`、`/fr/posts/Bad_Slug`）为法语、服务端文档；公开页面仍可缓存（响应头）
- 依赖：none

### Batch 2 — 内容索引与 proxy 判定
- 状态：done（本提交）— 本机界面闸门 35 过、运行时 25 过、0 todo；不变量 10 植入即红
- 范围：`src/app/api/route-index/route.ts`（新）、`route-decision.ts`（`lookup`、`isPublished`）、`src/proxy.ts`（回环取索引，失败放行）、DESIGN §7-10 的新测试；TECHNICAL_DEBT 登记本结构为已接受的临时方案（退役条件：上游修好）、删 TD-025 · 覆盖 §5.2-i 全部、content-publishing §5.4-a
- 验收判据：§5.2-i、§5.4-a 去 todo 且绿（界面闸门，有库）；索引不可达时存在的内容照常 200；20 个未知 slug 不增加数据库读取（§5.4-d 原判据）
- 依赖：Batch 1

### Batch 3 — 界面闸门分机与并行
- 状态：done `7264447` — §5.5-c 去 todo；§5.5-d 连续 5 次全绿（第三区）
- 范围：`tests/ui/manifest.mjs`（`SHARDS`、`requiredCoverage`、`coverageFor` 移入）、`tests/ui/harness.mjs`（环境并行）、`tests/ui/coverage.ui.mjs`（按份对账）、`scripts/ui-check.sh`（`UI_SHARD`）、`.github/workflows/branch.yml`（矩阵）、删 TD-024 · 覆盖 visual-upgrade §5.5-c/d
- 验收判据：§5.5-c 去 todo 且绿；每份各植入违例一次变红（运行号）；同一提交连续 5 次全绿；推送到预发布验过的耗时前后对比记入第三区
- 依赖：none（与 Batch 1、2 可并行，合并时后到者重跑）

### Batch 4 — 备份的密钥
- 状态：done（本提交）— §5.7-e 去 todo；VPS 实跑证据见第三区
- 范围：`scripts/backup.sh`、`scripts/sync-bucket.mjs`（`SUPABASE_SERVICE_ROLE_KEY_FILE`）+ 测试；`docs/DEPLOYMENT.md` 的备份段；删 TD-026 · 覆盖 release-pipeline §5.7-e
- 验收判据：§5.7-e 去 todo 且绿；VPS 上实跑一次 `backup.sh`，期间采样 `ps` 与 `docker inspect` 不含两个密钥（在 VPS 上比对、只回报次数），产出转储与存储镜像
- 依赖：none

## 三、门与发布

**评审发现登记**（Codex 设计门，xhigh，只读，提交 `3a81a78`；J1 = TD-025 设计 `codex resume 01a0ed7a-6696-7f32-adc1-7cc3d27f1b6d`，J2 = TD-024 + TD-026 `codex resume 01a0ed7a-6760-79c0-9152-4afd002fa202`；引文已逐条对源核实；处置按 Claude 提议，第一区裁定）：
- J1-M1 · MUST：索引取不到而页面读库正常时放行，未知条目又得到空壳 404 —— status: accepted：索引故障时降级为今天的空壳 404；proxy 记一行日志
- J1-M2 · MUST（待核）：索引与页面不是同一快照，发布瞬间一个在途请求可能读到旧列表 —— status: accepted（降为 SHOULD）：错开只限失效瞬间的在途请求
- J1-M3 · MUST：`/og.png` 放行规则过宽，`/fr/…/og.png` 绕过语言校验 —— status: no change：语言分支在 og 规则之前（实测 404）；单元用例钉住 → Batch 1
- J1-M4 · MUST：索引返回 200 但内容畸形（`{}`、`null`、HTML）没有覆盖 —— status: → Batch 2：索引形状校验，不合即放行
- J1-M5 · MUST（待核）：标签的解码与比较规则未定义 —— status: → Batch 2：解码一次、失败判「不存在」
- J1-S6 · SHOULD：每次查找多一次回环，无熔断 —— status: → Batch 2：超时 500 毫秒；耗时 Phase 4 实测
- J1-S7 · SHOULD：`/api/route-index` 实际对外公开 —— status: accepted：内容本已公开
- J1-S8 · SHOULD：验收判据漏掉高风险路径形状 —— status: → Batch 1、2：单元用例补齐各路径形状
- J1-S9 · SHOULD（待核）：查询串可能放大缓存条目 —— status: → Batch 1：判定不看查询串（单元用例）
- J1-N10 · NICE（待核）：绕过 proxy 的路径上可伪造语言头 —— status: accepted：后果只及请求者本人
- J1-N11 · NICE：本地化 404 的标题仍是英文 —— status: → Batch 1：按语言出标题
- J2-A1 · MUST（待核）：`staging-check` 是否真是必需检查 —— status: no change：分支保护读出为必需
- J2-A2 · MUST：`UI_SHARD` 须对未知值、空文件集、空覆盖集失败关闭 —— status: → Batch 3：`UI_SHARD` 失败关闭
- J2-A3…A6 · SHOULD：矩阵、分片选择、环境并行、§5.5-c 仍为 todo —— status: → Batch 3（待实现内容）
- J2-B1 · MUST：`backup.sh` 现仍泄露两个密钥 —— status: → Batch 4（TD-026 本身）
- J2-B2 · SHOULD：临时凭据文件没有退出时的统一清理 —— status: → Batch 4：`EXIT` 清理，`release.sh` 同改
- J2-B3 · SHOULD（待核）：0600 文件与容器内 UID —— status: no change：v2.5.0 部署已如此读取
- J2-B4 · SHOULD：源码检查证明不了运行时不泄露 —— status: → Batch 4：实跑加查权限与失败后不残留
- J2-B5 · NICE（待核）：cron 的最小环境 —— status: no change：每日备份一直按时产出

**批次证据**：
- Batch 4（VPS，本分支脚本在演练目录、`.env` 链接生产的那份）：两次实跑均成功，各产出转储与 24 个存储对象。运行期间采样：`ps` 命令行 9 次，密码 0、密钥 0；只取备份自己的容器的 `docker inspect` 7 次（`postgres:17` 2、`node:24-slim` 5），密码 0、密钥 0；临时文件模式全为 600（13 次），结束后残留 0。比对在 VPS 上进行，只回报次数。对照：常驻的生产应用容器 `antelacus` 的 `docker inspect` 含密码与密钥各 1 处（见 S-1）

- Batch 3（`7264447`）：推送到预发布验过 7 分 50 秒 → 5 分 20 秒（运行 36586549143 → 36587784209；界面闸门 6 分 31 秒 → public 4 分 18 秒、admin 4 分 44 秒）；本机不分片全套 130 秒，axe 四环境 32 秒 → 13 秒；`UI_SHARD` 拼错即拒绝（本机试跑）；两份各自的植入违例自检均过；§5.5-d：同一提交（运行 36587784209）第 1–5 次尝试全绿，两份界面闸门与 `staging-check` 次次通过

**评审发现登记**（Codex 发布前审查，xhigh，只读，最终树 `7264447`；P1 `route-decision.ts`+`proxy.ts`+代码对需求 `codex resume 01a0edbb-0070-7431-afd9-6c9c23152548`、P2 `global-not-found.tsx`+`route-index` `…-0124-72b3-ba44-9402498891a3`、P3 `backup.sh`+`decide.mjs` `…-0197-7b21-b814-306f419ae1a0`；引文已对源核实，待核项已实测；处置按 Claude 提议，第一区裁定）：
- P1-M1 · MUST：编码写错的 og 地址会让解码抛错 —— status: no change：Next 在路由之前答 400（生产实测）
- P1-M2 / P2-M2 · MUST：标签被解码两次（Next 已解码 `params`，标签页再解一次），含 `%` 的标签 500 —— status: no change（实测推翻前提）：Next 16.3.7 交给页面的 `id` 是未解码的原样（`vibe%20coding`），页面解码一次、proxy 对原始路径解码一次，两者一致；`/tags/100%25` 在不解码的最小应用里也是 500——Next 自身的行为，生产同样 500
- P2-S1 · SHOULD：含特殊字符的标签，规范链接未编码 —— status: no change：`id` 本是编码后的原样，规范链接已正确（生产 `vibe%20coding`）
- P1-M3 · MUST：content-publishing §5.4-d 的「20 个未知 slug 不增缓存、不读库」没有测试 —— status: fixed：运行时加「20 个未知 slug 都是服务端渲染的站点 404」（页面未运行即无页面缓存）
- P1-S1 · SHOULD（待核）：结尾多个斜杠的判定不一致 —— status: no change：Next 先以 308 规整斜杠（生产实测）
- P1-S2 · SHOULD：proxy 取不到索引时放行，只有纯函数测试 —— status: fixed：`tests/proxy.test.ts`——索引返回 HTML、500、形状不对、连接失败时存在的内容都放行；伪造的语言头不被采用（删掉那一行即红）
- P1-S3 · SHOULD（待核）：并发查找放大负载 —— status: accepted：索引经缓存读取；耗时 Phase 4 实测
- P1-S4 · SHOULD（待核）：会话续期失败的处理 —— status: no change：既有行为，不在本版
- P1-N1 · NICE：语言头伪造没有运行时断言 —— status: accepted
- P2-M1 · MUST：`/en/posts/foo%2Dbar` 这类编码过的 slug 被判 404 —— status: accepted：v2.3.0 起的既有行为，站内不产生这种链接
- P2-S2 · SHOULD（待核）：关于页只有不受支持语言的版本时，索引与页面不一致 —— status: accepted：后台保存时校验语言
- P3-M1 · MUST：查询串里的 `password=` 绕过 pgpass —— status: fixed：查询串里的 `password` 一并移进 pgpass（单元测试）
- P3-M2 · MUST：两次备份重叠会删掉对方的临时文件与镜像目录 —— status: fixed：备份持锁运行，第二次等待——VPS 上两次重叠的备份都成功、先后完成、无残留；时间戳在持锁后取
- P3-M3 · MUST：`.env` 里重复的 `DATABASE_URL` 取了第一条 —— status: fixed：取最后一条（单元测试）
- P3-S4 · SHOULD：带引号的值后跟注释时引号被保留 —— status: fixed：`dockerEnv` 处理引号后的注释（单元测试）
- P3-S5 · SHOULD：CRLF 的 `.env` —— status: accepted
- P3-S6 · SHOULD：`.env` 缺失或有误时不发失败通知 —— status: fixed：先装失败处理再读 `.env`，失败写入日志；上报地址也在 `.env` 里，此时由备份监控的「未收到成功」报警兜底
- P3-S7 · SHOULD：失败的半截转储不会被删 —— status: fixed：退出时删 `.part`
- P3-S8 · SHOULD（待核）：密码含换行 —— status: accepted：认证会明确失败
- P3-S9 · SHOULD（待核）：cron 的 PATH 找不到 node —— status: no change：node 在 `/usr/bin`，cron 的 PATH 含它（实测）
- P3-S10 · SHOULD（待核）：清扫可能删掉被强杀后仍在跑的查询的 pgpass —— status: accepted
- P3-N11 · NICE：`ANTELACUS_PORT` 仍进容器 —— status: accepted

**评审发现登记**（`/code-review` high，`main...feat/routing-slimdown`，同模型，整版一次；已逐条核实；处置按 Claude 提议，第一区裁定）：
- R-1 · MUST：`pgConnection` 解析失败时 Node 把整串连接串（含密码）打进错误输出——备份写进 `backup.log`，`release.sh` 经 CI 进公开仓库的 Actions 日志；密码含 `/`、`#`、`?` 即触发（假值复现） —— status: fixed：解析失败只报「DATABASE_URL 不是有效的 URL」，不带原文；单元测试断言消息、属性与栈里都没有输入，同一假值的未捕获输出含原文 0 次
- R-2 · SHOULD：每次查找都取回整份索引，预取时成倍放大 —— status: accepted：实测每次约 5 毫秒；随 TD-027 退役
- R-3 · SHOULD：`global-not-found` 没带站点的 viewport 与 metadata（图标、主题色、安全区、`metadataBase`） —— status: fixed：导出 `siteViewport`，metadata 以 `siteMetadata` 为底（去掉 `robots`，只留 Next 自己的 `noindex`）；本机构建核对 `<head>`
- R-4 · SHOULD：`.env` 缺 service-role 密钥时 `set -u` 退出不走失败处理 —— status: fixed：写密钥文件前显式检查，缺即 `fail`
- R-5 · SHOULD：proxy 放行的路径上，客户端的语言头仍会到达 `global-not-found` —— status: accepted：同 J1-N10、P1-N1
- R-6 · SHOULD：引号后跟注释的正则是贪婪的，注释里再有同种引号就吞进值里 —— status: fixed：非贪婪匹配（单元测试）
- R-7 · SHOULD：`next` 与 `eslint-config-next` 被 `npm install` 写成了 `^16.3.7` —— status: fixed：恢复精确钉版 16.3.7，lockfile 同步
- R-8 · SHOULD：`visit()` 用 `Promise.all`，一个环境在 try 之外出错时其余环境仍在后台跑 —— status: fixed：`Promise.allSettled`，拒绝并入失败清单
- R-9 · SHOULD：`tsconfig.json` 残留本机构建写入的 `.next-b1` 两行 —— status: fixed：删掉两行、`.gitignore` 加 `/.next-*/`；本机构建改用已在 include 里的 `.next-ui`，Next 便不再改写 `tsconfig`
- R-10 · SHOULD：关于页的索引判定与页面的语言回退可能不一致 —— status: accepted：同 P2-S2

- 真实发布（运行 36651491499）：合并提交 `2e0882d` 的键 `b3d944ad…` 即预发布验过的那个；`verify` 构建标识一致、有库运行时 26 项全过（含 §5.2-i、§5.4-a 于生产真实内容）；`v2.5.1` 已打；`purge` 按改动判定无需清缓存；`auth` 通过
- S-1：生产容器 `docker inspect` 中数据库密码 0 处、运维变量 0 个，service-role 密钥在（应用需要）——在 VPS 上比对、只回报次数
- 收缩步：`.env` 的 `SUPABASE_ADMIN_EMAILS` 1 → 0 行（`.env.staging` 本无），两环境 `restart` 后仍为 `b3d944ad…`，公网 200；Jason 登录生产后台并保存成功。顺带发现生产 `.env` 为 664，经 Jason 同意改为 600（备份同改）；能登录的只有 root 与部署用户、家目录 750，此前实际未暴露

**本版自查发现**（Claude）：
- S-1 · SHOULD：`release.sh` 把整份 `.env` 交给应用容器，`DATABASE_URL`（含数据库密码）因此进了应用的环境、`docker inspect` 可见；应用不用它，只有备份与发布脚本用 —— status: fixed（Jason 裁定本版修）：`appEnv` 剔掉运维任务的变量（`DATABASE_URL`、备份设置、`HC_PING_*`）再交给容器，单元测试；`.env.staging` 本无这些变量，证据在真实发布

**Phase 4 证据**：
- 真实内容：`staging-check` 在预发布上经 nginx 与 Cloudflare 跑有库运行时套件全绿（运行 36586549143 起），含 §5.2-i、§5.4-a 的服务端渲染判定
- 耗时（DESIGN §10 Q2，VPS 上直连容器，各 30 次中位数）：`/api/route-index` 5.6 毫秒；文章详情预发布（有查找）约 13 毫秒、生产（v2.5.0，无查找）7.8 毫秒；首页两边相同（6.6–6.8）；两边 `x-nextjs-cache: HIT`。首轮测得详情 66.7 毫秒，连续复测为 11–21 毫秒，首轮属刚替换容器后的预热

**Phase 6 boxes**（合并 ≠ 发布）：
- [x] 版本 PR：Claude 开 PR、跑 `/code-review` 并登记处置 → Jason 审结构与范围后合并（#16，合并提交 `2e0882d`）
- [x] 真实发布：*Production* 全绿，公网构建标识 = 合并提交的键，打出 `v2.5.1`
- [x] S-1 的证据：发布后生产容器 `antelacus` 的 `docker inspect` 里数据库密码 0 处（在 VPS 上比对、只回报次数），`verify` 全绿
- [x] 收缩步（release-pipeline §5.8-e）：删生产 `.env` 与 `.env.staging` 里的 `SUPABASE_ADMIN_EMAILS`（只删这一行、不读其他值）→ 两个环境 `restart` → Jason 登录生产后台并保存一次 → 删 TD-023
- [x] CHANGELOG 条目
- [x] TECHNICAL_DEBT 定稿：TD-023…TD-026 删除；TD-027（Batch 2 的临时方案）在册
- [x] 常新文档扫尾：release-pipeline DESIGN §9 改为收缩后的现状并删去过渡期一条；`DEPLOYMENT.md` 首次设置加 `chmod 600`；项目 `CLAUDE.md` 的 404 规则（Batch 2）与本地构建目录一条；README 属实
- [x] FEEDBACK 扫尾 · 路线图：没有 FEEDBACK 条目；登记册只余 TD-027，其退役条件是上游 #62228；CI 再提速的候选（Supabase 镜像、Playwright 容器）Jason 裁定暂不做
- [x] 各门读数（运行次数 / 改变了输出的拦截次数）：
  - *Branch* 闸门：8 次 + 同一运行重跑 4 次 / 0（5 绿、3 次被更新的推送取消）——缺陷都在本机测试与审查阶段拦下；不空转由植入违例与不变量的植入证明，不退役
  - Codex 设计门：2 个任务 / 采纳并改设计 8 条（索引形状校验、标签解码、超时、日志、标题、`UI_SHARD` 失败关闭、临时文件清理、实跑加查）
  - Codex 发布前：3 个任务 / 11 条修复（其中查询串密码、备份并发、重复 `DATABASE_URL`、proxy 放行测试、20 个未知 slug 测试）；3 条经实测推翻
  - `/code-review`：1 次 / 7 条修复，含 R-1（解析失败时密码进公开 CI 日志）
  - GitGuardian：1 次报告 / 0（误报；测试值改为 example.com 上的假值）
  - `pr-checklist`：1 次 / 0 · *Production*：1 次 / 0 · 迁移 lint：每次推送 / 0（本版无迁移）
- [x] 文档预算为绿 · 记忆修剪
- [x] **关版（最后一项）**：未了事项各归其位 → `git mv TRACK.md TRACK_v2.5.1.md`
