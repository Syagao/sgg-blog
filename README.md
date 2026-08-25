# 沈高高的个人博客

基于 Astro 构建的中文个人博客，内容聚焦机器人算法、运动控制、系统辨识、编程学习、工作总结和生活记录。

## 本地开发

```sh
npm install
npm run dev
```

访问终端输出的本地地址即可预览。生产构建使用：

```sh
npm run build
```

## 新增文章

在 `src/content/blog/` 下创建 `.md` 或 `.mdx` 文件，并使用以下 frontmatter：

```yaml
---
title: "文章标题"
description: "文章摘要"
pubDate: "2026-08-26"
updatedDate: "2026-08-26"
tags: ["机器人", "运动控制"]
draft: false
---
```

`updatedDate` 可以省略；`draft: true` 的文章不会进入生产构建。
