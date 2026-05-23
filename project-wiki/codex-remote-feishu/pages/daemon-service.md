<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [internal/app/install/service.go](../../../project-repos/codex-remote-feishu/internal/app/install/service.go)
- [internal/app/install/linux_service.go](../../../project-repos/codex-remote-feishu/internal/app/install/linux_service.go)
- [docs/general/config-state-storage-guidelines.md](../../../project-repos/codex-remote-feishu/docs/general/config-state-storage-guidelines.md)

</details>

# Linux Service 守护常驻与状态 API

对于中长期在 Linux 开发机或远程工作站上部署的 Bot 而言，依赖会话终端的前台常驻极其脆弱。为了确保 `codex-remote` 服务在后台的高可用度，系统内建了跨操作系统的后台守护服务适配管理器，并重点针对 Linux 系统设计了符合安全边界的 **user 级 systemd** 托管方案。

## 为什么选择 systemd --user 用户级服务？

在企业或共享开发机中，普通的开发者并没有 Linux 系统的超级管理员 `root` 权限。
- **痛点**：传统的守护服务配置在 `/etc/systemd/system/` 下，需要 `sudo` 授权且服务会以 root 高权限运行，这会带来严重的系统安全风险。
- **解法**：系统在 `linux_service.go` 中将守护单元配置为 `systemd --user`（用户级系统服务）。
  - 服务定义文件存放在用户的家目录下：`~/.config/systemd/user/lark-channel-bridge.bot.service`。
  - 服务完全以当前用户的权限运行，其对文件的操作权限受到该用户的系统权限物理限制，实现了极高的沙箱隔离安全性。

