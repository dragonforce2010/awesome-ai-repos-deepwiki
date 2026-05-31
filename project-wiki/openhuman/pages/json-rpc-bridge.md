<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/rpc/mod.rs](../../project-repos/openhuman/src/rpc/mod.rs)
- [src/core/jsonrpc.rs](../../project-repos/openhuman/src/core/jsonrpc.rs)
- [app/src/services/coreRpcClient.ts](../../project-repos/openhuman/app/src/services/coreRpcClient.ts)

</details>

# JSON-RPC 通信桥

OpenHuman 的控制面是 **JSON-RPC 2.0 over HTTP**，辅以 **Socket.IO** 做流式事件。域模块通过 `RpcOutcome<T>` 统一返回 `{ result, logs }` 形状。

## 全局数据流

```mermaid
flowchart LR
    UI["React callCoreRpc"]
    Relay["Tauri relay 可选"]
    HTTP["http_host JSON-RPC"]
    Dispatch["try_dispatch / controllers"]
    Domain["openhuman::* ops"]
    UI --> Relay --> HTTP --> Dispatch --> Domain
```

## 双通道对比

| 通道 | 用途 | 认证 |
|------|------|------|
| HTTP JSON-RPC | 请求/响应 RPC | HTTP Basic / bearer |
| Socket.IO | Agent 流、通道事件 | Session baked auth |

`src/rpc/dispatch.rs` 的 `try_dispatch` 把 method 字符串路由到各域 `all_*_registered_controllers()` 注册表——新增 RPC 需同时注册 schema 与 handler。

## 错误模型

`StructuredRpcError` 与 sentinel 常量让前端可区分 thread not found、审批 pending 等结构化错误（E2E 见 `tests/json_rpc_e2e.rs`）。

**Insight**：E2E 测试使用独立 token 与 temp auth dir，证明 RPC 层是质量门禁的核心——Playwright flow 大量断言 UI→coreRpcClient→sidecar 全链路。

## 相关页面

- [React 前端](react-frontend.md)
- [Rust 核心运行时](rust-core-runtime.md)
- [Agent 编排与循环](agent-orchestration.md)

Sources: [src/rpc/mod.rs:1-80](../../../project-repos/openhuman/src/rpc/mod.rs#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/rpc/mod.rs:1-80`

```rust
//! Shared types for JSON-RPC / CLI controller surfaces.
//!
//! This module provides the foundational types and utilities for handling
//! RPC outcomes across different domain modules. It ensures a consistent
//! response format for both internal consumption and external presentation.
//!
//! Domain `rpc` modules should use [`RpcOutcome`] to wrap their results,
//! which facilitates consistent logging and error handling.

use serde::Serialize;
use serde_json::json;

mod dispatch;
mod structured_error;

pub use dispatch::try_dispatch;
pub use structured_error::{StructuredRpcError, STRUCTURED_RPC_ERROR_SENTINEL};

/// Successful RPC handler result: serialized JSON value plus optional log lines.
///
/// This type represents the result of a domain-specific RPC call, including
/// any log messages generated during execution.
#[derive(Debug)]
pub struct RpcOutcome<T> {
    /// The actual data returned by the RPC call.
    pub value: T,
    /// A collection of log messages for auditing or debugging.
    pub logs: Vec<String>,
}

impl<T> RpcOutcome<T> {
    /// Creates a new `RpcOutcome` with a value and a list of logs.
    pub fn new(value: T, logs: Vec<String>) -> Self {
        Self { value, logs }
    }
}

impl<T: Serialize> RpcOutcome<T> {
    /// Creates a new `RpcOutcome` with a value and a single log message.
    pub fn single_log(value: T, log: impl Into<String>) -> Self {
        Self {
            value,
            logs: vec![log.into()],
        }
    }

    /// Converts the outcome into a CLI-compatible JSON value.
    ///
    /// The resulting JSON shape matches the core CLI expectations:
    /// - If no logs are present, the value is returned directly.
    /// - If logs are present, an object with `result` and `logs` keys is returned.
    ///
    /// # Errors
    ///
    /// Returns an error if serialization to JSON fails.
    pub fn into_cli_compatible_json(self) -> Result<serde_json::Value, String> {
        let RpcOutcome { value, logs } = self;
        let value = serde_json::to_value(value).map_err(|e| e.to_string())?;
        if logs.is_empty() {
            Ok(value)
        } else {
            Ok(json!({ "result": value, "logs": logs }))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn new_preserves_value_and_logs() {
        let outcome: RpcOutcome<i64> = RpcOutcome::new(7, vec!["a".into(), "b".into()]);
        assert_eq!(outcome.value, 7);
        assert_eq!(outcome.logs, vec!["a".to_string(), "b".to_string()]);
    }

    #[test]
    fn single_log_stores_exactly_one_log() {
```

<!-- source-snippets:end -->
</details>
