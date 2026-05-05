---
name: setup-pre-commit
description: 在当前仓库配置 Husky pre-commit：lint-staged（Prettier）、类型检查与测试。当用户希望添加 pre-commit、配置 Husky、lint-staged，或在提交时做格式化/类型检查/测试时使用。
---

# 配置 Pre-Commit 钩子

## 将配置的内容

- **Husky** pre-commit 钩子
- **lint-staged** 对所有已暂存文件运行 Prettier
- **Prettier** 配置（若缺失则创建）
- pre-commit 中包含 **typecheck** 与 **test** 脚本

## 步骤

### 1. 检测包管理器

检查 `package-lock.json`（npm）、`pnpm-lock.yaml`（pnpm）、`yarn.lock`（yarn）、`bun.lockb`（bun）。以实际存在的为准。不明确时默认 npm。

### 2. 安装依赖

作为 devDependencies 安装：

```
husky lint-staged prettier
```

### 3. 初始化 Husky

```bash
npx husky init
```

将创建 `.husky/` 目录，并在 package.json 中添加 `prepare: "husky"`。

### 4. 创建 `.husky/pre-commit`

写入以下内容（Husky v9+ 钩子文件无需 shebang）：

```
npx lint-staged
npm run typecheck
npm run test
```

**适配**：将 `npm` 换为检测到的包管理器。若 package.json 中无 `typecheck` 或 `test` 脚本，则删除对应行并告知用户。

### 5. 创建 `.lintstagedrc`

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 6. 创建 `.prettierrc`（若不存在）

仅当尚无 Prettier 配置时创建。默认采用：

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

### 7. 验证

- [ ] `.husky/pre-commit` 存在且可执行
- [ ] `.lintstagedrc` 存在
- [ ] package.json 中 `prepare` 为 `"husky"`
- [ ] 存在 `prettier` 配置
- [ ] 运行 `npx lint-staged` 确认可用

### 8. 提交

暂存所有新建/修改文件，提交信息：`Add pre-commit hooks (husky + lint-staged + prettier)`

提交将触发新的 pre-commit — 可作为冒烟测试。

## 说明

- Husky v9+ 钩子文件不需要 shebang
- `prettier --ignore-unknown` 会跳过 Prettier 无法解析的文件（如图片等）
- pre-commit 先跑 lint-staged（快、仅暂存），再全量 typecheck 与测试