Sources: [internal/app/install/linux_service.go:1-60](../../../project-repos/codex-remote-feishu/internal/app/install/linux_service.go#L1-L60)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `internal/app/install/linux_service.go:1-60`

```go
package install

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/kxn/codex-remote-feishu/internal/config"
	"github.com/kxn/codex-remote-feishu/internal/execlaunch"
	"github.com/kxn/codex-remote-feishu/internal/pathscope"
)

var (
	serviceRuntimeGOOS    = runtime.GOOS
	serviceUserHomeDir    = pathscope.UserHomeDir
	serviceMkdirAll       = os.MkdirAll
	serviceWriteFile      = os.WriteFile
	serviceRemoveFile     = os.Remove
	systemctlUserRunner   = runSystemctlUser
	systemdShellEnvLookup = config.LookupUserShellEnvValue
)

var defaultSystemdUserPATH = []string{
	"/usr/local/sbin",
	"/usr/local/bin",
	"/usr/sbin",
	"/usr/bin",
	"/sbin",
	"/bin",
}

type systemdUserUnitState struct {
	ActiveState string
	MainPID     string
}

func runSystemctlUser(ctx context.Context, args ...string) (string, error) {
	commandArgs := append([]string{"--user"}, args...)
	cmd := execlaunch.CommandContext(ctx, "systemctl", commandArgs...)
	output, err := cmd.CombinedOutput()
	trimmed := strings.TrimSpace(string(output))
	if err != nil {
		if trimmed == "" {
			return "", err
		}
		return trimmed, fmt.Errorf("%w: %s", err, trimmed)
	}
	return trimmed, nil
}

func ensureLinuxSystemdUserSupport() error {
	if serviceRuntimeGOOS != "linux" {
		return fmt.Errorf("systemd user service is only supported on linux (current: %s)", serviceRuntimeGOOS)
	}
	return nil
}
```

<!-- source-snippets:end -->
</details>

## SSH 登出保活与自愈方案

在 Linux systemd 用户单元默认策略下，一旦用户关闭终端并退出 SSH 连接，操作系统会自动回收并强杀该用户的所有后台进程，这会导致 Bot 下线。
- **保活机制**：安装器引导用户在终端执行以下系统命令：
  ```bash
  loginctl enable-linger "$USER"
  ```
  - **技术考量**：这会在操作系统层面开启“用户留守”属性。此后即使该用户没有任何活跃的 SSH 登录会话，系统也会持续为其加载并运行 systemd 用户级守护服务，保障了长驻稳定性。
- **崩溃与升级自愈**：
  在服务配置文件中配置了 `Restart=always` 与 `RestartSec=5`。当用户通过飞书发送 `/upgrade` 触发热升级导致进程重启，或由于环境变动导致进程意外挂掉时，systemd 会在 5 秒内自动将其拉起并加载最新的程序包。

Sources: [internal/app/install/service.go:1-80](../../../project-repos/codex-remote-feishu/internal/app/install/service.go#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `internal/app/install/service.go:1-80`

```go
package install

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/kxn/codex-remote-feishu/internal/adapter/editor"
	"github.com/kxn/codex-remote-feishu/internal/config"
)

type Options struct {
	InstanceID         string
	BaseDir            string
	InstallBinDir      string
	BinaryPath         string
	ServiceManager     ServiceManager
	CurrentVersion     string
	InstallSource      InstallSource
	CurrentTrack       ReleaseTrack
	VersionsRoot       string
	CurrentSlot        string
	WrapperBinary      string
	RelaydBinary       string
	RelayServerURL     string
	CodexRealBinary    string
	IntegrationMode    WrapperIntegrationMode
	Integrations       []WrapperIntegrationMode
	VSCodeSettingsPath string
	BundleEntrypoint   string
	FeishuGatewayID    string
	FeishuAppID        string
	FeishuAppSecret    string
	UseSystemProxy     bool
	BootstrapOnly      bool
}

type InstallState struct {
	InstanceID             string                   `json:"instanceId,omitempty"`
	BaseDir                string                   `json:"baseDir,omitempty"`
	ConfigPath             string                   `json:"configPath,omitempty"`
	StatePath              string                   `json:"statePath"`
	ServiceManager         ServiceManager           `json:"serviceManager,omitempty"`
	ServiceUnitPath        string                   `json:"serviceUnitPath,omitempty"`
	InstallSource          InstallSource            `json:"installSource,omitempty"`
	CurrentTrack           ReleaseTrack             `json:"currentTrack,omitempty"`
	CurrentVersion         string                   `json:"currentVersion,omitempty"`
	CurrentBinaryPath      string                   `json:"currentBinaryPath,omitempty"`
	VersionsRoot           string                   `json:"versionsRoot,omitempty"`
	CurrentSlot            string                   `json:"currentSlot,omitempty"`
	RollbackCandidate      *RollbackCandidate       `json:"rollbackCandidate,omitempty"`
	LastCheckAt            *time.Time               `json:"lastCheckAt,omitempty"`
	LastKnownLatestVersion string                   `json:"lastKnownLatestVersion,omitempty"`
	PendingUpgrade         *PendingUpgrade          `json:"pendingUpgrade,omitempty"`
	InstalledBinary        string                   `json:"installedBinary,omitempty"`
	InstalledWrapperBinary string                   `json:"installedWrapperBinary,omitempty"`
	InstalledRelaydBinary  string                   `json:"installedRelaydBinary,omitempty"`
	Integrations           []WrapperIntegrationMode `json:"integrations"`
	VSCodeSettingsPath     string                   `json:"vscodeSettingsPath,omitempty"`
	BundleEntrypoint       string                   `json:"bundleEntrypoint,omitempty"`
}

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) Bootstrap(opts Options) (InstallState, error) {
	instanceID, err := parseInstanceID(opts.InstanceID)
	if err != nil {
		return InstallState{}, err
	}
	layout := installLayoutForInstance(opts.BaseDir, instanceID)
	configDir := layout.ConfigDir
	stateDir := layout.StateDir
```

<!-- source-snippets:end -->
</details>

## 健康状态监控 API (/v1/status)

为了方便运维系统或本地诊断工具捕获 Bot 的健康度，`daemon` 提供了一个免密、环回可读的健康快照接口：
```bash
curl -sf http://127.0.0.1:9501/v1/status | jq .
```
该快照会实时输出当前进程的：
- 活动连接状态与绑定的飞书 Surface 数量。
- **活动会话追踪**：`ObservedFocusedThreadID` (VS Code 当前聚焦的 Thread ID)、`ActiveThreadID` (飞书活跃交互 ID)。
- 当前挂起的 FIFO 消息队列长度。
- AI 模型的参数覆盖状态。

当诊断工具发现该 API 报错或超时（例如因为代理网络污染导致 loopback 被代理软件劫持），能第一时间输出警报。

Sources: [docs/general/config-state-storage-guidelines.md:1-50](../../../project-repos/codex-remote-feishu/docs/general/config-state-storage-guidelines.md#L1-L50)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/general/config-state-storage-guidelines.md:1-50`

```markdown
# Configuration State Storage Guidelines

> Type: `general`
> Updated: `2026-05-09`
> Summary: 新增配置项存储决策规则，区分显示配置、本地副作用配置、启动合同、backend 行为默认值和 backend 可变状态。

## 1. 适用范围

这份规范适用于所有以“参数、开关、档位、profile、provider、mode、override”形式影响 Codex Remote Feishu 行为的配置项。

典型入口包括：

- 飞书命令和菜单项，例如 `/model`、`/reasoning`、`/access`、`/plan`、`/verbose`
- 本地自动化开关，例如 AutoContinue、AutoWhip
- backend / mode / provider / profile 切换
- Web admin / Web setup 中新增的默认值、profile 字段或运行时偏好
- wrapper / relay / daemon 从 backend 观测并回传的配置状态

新增配置项前，必须先按本文完成存储分类，而不是先找一个现有 state 字段临时复用。

## 2. 基本原则

### 2.1 先判定影响层，再决定存储

配置项必须先归类到以下影响层之一：

1. 只影响展示
2. 只影响本地自动化，但有执行副作用
3. 影响本地路由或 backend 启动合同
4. 影响 backend 行为，且 Codex Remote Feishu 是唯一修改入口
5. 影响 backend 行为，但 backend 或其他客户端也可能修改

不能只根据“用户希望下次还在不在”来决定是否持久化。持久化本质上是在声明 source of truth，必须先确认这个配置是否真的应由本系统持有真相。

### 2.2 Desired state 和 observed state 分开

本地用户设置得到的是 desired state。backend 上报得到的是 observed state。

- desired state 表示 Codex Remote Feishu 希望后续行为是什么
- observed state 表示 backend 当前真实状态或历史记录是什么
- observed state 不能无条件覆盖 desired state
- desired state 也不能无条件压回 backend，尤其当 backend 本身允许用户或 LLM 主动改变状态时

如果一个配置同时存在 desired 和 observed 两面，数据结构、字段名和展示文案必须能明确区分这两层。

### 2.3 Prompt 入队时必须冻结执行参数

对下一条 prompt 生效的配置，在 queue item 创建时必须冻结。

冻结后：
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [系统架构与统一二进制模型](system-architecture.md) — 了解 daemon 在 Host 下的整体角色
- [WebSetup 与引导安装生命周期](setup-install.md) — 探究安装期如何触发 systemd 注册
