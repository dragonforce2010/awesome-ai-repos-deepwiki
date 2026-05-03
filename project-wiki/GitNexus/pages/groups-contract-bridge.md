<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [ARCHITECTURE.md](../../../project-repos/GitNexus/ARCHITECTURE.md)
- [gitnexus/src/mcp/tools.ts](../../../project-repos/GitNexus/gitnexus/src/mcp/tools.ts)
- [README.md](../../../project-repos/GitNexus/README.md)
- [gitnexus/src/mcp/resources.ts](../../../project-repos/GitNexus/gitnexus/src/mcp/resources.ts)
- [gitnexus/package.json](../../../project-repos/GitNexus/gitnexus/package.json)

</details>

# 多仓组与 Contract Bridge

当多个仓库在业务上组成一组（例如微服务单仓）时，GitNexus 支持以 **`@<groupName>`** 形式的 repo 参数在 `query`、`context`、`impact` 等工具中进入 **group 模式**：单成员内的图遍历与跨边界扇出通过 **Contract Bridge** 与 `gitnexus/src/core/group/` 下的同步与交叉影响逻辑协作完成。

## 资源与工具分工

`ARCHITECTURE.md` 明确：**不**再引入一组独立的 `group_query` 等 MCP 工具，组级状态通过 **MCP 资源** 暴露：

| 资源 URI | 内容 |
|----------|------|
| `gitnexus://group/{name}/contracts` | Contract Registry（提供方、消费方与交叉链接） |
| `gitnexus://group/{name}/status` | 各成员索引与契约注册表陈旧度 |

`group_list` / `group_sync` 工具用于列出组详情与重建组级 `contracts.json` 及桥接图。

## MCP 资源定义位置

组级 URI 模板在 `resources.ts` 中与各 `gitnexus://repo/...` 模板并列注册，客户端可按模板拉取契约与状态文本。

## 相关页面

- [MCP、CLI 与 HTTP 桥](mcp-cli-http-interfaces.md)
- [检索、向量与 Wiki](search-embeddings-and-wiki.md)

Sources: [ARCHITECTURE.md:47-52](../../../project-repos/GitNexus/ARCHITECTURE.md#L47-L52), [ARCHITECTURE.md:61-62](../../../project-repos/GitNexus/ARCHITECTURE.md#L61-L62), [gitnexus/src/mcp/tools.ts:88-95](../../../project-repos/GitNexus/gitnexus/src/mcp/tools.ts#L88-L95), [gitnexus/src/mcp/tools.ts:338-345](../../../project-repos/GitNexus/gitnexus/src/mcp/tools.ts#L338-L345), [gitnexus/src/mcp/resources.ts:82-95](../../../project-repos/GitNexus/gitnexus/src/mcp/resources.ts#L82-L95)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:47-52`

```markdown
`query`, `context`, and `impact` are group-aware: pass `repo: "@<groupName>"` (or `"@<groupName>/<memberPath>"` to scope to one member) plus optional `service: "<monorepo/path>"`. Group-mode `query` merges per-repo results via Reciprocal Rank Fusion; group-mode `impact` runs the local walk in the chosen member and fans out across boundaries via the Contract Bridge (`gitnexus/src/core/group/cross-impact.ts`). The previously-planned `group_query`, `group_context`, `group_impact`, `group_contracts`, `group_status` MCP tools are intentionally not introduced — group-level state is exposed via resources instead:

| Resource URI | Purpose |
|--------------|---------|
| `gitnexus://group/{name}/contracts` | Contract Registry (provider/consumer rows + cross-links) |
| `gitnexus://group/{name}/status` | Per-member index + Contract Registry staleness |
```

#### `ARCHITECTURE.md:61-62`

```markdown
| MCP tools/resources | `src/mcp/server.ts`, `tools.ts`, `resources.ts` |
| Cross-repo groups (sync, contracts, `@<group>` routing) | `src/core/group/` (`service.ts`, `cross-impact.ts`, `sync.ts`, `bridge-db.ts`) |
```

#### `gitnexus/src/mcp/tools.ts:88-95`

```typescript
GROUP MODE: set "repo" to "@<groupName>" to search all member repos in that group (merged via RRF), or "@<groupName>/<groupRepoPath>" to run against a single member (same path keys as in group.yaml). If you use "@<groupName>" only, the member repo defaults to the lexicographically first key in group.yaml "repos". Prefer resources for contracts/status (see migration from legacy group_* tools).

SERVICE: optional monorepo path prefix (POSIX-style, case-sensitive segments). When "repo" starts with "@", only processes whose symbols fall under that prefix are included. For a normal indexed repo name (no leading @), this field is currently ignored by the server.`,
    annotations: QUERY_TOOL_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language or keyword search query' },
```

#### `gitnexus/src/mcp/tools.ts:338-345`

```typescript
EdgeType: CALLS, IMPORTS, EXTENDS, IMPLEMENTS, HAS_METHOD, HAS_PROPERTY, METHOD_OVERRIDES, METHOD_IMPLEMENTS, ACCESSES
Confidence: 1.0 = certain, <0.8 = fuzzy match

GROUP MODE: set "repo" to "@<groupName>" for cross-repo impact anchored at the default member (lexicographically first key in group.yaml "repos"), or "@<groupName>/<groupRepoPath>" to choose the member (same path keys as in group.yaml). Phase-1 walk runs in that member; cross-boundary fan-out uses the group bridge.

SERVICE: optional monorepo path prefix (case-sensitive path segments). When "repo" starts with "@", scopes the local impact walk and cross-repo symbol paths to files under that prefix; ignored for a normal indexed repo name.`,
    annotations: READ_ONLY_TOOL_ANNOTATIONS,
    inputSchema: {
```

#### `gitnexus/src/mcp/resources.ts:82-95`

```typescript
      uriTemplate: 'gitnexus://repo/{name}/process/{processName}',
      name: 'Process Trace',
      description: 'Step-by-step execution trace',
      mimeType: 'text/yaml',
    },
    {
      uriTemplate: 'gitnexus://group/{name}/contracts',
      name: 'Group Contract Registry',
      description:
        'Cross-repo contract registry for a repository group. Optional query: type, repo, unmatchedOnly (true|false).',
      mimeType: 'text/yaml',
    },
    {
      uriTemplate: 'gitnexus://group/{name}/status',
```

<!-- source-snippets:end -->
</details>
