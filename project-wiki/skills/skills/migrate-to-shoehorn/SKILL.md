---
name: migrate-to-shoehorn
description: 将测试文件从 `as` 类型断言迁移到 @total-typescript/shoehorn。在用户提到 shoehorn、希望替换测试里的 `as`，或需要部分测试数据时使用。
---

# 迁移到 Shoehorn

## 为何 shoehorn？

`shoehorn` 让你在测试中传入部分数据同时让 TypeScript 满意。用类型安全的替代方案取代 `as` 断言。

**仅测试代码。** 永远不要在生产代码中使用 shoehorn。

测试里 `as` 的问题：

- 被训练避免使用
- 必须手动写明目标类型
- 故意错误数据需要双 `as`（`as unknown as Type`）

## 安装

```bash
npm i @total-typescript/shoehorn
```

## 迁移模式

### 大对象但只需少数属性

之前：

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

之后：

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

之前：

```ts
getUser({ body: { id: "123" } } as Request);
```

之后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

getUser(fromPartial({ body: { id: "123" } }));
```

### `as unknown as Type` → `fromAny()`

之前：

```ts
getUser({ body: { id: 123 } } as unknown as Request); // wrong type on purpose
```

之后：

```ts
import { fromAny } from "@total-typescript/shoehorn";

getUser(fromAny({ body: { id: 123 } }));
```

## 各函数何时用

| Function        | Use case                                           |
| --------------- | -------------------------------------------------- |
| `fromPartial()` | Pass partial data that still type-checks           |
| `fromAny()`     | Pass intentionally wrong data (keeps autocomplete) |
| `fromExact()`   | Force full object (swap with fromPartial later)    |

## 工作流

1. **收集需求** —— 问用户：
   - 哪些测试文件的 `as` 造成问题？
   - 是否处理「只需部分属性的大对象」？
   - 是否需要故意错误数据做错误路径测试？

2. **安装并迁移**：
   - [ ] 安装：`npm i @total-typescript/shoehorn`
   - [ ] 查找含 `as` 的测试：`grep -r " as [A-Z]" --include="*.test.ts" --include="*.spec.ts"`
   - [ ] 将 `as Type` 换为 `fromPartial()`
   - [ ] 将 `as unknown as Type` 换为 `fromAny()`
   - [ ] 自 `@total-typescript/shoehorn` 添加 import
   - [ ] 运行类型检查验证
