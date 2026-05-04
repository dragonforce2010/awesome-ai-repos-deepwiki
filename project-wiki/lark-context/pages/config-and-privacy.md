<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/config.ts](../../../project-repos/lark-context/src/config.ts)
- [README.md](../../../project-repos/lark-context/README.md)
- [src/commands/init.ts](../../../project-repos/lark-context/src/commands/init.ts)

</details>

# 配置、路径与隐私边界

配置系统的目标是：**同一套代码既能在笔记型电脑上交互使用，又能在 CI/Headless 环境用环境变量完全重写路径**。`loadConfig` 的优先级被写成 CLI flag → env → yaml → 默认值四段；`init` 则确保 `~/.lark-context` 与 `~/.claude/lark-memory`（可改写）存在。

| 环境变量 | 作用 |
|---------|------|
| `LARK_CONTEXT_CONFIG` | 覆盖默认 `~/.lark-context/config.yaml` |
| `LARK_CONTEXT_MEMORY_DIR` | 覆盖记忆输出根目录 |
| `LARK_CONTEXT_RAW_DIR` | 覆盖 SQLite 与中间状态目录 |

## 内网安装与飞书 Wiki（`lark-cli` 可读）

对已 OAuth 的开发者机器，`lark-cli` 可直接拉取云文档/Wiki 的 markdown，例如：

```bash
lark-cli docs +fetch \
  --doc "https://bytedance.larkoffice.com/wiki/Lk61wCa7YiW6w6kk0klcTKRKn6g" \
  --format json
```

团队在内网飞书 Wiki 中补充的安装路径（**以 Wiki 正文为准，以下为常见摘要**）：

- **CLI 包**：`@tiktok-fe/lark-context` 可通过内网 registry 安装，例如 `npm i -g @tiktok-fe/lark-context --registry http://bnpm.byted.org`（与开源文档里 `bnpm i -g` 叙述一致时以此侧边栏为准）。  
- **原生模块**：全局 `better-sqlite3` 若走 pnpm，需要 `pnpm approve-builds -g` 之类流程，避免安装后无法加载 SQLite。  
- **Skill**：可直接 `npx skills add git@code.byted.org:tiktok/lark-context.git -g -y`，与「从 Git 源分发 skill」的路径对齐。

公网 DeepWiki **不会**自动同步 Wiki 全文；更新叙事时应在本地执行上述 `+fetch`，再人工摘录进本站点。

## 隐私与数据驻留

README 在动机层面强调：**digest 阶段不调用外部 LLM API**，由 Claude Code 本地读写 markdown；再叠加 `show` 只读 SQLite 的行为，**在没有网络权限的机器上仍可持续阅读历史沉淀**（前提是之前已完成 `pull` / `ingest-doc`）。

## V1 能力边界（产品级约束）

README 将以下能力明确标为 V1 之外或限制：无自动 cron、首次拉取 200 页封顶、仅处理白名单群、部分老版文档类型、私聊/@消息/多维表格等留给 V2。阅读源码时应把这些当作**刻意的范围控制**，而不是遗漏实现。

