---
name: setup-pre-commit
description: 在当前仓库设置 Husky pre-commit 钩子，含 lint-staged（Prettier）、类型检查与测试。在用户希望添加 pre-commit、配置 Husky、lint-staged，或在提交时做格式化/类型检查/测试时使用。
---

# 设置 Pre-Commit 钩子

## 会设置什么

- **Husky** pre-commit 钩子
- **lint-staged** 对所有暂存文件跑 Prettier
- **Prettier** 配置（若缺失）
- pre-commit 钩子中的 **typecheck** 与 **test** 脚本

## 步骤

### 1. 检测包管理器

检查 `package-lock.json`（npm）、`pnpm-lock.yaml`（pnpm）、`yarn.lock`（yarn）、`bun.lockb`（bun）。用实际存在的；不明确则默认 npm。

### 2. 安装依赖

作为 devDependencies 安装：

```
husky lint-staged prettier
```

### 3. 初始化 Husky

```bash
npx husky init
```

创建 `.husky/` 并在 package.json 添加 `prepare: "husky"`。

### 4. 创建 `.husky/pre-commit`

写入（Husky v9+ 可无 shebang）：

```
npx lint-staged
npm run typecheck
npm run test
```

**适配**：将 `npm` 换为检测到的包管理器。若 package.json 无 `typecheck` 或 `test` 脚本，删掉对应行并告知用户。

### 5. 创建 `.lintstagedrc`

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 6. 创建 `.prettierrc`（若缺失）

仅当尚无任何 Prettier 配置时创建。默认：

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
- [ ] package.json 的 `prepare` 为 `"husky"`
- [ ] `prettier` 配置存在
- [ ] 运行 `npx lint-staged` 确认可用

### 8. 提交

暂存所有变更/创建的文件，提交信息：`Add pre-commit hooks (husky + lint-staged + prettier)`

这会跑新的 pre-commit —— 很好的冒烟测试。

## 说明

- Husky v9+ 钩子文件无需 shebang
- `prettier --ignore-unknown` 跳过无法解析的文件（图片等）
- pre-commit 先跑 lint-staged（快，仅暂存），再全量 typecheck 与 test
