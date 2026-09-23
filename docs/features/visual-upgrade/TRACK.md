# TRACK — visual-upgrade v2.4.0

## 一、范围与裁定

- 模式：standard · 目标：不同访客（视觉障碍、肢体障碍、前庭敏感、iPad / Android 触屏、纯键盘）都能使用网站全部功能，并在此约束之内升级「活手稿」的美学。
- 范围：
  1. 无障碍：公开页面与后台 `/admin` 达到 WCAG 2.2 AA 全量；先做基线审计，审计结论写进 REQ 作为美学的约束
  2. 美学升级：保持活手稿（纸、墨、朱砂、衬线），改在它与无障碍冲突处和可以更好处
  3. TD-019：关于页进数据库、改 Markdown（按语言多份，回退「请求语言 → 英文 → 任意」），`next-mdx-remote` 随之移除
  4. TD-020：删除 `eslint.config.mjs` 对三条 React Compiler 规则的降级，改写中修掉余下违例
  5. `docs/aesthetic-thesis.md` 改写为可执行的设计规则（字体角色、间距档、拒绝清单、审查顺序），代码片段删除；Vercel `design.md` 作参照样本，不作规范
  6. routing-slimdown REQ §6「外观与 `<head>` 不变」及其验收 §6-a 在本版正式退役（v2.3.0 已裁定）
- 明确不做：
  - 暗色模式：活手稿只有一种环境
  - 按语言分别撰写的内容（内容仍是单一来源，关于页除外，见范围 3）
  - 路由、缓存、发布流程的结构改动——本版改外观与交互，不改数据流
- 全局约束（约束所有批次）：
  - 公开页面保持可缓存：规则在项目 `CLAUDE.md`「Routing and languages」，证据是运行中服务器的响应头
  - CSP 为「同源 + 内联」（content-publishing DESIGN §2）：新字体、脚本、样式一律自托管（`next/font`），不引外部 CDN
  - 缩放不得被禁：`src/app/site-metadata.ts` 的 `viewport` 保持允许缩放（WCAG 1.4.4）
  - The Floor：审计截图只落会话 scratchpad，不进仓库；后台页面的截图可能含未发布草稿，不外发
- 裁定（一行一条，只记「批了什么」）：
  - 2026-09-23 · 无障碍与美学合为一个版本，先无障碍审计、后美学设计 · Jason · 级联：本 TRACK 范围
  - 2026-09-23 · 无障碍标准为 WCAG 2.2 AA 全量 · Jason · 级联：REQ（待开）
  - 2026-09-23 · 后台 `/admin` 纳入 AA 范围 · Jason · 级联：本 TRACK 范围 1、REQ（待开）
  - 2026-09-23 · 不做暗色模式 · Jason · 级联：本 TRACK 明确不做
  - 2026-09-23 · Vercel `design.md` 作参照样本不作规范；`aesthetic-thesis.md` 本版改写为可执行设计规则 · Jason · 级联：本 TRACK 范围 5

## 二、批次

批次在 Phase 2 设计门通过后按 DESIGN 切分。Phase 1 的输入是无障碍基线审计（桌面 / iPad / Android 视口、键盘、减少动画、无障碍树），其结论进 REQ，不进本文件。

## 三、门与发布

**评审发现登记**：（Phase 2 起）

**Phase 4 证据**：（Phase 4 起）

**Phase 6 boxes**：Phase 4 收尾时写入。

## 四、Session-end pickup
