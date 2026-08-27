# blog

一个零后端、纯静态的个人博客。基于 GitHub Pages 部署，评论用 Giscus（GitHub Discussions），访问量用 GoatCounter。

## 目录结构

```
blog/
├── index.html          # 唯一入口（页面结构）
├── css/style.css       # 样式（主题、配色都在这）
├── js/
│   ├── text.js         # ★ 全站文案都在这里（JSON），改它就改字
│   ├── main.js         # 逻辑（风场粒子、路由、搜索、渲染…）
│   ├── articles-data.js# 文章数据（由 gen.mjs 自动生成，勿手改）
│   └── lib/            # marked / highlight.js（离线渲染用，勿动）
├── articles/           # ★ 你的文章都放这（Markdown）
├── rss.xml             # 订阅源（由 gen.mjs 自动生成）
└── tools/
    ├── gen.mjs         # ★ 生成文章数据 + RSS
    └── setup-github.mjs# 一键部署到 GitHub Pages
```

## 改文字

所有页面文字（导航、标题、按钮、空状态、快捷键说明、状态栏…）都在 **`js/text.js`** 里，标准 JSON 对象。直接改那个文件，保存后刷新页面即生效，不用重新生成、不用重新部署源码。改完记得把 `index.html` 里的 `?v=6` 版本号 +1 再推送。

## 发布一篇文章

1. 在 `articles/` 新建一个 `.md` 文件，文件名随意（会作为文章 id，建议英文短横线，如 `my-first-post.md`）。
2. 文件开头写 frontmatter，正文用 Markdown：

```markdown
---
title: 我的第一篇文章
date: 2026-08-27
tags: [生活, 随笔]
excerpt: 一句话摘要（可选，不写会自动截取正文）
glyph: ✨
---

这里是正文，支持 **加粗**、`行内代码`、列表、引用，以及代码块：

```js
console.log('hello');
```
```

3. 本地预览：
   ```bash
   cd ~/blog
   python3 -m http.server 8123
   ```
   打开 http://127.0.0.1:8123 查看效果（支持实时改 md 免重新生成）。

4. 生成数据并发布：
   ```bash
   node tools/gen.mjs        # 生成 articles-data.js + rss.xml
   git add -A
   git commit -m "发布：我的第一篇文章"
   git push origin main      # 推到 GitHub 后 Pages 自动构建（约 1 分钟）
   ```

## 修改 / 删除文章

- **改内容**：直接改对应 `.md`，重复上面第 4 步。
- **改标题/标签/日期**：改 frontmatter，重新 `node tools/gen.mjs`。
- **删除**：删掉 `.md` 文件，重新 `node tools/gen.mjs` 再推送。

## 自定义

- **背景粒子数量**：`js/main.js` 里 `initParticles()`，调 `Math.min(420, ...)` 里的数字。
- **配色 / 主题**：`css/style.css` 顶部的 `:root` 和 `[data-theme="light"]` 变量。
- **站点标题**：`index.html` 的 `<title>`。

## 评论与统计

- 评论 = Giscus，存在你的 GitHub Discussions，管理入口在仓库的 Discussions 标签页。
- 访问量 = GoatCounter（`noonecomes.goatcounter.com`），后台入口 https://noonecomes.goatcounter.com/

## 备注

- 改完 `js/main.js` 或 `css/style.css` 后，记得把 `index.html` 里的 `?v=4` 版本号 +1，否则访客会吃到浏览器缓存。
