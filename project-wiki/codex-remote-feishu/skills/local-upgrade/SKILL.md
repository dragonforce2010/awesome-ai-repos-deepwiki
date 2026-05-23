---
name: local-upgrade
description: "当根据当前仓库签出刷新本地安装的 codex-remote 守护进程时使用。优先使用从仓库根运行的脚本进行拉取、重新构建，并在成功后执行升级。"
---

# local-upgrade

当任务是从当前仓库签出刷新本地安装的 `codex-remote` 守护进程时，使用此技能。

## 默认路径

优先从仓库根运行此命令：
```bash
./upgrade-local.sh
```

该脚本会自动执行以下所有操作：
1. `git pull --ff-only`
2. 重新构建 `./bin/codex-remote`
3. 将新的二进制文件复制到固定的本地资产路径
4. 运行 `./bin/codex-remote local-upgrade`

对于升级当前承载活跃 Codex 对话的守护进程实例，优先使用：
```bash
./upgrade-self.sh
```

## 自然语言边界

- 自然语言的 `本地升级` 请求是仓库任务，而不是守护进程的斜杠命令请求。
- 对于基于仓库构建的本地升级请求：
  - 使用 `./upgrade-local.sh`
  - 当用户指定目标实例时，使用 `--instance <id>` 保持该目标明确
  - **不要**将 `/upgrade ...` 发送回当前承载 Codex 对话的守护进程中
- 对于自我恢复请求（即当前守护进程太旧或已损坏，无法依赖其自身的 `/upgrade dev` 或 `upgrade local` 入口）：
  - 使用 `./upgrade-self.sh`
  - 此路径首先构建一个崭新的仓库二进制文件，然后使用该二进制文件对当前守护进程进行 `local-upgrade`

## 变体

- 不同的安装基目录：
  ```bash
  ./upgrade-local.sh --base-dir /path/to/base
  ```
- 明确的目标实例：
  ```bash
  ./upgrade-local.sh --instance beta
  ```
- 升级当前承载此 Codex 会话的守护进程：
  ```bash
  ./upgrade-self.sh
  ```
