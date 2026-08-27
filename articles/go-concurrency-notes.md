---
title: Go 并发三板斧：goroutine、channel、select
date: 2026-08-15
tags: [Go, 后端, 并发]
excerpt: 不要通过共享内存来通信，而要通过通信来共享内存。用三个核心原语拆解 Go 的并发心智模型。
glyph: 🐹
---

Go 的并发模型就一句话：**不要通过共享内存来通信，而要通过通信来共享内存。** 翻译成人话——别让多个 goroutine 抢同一个变量，而是让它们互相"传纸条"。

## goroutine：轻到没朋友

goroutine 不是线程，而是一个 **2KB 起步、按需增长**的协程，由 Go 运行时调度。创建一万个 goroutine 毫无压力，而一万个线程可能已经撑爆了。

```go
go func() {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            work()
        }
    }
}()
```

关键洞察：goroutine 之间的"切换"由运行时在**协作点**完成（channel 收发、syscall、调度点），而非操作系统的抢占式时间片，所以它快、它省。

## channel：就是那个纸条

channel 是一根管道。send 是塞纸条，receive 是取纸条。它默认是**同步**的：发送方会阻塞直到有人接收。

```go
jobs := make(chan int, 8)   // 带缓冲，像收件箱
done := make(chan struct{}) // 无缓冲，纯信号

go func() {
    for j := range jobs {    // 空 channel 关闭后自动退出
        process(j)
    }
    close(done)
}()
```

带缓冲的 channel 是"异步邮箱"，能减少阻塞；无缓冲的 channel 则是"握手"，天然适合做同步信号。**close 一个 channel 是广播**——所有接收方都会立刻拿到零值，这是优雅停止 worker 的标准姿势。

## select：同时监听所有纸条

`select` 会让 goroutine 同时等一堆 channel，谁先有消息就处理谁：

```go
select {
case msg := <-inbox:
    handle(msg)
case <-ticker.C:
    heartbeat()
case <-ctx.Done():
    return err
default:
    // 一个都没就绪：立刻返回，不阻塞
}
```

`select` 加 `ctx` 是 Go 世界里最优雅的"超时 + 取消"组合拳。没有它，你很容易写出阻塞到死的 worker。

## 常见翻车现场

1. **只发不收**：没人消费 channel，goroutine 全堵死 → 用 `context` 或确保消费方存在。
2. **重复 close**：`close` 一个已关闭的 channel 会 panic → 用 `sync.Once` 或只让一个 goroutine 负责关闭。
3. **无锁共享变量**：多个 goroutine 同时写 map → 用 `sync.Mutex` 或直接改成 channel。

```go
var mu sync.Mutex
count := make(map[string]int)
mu.Lock()
count[key]++   // 天下太平
mu.Unlock()
```

> 并发不是并行。并发是"同时处理很多事"，并行是"同一时刻真的在做很多事"。先学会并发，再谈并行。

这套心智模型背下来，你的 Go 程序就很少再出现"死锁现场"了。
