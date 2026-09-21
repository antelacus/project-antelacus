# DESIGN — routing-slimdown

## 1 引言
### 1.1 参考
- 需求：`docs/features/routing-slimdown/REQ.md`
- 实测记录：`docs/features/routing-slimdown/TRACK.md` 第三区「设计门后的实测」
- Next.js 文档：middleware 文件位置、国际化指南（根布局放进 `app/[lang]`）、`generateStaticParams` 返回空数组、`revalidateTag`；next-intl 文档：静态渲染与 `setRequestLocale`
### 1.2 术语
见 REQ §1.4。

## 2 总体设计

### 2.1 模块关系
| 模块 / 文件 | 单一职责 | 测试层级 |
|-------------|---------|----------|
| `src/i18n/routing.ts` | 支持的语言、默认语言、**公开栏目清单**（`/<语言>/` 之下的一级路径名）——三者的唯一来源 | infra |
| `src/i18n/detect.ts` | 把语言标签（路径段、`Accept-Language`）归到支持的语言；归不到则为空 | core |
| `src/i18n/route-decision.ts`（新） | **语言路由的全部规则**：路径、`Accept-Language`、记住的选择 → 「放行」「308 到某地址」或「不存在」 | core |
| `src/middleware.ts`（由根目录移入） | 薄壳：排除名单 → `/admin`、`/auth` 走会话续期 → 其余执行 `route-decision` 的结论。自身不含规则 | IO |
| `src/app/global-not-found.tsx`（新） | 全站唯一的 404 页：英文、站点外壳（`SiteDocument`）、无导航；构建时生成一次 | infra |
| `src/app/site-metadata.ts`（新） | 全站的 `metadata` 与 `viewport` 对象（由现根布局原样搬来） | infra |
| `src/components/SiteDocument.tsx`（新） | `<html lang>`、`<head>`、`<body>` 的公共外壳：全局 CSS、KaTeX 样式、字体变量与预载都在这里引入；`lang` 由调用方传入 | infra |
| `src/app/[locale]/layout.tsx` | **公开站点的根布局**：校验语言（不支持 → `notFound()`）、`setRequestLocale`、用 `SiteDocument` 输出 `lang`、挂导航与翻译；导出 `metadata`、`viewport` | IO |
| `src/app/admin/layout.tsx` | **后台的根布局**：`SiteDocument lang="en"`，强制不缓存；导出同一份 `metadata`、`viewport` | infra |
| `src/app/[locale]/**/page.tsx` | 页面。详情页的真实实现从无前缀目录搬来；每个页面调用 `setRequestLocale`，详情页另声明「首次访问时生成、之后缓存」 | IO |
| `src/app/{posts,notes,gallery,projects}/[slug]/og.png`、`src/app/og.png` | 分享图，地址不变 | IO |
| `src/lib/sitemap-entries.ts`（由 `src/app/sitemap.ts` 改名搬来） | 生成 sitemap 条目的普通模块——不再是路由文件 | IO |
| `src/app/sitemap.xml/route.ts` | `/sitemap.xml` 的**唯一**路由，请求时生成 | IO |
| `src/lib/{posts,notes,gallery,projects}.ts` | 带标签、带时限的数据缓存；列表与详情的时限统一为一小时 | IO |
| `src/components/UtilityDropdown.tsx` | 语言切换；手动切换时记下选择 | IO |
| `src/app/admin/(protected)/notes/actions.ts` | 保存/发布笔记；成功后使 `notes` 标签失效 | IO |
| `.github/workflows/check.yml`（新） | 闸门：lint、类型检查、测试、构建 + 中间件清单断言、文档预算。可被调用 | infra |
| `.github/workflows/deploy.yml` | `check` 任务调用闸门；`deploy` 任务 `needs: check` | infra |
| `public/sw.js` | 自注销脚本 | infra |
| `CLAUDE.md` + `tests/claude-md.test.ts`（新） | 与现实一致的项目说明；测试断言其中每个路径与 `npm run` 名都存在 | infra |

依赖方向：`middleware → route-decision → detect → routing`，单向；页面与组件只读 `routing`。

删除的文件：`src/app/layout.tsx`、`src/app/not-found.tsx`、`src/app/page.tsx`、8 个无前缀的重定向空壳与 `src/app/search/page.tsx`、`src/app/tags/[id]/page.tsx`（与 `[locale]` 下的逐字重复）、`[locale]` 下 4 个三行的转引文件（被搬来的真实实现取代），以及 TD-010 列出的全部条目。

