---
name: gitnexus-pr-review
description: "当用户需要评审 PR、理解变更内容、评估合并风险或检查测试覆盖缺口时使用。示例：「评审这个 PR」「PR #42 改了什么？」「这个 PR 能安全合并吗？」"
---

# 使用 GitNexus 做 PR 评审

## 何时使用

- 「评审这个 PR」
- 「PR #42 改了什么？」
- 「合并是否安全？」
- 「这个 PR 的爆炸半径？」
- 「是否缺少针对该 PR 的测试？」
- 在合并前评审他人变更

## 工作流

```
1. gh pr diff <number>                                    → 获取原始 diff
2. gitnexus_detect_changes({scope: "compare", base_ref: "main"})  → 将 diff 映射到受影响流程
3. 对每个变更符号：
   gitnexus_impact({target: "<symbol>", direction: "upstream"})    → 每个变更的爆炸半径
4. gitnexus_context({name: "<关键符号>"})               → 理解调用方/被调方
5. READ gitnexus://repo/{name}/processes                   → 检查受影响执行流
6. 汇总发现并给出风险评估
```

> 若提示「Index is stale」→ 评审前先在终端运行 `npx gitnexus analyze`。

## 清单

```
- [ ] 获取 PR diff（gh pr diff 或 git diff base...head）
- [ ] gitnexus_detect_changes 将变更映射到受影响执行流
- [ ] 对每个非平凡变更符号执行 gitnexus_impact
- [ ] 审阅 d=1 项（WILL BREAK）— 调用方是否都已更新？
- [ ] 对关键变更符号执行 gitnexus_context 以掌握全貌
- [ ] 检查受影响流程是否有测试覆盖
- [ ] 评估整体风险等级
- [ ] 撰写带发现的评审摘要
```

## 评审维度

| 维度 | GitNexus 如何帮助 |
|------|-------------------|
| **正确性** | `context` 展示调用方 — 是否都与变更兼容？ |
| **爆炸半径** | `impact` 展示 d=1/d=2/d=3 依赖 — 是否有遗漏？ |
| **完整性** | `detect_changes` 列出受影响流程 — 是否都已处理？ |
| **测试覆盖** | `impact({includeTests: true})` 展示哪些测试触及变更代码 |
| **破坏性变更** | PR 外仍存在未更新的 d=1 上游调用方 → 潜在破坏 |

## 风险评估

| 信号 | 风险 |
|------|------|
| 变更触及 <3 符号、0–1 个流程 | LOW |
| 变更触及 3–10 符号、2–5 个流程 | MEDIUM |
| 变更触及 >10 个符号或大量流程 | HIGH |
| 触及认证、支付或数据完整性代码 | CRITICAL |
| d=1 调用方存在于 PR diff 之外 | 潜在破坏 — 必须标出 |

## 工具

**gitnexus_detect_changes** — 将 PR diff 映射到受影响执行流：

```
gitnexus_detect_changes({scope: "compare", base_ref: "main"})

→ Changed: 8 symbols in 4 files
→ Affected processes: CheckoutFlow, RefundFlow, WebhookHandler
→ Risk: MEDIUM
```

**gitnexus_impact** — 每个变更符号的爆炸半径：

```
gitnexus_impact({target: "validatePayment", direction: "upstream"})

→ d=1 (WILL BREAK):
  - processCheckout (src/checkout.ts:42) [CALLS, 100%]
  - webhookHandler (src/webhooks.ts:15) [CALLS, 100%]

→ d=2 (LIKELY AFFECTED):
  - checkoutRouter (src/routes/checkout.ts:22) [CALLS, 95%]
```

**含测试的 gitnexus_impact** — 检查测试覆盖：

```
gitnexus_impact({target: "validatePayment", direction: "upstream", includeTests: true})

→ 覆盖该符号的测试：
  - validatePayment.test.ts [direct]
  - checkout.integration.test.ts [via processCheckout]
```

**gitnexus_context** — 理解变更符号的角色：

```
gitnexus_context({name: "validatePayment"})

→ Incoming calls: processCheckout, webhookHandler
→ Outgoing calls: verifyCard, fetchRates
→ Processes: CheckoutFlow (step 3/7), RefundFlow (step 1/5)
```

## 示例：「评审 PR #42」

```
1. gh pr diff 42 > /tmp/pr42.diff
   → 4 个文件变更：payments.ts, checkout.ts, types.ts, utils.ts

2. gitnexus_detect_changes({scope: "compare", base_ref: "main"})
   → 变更符号：validatePayment, PaymentInput, formatAmount
   → 受影响流程：CheckoutFlow, RefundFlow
   → Risk: MEDIUM

3. gitnexus_impact({target: "validatePayment", direction: "upstream"})
   → d=1: processCheckout, webhookHandler (WILL BREAK)
   → webhookHandler 不在 PR diff 中 — 潜在破坏！

4. gitnexus_impact({target: "PaymentInput", direction: "upstream"})
   → d=1: validatePayment（在 PR 内）, createPayment（不在 PR 内）
   → createPayment 仍使用旧 PaymentInput 形状 — 破坏性变更！

5. gitnexus_context({name: "formatAmount"})
   → 被 12 个函数调用 — 但变更为向后兼容（新增可选参数）

6. 评审摘要：
   - MEDIUM 风险 — 3 个变更符号影响 2 条执行流
   - BUG：webhookHandler 调用 validatePayment 但未随新签名更新
   - BUG：createPayment 依赖已变更的 PaymentInput 类型
   - OK：formatAmount 变更向后兼容
   - 测试：checkout.test.ts 覆盖 processCheckout 路径，但无 webhook 测试
```

## 评审输出格式

将评审组织为：

```markdown
## PR Review: <title>

**Risk: LOW / MEDIUM / HIGH / CRITICAL**

### Changes Summary
- <N> 个符号跨 <M> 个文件变更
- <P> 条执行流受影响

### Findings
1. **[severity]** 发现描述
   - GitNexus 工具给出的证据
   - 受影响的调用方/流程

### Missing Coverage
- PR 中未更新的调用方：...
- 未测试的流程：...

### Recommendation
APPROVE / REQUEST CHANGES / NEEDS DISCUSSION
```
