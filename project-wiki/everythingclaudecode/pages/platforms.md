<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [rules/typescript/coding-style.md](../../../project-repos/everythingclaudecode/rules/typescript/coding-style.md)
- [rules/golang/coding-style.md](../../../project-repos/everythingclaudecode/rules/golang/coding-style.md)
- [rules/python/coding-style.md](../../../project-repos/everythingclaudecode/rules/python/coding-style.md)
- [rules/swift/coding-style.md](../../../project-repos/everythingclaudecode/rules/swift/coding-style.md)
- [rules/kotlin/coding-style.md](../../../project-repos/everythingclaudecode/rules/kotlin/coding-style.md)
- [skills/golang-patterns/SKILL.md](../../../project-repos/everythingclaudecode/skills/golang-patterns/SKILL.md)

</details>

# 多语言平台支持

ECC 的规则系统为 TypeScript、Go、Python、Perl、Kotlin、Swift、PHP 七种语言各自维护了独立的规则集。每个规则集包含 coding-style、security、testing、patterns 四个维度，加上对应的专项技能（如 `golang-patterns`、`python-testing`）。

## 语言规则对照表

| 语言 | coding-style | security | testing | patterns | 专项技能 |
|------|--------------|----------|---------|----------|----------|
| TypeScript | 66 行 | 28 行 | 18 行 | 52 行 | `frontend-patterns`、`api-design` |
| Python | 42 行 | 30 行 | 38 行 | 39 行 | `python-patterns`、`python-testing` |
| Go | 32 行 | 34 行 | 31 行 | 45 行 | `golang-patterns`、`golang-testing` |
| Swift | 47 行 | 33 行 | 45 行 | 66 行 | `swiftui-patterns`、`swift-actor-persistence` |
| Kotlin | 86 行 | 82 行 | 128 行 | 146 行 | `compose-multiplatform-patterns` |
| Perl | 46 行 | 69 行 | 54 行 | 76 行 | `perl-patterns`、`perl-security` |
| PHP | 35 行 | 33 行 | 34 行 | 32 行 | — |

## TypeScript — 核心规则

```typescript
// ✅ type 别名优于 interface（开放集）
type Status = 'pending' | 'active' | 'closed';

// ✅ async 函数必须标注返回类型
async function fetchUser(id: string): Promise<User> { ... }

// ✅ 禁止 any，显式 unknown + 类型守卫
function parse(value: unknown): string {
  if (typeof value === 'string') return value;
  throw new Error('not a string');
}
```

## Go — 核心规则

```go
// ✅ 错误必须处理（没有异常机制）
result, err := db.Query(query)
if err != nil {
    return fmt.Errorf("query failed: %w", err)  // wrap 错误链
}

// ✅ context 作为第一个参数
func FetchUser(ctx context.Context, id string) (*User, error) { ... }

// ✅ 接口越小越好（Unix 风格）
type Reader interface {
    Read(p []byte) (n int, err error)
}
```

ECC 的 Go 规则强调：**错误即返回值**（无异常）、**goroutine 必须有生命周期管理**（context）、**接口隔离**（小接口优于大接口）。

## Python — 核心规则

```python
# ✅ 类型提示必须完整（mypy 模式）
def process_user(user_id: str) -> UserDTO:  # 返回类型必须标注
    ...

# ✅ dataclass 用于数据传输对象
from dataclasses import dataclass
@dataclass(frozen=True)  # frozen=True 强制不可变
class UserDTO:
    id: str
    name: str
    email: str | None = None

# ✅ async/await 优先于 threading
async def fetch_all(urls: list[str]) -> list[Response]:
    async with aiohttp.ClientSession() as session:
        return await asyncio.gather(*[fetch(session, u) for u in urls])
```

## Swift — 核心规则

```swift
// ✅ 值类型优先（struct 而非 class）
struct User: Codable, Identifiable {
    let id: UUID
    var name: String
}

// ✅ @MainActor 确保 UI 相关代码在主线程
@MainActor
class ProfileViewModel: ObservableObject {
    @Published var user: User?
}

// ✅ 协议组合优于继承
typealias Loadable = Codable & Identifiable & Hashable
```

## Kotlin — 核心规则

```kotlin
// ✅ sealed class 优于 enum（扩展性）
sealed class Result<out T> {
    data class Success<T>(val data: T): Result<T>()
    data class Error(val message: String): Result<Nothing>()
    data object Loading: Result<Nothing>()
}

// ✅ Coroutines 优于 RxJava（新代码）
suspend fun fetchUser(id: String): User = withContext(Dispatchers.IO) {
    api.getUser(id)
}

// ✅ 不可变集合
val users: List<User> = listOf(...)  // 而非 mutableListOf
```

## 多语言共性约束

无论哪种语言，ECC 规则系统都强制以下约束：

1. **Immutability** — 永远不修改输入对象，返回新实例
2. **错误处理** — 每层都要处理错误，不允许静默失败
3. **输入验证** — 在公共 API 边界验证，不信任任何外部数据
4. **测试覆盖率** — 80% 覆盖率红线（通过 `common/testing.md` 规则强制）

## 包管理器自动检测

ECC 的 `scripts/lib/package-manager.js` 为每种语言实现了包管理器检测：

| 语言 | 支持的包管理器 | 检测优先级 |
|------|--------------|------------|
| TypeScript | npm / pnpm / yarn / bun | lock 文件 > package.json |
| Python | pip / poetry / uv | poetry.lock > requirements.txt |
| Go | go mod | go.mod |
| Swift | Swift Package Manager | Package.swift |
| Kotlin | Gradle / Maven | build.gradle.kts |
| Perl | cpanm / cartonto | cpanfile |

Sources: [rules/typescript/coding-style.md:1-60](../../../project-repos/pages/rules/typescript/coding-style.md#L1-L60), [rules/golang/coding-style.md:1-32](../../../project-repos/pages/rules/golang/coding-style.md#L1-L32), [rules/python/coding-style.md:1-42](../../../project-repos/pages/rules/python/coding-style.md#L1-L42), [rules/swift/coding-style.md:1-47](../../../project-repos/pages/rules/swift/coding-style.md#L1-L47), [rules/kotlin/coding-style.md:1-86](../../../project-repos/pages/rules/kotlin/coding-style.md#L1-L86)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `rules/typescript/coding-style.md:1-60`

> 未找到引用文件：`rules/typescript/coding-style.md`

#### `rules/golang/coding-style.md:1-32`

> 未找到引用文件：`rules/golang/coding-style.md`

#### `rules/python/coding-style.md:1-42`

> 未找到引用文件：`rules/python/coding-style.md`

#### `rules/swift/coding-style.md:1-47`

> 未找到引用文件：`rules/swift/coding-style.md`

#### `rules/kotlin/coding-style.md:1-86`

> 未找到引用文件：`rules/kotlin/coding-style.md`

<!-- source-snippets:end -->
</details>
