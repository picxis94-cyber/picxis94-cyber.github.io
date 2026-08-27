---
title: 极简博客的心智模型：没有后端的博客也是博客
date: 2026-07-30
tags: [架构, 前端, 随笔]
excerpt: 一个不需要数据库、不需要服务器、双击 index.html 就能跑的博客，是怎么组织数据流的？
glyph: 🏔️
---

写博客最常见的第一反应是：上框架、上数据库、上后台。但多数个人博客的内容量，根本喂不饱一台服务器。这篇聊聊**零后端**博客的心智模型——它怎么组织数据、怎么路由、怎么升级。

## 内容即数据

把"内容"和"程序"分离：文章是纯 Markdown 文件，程序只负责把它们渲染出来。目录结构一目了然：

```
blog/
├── index.html          # 唯一入口
├── css/style.css
├── js/main.js
├── articles/           # 内容即数据
│   ├── flow-field-engine.md
│   └── go-concurrency-notes.md
└── rss.xml             # 由脚本生成
```

关键决策：**文章是内容，不是数据库记录**。Markdown 文件 + 版本管理（git），比任何后台编辑器都可靠、可追溯。

## 数据流：编译期 vs 运行时

零后端博客有两条路：

1. **编译期构建**：写一个脚本把 Markdown 打包进一个 `articles.js`。浏览器直接读内存里的数据，双击文件也能跑（`file://` 协议下 `fetch` 会被浏览器禁止）。
2. **运行时拉取**：用 `fetch('articles/x.md')` 按需加载，文章多时更省流量，但必须通过 HTTP 服务器访问。

```js
// 优雅降级：先试 fetch，失败就退回内嵌数据
async function load(id) {
  try {
    const res = await fetch(`articles/${id}.md`);
    if (res.ok) return parseFrontmatter(await res.text());
  } catch (_) { /* file:// 下必然失败，忽略 */ }
  return EMBEDDED[id];   // 打包进来的兜底
}
```

两条路都留，一条在云端，一条在本地——本地草稿永远能看。

## 路由：一个页面，N 种视图

没有后端就没有 URL 路由，于是我们用"视图切换"模拟页面：主文档只有一个 `index.html`，`data-view` 属性决定显示哪一块。

```js
const views = document.querySelectorAll('[data-view]');
function go(view) {
  views.forEach(v => v.classList.toggle('is-active', v.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

配合 `history.pushState`，还能把视图状态写进 URL，分享链接、刷新还原都不成问题。这是单页应用最朴素的形态，代价是框架约等于零。

## 什么时候需要升级

如果有一天你发现：

- 文章超过几百篇，首屏要加载的数据太大；
- 想要多人协作、评论、数据统计；
- 想要一套完整的后台编辑器；

那就乖乖上静态站点生成器（Astro / Vite）或后端。但在此之前——**先让内容流动起来**。

> 博客的核心不是技术栈，是写作本身。零后端不是简陋，是克制。

这篇文章本身，就是这个心智模型的证明。
