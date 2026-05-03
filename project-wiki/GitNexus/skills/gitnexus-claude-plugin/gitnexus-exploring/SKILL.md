---
name: gitnexus-exploring
description: "当用户想了解代码如何工作、梳理架构、跟踪执行流或探索陌生模块时使用。示例：「认证怎么做？」「谁调了这个函数？」「展示 auth 流程」"
---

# 使用 GitNexus 探索代码库

## 何时使用

- 「认证是如何实现的？」
- 「项目结构是什么？」
- 「主要组件有哪些？」
- 「数据库逻辑在哪里？」
- 需要快速理解从未接触过的代码

## 工作流

```
1. READ gitnexus://repos                          → 发现已索引仓库
2. READ gitnexus://repo/{name}/context             → 仓库概览，检查是否陈旧
3. gitnexus_query({query: "<你想理解的主题>"})  → 查找相关执行流
4. gitnexus_context({name: "<symbol>"})            → 深入单个符号
5. READ gitnexus://repo/{name}/process/{name}    → 跟踪完整执行流
```

> 若第 2 步提示「Index is stale」→ 在终端运行 `npx gitnexus analyze`。

## 清单

```
- [ ] READ gitnexus://repo/{name}/context
- [ ] 对目标概念执行 gitnexus_query
- [ ] 审阅返回的 processes（执行流）
- [ ] 对关键符号执行 gitnexus_context 查看调用方/被调方
- [ ] READ process 资源获取完整轨迹
- [ ] 阅读源码确认实现细节
```

## 资源

| 资源 | 内容 |
|------|------|
| `gitnexus://repo/{name}/context` | 统计、陈旧警告（约 150 token） |
| `gitnexus://repo/{name}/clusters` | 功能区与凝聚度（约 300 token） |
| `gitnexus://repo/{name}/cluster/{name}` | 成员与文件路径（约 500 token） |
| `gitnexus://repo/{name}/process/{name}` | 逐步执行轨迹（约 200 token） |

## 工具

**gitnexus_query** — 按概念查找相关执行流：

```
gitnexus_query({query: "payment processing"})
→ Processes: CheckoutFlow, RefundFlow, WebhookHandler
→ 按流分组的符号与文件位置
```

**gitnexus_context** — 单符号 360° 视图：

```
gitnexus_context({name: "validateUser"})
→ Incoming calls: loginHandler, apiMiddleware
→ Outgoing calls: checkToken, getUserById
→ Processes: LoginFlow (step 2/5), TokenRefresh (step 1/3)
```

## 示例：「支付处理如何实现？」

```
1. READ gitnexus://repo/my-app/context       → 918 symbols, 45 processes
2. gitnexus_query({query: "payment processing"})
   → CheckoutFlow: processPayment → validateCard → chargeStripe
   → RefundFlow: initiateRefund → calculateRefund → processRefund
3. gitnexus_context({name: "processPayment"})
   → Incoming: checkoutHandler, webhookHandler
   → Outgoing: validateCard, chargeStripe, saveTransaction
4. 阅读 src/payments/processor.ts 了解实现细节
```
