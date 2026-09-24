# antelacus.com

一个多语言的个人博客与作品集：专栏、闪念、视觉、实验室四类内容；界面随语言切换，内容每篇只有一份。美学是《临湖》——古典内核，现代形式。

站点用 Next.js（App Router），内容存放在 Supabase（PostgreSQL），在站内后台 `/admin` 撰写与发布。它自托管在一台 VPS 上（Docker + nginx），前面是 Cloudflare；推送到 `main` 经闸门检查后自动部署。

## 在本地运行

命令、测试与闸门都写在 `CLAUDE.md` 的「Commands」一节，这里不重复。环境变量的清单是 `.env.example`；真实的值只在服务器上。不接数据库也能构建；要看一个带合成内容的完整站点，方法也在那一节。

## 文档在哪

| 想知道 | 去看 |
|---|---|
| 代码怎么组织、改代码要守的规则 | `CLAUDE.md` |
| 怎么写作与发布内容 | `docs/content-publishing.md` |
| 美学与设计规则 | `docs/aesthetic-thesis.md` |
| 各功能的需求、设计与进度 | `docs/features/<功能>/` 下的 `REQ.md`、`DESIGN.md`、`TRACK.md` |
| 每个版本改了什么 | `CHANGELOG.md` |
| 部署、服务器、备份与恢复 | `docs/DEPLOYMENT.md` |
| 尚未解决的技术债 | `docs/TECHNICAL_DEBT.md` |
| 术语 | `docs/GLOSSARY.md` |
| 创收与品牌运营 | `docs/site-operating.md` |
| v2.2.0 之前的版本记录 | `docs/versions/` |
