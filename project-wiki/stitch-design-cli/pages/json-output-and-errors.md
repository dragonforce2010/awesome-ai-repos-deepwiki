<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [docs/CONTRACT_V1.md](../../../project-repos/stitch-design-cli/docs/CONTRACT_V1.md)
- [src/output.ts](../../../project-repos/stitch-design-cli/src/output.ts)
- [src/cli.ts](../../../project-repos/stitch-design-cli/src/cli.ts)

</details>

# JSON 契约与错误模型

`docs/CONTRACT_V1.md` 定义 v1 的稳定机器可读行为：`--json` 时 stdout **恰好一个** JSON 对象；进度与检查信息走 stderr；成功与失败分别使用 `ok` 信封与 `FailEnvelope`。

## 成功与失败信封

成功：`{ "ok": true, "data": {}, "meta": {} }`，`meta` 可选。失败：`{ "ok": false, "error": { "code", "message", "retryable" }, "meta": {} }`。

Sources: [docs/CONTRACT_V1.md:15-38](../../../project-repos/stitch-design-cli/docs/CONTRACT_V1.md#L15-L38)

## 退出码映射

`exitCodeFor` 将 `AUTH_MISSING`、`VALIDATION_ERROR`、`AUTH_FAILED` 映射为退出码 **2**（需要用户动作或输入非法）；其余错误码为 **1**；成功为 **0**。与 CONTRACT 中「用户动作或无效输入为 2」一致。

Sources: [src/output.ts:94-96](../../../project-repos/stitch-design-cli/src/output.ts#L94-L96), [docs/CONTRACT_V1.md:43-47](../../../project-repos/stitch-design-cli/docs/CONTRACT_V1.md#L43-L47)

## 错误归一化与凭据启发式

`makeError` 优先识别 `StitchError`；否则尝试 `StitchError.fromUnknown`；再回退到消息中的超时检测等。若消息匹配「invalid authentication credentials」或「expected oauth 2 access token」类文案，则升级为 `AUTH_FAILED` 并附带解释性 `detail`，对应 README 中「tool list 可用但 project list 失败」场景。

Sources: [src/output.ts:39-76](../../../project-repos/stitch-design-cli/src/output.ts#L39-L76)

## 可重试性

`isRetryable` 对 `StitchError` 尊重 `recoverable`；对非 SDK 错误则依据错误码集合 `RATE_LIMITED`、`NETWORK_ERROR`。

Sources: [src/output.ts:22-37](../../../project-repos/stitch-design-cli/src/output.ts#L22-L37)

```mermaid
flowchart TD
  Err["原始异常"]
  StitchErr["StitchError 分支"]
  Unknown["fromUnknown 回退"]
  Heuristic["凭据消息启发式"]
  Cli["CliError 输出"]
  Err --> StitchErr
  Err --> Unknown
  StitchErr --> Heuristic
  Unknown --> Heuristic
  Heuristic --> Cli
```

## 相关页面

- [CLI 命令面](cli-commands.md)
- [响应归一化与屏幕变更结果](normalization-pipeline.md)
