# TRACK — maintenance v2.5.4

## 一、范围与裁定

- 模式：maintenance · 目标：关掉公网站点上的两处已公开漏洞，用户可见行为不变
- 范围：
  1. `next`、`eslint-config-next` 16.4.0 → 16.4.3：GHSA-673q-mjm6-r5xr（`use cache` 返回多个 typed array 时无需认证的远程代码执行，CVSS 9.5，16.0.0–16.4.0 受影响，16.4.1 修复）。本站没有 `use cache`，前提不成立；公告写明没有绕过办法、仍须升级。同一批发布还修了图片优化经 sharp/librsvg 处理 SVG 的内存漏洞与 Server Actions 的拒绝服务，本站的图片优化走 sharp
  2. 镜像在 Node ≥ 24.22.1 上重建：生产容器是 24.21.0，受 Node 2026-10-21 安全发布里 Brotli 解码越界写的影响。`Dockerfile` 的 `node:24-bookworm-slim` 是浮动标签，CI 每次在新 runner 上拉取，改版本号即触发重建。运行阶段删去基础镜像自带的 npm、corepack、yarn：运行时只有 `node server.js`，而 Trivy 首次运行报出的 6 个 HIGH（`brace-expansion` 5.0.9、`undici` 6.28.0）全在 `usr/local/lib/node_modules/npm/` 里
  3. `zod` ^3.23.8 → ^4.6.7：GHSA-mrhx-c7xc-m3w5（数组 schema 无长度上限时内存耗尽，2026-10-01 公布，修复只在 4.6.6 起）。本站唯一的数组 schema 在 `saveContentAction` 里，解析排在 `requireAdminUser` 之后，只有登录的管理员够得着；按危害本可留到下次维护，但 `check` 的 `npm audit --omit=dev` 对任何生产依赖公告都拦截，不升级 Next 的修复就合不进去。源码不用改（`tsc` 通过）；zod 4 的行为由 `ui` 门 admin 分片的登录、保存、发布来证明，单元测试不覆盖这些 schema
  4. 镜像构建后用 Trivy 扫描，有修复版本的高危及以上漏洞拦截发布（`branch.yml` 的 `image` 任务）
- 明确不做：每周扫描已部署镜像（单独的 repo-infra 改动，见第三区）；`.nvmrc` 与 Node 版本一致性检查；其他依赖升级
- 全局约束：
  - 版本地板：`package.json`（精确钉版）；Node 由 `Dockerfile` 的基础镜像决定
  - 本版不含数据库迁移
- 裁定：
  - 2026-10-29 · 两个公网站点的 Next.js 安全修复按 maintenance 模式做，antelacus 先、goodman 后；镜像加 Trivy 扫描 · Jason · 级联：无

## 三、门与发布

**评审发现登记**：maintenance 模式不触发 Codex；改动不涉及源码，不跑 `/code-review`。

**Phase 4 证据**：
- Trivy（`image` 任务）首次运行 40805198427：红，6 个 HIGH，全在基础镜像自带的 npm 里 → 运行阶段删去包管理器。检查非空转，得到证明

**Phase 6 boxes**：
- [x] CHANGELOG 条目（Security）
- [ ] TECHNICAL_DEBT 定稿
- [x] 旧值扫尾：`16.4.0` 在 CHANGELOG 与冻结文档之外无出处；各 DESIGN 里的「对象 Next 16.3.5」是实测时的版本记录，保持原样
- [ ] staging：`staging-check` 绿；Jason 在手机上看过 staging（`pr-checklist`）
- [ ] 生产部署 + 核对 served key；容器内 `next` 16.4.3、Node ≥ 24.22.1
- [ ] tag `v2.5.4`
- [ ] 各门读数：运行次数 / 改变了输出的拦截次数（Trivy 首次运行单列）
- [ ] 文档预算为绿（`python3 scripts/check_doc_budget.py`）
- [ ] 每周扫描已部署镜像：repo-infra 改动已开出，或在 TECHNICAL_DEBT 登记触发条件
- [ ] **关版（最后一项）**：未了事项各归其位 → `git mv TRACK.md TRACK_v2.5.4.md`
