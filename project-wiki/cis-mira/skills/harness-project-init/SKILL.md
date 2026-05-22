---
name: harness-project-init
description: |
  为项目初始化 Harness 标准多维表格（project + tasks 两张数据表）并绑定到项目。
  当用户要求"初始化多维表格"、"创建项目表格"、"初始化 harness bitable"、
  "绑定多维表格到项目"时触发。
  触发词：初始化表格、创建多维表格、bitable init、harness init、项目绑定。
version: 1.0.0
---

# Bitable Init

为项目创建 Harness 标准多维表格 → 建立 project/tasks 数据表 → 绑定配置到 `.harness/project.yaml`。

## 配置

| 键 | 说明 |
|---|---|
| 缓存文件 | `/tmp/{PROJECT_NAME}-bitable-config.json`（PROJECT_NAME 为 git 项目根目录名） |
| 项目配置 | `{PROJECT_ROOT}/.harness/project.yaml` |
| 脚本目录 | 本 SKILL.md 同级 `scripts/` |
| CLI | `bytedcli feishu bitable` |

### 脚本清单

| 脚本 | 用途 | 关键参数 |
|------|------|----------|
| `scripts/init-bitable.sh` | 创建多维表格 App + project 表 + tasks 表 | `--name <名称>`, `--folder <token>`, `--dry-run` |
| `scripts/bind-project.sh` | 将配置写入 `.harness/project.yaml` 并可选注册到 project 表 | `--type`, `--name`, `--register`, `--dry-run` |

## 数据表 Schema

### 表1: project（项目）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | Text (Primary) | 项目名称 |
| codebase | URL | git remote 地址 |
| type | SingleSelect | `backend` / `frontend` / `complex` |

### 表2: tasks（任务）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| ID | AutoNumber | 自增编号，只读 |
| Story | SingleSelect | 需求故事分类 |
| 需求描述 | Text | 需求主体内容 |
| 需求补充 | Text | 额外说明 |
| 类型 | SingleSelect | BUG / 特性 / 重构 |
| TraeSession | Text | Trae 会话 ID |
| 负责人邮箱前缀 | Text | 负责人邮箱前缀（如 luwei.will） |
| 负责人 | Person | 飞书人员 |
| 修复状态 | SingleSelect | 待接受 → 接受 → 开发中 → 已合码 → 已发包 → 完成 |
| 开发进度 | Number | 百分比 0-100 |
| Checklist | Text | 验收检查项 |
| 附件 | Attachment | 截图/设计稿 |
| 修复版本 | SingleSelect | 版本号 |
| 端 | MultiSelect | Mac / Windows / Linux / 全平台 / PC端 / 移动端 / Android |
| 父ID | Text | 父任务 ID |
| 方案 | Text | 根因分析 |
| 执行步骤 | Text | 执行步骤描述 |
| 提交人 | Person | 飞书人员 |

> 详细字段定义见 [references/field-schema.md](references/field-schema.md)

## 工作流概览

| Phase | 说明 |
|-------|------|
| 0 | 检查是否已有缓存配置，有则跳过创建 |
| 1 | 创建多维表格 App（`init-bitable.sh`） |
| 2 | 创建 project + tasks 数据表及全部字段 |
| 3 | 清理默认表、写入缓存 |
| 4 | 绑定项目（`bind-project.sh` → `.harness/project.yaml`） |
| 5 | 可选：注册当前项目到 project 表（`--register`） |

## 典型使用

```bash
# 第一步：创建多维表格
bash scripts/init-bitable.sh

# 第二步：绑定到项目并注册
bash scripts/bind-project.sh --register

# 指定名称和文件夹
bash scripts/init-bitable.sh --name "MyProject Tasks" --folder fldXXXXXX
```

## 生成的 .harness/project.yaml 格式

```yaml
project:
  name: "harness"
  codebase: "git@code.byted.org:larkarch/harness.git"
  type: "backend"

bitable:
  app_token: "XXX"
  url: "https://bytedance.larkoffice.com/base/XXX"
  tables:
    project: "tblXXX"
    tasks: "tblYYY"

metadata:
  created_at: "2026-04-15"
  updated_at: "2026-04-15"
```

## 与其他 Skill 的关系

| Skill | 关系 |
|-------|------|
| `task-run` | 从 tasks 表拉取需求并回写状态，读取 `.harness/project.yaml` 中的 table_id |
| `task-create` | 向 tasks 表创建需求记录，读取 `.harness/project.yaml` 中的 table_id |

初始化完成后，`task-run` 和 `task-create` 从 `.harness/project.yaml` 读取 bitable 配置。

## 注意事项

- **幂等性**：配置缓存存在时 `init-bitable.sh` 直接返回，不会重复创建
- **项目隔离**：缓存文件路径基于 git 项目名动态生成
- **自动检测**：`bind-project.sh` 根据 `go.mod` / `package.json` 自动判断项目类型
- **注册可选**：`--register` 标志控制是否写入 project 表，避免测试时污染数据
