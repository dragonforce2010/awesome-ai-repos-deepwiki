---
name: gitnexus-impact-analysis
description: "当用户想知道修改某处会破坏什么，或在编辑前需要安全分析时使用。示例：「改 X 安全吗？」「谁依赖这个？」「会破坏什么？」"
---

# 使用 GitNexus 做影响分析

## 何时使用

- 「改这个函数安全吗？」
- 「修改 X 会破坏什么？」
- 「展示爆炸半径」
- 「谁在用这段代码？」
- 在进行非平凡改动之前
- 提交前 — 了解当前改动影响范围

## 工作流

```
1. gitnexus_impact({target: "X", direction: "upstream"})  → 谁依赖它
2. READ gitnexus://repo/{name}/processes                   → 检查受影响执行流
3. gitnexus_detect_changes()                               → 将当前 git 改动映射到受影响流程
4. 评估风险并向用户汇报
```

> 若提示索引陈旧 → 在终端运行 `npx gitnexus analyze`。

## 清单

```
- [ ] gitnexus_impact({target, direction: "upstream"}) 查找依赖方
- [ ] 优先审阅 d=1 项（将直接破坏）
- [ ] 关注高置信度（>0.8）依赖
- [ ] READ processes 检查受影响执行流
- [ ] gitnexus_detect_changes 做提交前检查
- [ ] 评估风险等级并汇报
```

## 理解输出

| 深度 | 风险等级 | 含义 |
|------|----------|------|
| d=1 | **WILL BREAK** | 直接调用方 / import 方 |
| d=2 | LIKELY AFFECTED | 间接依赖 |
| d=3 | MAY NEED TESTING | 传递影响 |

## 风险评估

| 影响范围 | 风险 |
|----------|------|
| <5 个符号、流程较少 | LOW |
| 5–15 个符号、2–5 个流程 | MEDIUM |
| >15 个符号或大量流程 | HIGH |
| 关键路径（认证、支付等） | CRITICAL |

## 工具

**gitnexus_impact** — 符号爆炸半径的主要工具：

```
gitnexus_impact({
  target: "validateUser",
  direction: "upstream",
  minConfidence: 0.8,
  maxDepth: 3
})

→ d=1 (WILL BREAK):
  - loginHandler (src/auth/login.ts:42) [CALLS, 100%]
  - apiMiddleware (src/api/middleware.ts:15) [CALLS, 100%]

→ d=2 (LIKELY AFFECTED):
  - authRouter (src/routes/auth.ts:22) [CALLS, 95%]
```

**gitnexus_detect_changes** — 基于 git diff 的影响分析：

```
gitnexus_detect_changes({scope: "staged"})

→ Changed: 5 symbols in 3 files
→ Affected: LoginFlow, TokenRefresh, APIMiddlewarePipeline
→ Risk: MEDIUM
```

## 示例：「改 validateUser 会破坏什么？」

```
1. gitnexus_impact({target: "validateUser", direction: "upstream"})
   → d=1: loginHandler, apiMiddleware (WILL BREAK)
   → d=2: authRouter, sessionManager (LIKELY AFFECTED)

2. READ gitnexus://repo/my-app/processes
   → LoginFlow 与 TokenRefresh 均触及 validateUser

3. 风险：2 个直接调用方、2 个流程 → MEDIUM
```
