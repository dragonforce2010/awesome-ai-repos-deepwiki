---
name: linear
description: |
  在 Symphony app-server session 中使用 `linear_graphql` 客户端工具执行原始
  Linear GraphQL 操作（如评论编辑和上传流程）。
---

# Linear GraphQL

在 Symphony app-server session 中进行原始 Linear GraphQL 操作时使用此 skill。

## 主要工具

使用 Symphony app-server session 暴露的 `linear_graphql` 客户端工具。
它复用 Symphony 为当前 session 配置的 Linear 认证。

工具输入：

```json
{
  "query": "query or mutation document",
  "variables": {
    "optional": "graphql variables object"
  }
}
```

工具行为：

- 每次工具调用发送一个 GraphQL 操作。
- 即使工具调用本身成功，顶层 `errors` 数组也视为 GraphQL 操作失败。
- 保持 queries/mutations 范围精确；只请求需要的字段。

## 发现不熟悉的操作

当需要不熟悉的 mutation、input type 或 object field 时，通过 `linear_graphql` 使用有针对性的 introspection。

列出 mutation 名称：

```graphql
query ListMutations {
  __type(name: "Mutation") {
    fields {
      name
    }
  }
}
```

检查特定 input object：

```graphql
query CommentCreateInputShape {
  __type(name: "CommentCreateInput") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
}
```

## 常见工作流

### 按 key、identifier 或 id 查询 issue

逐步使用：

- 有工单键（如 `MT-686`）时先用 `issue(id: $key)`。
- 需要 identifier 搜索语义时退回到 `issues(filter: ...)`。
- 获得内部 issue id 后，优先使用 `issue(id: $id)` 精确读取。

按 issue key 查询：

```graphql
query IssueByKey($key: String!) {
  issue(id: $key) {
    id
    identifier
    title
    state { id name type }
    project { id name }
    branchName
    url
    description
    updatedAt
    links { nodes { id url title } }
  }
}
```

按 identifier 过滤查询：

```graphql
query IssueByIdentifier($identifier: String!) {
  issues(filter: { identifier: { eq: $identifier } }, first: 1) {
    nodes {
      id identifier title
      state { id name type }
      project { id name }
      branchName url description updatedAt
    }
  }
}
```

将 key 解析为内部 id：

```graphql
query IssueByIdOrKey($id: String!) {
  issue(id: $id) { id identifier title }
}
```

已知内部 id 时读取 issue 详情：

```graphql
query IssueDetails($id: String!) {
  issue(id: $id) {
    id identifier title url description
    state { id name type }
    project { id name }
    attachments { nodes { id title url sourceType } }
  }
}
```

### 查询 issue 所属 team 的工作流状态

在修改 issue 状态前使用，获取确切的 `stateId`：

```graphql
query IssueTeamStates($id: String!) {
  issue(id: $id) {
    id
    team {
      id key name
      states { nodes { id name type } }
    }
  }
}
```

### 编辑已有评论

通过 `linear_graphql` 使用 `commentUpdate`：

```graphql
mutation UpdateComment($id: String!, $body: String!) {
  commentUpdate(id: $id, input: { body: $body }) {
    success
    comment { id body }
  }
}
```

### 创建评论

通过 `linear_graphql` 使用 `commentCreate`：

```graphql
mutation CreateComment($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment { id url }
  }
}
```

### 将 issue 移至不同状态

使用 `issueUpdate` 配合目标 `stateId`：

```graphql
mutation MoveIssueToState($id: String!, $stateId: String!) {
  issueUpdate(id: $id, input: { stateId: $stateId }) {
    success
    issue { id identifier state { id name } }
  }
}
```

### 将 GitHub PR 附加到 issue

链接 PR 时使用 GitHub 特定的 attachment mutation：

```graphql
mutation AttachGitHubPR($issueId: String!, $url: String!, $title: String) {
  attachmentLinkGitHubPR(
    issueId: $issueId url: $url title: $title linkKind: links
  ) {
    success
    attachment { id title url }
  }
}
```

如只需普通 URL attachment 且不关心 GitHub 特定的链接元数据，使用：

```graphql
mutation AttachURL($issueId: String!, $url: String!, $title: String) {
  attachmentLinkURL(issueId: $issueId, url: $url, title: $title) {
    success
    attachment { id title url }
  }
}
```

### Schema 发现时使用的 introspection 模式

确切 field 或 mutation 形状不明确时使用：

```graphql
query QueryFields {
  __type(name: "Query") { fields { name } }
}
```

```graphql
query IssueFieldArgs {
  __type(name: "Query") {
    fields {
      name
      args {
        name
        type { kind name ofType { kind name ofType { kind name } } }
      }
    }
  }
}
```

### 上传视频到评论

分三步执行：

1. 调用 `linear_graphql` 的 `fileUpload` 获取 `uploadUrl`、`assetUrl` 和所需的上传 headers。
2. 用 `curl -X PUT` 将本地文件字节上传到 `uploadUrl`，附带 `fileUpload` 返回的确切 headers。
3. 再次调用 `linear_graphql` 的 `commentCreate`（或 `commentUpdate`），在评论 body 中包含生成的 `assetUrl`。

相关 mutation：

```graphql
mutation FileUpload(
  $filename: String! $contentType: String! $size: Int! $makePublic: Boolean
) {
  fileUpload(
    filename: $filename contentType: $contentType size: $size makePublic: $makePublic
  ) {
    success
    uploadFile { uploadUrl assetUrl headers { key value } }
  }
}
```

## 使用规则

- 使用 `linear_graphql` 进行评论编辑、上传和临时 Linear API 查询。
- 优先使用与已有信息匹配的最窄 issue 查询：key → identifier 搜索 → 内部 id。
- 状态转换时，先获取 team states 并使用确切的 `stateId`，而非在 mutation 中硬编码名称。
- 链接 GitHub PR 到 Linear issue 时优先使用 `attachmentLinkGitHubPR` 而非通用 URL attachment。
- **不要**为 GraphQL 访问引入新的 raw-token shell helper。
- 如需 shell 操作用于上传，仅用于 `fileUpload` 返回的签名 upload URL；这些 URL 已携带所需授权。
