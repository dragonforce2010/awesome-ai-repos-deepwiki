---
description: 如何使用 OpenCLI 自动化 Antigravity
---

# Antigravity 自动化 Skill

这个 skill 允许 AI Agent 通过 OpenCLI 以编程方式控制 [Antigravity](https://github.com/chengazhen/Antigravity) 桌面应用，以及任何启用了 CDP 的 Electron 应用。

## 要求

opencli 会自动检测、启动 Antigravity（带 `--remote-debugging-port=9234`），并连接到它。

如果 Antigravity 已经在没有 CDP 的情况下运行，opencli 会提示重启。

如果 endpoint 暴露了多个可检查 target，设置：

```bash
export OPENCLI_CDP_TARGET="antigravity"
```

## 高层能力

1. **发送消息（`opencli antigravity send <message>`）**：直接把消息输入并发送到聊天 UI。
2. **读取历史（`opencli antigravity read`）**：从主 UI 容器抓取原始聊天记录。
3. **提取代码（`opencli antigravity extract-code`）**：自动隔离并提取 AI 最近回答中的源码文本块。
4. **切换模型（`opencli antigravity model <name>`）**：即时切换当前 LLM，例如 `gemini`、`claude`。
5. **清空上下文（`opencli antigravity new`）**：开始新会话。

## 自动化工作流示例

### 生成并保存代码

```bash
opencli antigravity send "Write a python script to fetch HN top stories"
# 等待约 10-15 秒，直到输出渲染完成
opencli antigravity extract-code > hn_fetcher.py
```

### 读取实时日志

Agent 可以运行长时间 streaming watch：

```bash
opencli antigravity watch
```