### 2.2 数据流
请求 → `middleware`：
1. 路径在排除名单里（`/_next`、静态文件、`/api`、`/sitemap.xml`、`/robots.txt`、`/ads.txt`、`/sw.js`、**以 `/og.png` 结尾的任何路径**）→ 放行。
2. `/admin`、`/auth` → 续期会话后放行。
3. 其余 → `route-decision`，按第一段路径：
   - 是支持的语言 → 放行。
   - 为空，或在公开栏目清单里（`posts`、`about`…）→ 没有前缀：308 到 `/<语言>/<原路径>`，语言取 记住的选择 → `Accept-Language` → `en`。
   - 能归到支持的语言的变体（`zh-tw`、`en-US`）→ 308 到对应语言。
   - 其余一切（`xx-anything`、`essays`）→ 「不存在」：中间件把请求改写到一个匹配不到任何路由的地址，Next 以 `global-not-found` 作答。原请求直接得到 404，不经重定向，不渲染任何页面。
   - 支持的语言之下的未知栏目（`/en/garbage`）本来就匹配不到路由，得到同一张 404 页。

变体的判定按语言标签的**主标签**精确匹配（`en-US` 的主标签是 `en`），不按字符串前缀——不用「以 es 开头」来判，那会把 `/essays` 带到 `/es`（实测现行代码正是如此）。栏目按清单查，不猜。

页面渲染：`[locale]` 根布局不读 cookie、不读请求头，并在渲染前调用 `setRequestLocale`，整棵公开页面树因此可以静态生成；数据经 `src/lib/*.ts` 的缓存读取。页面在首次被访问时生成，随后按数据缓存的时限（一小时）复用。后台保存笔记 → `revalidateTag('notes')` → 用到笔记数据的页面（详情、列表、首页、标签页、搜索索引、sitemap，都经 `notes` 标签读取）下次访问时重新生成。

## 3 入口
- 访客：`/<语言>/…` 下的页面；无前缀与语言变体地址经中间件到达它们。
- 维护者：`/admin/…`（自己的根布局，始终动态）。
- 机器：`/sitemap.xml`、`/robots.txt`、`/api/search-index`、各 `og.png`、`/sw.js`。
- CI：`check.yml` 由 PR 与所有分支的推送触发，并被 `deploy.yml` 调用。

## 4 模块间契约
- `decideLocaleRoute(input: { pathname: string; acceptLanguage: string | null; preferredLocale: string | null }): { kind: 'pass' } | { kind: 'redirect'; pathname: string } | { kind: 'not-found' }`
  - 纯函数，无 IO，不抛错；任何畸形输入都落到「没有偏好」。
  - `preferredLocale` 不是支持的语言时当作 `null`。
  - 重定向只改路径，查询串由中间件原样带上。
  - 语言集合与栏目清单从 `routing.ts` 读，不作为参数——它们不随请求变化。
- `mapLanguageTag(tag: string): AppLocale | null`（`detect.ts`，取代 `mapPathLocaleSegment`）：主标签不是 `en`、`fr`、`es`、`zh` 之一 → `null`。
- 记住的选择：cookie `preferred_locale`，值为支持的语言代码；`Path=/`、一年、`SameSite=Lax`、`Secure`。**只由语言切换控件写，只由中间件读**——页面与布局不得读它。
- 缓存标签：`notes`、`posts`、`gallery`、`projects`。写入方在写成功后使对应标签失效。
- 工作流：`deploy.yml` 顶层保持 `permissions: {}`；其 `check` 任务写 `uses: ./.github/workflows/check.yml` 并声明 `permissions: contents: read`（被调用的工作流只能降低、不能提升调用方给的权限）；`deploy` 任务写 `needs: check`，自身权限仍为空。

## 5 持久化数据
N/A —— 本版不改数据库结构。

## 6 异常流
- `Accept-Language` 缺失或畸形 → 按无偏好处理，落到 `en`。
- 不支持的语言前缀、未知的顶级路径 → 由 `route-decision` 判为「不存在」，状态码 404，页面为 `global-not-found`。`[locale]` 根布局里的 `notFound()` 只是兜底，任何行为不得依赖它。
- `/admin`、`/auth` 的会话续期失败（Supabase 不可达）→ 放行，由页面自己的管理员校验决定去向（fail-closed 在校验处，不在中间件）。
- 保存成功但缓存失效调用抛错 → 保存仍算成功，错误上抛到后台页面显示；内容最迟一小时后自行可见。不回滚保存：内容已落库是事实，缓存只是延迟。
- 闸门里任一步失败 → 后续步骤与部署都不执行。

## 7 不变量
1. 特权数据库客户端只经管理员校验发放 —— `tests/service-role-guard.test.ts`（既有）。
2. 公开页面保持可缓存 —— 两道守卫：`src/app/[locale]/**` 及其用到的服务端模块不引入 `next/headers`；其下每个 `layout.tsx`、`page.tsx` 都调用 `setRequestLocale`（新测试，按语法树检查）。**证据只认运行中服务的响应头**：构建的路由表把页面标成静态，并不意味着运行时不是 `no-store`（实测）。
3. 支持的语言只在 `src/i18n/routing.ts` 里列出 —— 新测试：别处不得出现同时含 `zh-CN` 与 `zh-HK` 的字面量数组（`src/messages/` 除外）。
4. 公开栏目清单 = `src/app/[locale]/` 下的一级目录名 —— 新测试。加了栏目却没登记，它的无前缀地址就会 404 而不是跳转。
5. 中间件确实被注册 —— 闸门里构建之后断言 `.next/server/middleware-manifest.json` 含一个入口。
6. 构建不依赖 Supabase 可达 —— 闸门用假环境变量完成构建即是证明。
7. `CLAUDE.md` 提到的路径与脚本都存在 —— `tests/claude-md.test.ts`。

