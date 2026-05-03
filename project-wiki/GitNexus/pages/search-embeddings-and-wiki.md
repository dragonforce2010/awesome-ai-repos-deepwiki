<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [ARCHITECTURE.md](../../../project-repos/GitNexus/ARCHITECTURE.md)
- [README.md](../../../project-repos/GitNexus/README.md)
- [RUNBOOK.md](../../../project-repos/GitNexus/RUNBOOK.md)
- [gitnexus/package.json](../../../project-repos/GitNexus/gitnexus/package.json)
- [TESTING.md](../../../project-repos/GitNexus/TESTING.md)

</details>

# 检索、向量与 Wiki

GitNexus 的 **`query` 工具**在架构文档中描述为 **BM25 与向量检索的混合**（hybrid），并依赖可选的嵌入流水线；`ARCHITECTURE.md` 将搜索排序实现指向 `gitnexus/src/core/search/`。

## 嵌入与 CLI 开关

README 的 CLI 章节列出 `gitnexus analyze --embeddings`、`--skip-embeddings`、`--drop-embeddings` 等标志，用于在索引速度与语义检索质量之间取舍。依赖中包含 `@huggingface/transformers` 与 `onnxruntime-node`，表明嵌入路径与本地推理相关。

## Wiki 生成

README 说明 `gitnexus wiki` 可基于知识图谱调用 LLM 生成文档，并支持 `--model`、`--concurrency`、`--gist` 等参数；首次使用需配置 API Key（写入 `~/.gitnexus/config.json`）。实现入口在 `gitnexus/src/core/wiki/`（见 ARCHITECTURE 变更表）。

## 相关页面

- [索引流水线](ingestion-pipeline.md)
- [MCP、CLI 与 HTTP 桥](mcp-cli-http-interfaces.md)

Sources: [ARCHITECTURE.md:63-64](../../../project-repos/GitNexus/ARCHITECTURE.md#L63-L64), [ARCHITECTURE.md:65-66](../../../project-repos/GitNexus/ARCHITECTURE.md#L65-L66), [README.md:188-200](../../../project-repos/GitNexus/README.md#L188-L200), [RUNBOOK.md:1-120](../../../project-repos/GitNexus/RUNBOOK.md#L1-L120), [gitnexus/package.json:54-73](../../../project-repos/GitNexus/gitnexus/package.json#L54-L73)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:63-64`

```markdown
| Search ranking | `src/core/search/` (BM25, hybrid fusion) |
| Embeddings | `src/core/embeddings/` + `src/core/run-analyze.ts` |
```

#### `ARCHITECTURE.md:65-66`

```markdown
| Wiki generation | `src/core/wiki/` |
| Language support | `src/core/ingestion/languages/` + `tree-sitter-queries.ts` + `gitnexus-shared/src/languages.ts` |
```

#### `README.md:188-200`

````markdown
### CLI Commands

```bash
gitnexus setup                   # Configure MCP for your editors (one-time)
gitnexus analyze [path]          # Index a repository (or update stale index)
gitnexus analyze --force         # Force full re-index
gitnexus analyze --skills        # Generate repo-specific skill files from detected communities
gitnexus analyze --skip-embeddings  # Skip embedding generation (faster)
gitnexus analyze --skip-agents-md  # Preserve custom AGENTS.md/CLAUDE.md gitnexus section edits
gitnexus analyze --skip-git        # Index folders that are not Git repositories
gitnexus analyze --embeddings    # Enable embedding generation (slower, better search)
gitnexus analyze --verbose       # Log skipped files when parsers are unavailable
gitnexus analyze --worker-timeout 60  # Increase worker idle timeout for slow parses
````

#### `RUNBOOK.md:1-120`

````markdown
# Runbook — GitNexus

Short, copy-paste operations for **local development**, **MCP**, and **CI**. Commands assume a Unix shell; on Windows use Git Bash or equivalent paths.

## Prerequisites

- **Node.js** ≥ 20 (`gitnexus-web/package.json` `engines`).  
- **Git** (analyze requires a git repository).  
- From repo root, install and build the CLI package:

```bash
cd gitnexus
npm install
npm run build
```

Use `npx gitnexus …` from any path after global/published install, or `node dist/cli/index.js …` when developing from `gitnexus/` with a local build.

---

## Index out of date / “stale” tools

**Symptom:** MCP or resources warn the index is behind `HEAD`, or results don’t reflect recent commits.

**Fix (from the target repo root):**

```bash
npx gitnexus analyze
```

**Force full rebuild** (same commit but suspect corruption or changed ignore rules):

```bash
npx gitnexus analyze --force
```

**Check status:**

```bash
npx gitnexus status
```

**List what MCP knows about:**

```bash
npx gitnexus list
```

---

## Embeddings

**First time with vectors** (slower, more disk/RAM):

```bash
npx gitnexus analyze --embeddings
```

**Important:** If you already had embeddings, **always** pass `--embeddings` on later analyzes, or they can be dropped. See `stats.embeddings` in `.gitnexus/meta.json` (0 means none).

**Large repos:** Analyze may skip or limit embedding work when node counts are very high; watch CLI output.

---

## MCP: no repos / empty tools

**Symptom:** `GitNexus: No indexed repos yet` on stderr when starting MCP.

**Fix:** In each project you want indexed:

```bash
cd /path/to/repo
npx gitnexus analyze
```

Restart the editor MCP session if needed. The server **refreshes the registry lazily**; new analyzes are picked up without necessarily reinstalling MCP.

**Symptom:** Wrong repo when multiple are indexed — pass `repo` on tools or use `list_repos` first.

---

## Clean slate (corrupt or huge `.gitnexus`)

**Current repo only** (prompts for confirmation):

```bash
npx gitnexus clean
```

**Skip confirmation:**

```bash
npx gitnexus clean --force
```

**All registered repos:**

```bash
npx gitnexus clean --all --force
```

Then re-run `npx gitnexus analyze` (and `--embeddings` if you need vectors).

---

## Local bridge for the web UI

```bash
cd gitnexus
npx gitnexus serve
# default http://127.0.0.1:4747 — see serve --help for port/host
```

Use when the browser UI should talk to **local** indexed repos instead of WASM-only mode.

---

## CLI equivalents of MCP tools

Useful for debugging without an editor:
````

#### `gitnexus/package.json:54-73`

```json
  "dependencies": {
    "@huggingface/transformers": "^4.1.0",
    "@ladybugdb/core": "^0.16.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@scarf/scarf": "^1.4.0",
    "cli-progress": "^3.12.0",
    "commander": "^14.0.3",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "glob": "^13.0.6",
    "graphology": "^0.26.0",
    "graphology-indices": "^0.17.0",
    "graphology-utils": "^2.3.0",
    "ignore": "^7.0.5",
    "js-yaml": "^4.1.1",
    "jsonc-parser": "^3.3.1",
    "lru-cache": "^11.0.0",
    "mnemonist": "^0.40.3",
    "onnxruntime-node": "^1.24.0",
    "pandemonium": "^2.4.0",
```

<!-- source-snippets:end -->
</details>