Sources: [src/config.ts:6-133](../../../project-repos/lark-context/src/config.ts#L6-L133), [README.md:120-185](../../../project-repos/lark-context/README.md#L120-L185), [src/commands/init.ts:27-44](../../../project-repos/lark-context/src/commands/init.ts#L27-L44)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/config.ts:6-133`

```typescript
export const ENV_CONFIG = "LARK_CONTEXT_CONFIG";
export const ENV_MEMORY = "LARK_CONTEXT_MEMORY_DIR";
export const ENV_RAW = "LARK_CONTEXT_RAW_DIR";

/**
 * Resolve the user's home directory, preferring $HOME so tests can redirect
 * it. Matches Python's `Path.home()` semantics (which reads $HOME first).
 */
function homedir(): string {
  return process.env.HOME ?? osHomedir();
}

export interface GroupConfig {
  alias: string;
  chatId: string;
  name: string;
  enabled: boolean;
}

export interface Config {
  memoryDir: string;
  rawDir: string;
  groups: GroupConfig[];
  configPath: string | null;
}

export interface LoadConfigOptions {
  configPathOverride?: string;
  memoryDirOverride?: string;
  rawDirOverride?: string;
}

function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/") || p.startsWith(`~${sep}`)) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

function defaultConfigPath(): string {
  const env = process.env[ENV_CONFIG];
  if (env) return expandHome(env);
  return join(homedir(), ".lark-context", "config.yaml");
}

function resolvePath(
  flag: string | undefined,
  envVar: string,
  yamlValue: string | undefined,
  fallback: string,
): string {
  if (flag !== undefined) return expandHome(flag);
  const env = process.env[envVar];
  if (env) return expandHome(env);
  if (yamlValue) return expandHome(yamlValue);
  return expandHome(fallback);
}

function parseGroups(raw: unknown): GroupConfig[] {
  if (raw === null || raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error("'groups' must be a list");
  const seen = new Set<string>();
  const out: GroupConfig[] = [];
  for (const entry of raw) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("alias" in entry) ||
      !("chat_id" in entry)
    ) {
      throw new Error(`bad group entry: ${JSON.stringify(entry)}`);
    }
    const e = entry as Record<string, unknown>;
    const alias = String(e.alias);
    if (seen.has(alias)) {
      throw new Error(`duplicate alias "${alias}" in groups`);
    }
    seen.add(alias);
    out.push({
      alias,
      chatId: String(e.chat_id),
      name: typeof e.name === "string" ? e.name : "",
      enabled: e.enabled === undefined ? true : Boolean(e.enabled),
    });
  }
  return out;
}

export function loadConfig(opts: LoadConfigOptions = {}): Config {
  const configPath = opts.configPathOverride
    ? expandHome(opts.configPathOverride)
    : defaultConfigPath();
  let yamlData: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    const parsed = YAML.parse(readFileSync(configPath, "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      yamlData = parsed as Record<string, unknown>;
    }
  }
  const pathsRaw = yamlData.paths;
  const pathsSection: Record<string, unknown> =
    pathsRaw && typeof pathsRaw === "object" && !Array.isArray(pathsRaw)
      ? (pathsRaw as Record<string, unknown>)
      : {};
  const memoryDir = resolvePath(
    opts.memoryDirOverride,
    ENV_MEMORY,
    typeof pathsSection.memory_dir === "string"
      ? pathsSection.memory_dir
      : undefined,
    "~/.claude/lark-memory",
  );
  const rawDir = resolvePath(
    opts.rawDirOverride,
    ENV_RAW,
    typeof pathsSection.raw_dir === "string"
      ? pathsSection.raw_dir
      : undefined,
    "~/.lark-context",
... snippet truncated ...
```

#### `README.md:120-185`

````markdown
## 存储位置

| 东西 | 默认路径 | 覆盖方式 |
|---|---|---|
| 配置文件 | `~/.lark-context/config.yaml` | `LARK_CONTEXT_CONFIG` 环境变量 |
| 原始数据（SQLite） | `~/.lark-context/raw.db` | `LARK_CONTEXT_RAW_DIR` |
| 记忆文件（给 Claude 读） | `~/.claude/lark-memory/` | `LARK_CONTEXT_MEMORY_DIR` |

覆盖优先级（高 → 低）：CLI flag → 环境变量 → config.yaml → 默认值。

## 配置文件示例

```yaml
paths:
  memory_dir: ~/.claude/lark-memory
  raw_dir: ~/.lark-context

groups:
  - alias: project_alpha
    chat_id: oc_xxxxxxxx
    name: 项目 Alpha 大群
    enabled: true
  - alias: infra_weekly
    chat_id: oc_yyyyyyyy
    name: 基础设施周会
    enabled: true
```

## 记忆文件结构

沉淀后的文件（由 Claude 在 `/lark-context 沉淀…` 里维护）：

```
~/.claude/lark-memory/
├── MEMORY.md            # 始终加载的索引
├── entities/            # 稳定层，Claude 做增量 merge（保留手工写的段）
│   ├── people/<slug>.md
│   ├── projects/<slug>.md
│   ├── terms.md
│   └── decisions/<slug>.md
└── journal/             # 按 ISO 周的流水
    └── 2026-W16.md
```

每个实体文件带统一 frontmatter：

```yaml
---
name: 项目 Alpha
type: project | person | decision | terms
updated_at: 2026-04-19
source_hints:
  - chat:project_alpha
  - doc:docxxxxxxxxxxxxxx
---
```

## 已知限制 / V1 边界

- **不自动调度**：全手动，你在 Claude 对话里触发。cron / hook 在 V2
- **首次 pull 上限 200 页**（约 10k 条消息）：避免一下子拉爆。到上限会在 stderr 提示，再跑 `pull` 可续
- **只读指定群聊**：私聊、@你的消息、多维表格、日历留给 V2
- **文档仅支持新版 `/docx/` 等**：老版 `/docs/` 若被 lark-cli 拒绝（`Unsupported document type: Legacy document`），透传错误
- **不拉回复线程**：只拉主消息流
- **工具不调任何 LLM API**：提炼全部由 Claude Code 完成

````

#### `src/commands/init.ts:27-44`

```typescript
export async function runInit(opts: InitOpts = {}): Promise<void> {
  if (opts.checkLarkCli !== false) {
    const check = opts._pathCheck ?? defaultPathCheck;
    if (!(await check())) {
      throw new Error(
        "`lark-cli` binary not found on PATH. Install: `bnpm i -g @larksuite/cli` (or `npm i -g @larksuite/cli`), then `lark-cli auth login`.",
      );
    }
  }
  const cfg = loadConfig({
    configPathOverride: opts.configPathOverride,
    memoryDirOverride: opts.memoryDirOverride,
    rawDirOverride: opts.rawDirOverride,
  });
  mkdirSync(cfg.memoryDir, { recursive: true });
  mkdirSync(cfg.rawDir, { recursive: true });
  if (cfg.configPath && !existsSync(cfg.configPath)) {
    const fresh: Config = {
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [系统架构](system-architecture.md) — `lark-cli` 依赖与错误语义  
- [CLI 命令参考](cli-commands.md) — 命令级 flag 与 stdin/out  
- [测试、构建与 Python 遗留](testing-and-legacy.md) — 如何在测试里重定向 HOME  