## 8 外部系统约束
- **Next.js**：`middleware.ts` 必须与 `app` 目录同级；本项目的 `app` 在 `src/` 下，故为 `src/middleware.ts`。放在仓库根目录时构建不报错，只是不注册（实测：除位置外相同的两次构建，清单入口分别为空与 `/`）。
- **Next.js**：没有顶层 `app/layout.tsx` 时，每个含页面的顶级路由段要有自己的根布局；只有路由处理器的段不需要。顶层的 `not-found.tsx` 在此结构下不可用——未匹配的地址都落进 `[locale]`。
- **Next.js**：`metadata` 与 `viewport` 是路由段的导出，不能放进组件；两个根布局都得各自导出。
- **Next.js**：动态段的页面要在首次访问后被缓存，必须导出 `generateStaticParams`（可返回空数组）。
- **Next.js**：`app/` 下名为 `sitemap.ts` 的文件本身就是一条在构建期生成的路由；要让 sitemap 在请求时生成，它不能以这个名字留在 `app/` 里。
- **Next.js**：`[locale]` 本身也是动态段——根布局同样要导出 `generateStaticParams`（空数组），否则其下的列表页按请求渲染，运行时为 `no-store`（实测）。
- **Next.js**：`loading.tsx` 会在**同级布局之外**再包一层 Suspense。没有顶层布局时，放在 `app/` 下的 `loading.tsx` 包住了根布局：加载占位先于 `<html>` 流出、状态码已是 200，根布局的 `notFound()` 来不及改成 404（实测）。故它放在 `[locale]/` 下。
- **Next.js**：布局与页面并行渲染。根布局 `notFound()` 时页面仍会渲染；页面抛错则整个响应是 500 而非 404（实测）。
- **Next.js**：静态渲染的页面里，客户端组件调用 `useSearchParams()` 而其上没有 Suspense 边界，运行时为 500。导航在每个页面上，故它及其子组件不用这个 hook。
- **Next.js**：根布局里调用 `notFound()` 是框架不鼓励的用法（15.5 的开发模式有专门的守卫，Next 16 禁止）。404 不得建立在它之上。
- **Next.js**：`global-not-found` 是 15.5 的实验性功能（`experimental.globalNotFound`），是官方为「多个根布局」与「顶层动态段作根布局」给出的 404 方案——本项目两条都占。它不经任何布局，须自带整份文档。运行时验收断言这张页面是站点自己的页面；升级 Next 时若行为有变，闸门会红。
- **next-intl**：`NextIntlClientProvider` 在服务端渲染时会经请求头解析语言，除非此前调用过 `setRequestLocale`。不调用的后果不是报错，而是页面在运行时静默地变成 `no-store`。
- **浏览器**：Service Worker 的更新检查发生在访客再次打开站点时；距上次取脚本超过 24 小时，这次检查会绕过 HTTP 缓存，`immutable` 不妨碍它。所以回访的老访客会拿到新脚本；不再回访的访客不受影响，也无需处理。新脚本须在安装时跳过等待、激活时接管页面，否则会在旧页面开着时一直等待。
- **Cloudflare**：默认不缓存 HTML。本版的「可缓存」指应用自身复用已生成的页面。
- **GitHub Actions**：被调用的工作流需要 `on: workflow_call`，且不能提升调用方的权限。第三方与官方 action 一律钉到提交 SHA（本仓库既有做法）。
- **VPS 构建**：镜像在 VPS 上构建，`.env` 在构建上下文里；本版之后构建不再访问 Supabase，运行时仍需要。

## 9 其他设计
- `next.config.ts` 里对所有 `.css`/`.js` 加一年不可变缓存的规则删除：带哈希的 `_next/static` 资源 Next 自己已这样处理；这条规则真正波及的只有 `public/` 下不带哈希的文件，`/sw.js` 正是受害者。
- 自注销脚本：安装时 `skipWaiting()`；激活时 `clients.claim()`、删除全部缓存、`registration.unregister()`。约十行，长期保留。

## 10 开放设计问题
无。设计门提出的四个问题已由框架源码（评审）与实测（TRACK 第三区）定论；`notFound()` 的状态码与 OG 路径不被重定向，作为 REQ §5.2-d、§5.2-f 的验收在真的服务上检验。
