# DESIGN — routing-slimdown

## 1 引言
### 1.1 参考
- 需求：`docs/features/routing-slimdown/REQ.md`
- 实测记录：`docs/features/routing-slimdown/TRACK.md` 第三区「设计门后的实测」
- Next.js 文档：middleware 文件位置、国际化指南（根布局放进 `app/[lang]`）、`generateStaticParams` 返回空数组、`revalidateTag`；next-intl 文档：静态渲染与 `setRequestLocale`、error files（`[locale]/not-found.tsx` 与 `global-not-found`）
- 上游缺陷：vercel/next.js #62228、#99287——页面里的 `notFound()` 不经服务端渲染（§8）
### 1.2 术语
见 REQ §1.4。

## 2 总体设计

### 2.1 模块关系
| 模块 / 文件 | 单一职责 | 测试层级 |
|-------------|---------|----------|
| `src/i18n/routing.ts` | 支持的语言、默认语言、**公开栏目清单**（`/<语言>/` 之下的一级路径名）、**不参与语言路由的顶级路径清单**（目录与单个文件）——唯一来源 | infra |
| `src/i18n/detect.ts` | 把语言标签（路径段、`Accept-Language`）归到支持的语言；归不到则为空 | core |
| `src/i18n/route-decision.ts` | **语言路由的全部规则**：路径、`Accept-Language`、记住的选择 → 「放行」「308 到某地址」「不存在（带语言）」或「查过内容再定」；另有「按内容索引判定是否存在」的纯函数 | core |
| `src/proxy.ts`（由根目录的 `middleware.ts` 移入，Next 16 起改名） | 薄壳：执行 `route-decision` 的结论；「查过内容再定」时经本机回环取内容索引；「不存在」时改写到匹配不到路由的地址，并把语言放进请求头；放行的请求若在 `/admin`、`/auth` 之下则续期会话。自身不含规则，`matcher` 只排除框架自己的 `/_next/` | IO |
| `src/app/api/route-index/route.ts`（新） | 内容索引：各类型已发布的 slug、在用的标签、关于页是否有已发布版本。经 `src/lib/*.ts` 的缓存读取，随各类型的标签失效——与页面同一套缓存，不另造 | IO |
| `src/app/global-not-found.tsx` | 全站唯一的 404 文档：请求头带支持的语言时，用该语言的站点外壳（`LocaleShell`，含导航）与该语言的标题；否则英文、无导航 | IO |
| `src/components/LocaleShell.tsx`（新） | 一种语言的公开站点外壳：按语言载入界面文字（缺的键回落到 `en`）、`SiteDocument lang`、导航与翻译上下文。由 `[locale]` 根布局与 `global-not-found` 共用 | infra |
| `src/app/site-metadata.ts`（新） | 全站的 `metadata` 与 `viewport` 对象（由现根布局原样搬来） | infra |
| `src/components/SiteDocument.tsx`（新） | `<html lang>`、`<head>`、`<body>` 的公共外壳：全局 CSS、KaTeX 样式、字体变量与预载都在这里引入；`lang` 由调用方传入 | infra |
| `src/app/[locale]/layout.tsx` | **公开站点的根布局**：校验语言（不支持 → `notFound()`）、`setRequestLocale`、用 `LocaleShell` 输出外壳；导出 `metadata`、`viewport` | IO |
| `src/app/admin/layout.tsx` | **后台的根布局**：`SiteDocument lang="en"`，强制不缓存；导出同一份 `metadata`、`viewport` | infra |
| `src/app/[locale]/**/page.tsx` | 页面。每个页面调用 `setRequestLocale`，详情页另声明「首次访问时生成、之后缓存」。内容不存在时的 `notFound()` 只是兜底（§6） | IO |
| `src/app/{posts,notes,gallery,projects}/[slug]/og.png`、`src/app/og.png` | 分享图，地址不变 | IO |
| `src/lib/sitemap-entries.ts`（由 `src/app/sitemap.ts` 改名搬来） | 生成 sitemap 条目的普通模块——不再是路由文件 | IO |
| `src/app/sitemap.xml/route.ts` | `/sitemap.xml` 的**唯一**路由，请求时生成 | IO |
| `src/lib/{posts,notes,gallery,projects}.ts` | 带标签、带时限的数据缓存；时限统一为半小时（`src/lib/cache-lifetime.ts`）——页面自身的缓存继承并叠加在它之上，改库最坏两倍时限可见，REQ 承诺一小时 | IO |
| `src/components/LanguageSwitch.tsx` | 语言切换；手动切换时记下选择 | IO |
| `src/app/admin/(protected)/content/actions.ts` | 保存/发布内容；成功后使该类型的标签失效 | IO |
| `.github/workflows/branch.yml` | 闸门（含构建后的 proxy 清单断言）与部署：release-pipeline DESIGN §2 | infra |
| `public/sw.js` | 自注销脚本 | infra |
| `CLAUDE.md` + `tests/claude-md.test.ts`（新） | 与现实一致的项目说明；测试断言其中每个路径与 `npm run` 名都存在 | infra |

