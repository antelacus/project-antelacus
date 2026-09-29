# TRACK — routing-slimdown v2.5.1

## 一、范围与裁定

- 模式：standard（TD-025 要改已上线的根布局设计，需设计门）· 目标：把登记在册的四条技术债全部了结
- 范围：
  1. TD-025：未知条目与格式不对的条目地址，得到的是站点自己的 404 页（有 `lang`、有标题、按地址的语言），不再是 Next 的裸错误文档；content-publishing REQ §5.4-a、§5.4-d 去掉 todo
  2. TD-026：`backup.sh` 的数据库密码与 service-role 密钥不出现在命令行或容器配置里
  3. TD-024：界面闸门缩短——axe 的四个上下文并行、界面检查分到两台机器，覆盖率核对跨任务合并
  4. TD-023：v2.5.1 发布后，从生产 `.env` 删掉 `SUPABASE_ADMIN_EMAILS`（收缩步）
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

## 二、批次

（Phase 0 探测之后切分）

## 三、门与发布

**评审发现登记**：（设计门之后）

**Phase 4 证据**：（Phase 4 填写）

**Phase 6 boxes**：（Phase 4 收尾前写好）
