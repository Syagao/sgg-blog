# 系统架构

## 技术栈

- Astro `^7.2.6`，静态输出；
- Node.js `>=22.12.0`；
- TypeScript 严格配置；
- Astro Content Collections；
- Markdown 和 MDX；
- `@astrojs/sitemap` 生成站点地图；
- `@astrojs/rss` 生成 RSS；
- `@fontsource/inter` 提供本地托管的 Inter 拉丁字符字体；
- `lxgw-wenkai-screen-webfont` 提供按 Unicode 范围切分的霞鹜文楷屏幕阅读版；
- `sharp` 供 Astro 图片处理使用；
- 原生 CSS 和 Astro 组件作用域样式，无 Tailwind 或客户端框架。

站点地址的构建配置位于 `astro.config.mjs`，当前为 `https://shengaogao.com`。

## 目录职责

```text
src/
├─ components/       可复用的页面部件
├─ content/blog/     Markdown 与 MDX 文章
├─ layouts/          通用页面壳和文章布局
├─ pages/            Astro 文件路由与 RSS 端点
├─ styles/           全局设计令牌和基础样式
├─ utils/blog.ts     文章查询、排序、日期与阅读时间工具
├─ content.config.ts 内容集合 schema
└─ consts.ts         站点标题、描述、域名和 GitHub 地址
```

## 页面与路由

| 路由 | 来源 | 职责 |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | 展示四个静态技术版块和最新 6 篇文章 |
| `/blog/` | `src/pages/blog/index.astro` | 兼容旧地址的文章列表，站内不再提供入口 |
| `/blog/[...slug]/` | `src/pages/blog/[...slug].astro` | 静态生成文章详情 |
| `/tags/[tag]/` | `src/pages/tags/[tag].astro` | 静态生成标签聚合页 |
| `/archive/` | `src/pages/archive.astro` | 唯一文章总览入口，按年份归档并提供标签索引 |
| `/about/` | `src/pages/about.astro` | 个人介绍与博客说明 |
| `/rss.xml` | `src/pages/rss.xml.js` | RSS feed |
| `/404.html` | `src/pages/404.astro` | 静态 404 页面 |

## 渲染与数据流

1. `src/content.config.ts` 从 `src/content/blog/**/*.{md,mdx}` 加载并校验文章。
2. `getPublishedPosts()` 查询集合、按发布日期倒序排序，并在生产环境排除草稿。
3. 列表、首页、标签、归档和 RSS 共用该查询函数。
4. 文章动态路由在构建期生成路径，并计算上一篇和下一篇。
5. Astro `render()` 生成文章内容及标题目录；`BlogPost.astro` 负责文章页外壳。
6. `astro build` 输出到被 Git 忽略的 `dist/`，并生成 sitemap。

## 布局与组件边界

- `PageLayout.astro` 统一 HTML 外壳、SEO head、页头、主内容和页脚。
- `BlogPost.astro` 在通用布局内增加文章标题、元数据、标签、目录、分享和前后文章导航。
- `PostList.astro` 被旧兼容文章列表和标签页复用；首页使用独立的紧凑日期文章列表。
- `Header.astro`、`Footer.astro` 和 `ThemeToggle.astro` 提供全站品牌区、导航、页脚索引与主题切换。页头通过 Astro `Image` 组件处理 `pic/jiamo.jpg`，构建为尺寸受控的 WebP 头像。
- `BaseHead.astro` 生成 canonical、RSS、Open Graph 和 Twitter 元数据，并在首屏脚本中恢复主题。
- `Callout.astro` 是 MDX 可用的说明、提示和警告组件。

## 样式系统

- `src/styles/global.css` 定义颜色、宽度和字体等设计令牌，以及全局基础样式。
- 组件和页面的具体样式大多与对应 `.astro` 文件放在一起。
- 深色模式通过根元素的 `data-theme="dark"` 切换 CSS 变量。
- 主题偏好先读取 `localStorage`，没有保存值时跟随系统偏好。
- `src/styles/global.css` 直接导入本地字体包，不依赖外部字体 CDN：Inter 加载拉丁字符的 400、500、600、700 字重，霞鹜文楷屏幕阅读版加载 400 字重并按 Unicode 范围拆分。
- 全站字体栈为 `Inter, "LXGW WenKai Screen", "STFangsong", "FangSong", serif`；英文和数字优先使用 Inter，中文使用霞鹜文楷，后续字体用于加载失败时回退。
- 仓库原有的 Atkinson 字体文件仍未被引用。

## 客户端行为

站点绝大部分为静态 HTML。少量原生脚本用于：

- 切换并持久化深浅主题；
- 为文章标题补充锚点；
- 为代码块添加复制按钮；
- 复制文章链接；
- 使用 `IntersectionObserver` 标记目录当前位置；
- 为正文图片补充延迟加载和异步解码。

## 质量保障

`package.json` 当前只有开发、构建、预览和 Astro CLI 脚本，没有独立的测试、lint 或格式化脚本。`tests/` 内使用 Node.js 内置测试运行器检查构建后的导航、外链和归档行为；完整回归需先运行 `npm run build`，再运行 `node --test tests/*.test.mjs`。