依赖方向：`proxy → route-decision → detect → routing`，单向；proxy 经 HTTP 读 `route-index`，不 import 数据层；页面与组件只读 `routing`。

删除的文件：`src/app/layout.tsx`、`src/app/not-found.tsx`、`src/app/page.tsx`、8 个无前缀的重定向空壳与 `src/app/search/page.tsx`、`src/app/tags/[id]/page.tsx`（与 `[locale]` 下的逐字重复）、`[locale]` 下 4 个三行的转引文件（被搬来的真实实现取代），以及 TD-010 列出的全部条目。

### 2.2 数据流
请求 → `middleware`：
1. `/_next/` 之下的请求不经中间件。其余一律交 `route-decision`，按第一段路径（**整段比较，不按前缀**——`/apiary` 不在 `/api` 之下，`/authors` 不在 `/auth` 之下）：
   - 在「不参与语言路由」清单里（目录 `admin`、`api`、`auth`、`images`，文件 `robots.txt`、`sitemap.xml`、`sw.js`、`ads.txt`），或以 `/og.png` 结尾 → 放行；其中 `/admin`、`/auth` 之下的由中间件续期会话。只有 `/admin` 自身是页面，其余目录的裸名（`/auth`、`/api`）属「不存在」。
   - 是支持的语言 → 看其后的路径：首页、公开栏目、`<栏目>/<合法 slug>`、`tags/<标签>` 之外的一切（未知栏目、多余的层级、格式不对的 slug）→「不存在」，带上这个语言；详情、标签页、关于页 →「查过内容再定」；其余（首页、列表页）放行。
   - 「查过内容再定」：中间件取内容索引，条目在 → 放行；不在 →「不存在」，带上语言。索引取不到（数据库不可达、超时）→ 放行，由页面作答，与没有这一步时相同。
   - 为空，或在公开栏目清单里（`posts`、`about`…）→ 没有前缀：308 到 `/<语言>/<原路径>`，语言取 记住的选择 → `Accept-Language` → `en`。
   - 能归到支持的语言的变体（`zh-tw`、`en-US`）→ 308 到对应语言。
   - 其余一切（`xx-anything`、`essays`）→ 「不存在」，不带语言。
   - 「不存在」：中间件把请求改写到一个匹配不到任何路由的地址，带语言时再把语言放进请求头；Next 以 `global-not-found` 作答，它按请求头选语言，没有则英文。原请求直接得到 404，不经重定向，不渲染任何页面，整份文档在服务端生成。

变体的判定按语言标签的**主标签**精确匹配（`en-US` 的主标签是 `en`），不按字符串前缀——不用「以 es 开头」来判，那会把 `/essays` 带到 `/es`（实测现行代码正是如此）。栏目按清单查，不猜。

页面渲染：`[locale]` 根布局不读 cookie、不读请求头，并在渲染前调用 `setRequestLocale`，整棵公开页面树因此可以静态生成；数据经 `src/lib/*.ts` 的缓存读取。页面在首次被访问时生成，随后按数据缓存的时限复用。后台保存一条内容 → 该类型的标签失效 → 用到它的页面（详情、列表、首页、标签页、搜索索引、sitemap，都经该标签读取）下次访问时重新生成。

## 3 入口
- 访客：`/<语言>/…` 下的页面；无前缀与语言变体地址经中间件到达它们。
- 维护者：`/admin/…`（自己的根布局，始终动态）。
- 机器：`/sitemap.xml`、`/robots.txt`、`/api/search-index`、各 `og.png`、`/sw.js`。
- CI：见 release-pipeline DESIGN §3。
- proxy：`GET /api/route-index`，只经本机回环。

