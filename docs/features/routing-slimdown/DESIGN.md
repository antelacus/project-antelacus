# DESIGN — routing-slimdown

## 1 引言
### 1.1 参考
- 需求：`docs/features/routing-slimdown/REQ.md`
- Next.js 文档：middleware 文件位置、国际化指南（根布局放进 `app/[lang]`）、`generateStaticParams` 返回空数组、`revalidateTag`
### 1.2 术语
见 REQ §1.4。

## 2 总体设计

### 2.1 模块关系
| 模块 / 文件 | 单一职责 | 测试层级 |
|-------------|---------|----------|
| `src/i18n/routing.ts` | 支持的语言集合与默认语言——唯一来源 | infra |
| `src/i18n/detect.ts` | 把任意语言标签（路径段、`Accept-Language`）归到支持的语言，或判为「不是语言」 | core |
| `src/i18n/route-decision.ts`（新） | **语言路由的全部规则**：给定路径、`Accept-Language`、记住的选择 → 「放行」或「308 到某地址」 | core |
| `src/middleware.ts`（由根目录移入） | 薄壳：排除名单 → `/admin`、`/auth` 走会话续期 → 其余执行 `route-decision` 的结论。自身不含规则 | IO |
| `src/components/SiteDocument.tsx`（新） | `<html lang>`、`<head>`（字体预载）、`<body>` 的公共外壳，`lang` 由调用方传入 | infra |
| `src/app/[locale]/layout.tsx` | **公开站点的根布局**：校验语言（不支持 → `notFound()`），用 `SiteDocument` 输出 `lang`，挂导航与翻译 | IO |
| `src/app/admin/layout.tsx` | **后台的根布局**：`SiteDocument lang="en"`，强制不缓存 | infra |
| `src/app/[locale]/**/page.tsx` | 页面。详情页的真实实现从无前缀目录搬到这里，并声明「首次访问时生成、之后缓存」 | IO |
| `src/app/{posts,notes,gallery,projects}/[slug]/og.png`、`src/app/og.png` | 分享图，地址不变 | IO |
| `src/components/UtilityDropdown.tsx` | 语言切换；手动切换时记下选择 | IO |
| `src/app/admin/(protected)/notes/actions.ts` | 保存/发布笔记；成功后使 `notes` 标签的缓存失效 | IO |
| `.github/workflows/check.yml`（新） | 闸门：lint、类型检查、测试、构建、文档预算。可被其他工作流调用 | infra |
| `.github/workflows/deploy.yml` | 先调用 `check`，通过后才部署 | infra |
| `public/sw.js` | 自注销脚本 | infra |

依赖方向：`middleware → route-decision → detect → routing`，单向；页面与组件只读 `routing`。由 §7 的不变量测试守住。

删除的文件：`src/app/layout.tsx`、`src/app/not-found.tsx`、`src/app/page.tsx`、8 个无前缀的重定向空壳与 `src/app/search/page.tsx`、`src/app/tags/[id]/page.tsx`（与 `[locale]` 下的逐字重复）、`[locale]` 下 4 个三行的转引文件（被搬来的真实实现取代），以及 TD-010 列出的全部条目。

### 2.2 数据流
请求 → `middleware`：
1. 路径在排除名单里 → 放行。
2. `/admin`、`/auth` → 续期会话后放行。
3. 其余 → `route-decision`：
   - 第一段是支持的语言 → 放行。
   - 第一段形如语言标签且能归到支持的语言（`zh-tw`、`en-US`）→ 308 到对应语言。
   - 第一段形如语言标签但归不到（`xx-anything`）→ 放行，由 `[locale]` 根布局判为 404。
   - 第一段不像语言标签（`posts`、`essays`、空）→ 视为没有前缀：308 到 `/<语言>/<原路径>`，语言取 记住的选择 → `Accept-Language` → `en`。

「形如语言标签」= 主标签 2–3 个字母，后接若干 `-` 分隔的子标签。不用「以 en/fr/es 开头」来判：那会把 `/essays` 带到 `/es`。

页面渲染：`[locale]` 根布局不读 cookie、不读请求头，所以整棵公开页面树可以静态生成；数据经 `src/lib/*.ts` 里带标签、带时限的缓存读取（现状，不动）。页面在首次被访问时生成，随后按数据缓存的时限（一小时）复用。后台保存笔记 → `revalidateTag('notes')` → 用到该数据的页面下次访问时重新生成。

## 3 入口
- 访客：`/<语言>/…` 下的页面；无前缀与语言变体地址经中间件到达它们。
- 维护者：`/admin/…`（自己的根布局，始终动态）。
- 机器：`/sitemap.xml`、`/robots.txt`、`/api/search-index`、各 `og.png`、`/sw.js`。
- CI：`check.yml` 由 PR、所有分支的推送触发，并被 `deploy.yml` 调用。

## 4 模块间契约
- `decideLocaleRoute(input: { pathname: string; acceptLanguage: string | null; preferredLocale: string | null }): { kind: 'pass' } | { kind: 'redirect'; pathname: string }`
  - 纯函数，无 IO，不抛错；任何畸形输入都落到「没有偏好」。
  - `preferredLocale` 不是支持的语言时当作 `null`。
  - 重定向只改路径，查询串由中间件原样带上。
