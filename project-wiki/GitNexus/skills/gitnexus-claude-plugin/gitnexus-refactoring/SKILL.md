---
name: gitnexus-refactoring
description: "当用户需要安全地重命名、抽取、拆分、移动或重组代码时使用。示例：「重命名这个函数」「抽到独立模块」「重构这个类」「移到新文件」"
---

# 使用 GitNexus 重构

## 何时使用

- 「安全地重命名这个函数」
- 「把这段抽到模块里」
- 「拆分这个服务」
- 「移到新文件」
- 任何涉及重命名、抽取、拆分或结构调整的任务

## 工作流

```
1. gitnexus_impact({target: "X", direction: "upstream"})  → 映射所有依赖方
2. gitnexus_query({query: "X"})                            → 查找涉及 X 的执行流
3. gitnexus_context({name: "X"})                           → 查看入站/出站引用
4. 规划修改顺序：接口 → 实现 → 调用方 → 测试
```

> 若提示索引陈旧 → 在终端运行 `npx gitnexus analyze`。

## 清单

### 重命名符号

```
- [ ] gitnexus_rename({symbol_name: "oldName", new_name: "newName", dry_run: true}) — 预览全部编辑
- [ ] 审阅 graph 编辑（高置信）与 ast_search 编辑（需人工核对）
- [ ] 满意后：gitnexus_rename({..., dry_run: false}) — 应用编辑
- [ ] gitnexus_detect_changes() — 确认仅预期文件变更
- [ ] 为受影响流程运行测试
```

### 抽取模块

```
- [ ] gitnexus_context({name: target}) — 查看所有入站/出站引用
- [ ] gitnexus_impact({target, direction: "upstream"}) — 查找外部调用方
- [ ] 定义新模块接口
- [ ] 抽取代码并更新 import
- [ ] gitnexus_detect_changes() — 校验影响范围
- [ ] 为受影响流程运行测试
```

### 拆分函数/服务

```
- [ ] gitnexus_context({name: target}) — 理解所有被调方
- [ ] 按职责对被调方分组
- [ ] gitnexus_impact({target, direction: "upstream"}) — 映射需更新的调用方
- [ ] 创建新函数/服务
- [ ] 更新调用方
- [ ] gitnexus_detect_changes() — 校验影响范围
- [ ] 为受影响流程运行测试
```

## 工具

**gitnexus_rename** — 自动化多文件重命名：

```
gitnexus_rename({symbol_name: "validateUser", new_name: "authenticateUser", dry_run: true})
→ 12 edits across 8 files
→ 10 graph edits (high confidence), 2 ast_search edits (review)
→ Changes: [{file_path, edits: [{line, old_text, new_text, confidence}]}]
```

**gitnexus_impact** — 先映射所有依赖方：

```
gitnexus_impact({target: "validateUser", direction: "upstream"})
→ d=1: loginHandler, apiMiddleware, testUtils
→ Affected Processes: LoginFlow, TokenRefresh
```

**gitnexus_detect_changes** — 重构后校验改动：

```
gitnexus_detect_changes({scope: "all"})
→ Changed: 8 files, 12 symbols
→ Affected processes: LoginFlow, TokenRefresh
→ Risk: MEDIUM
```

**gitnexus_cypher** — 自定义引用查询：

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "validateUser"})
RETURN caller.name, caller.filePath ORDER BY caller.filePath
```

## 风险规则

| 风险因素 | 缓解措施 |
|----------|----------|
| 调用方很多（>5） | 使用 gitnexus_rename 自动更新 |
| 跨模块引用 | 之后用 detect_changes 校验范围 |
| 字符串/动态引用 | 用 gitnexus_query 查找 |
| 对外/公共 API | 正确版本化与弃用流程 |

## 示例：将 `validateUser` 重命名为 `authenticateUser`

```
1. gitnexus_rename({symbol_name: "validateUser", new_name: "authenticateUser", dry_run: true})
   → 12 处编辑：10 处 graph（安全）、2 处 ast_search（需审）
   → 涉及文件：validator.ts, login.ts, middleware.ts, config.json...

2. 审阅 ast_search 编辑（config.json：动态引用！）

3. gitnexus_rename({symbol_name: "validateUser", new_name: "authenticateUser", dry_run: false})
   → 已在 8 个文件中应用 12 处编辑

4. gitnexus_detect_changes({scope: "all"})
   → 受影响：LoginFlow, TokenRefresh
   → 风险：MEDIUM — 请为这些流程跑测试
```