## 4 模块间契约
- `decideLocaleRoute(input: { pathname: string; acceptLanguage: string | null; preferredLocale: string | null }): { kind: 'pass' } | { kind: 'redirect'; pathname: string } | { kind: 'not-found'; locale: AppLocale | null } | { kind: 'lookup'; locale: AppLocale; item: ContentItem }`
  - `ContentItem`：`{ section: 'posts' | 'notes' | 'gallery' | 'projects'; slug }`、`{ section: 'tags'; tag }`（解码后的标签）或 `{ section: 'about' }`。
  - 标签段只解码一次（`decodeURIComponent`，与标签页同一规则），解码失败 →「不存在」。判定不看查询串。
  - 纯函数，无 IO，不抛错；任何畸形输入都落到「没有偏好」。
  - `preferredLocale` 不是支持的语言时当作 `null`。
  - 重定向只改路径，查询串由中间件原样带上。
  - 语言集合与栏目清单从 `routing.ts` 读，不作为参数——它们不随请求变化。
- `mapLanguageTag(tag: string): AppLocale | null`（`detect.ts`，取代 `mapPathLocaleSegment`）：主标签不是 `en`、`fr`、`es`、`zh` 之一，或任一子标签不是非空的字母数字串（`en--US`、`zh-`）→ `null`。
- 记住的选择：cookie `preferred_locale`，值为支持的语言代码；`Path=/`、一年、`SameSite=Lax`、`Secure`。**只由语言切换控件写，只由中间件读**——页面与布局不得读它。
- `isPublished(item: ContentItem, index: RouteIndex): boolean`（`route-decision.ts`）：纯函数。
- `GET /api/route-index` → `RouteIndex = { posts: string[]; notes: string[]; gallery: string[]; projects: string[]; tags: string[]; about: boolean }`，`Cache-Control: no-store`；读取失败 → 500 与通用 JSON，不含数据库原文（同 `/api/search-index`）。内容都是已公开的（sitemap、搜索索引里本来就有）。
- proxy 取索引：`http://<回环主机>:<PORT>/api/route-index`，`cache: 'no-store'`，500 毫秒超时；返回的 JSON 先校验形状（六个字段各是字符串数组或布尔），不合即按「取不到」处理；回环主机在 `HOSTNAME` 为 `localhost` 时用 `localhost`，否则用 `127.0.0.1`（§8）。
- 语言请求头 `x-site-locale`：只由 proxy 写，且 proxy 先删掉请求里原有的同名头；`global-not-found` 读它，不是支持的语言就当没有。
- 缓存标签：`notes`、`posts`、`gallery`、`projects`、`pages`。写入方在写成功后使对应标签失效；内容索引经同一批标签读取。

## 5 持久化数据
N/A —— 本版不改数据库结构。

## 6 异常流
- `Accept-Language` 缺失或畸形 → 按无偏好处理，落到 `en`。
- 不支持的语言前缀、未知的顶级路径 → 由 `route-decision` 判为「不存在」，状态码 404，页面为 `global-not-found`。`[locale]` 根布局里的 `notFound()` 只是兜底，任何行为不得依赖它。
- 内容不存在的详情、标签、关于页 → proxy 查过索引后判为「不存在」，页面不渲染。页面里的 `notFound()` 只剩兜底：索引说在、页面读时已不在（两者经同一批标签失效，只在失效的瞬间可能错开），此时得到的是框架的空壳 404（§8），接受。
- 内容索引取不到（数据库不可达、回环超时、500、形状不对）→ proxy 放行并记一行日志，页面照旧作答（数据库不可达时 500）。不因索引故障把存在的内容答成 404；代价是这时的未知条目回到框架的空壳 404（接受）。
- 发布的瞬间，一个在途请求可能读到失效前的索引而答 404；下一次访问即正确（接受：索引与页面经同一缓存函数读取）。
- `/admin`、`/auth` 的会话续期失败（Supabase 不可达）→ 放行，由页面自己的管理员校验决定去向（fail-closed 在校验处，不在中间件）。
- 保存成功但缓存失效调用抛错 → 保存仍算成功，错误上抛到后台页面显示；内容最迟一小时后自行可见。不回滚保存：内容已落库是事实，缓存只是延迟。
- 闸门里任一步失败 → 后续步骤与部署都不执行。

