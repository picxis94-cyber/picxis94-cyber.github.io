---
title: PostgreSQL 索引漫谈：从 B-Tree 到 BRIN
date: 2026-08-10
tags: [数据库, PostgreSQL, 性能]
excerpt: 什么时候该建索引？B-Tree、GIN、BRIN 各自适合什么场景？一篇帮你建立索引直觉的漫谈。
glyph: 🗄️
---

索引是数据库的"作弊笔记"。没有它，PostgreSQL 只能**顺序扫描**每一行；有了它，就像在书里插了目录，直接翻到对应的页码。但索引不是越多越好——它要占空间、拖慢写入。这篇聊聊几种主流索引的心智模型。

## B-Tree：万金油

默认索引类型。适合 `=`、`>`、`<`、`BETWEEN`、`ORDER BY`、前缀 `LIKE 'abc%'`。它的结构是**多层有序树**，叶子节点指向行。

```sql
CREATE INDEX idx_users_email ON users(email);
```

经验法则：

- 选择性高（一个值对应行数很少）的列，索引收益最大。
- 组合索引 `(a, b)` 能同时服务 `a`、`a+b` 的查询，但**服务不了**单独查 `b` 的查询——最左前缀原则。
- `ORDER BY a DESC` 也能走 `(a)` 的索引，反序扫描几乎免费。

## GIN：给数组和全文搜索

GIN 是"倒排索引"，适合一个值对应很多行的场景：数组包含、全文搜索、JSONB 的 `@>` 查询。

```sql
CREATE INDEX idx_tags ON posts USING GIN (tags);
CREATE INDEX idx_fts ON posts USING GIN (to_tsvector('english', body));
```

查询"包含标签"或"包含某词"时，B-Tree 无能为力，GIN 一下命中。

## BRIN：为海量时序数据而生

BRIN 把表的**物理块区间**记录最小值与最大值。如果数据是按时间顺序写入的（日志、传感器），每个区间内的最大值 / 最小值范围就很小，查询能瞬间跳过绝大多数块。

```sql
CREATE INDEX idx_ts ON events USING BRIN (created_at);
```

BRIN 极省空间（几 KB 对比 B-Tree 的几 MB），但只适合**物理有序、且查询按序**的数据。乱序插入的列用 BRIN 是灾难。

## 如何验证索引有没有生效

永远用 `EXPLAIN ANALYZE` 说话，而不是猜：

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'a@b.c';
-- 看到 Seq Scan 说明没走索引，走 Index Scan / Bitmap Heap Scan 才对
```

一个小技巧：`EXPLAIN (ANALYZE, BUFFERS)` 会告诉你真正读了多少个 8KB 的页，这是判断成本最诚实的指标。

> 索引是药，不是保健品。先有查询病，再开索引方。

建索引之前，先问自己：这个查询真的慢吗？数据量大吗？如果表只有几千行，顺序扫描比索引还快。
