---
name: gitnexus-guide
description: "当用户询问 GitNexus 本身（可用工具、如何查询知识图谱、MCP 资源、图 schema、工作流参考）时使用。示例：「GitNexus 有哪些工具？」「怎么用 GitNexus？」"
---

# GitNexus 指南

面向所有 GitNexus MCP 工具、资源与知识图谱 schema 的快速参考。

## 始终从这里开始

凡涉及代码理解、调试、影响分析或重构：

1. **读取 `gitnexus://repo/{name}/context`** — 仓库概览并检查索引是否新鲜
2. **对照下表选择技能**并**阅读对应 SKILL 文件**
3. **按该技能的工作流与清单执行**

> 若第 1 步提示索引陈旧，请先在终端运行 `npx gitnexus analyze`。

## 技能路由

| 任务 | 应阅读的技能 |
|------|----------------|
| 理解架构 / 「X 如何工作？」 | `gitnexus-exploring` |
| 爆炸半径 / 「改 X 会破坏什么？」 | `gitnexus-impact-analysis` |
| 排查缺陷 / 「为何失败？」 | `gitnexus-debugging` |
| 重命名 / 抽取 / 拆分 / 重构 | `gitnexus-refactoring` |
| 工具、资源、schema 参考 | `gitnexus-guide`（本文件） |
| analyze、status、clean、wiki 等 CLI | `gitnexus-cli` |

## 工具参考

| 工具 | 作用 |
|------|------|
| `query` | 按执行流聚合的代码检索 — 与某概念相关的流程 |
| `context` | 单符号 360° 视图 — 分类引用、所属流程 |
| `impact` | 符号爆炸半径 — d=1/2/3 与置信度摘要 |
| `detect_changes` | 将 git diff 映射到受影响符号与流程 |
| `rename` | 多文件协调重命名，支持 `dry_run` 预览 |
| `cypher` | 原始图查询（先读 `gitnexus://repo/{name}/schema`） |
| `list_repos` | 发现已索引仓库 |

## 资源参考

轻量读取（约 100–500 token）用于导航：

| 资源 | 内容 |
|------|------|
| `gitnexus://repo/{name}/context` | 统计、陈旧度检查 |
| `gitnexus://repo/{name}/clusters` | 功能区与凝聚度 |
| `gitnexus://repo/{name}/cluster/{clusterName}` | 区域成员 |
| `gitnexus://repo/{name}/processes` | 全部执行流 |
| `gitnexus://repo/{name}/process/{processName}` | 逐步执行轨迹 |
| `gitnexus://repo/{name}/schema` | Cypher 用图 schema |

## 图模型摘要

**节点：** File, Function, Class, Interface, Method, Community, Process  
**边（CodeRelation.type）：** CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES, MEMBER_OF, STEP_IN_PROCESS

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "myFunc"})
RETURN caller.name, caller.filePath
```
