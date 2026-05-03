---
name: gitnexus-debugging
description: "当用户正在调试缺陷、追踪错误或分析失败原因时使用。示例：「为什么 X 失败？」「错误从哪来？」「帮我跟这个 bug」"
---

# 使用 GitNexus 调试

## 何时使用

- 「这个函数为什么失败？」
- 「错误是从哪里抛出的？」
- 「谁调用了这个方法？」
- 「这个接口返回 500」
- 调查 bug、异常或非预期行为

## 工作流

```
1. gitnexus_query({query: "<错误或症状>"})            → 查找相关执行流
2. gitnexus_context({name: "<可疑符号>"})            → 查看调用方/被调方/流程
3. READ gitnexus://repo/{name}/process/{name}        → 跟踪执行流
4. gitnexus_cypher({query: "MATCH path..."})         → 需要时自定义路径查询
```

> 若提示「Index is stale」→ 在终端运行 `npx gitnexus analyze`。

## 清单

```
- [ ] 明确症状（错误信息或非预期行为）
- [ ] 用 gitnexus_query 搜索错误文本或相关代码
- [ ] 从返回的 processes 中锁定可疑函数
- [ ] gitnexus_context 查看调用方与被调方
- [ ] 通过 process 资源跟踪执行流
- [ ] 必要时用 gitnexus_cypher 自定义调用链
- [ ] 阅读源码确认根因
```

## 调试模式

| 症状 | GitNexus 策略 |
|------|----------------|
| 错误信息 | `gitnexus_query` 搜错误文本 → 对抛出点 `context` |
| 返回值错误 | 对该函数 `context` → 沿被调方追踪数据流 |
| 间歇性失败 | `context` → 查找外部调用与异步依赖 |
| 性能问题 | `context` → 查找调用方很多的符号（热点） |
| 近期回归 | `detect_changes` 查看当前改动影响范围 |

## 工具

**gitnexus_query** — 查找与错误相关的代码：

```
gitnexus_query({query: "payment validation error"})
→ Processes: CheckoutFlow, ErrorHandling
→ Symbols: validatePayment, handlePaymentError, PaymentException
```

**gitnexus_context** — 可疑符号的完整上下文：

```
gitnexus_context({name: "validatePayment"})
→ Incoming calls: processCheckout, webhookHandler
→ Outgoing calls: verifyCard, fetchRates (external API!)
→ Processes: CheckoutFlow (step 3/7)
```

**gitnexus_cypher** — 自定义调用链：

```cypher
MATCH path = (a)-[:CodeRelation {type: 'CALLS'}*1..2]->(b:Function {name: "validatePayment"})
RETURN [n IN nodes(path) | n.name] AS chain
```

## 示例：「支付接口间歇性 500」

```
1. gitnexus_query({query: "payment error handling"})
   → Processes: CheckoutFlow, ErrorHandling
   → Symbols: validatePayment, handlePaymentError

2. gitnexus_context({name: "validatePayment"})
   → Outgoing calls: verifyCard, fetchRates (external API!)

3. READ gitnexus://repo/my-app/process/CheckoutFlow
   → Step 3: validatePayment → calls fetchRates (external)

4. 根因：fetchRates 调用外部 API 且未设置合理超时
```