## 7 不变量
1. 特权数据库客户端只经管理员校验发放 —— `tests/service-role-guard.test.ts`（既有）。
2. 公开页面保持可缓存 —— 两道守卫：`src/app/[locale]/**` 及其用到的服务端模块不引入 `next/headers`；其下每个 `layout.tsx`、`page.tsx` 都调用 `setRequestLocale`（新测试，按语法树检查）。**证据只认运行中服务的响应头**：构建的路由表把页面标成静态，并不意味着运行时不是 `no-store`（实测）。
3. 支持的语言只在 `src/i18n/routing.ts` 里列出 —— 新测试：别处不得出现同时含 `zh-CN` 与 `zh-HK` 的字面量数组（`src/messages/` 除外）。
4. 公开栏目清单 = `src/app/[locale]/` 下的一级目录名 —— 新测试。加了栏目却没登记，它的无前缀地址就会 404 而不是跳转。
5. proxy（中间件）确实被注册 —— 闸门里构建之后断言 `.next/server/functions-config-manifest.json` 的 `/_middleware` 项带 matcher（Next 16 起；15 时是 `middleware-manifest.json`）；运行时验收的 §5.2-b 重定向是第二道证据。
6. 构建不依赖 Supabase 可达 —— 闸门用假环境变量完成构建即是证明。
7. `CLAUDE.md` 提到的路径与脚本都存在 —— `tests/claude-md.test.ts`。
8. `src/app` 与 `public/` 的每个顶级条目都已登记为栏目或「不参与语言路由」—— 新测试。中间件对不认识的第一段一律答 404，未登记的新路由或新文件不会被提供。
9. 带语言的 404 都在渲染之前由 proxy 判定，文档在服务端生成 —— `route-decision` 的单元测试覆盖每种路径形状；运行时验收（REQ §5.2-i、content-publishing §5.4-a/d）只看去掉 `<script>` 之后的 HTML：`<html lang>` 是地址的语言、有标题。只查状态码或只在响应里搜 404 文案的检查会放过框架的空壳（文案在脚本数据里）。
10. `[locale]` 下凡有 `notFound()` 的页面，其判定条件都在内容索引里有对应项 —— 新测试：列出 `[locale]` 下调用 `notFound()` 的页面，每个都属于 `ContentItem` 的某一类。新增一种会 404 的页面而索引不认得它，测试即红。

## 8 外部系统约束
- **Next.js**：`middleware.ts`（Next 16 起为 `proxy.ts`）必须与 `app` 目录同级；本项目的 `app` 在 `src/` 下，故为 `src/proxy.ts`。放在仓库根目录时构建不报错，只是不注册（实测：除位置外相同的两次构建，清单入口分别为空与 `/`）。
- **Next.js**：没有顶层 `app/layout.tsx` 时，每个含页面的顶级路由段要有自己的根布局；只有路由处理器的段不需要。顶层的 `not-found.tsx` 在此结构下不可用——未匹配的地址都落进 `[locale]`。
- **Next.js**：`metadata` 与 `viewport` 是路由段的导出，不能放进组件；两个根布局都得各自导出。
- **Next.js**：动态段的页面要在首次访问后被缓存，必须导出 `generateStaticParams`（可返回空数组）。
- **Next.js**：`app/` 下名为 `sitemap.ts` 的文件本身就是一条在构建期生成的路由；要让 sitemap 在请求时生成，它不能以这个名字留在 `app/` 里。
- **Next.js**：`[locale]` 本身也是动态段——根布局同样要导出 `generateStaticParams`（空数组），否则其下的列表页按请求渲染，运行时为 `no-store`（实测）。
- **Next.js**：`loading.tsx` 会在**同级布局之外**再包一层 Suspense。没有顶层布局时，放在 `app/` 下的 `loading.tsx` 包住了根布局：加载占位先于 `<html>` 流出、状态码已是 200，根布局的 `notFound()` 来不及改成 404（实测）。故它放在 `[locale]/` 下。
- **Next.js**：布局与页面并行渲染。根布局 `notFound()` 时页面仍会渲染；页面抛错则整个响应是 500 而非 404（实测）。
- **Next.js**：静态渲染的页面里，客户端组件调用 `useSearchParams()` 而其上没有 Suspense 边界，运行时为 500。导航在每个页面上，故它及其子组件不用这个 hook。
- **Next.js**：根布局里调用 `notFound()` 是框架不鼓励的用法（15.5 的开发模式有专门的守卫，Next 16 禁止）。404 不得建立在它之上。
- **Next.js**：页面里调用 `notFound()` 时，生产构建返回 404 状态，但文档是空壳 `<html id="__next_error__">`，`not-found.tsx` 的内容只在脚本数据里、由浏览器渲染：无 `lang`、无标题，不执行 JavaScript 就是空白，执行时冷缓存下要数秒（实测生产 3.6–17 秒，正常页面 0.7–1.1 秒）。与布局结构无关：最小的标准应用在 15.5、16.0–16.3.7、16.4 canary 上都复现，Vercel 自己的站点也如此；对爬虫的 UA 同样。上游 #62228（2024 年起未修）、#99287。匹配不到路由的地址（`global-not-found`）不受影响，是完整的服务端文档。
- **Next.js**：`unstable_cache` 在 proxy 里不缓存——每次调用都执行（实测）。proxy 需要的数据经本机 HTTP 从路由处理器取，那里缓存照常生效。
- **Next.js**：`next start -p` 与 standalone 的 `server.js` 都把端口放在 `process.env.PORT`，proxy 能读到（实测）。proxy 发往本机的请求照样经过 proxy，`/api/…` 在「不参与语言路由」之列，不会循环。
- **Next.js**：`global-not-found` 可以读请求头（`headers()`）；proxy 的 `NextResponse.rewrite(url, { request: { headers } })` 带过去的头在那里可见（实测）。改写的目标必须匹配不到任何路由——一段的地址会被 `[locale]` 接住（实测得到首页）。
- **Next.js**：`global-not-found` 是 15.5 的实验性功能（`experimental.globalNotFound`），是官方为「多个根布局」与「顶层动态段作根布局」给出的 404 方案——本项目两条都占。它不经任何布局，须自带整份文档。运行时验收断言这张页面是站点自己的页面；升级 Next 时若行为有变，闸门会红。
- **next-intl**：`NextIntlClientProvider` 在服务端渲染时会经请求头解析语言，除非此前调用过 `setRequestLocale`。不调用的后果不是报错，而是页面在运行时静默地变成 `no-store`。
- **浏览器**：Service Worker 的更新检查发生在访客再次打开站点时；距上次取脚本超过 24 小时，这次检查会绕过 HTTP 缓存，`immutable` 不妨碍它。所以回访的老访客会拿到新脚本；不再回访的访客不受影响，也无需处理。新脚本须在安装时跳过等待、激活时接管页面，否则会在旧页面开着时一直等待。
- **Cloudflare**：默认不缓存 HTML。本版的「可缓存」指应用自身复用已生成的页面。
- **GitHub Actions**：第三方与官方 action 一律钉到提交 SHA（本仓库既有做法）。
- **构建**：构建不访问 Supabase，运行时需要；镜像在 CI 构建（release-pipeline DESIGN）。

