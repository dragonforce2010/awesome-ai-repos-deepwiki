<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [rules/README.md](../../../project-repos/everythingclaudecode/rules/README.md)
- [rules/common/coding-style.md](../../../project-repos/everythingclaudecode/rules/common/coding-style.md)
- [rules/common/security.md](../../../project-repos/everythingclaudecode/rules/common/security.md)
- [rules/common/testing.md](../../../project-repos/everythingclaudecode/rules/common/testing.md)
- [rules/typescript/coding-style.md](../../../project-repos/everythingclaudecode/rules/typescript/coding-style.md)

</details>

# 规则系统

ECC 的规则系统是**不可绕过的编码约束层**——与代理（可以被忽略）和技能（提供建议）不同，规则定义的行为 Claude Code 必须遵守，无法在不修改规则文件的情况下绕过。这是 ECC 质量防线的最底层。

## 规则的组织结构

```
rules/
├── common/           # 所有语言共享的基础规则
│   ├── coding-style.md
│   ├── security.md
│   ├── testing.md
│   ├── patterns.md
│   ├── hooks.md
│   ├── agents.md
│   ├── git-workflow.md
│   ├── development-workflow.md
│   └── performance.md
├── typescript/       # TypeScript 专属
├── python/           # Python 专属
├── golang/           # Go 专属
├── kotlin/           # Kotlin 专属
├── swift/            # Swift 专属
├── perl/             # Perl 专属
└── php/              # PHP 专属
```

规则文件的命名约定：`<category>.md`（如 `security.md`、`testing.md`），Claude Code 会自动加载对应项目类型的规则。

## 通用规则 — 核心约束

### Immutability（不可变原则）

ECC 最重要的规则，没有之一：**永远创建新对象，从不修改现有对象**。

```typescript
// 错误 ❌
function addItem(list: string[], item: string): void {
  list.push(item);  // 直接修改输入
}

// 正确 ✅
function addItem(list: string[], item: string): string[] {
  return [...list, item];  // 返回新数组
}
```

违反这一原则的代码会在 `code-reviewer` 代理审查时被标记为 CRITICAL。这一约束使得代码更容易测试（无副作用）、更容易推理（函数输出可预测）、更容易并行化（无竞态条件）。

### 安全底线

规则系统中 `security.md` 定义了必须遵守的安全约束：

- **禁止硬编码密钥**：API key、密码、token 必须通过环境变量或密钥管理器注入
- **输入验证**：所有外部输入必须在系统边界进行 schema 验证，fail-fast
- **参数化查询**：禁止字符串拼接 SQL，必须使用参数化查询
- **输出净化**：用户生成的内容渲染前必须经过 HTML 净化

### 测试覆盖率红线

`testing.md` 规定：**所有项目的测试覆盖率不得低于 80%**。这一数字是 ECC 作者 10 个月经验值——低于 80% 的覆盖率在实际项目中意味着"有测试但不保证质量"。

## TypeScript 规则

`rules/typescript/coding-style.md` 定义了 TypeScript 的编码规范：

```typescript
// ✅ 使用具体类型，禁止 any
function processUser(user: User): UserDTO {
  return { id: user.id, name: user.name };
}

// ❌ any 掩盖类型错误
function processUser(user: any): any {
  return { id: user.id, name: user.name };
}

// ✅ 显式返回类型（公共 API 必须标注）
async function fetchUser(id: string): Promise<UserDTO> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// ✅ 使用 type 而非 interface 描述形状
type UserDTO = {
  id: string;
  name: string;
  email?: string;
};
```

## 规则加载机制

Claude Code 按以下顺序加载规则：

1. `rules/common/*` — 通用规则，所有项目加载
2. `rules/<project-lang>/*` — 项目主语言专属规则
3. 按字母顺序加载同名文件（如 `common/testing.md` 之后加载 `typescript/testing.md`）

规则内容的叠加方式：**同名主题的规则取更严格的版本**。例如 `common/testing.md` 规定覆盖率 ≥ 80%，如果 `typescript/testing.md` 没有明确降低，就维持 80% 红线。

## 规则与代理的关系

规则和代理在功能上有重叠但职责不同：

| | 规则 | 代理 |
|---|------|------|
| 执行时机 | 实时（每次交互） | 按需（显式调用） |
| 强制程度 | 不可绕过 | 可忽略 |
| 适用场景 | 编码约束、安全底线 | 深度审查、复杂决策 |
| 覆盖范围 | 语法级错误 | 语义级问题 |

**最佳实践**：规则定义底线，代理执行深度检查。例如：规则强制"禁止 any 类型"，`code-reviewer` 代理进一步检查"该函数是否需要更精确的泛型约束"。

Sources: [rules/README.md:1-50](../../../project-repos/pages/rules/README.md#L1-L50), [rules/common/coding-style.md:1-48](../../../project-repos/pages/rules/common/coding-style.md#L1-L48), [rules/common/security.md:1-29](../../../project-repos/pages/rules/common/security.md#L1-L29), [rules/typescript/coding-style.md:1-60](../../../project-repos/pages/rules/typescript/coding-style.md#L1-L60)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `rules/README.md:1-50`

> 未找到引用文件：`rules/README.md`

#### `rules/common/coding-style.md:1-48`

> 未找到引用文件：`rules/common/coding-style.md`

#### `rules/common/security.md:1-29`

> 未找到引用文件：`rules/common/security.md`

#### `rules/typescript/coding-style.md:1-60`

> 未找到引用文件：`rules/typescript/coding-style.md`

<!-- source-snippets:end -->
</details>
