---
name: migrate-to-shoehorn
description: 将测试文件从 `as` 类型断言迁移到 @total-typescript/shoehorn。当用户提到 shoehorn、希望替换测试中的 `as`，或需要局部测试数据时使用。
---

# 迁移到 Shoehorn

## 为何使用 shoehorn？

`shoehorn` 允许在测试中传入局部数据，同时保持 TypeScript 满意。用类型安全的写法替代 `as` 断言。

**仅限测试代码。** 生产代码中禁止使用 shoehorn。

测试中滥用 `as` 的问题：

- 规范上应避免依赖 `as`
- 必须手写目标类型
- 故意错误数据时常需双重断言（`as unknown as Type`）

## 安装

```bash
npm i @total-typescript/shoehorn
```

## 迁移模式

### 大对象仅需少量字段

迁移前：

```ts
type Request = {
  body: { id: string };
  headers: Record<string, string>;
  cookies: Record<string, string>;
  // ...20 more properties
};

it("gets user by id", () => {
  // Only care about body.id but must fake entire Request
  getUser({
    body: { id: "123" },
    headers: {},
    cookies: {},
    // ...fake all 20 properties
  });
});
```

迁移后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

it("gets user by id", () => {
  getUser(
    fromPartial({
      body: { id: "123" },
    }),
  );
});
```

### `as Type` → `fromPartial()`

迁移前：

```ts
getUser({ body: { id: "123" } } as Request);
```

迁移后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

getUser(fromPartial({ body: { id: "123" } }));
```

### `as unknown as Type` → `fromAny()`

迁移前：

```ts
getUser({ body: { id: 123 } } as unknown as Request); // wrong type on purpose
```

迁移后：

```ts
import { fromAny } from "@total-typescript/shoehorn";

getUser(fromAny({ body: { id: 123 } }));
```

## 各 API 选用准则

| 函数            | 适用场景                                           |
| --------------- | -------------------------------------------------- |
| `fromPartial()` | 传入仍能通过类型检查的局部数据                     |
| `fromAny()`     | 传入故意错误的数据（保留自动补全）                 |
| `fromExact()`   | 强制完整对象（可后续再改为 `fromPartial`）       |

## 工作流

1. **收集需求** — 询问用户：
   - 哪些测试文件因 `as` 断言带来问题？
   - 是否在大对象上仅需部分字段？
   - 是否需要故意传入错误类型以测错误路径？

2. **安装并迁移**：
   - [ ] 安装：`npm i @total-typescript/shoehorn`
   - [ ] 查找含 `as` 的测试：`grep -r " as [A-Z]" --include="*.test.ts" --include="*.spec.ts"`
   - [ ] 将 `as Type` 替换为 `fromPartial()`
   - [ ] 将 `as unknown as Type` 替换为 `fromAny()`
   - [ ] 自 `@total-typescript/shoehorn` 添加 import
   - [ ] 运行类型检查确认