- `mapLanguageTag(tag: string): AppLocale | null`（`detect.ts`，取代 `mapPathLocaleSegment`）：不形如语言标签 → `null`；形如但归不到 → `null`。调用方用 `isLanguageTagShaped(tag)` 区分这两种 `null`。
- 记住的选择：cookie `preferred_locale`，值为支持的语言代码；`Path=/`、一年、`SameSite=Lax`、`Secure`。**只由语言切换控件写，只由中间件读**——页面与布局不得读它（§7 不变量 2）。
- 缓存标签：`notes`、`posts`、`gallery`、`projects`（`src/lib/*.ts` 已定义）。写入方在写成功后使对应标签失效。

## 5 持久化数据
N/A —— 本版不改数据库结构。

## 6 异常流
- `Accept-Language` 缺失或畸形 → 按无偏好处理，落到 `en`。
- 不支持的语言前缀 → `[locale]` 根布局 `notFound()`，状态码 404，页面用英文外壳。
- `/admin`、`/auth` 的会话续期失败（Supabase 不可达）→ 放行，由页面自己的管理员校验决定去向（fail-closed 在校验处，不在中间件）。
- 保存成功但缓存失效调用抛错 → 保存仍算成功，错误上抛到后台页面显示；内容最迟一小时后自行可见。不回滚保存：内容已落库是事实，缓存只是延迟。
- 闸门里任一步失败 → 后续步骤与部署都不执行。

## 7 不变量
1. 特权数据库客户端只经管理员校验发放 —— `tests/service-role-guard.test.ts`（既有）。
2. `src/app/[locale]/**` 与公开页面用到的服务端模块不引入 `next/headers` —— 新测试按导入关系检查。破了它，全站回到每次访问都重新渲染。
3. 支持的语言只在 `src/i18n/routing.ts` 里列出 —— 新测试：别处不得出现同时含 `zh-CN` 与 `zh-HK` 的字面量数组（`src/messages/` 除外）。
4. `src/app/[locale]/` 下的一级目录名都不形如语言标签 —— 新测试。否则该栏目会被当成未知语言而 404（例：将来加 `/rss`、`/cv`）。
5. 中间件确实被注册 —— 闸门里构建之后检查 `.next/server/middleware-manifest.json` 含一个入口。这正是此前一年无人发现的那类失效。
6. 构建不依赖 Supabase 可达 —— 闸门用假环境变量完成构建即是证明。

## 8 外部系统约束
- **Next.js**：`middleware.ts` 必须与 `app` 目录同级；本项目的 `app` 在 `src/` 下，故为 `src/middleware.ts`。放在仓库根目录时构建不报错，只是不注册。
- **Next.js**：没有顶层 `app/layout.tsx` 时，每个顶级路由段要有自己的根布局；只有路由处理器（`route.ts`）的段不需要。根布局之外无法渲染页面，所以顶层的 `not-found.tsx` 在此结构下不可用——未匹配的地址都落进 `[locale]`，由它给出 404。
- **Next.js**：动态段的页面要在首次访问后被缓存，必须导出 `generateStaticParams`（可返回空数组）；不导出则每次访问都渲染。
- **浏览器**：已安装的 Service Worker 的更新检查不经过它自己，但受 HTTP 缓存影响；现行 `/sw.js` 是以一年不可变缓存下发的。规范把 Service Worker 脚本的 HTTP 缓存上限定为 24 小时，故老访客最迟一天后拿到新脚本。【待核：设计评审时对照规范原文】
- **Cloudflare**：默认不缓存 HTML。本版的「可缓存」指应用自身复用已生成的页面；是否让 Cloudflare 缓存 HTML 不在本版。
- **GitHub Actions**：被调用的工作流需要 `on: workflow_call`；`deploy.yml` 现为 `permissions: {}`，检出代码的任务要在任务级声明 `contents: read`。第三方与官方 action 一律钉到提交 SHA（本仓库既有做法）。
- **VPS 构建**：镜像在 VPS 上构建，`.env` 在构建上下文里；本版之后构建不再访问 Supabase，但运行时仍需要。

## 9 其他设计
- `next.config.ts` 里对所有 `.css`/`.js` 加一年不可变缓存的规则删除：带哈希的 `_next/static` 资源 Next 自己已这样处理；这条规则真正波及的只有 `public/` 下不带哈希的文件，`/sw.js` 正是受害者。
- `src/app/sitemap.ts` 与 `src/app/sitemap.xml/route.ts` 并存，本版只保证后者在请求时生成（不在构建时），不合并二者。

## 10 开放设计问题
文档无法定论、要在第一批里用本地 `next build && next start`（假环境变量即可，关于页不读数据库）实测的四件事；任何一件不成立都回到本节改设计，不在代码里绕：
- D-1 `[locale]` 根布局里的 `notFound()` 对首次访问生成的路径给出的是 404 状态码，而不是 200。
- D-2 首次访问后生成的页面，其 `Cache-Control` 不含 `no-store`。
- D-3 `revalidateTag('notes')` 会使用到该数据的页面重新生成，而不只是数据缓存失效。
- D-4 中间件移入 `src/` 后，各 `og.png` 不被重定向（排除名单按路径后缀匹配）。