## 9 其他设计
- `next.config.ts` 里对所有 `.css`/`.js` 加一年不可变缓存的规则删除：带哈希的 `_next/static` 资源 Next 自己已这样处理；这条规则真正波及的只有 `public/` 下不带哈希的文件，`/sw.js` 正是受害者。
- 缓存时限的原则：只有文件名带内容哈希的资源才可以 `immutable`。`public/images/` 下的文件与各 `og.png` 的地址不随内容变化，统一为一天（`public, max-age=86400`）。分享图的一年不可变是 `next/og` 自带的默认值，须在路由里显式覆盖；`next.config.ts` 的规则只作用于 `/images/`，不碰 `/_next/static`。
- 自注销脚本：安装时 `skipWaiting()`；激活时 `clients.claim()`、删除全部缓存、`registration.unregister()`。约十行，长期保留。
- **内容 404 由 proxy 先判**，是为绕开 §8 的上游缺陷而设的临时结构，登记为 TECHNICAL_DEBT 里的已接受项，退役条件写在那里：上游修好之后，「查过内容再定」与 `route-index` 删除，页面的 `notFound()` 重新成为正路；按语言输出的 `global-not-found` 保留（格式不对的地址、未知栏目仍由 proxy 判）。
  - 不用 proxy 自己在内存里存索引、保存时作废：那要依赖 proxy 与保存动作在同一个进程里——实测如此，但不是文档保证；一旦不成立，新发的内容会被答成 404，最长半小时，而且没有任何报错。经 HTTP 取，失效机制与页面是同一个。
  - 不钉 Next 版本、不等上游：§8 列出的版本都复现，#62228 两年多未修。
  - 不用 `redirect` 到一个 404 地址：原地址必须直接得到 404（REQ §5.2-d、content-publishing §5.4-a）。

## 10 开放设计问题
- Q1 导航（客户端组件、next-intl 的上下文）在 `global-not-found` 里能否照常渲染：TD-025 的第一个批次先试；不能则带语言的 404 也不带导航，与无语言的 404 一致。
- Q2 每个详情、标签、关于页的请求多一次本机回环，增加多少耗时：Phase 4 在预发布上前后对比（首字节时间的中位数）。
