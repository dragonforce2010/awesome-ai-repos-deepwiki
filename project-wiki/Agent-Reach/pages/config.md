# 配置系统

<details>
<summary>相关源码文件</summary>

- [agent_reach/config.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/config.py)
- [agent_reach/cookie_extract.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/cookie_extract.py)
</details>

# 配置系统

## 配置目录

```
~/.agent-reach/
├── config.yaml        # 所有凭据和配置（权限 600）
└── tools/            # 第三方工具克隆目录
    ├── xiaoyuzhou/   # 小宇宙转录脚本
    └── wechat-article-for-ai/  # 微信公众号工具
```

## config.yaml 结构

```yaml
# ~/.agent-reach/config.yaml 示例（已脱敏）
twitter_auth_token: "abc123..."
twitter_ct0: "def456..."
github_token: "ghp_xxxxx..."
groq_api_key: "gsk_xxxxx..."
bilibili_proxy: "http://user:pass@host:port"
```

## Config 类核心逻辑

```python
class Config:
    CONFIG_DIR = Path.home() / ".agent-reach"
    CONFIG_FILE = CONFIG_DIR / "config.yaml"

    def get(self, key: str, default: Any = None) -> Any:
        # 1. 先查 config.yaml
        # 2. 再查环境变量（大写）
        ...

    def set(self, key: str, value: Any):
        self.data[key] = value
        self.save()  # 写文件 + 设置 0o600 权限
```

**配置优先级：** `config.yaml` > 环境变量

## Feature 配置要求

```python
FEATURE_REQUIREMENTS = {
    "exa_search":     ["exa_api_key"],
    "twitter_xreach":  ["twitter_auth_token", "twitter_ct0"],
    "groq_whisper":   ["groq_api_key"],
    "github_token":    ["github_token"],
}
```

## 安全机制：文件权限

首次写入 config.yaml 时，使用 `os.open` 直接创建权限为 `0o600` 的文件：

```python
fd = os.open(
    str(self.config_path),
    os.O_WRONLY | os.O_CREAT | os.O_TRUNC,
    stat.S_IRUSR | stat.S_IWUSR,  # 0o600
)
```

**目的：** 避免在磁盘上产生权限过宽的临时文件。

Doctor 引擎会检测 config.yaml 权限是否被意外放宽：

```python
# doctor.py 中的安全检查
if mode & (stat.S_IRGRP | stat.S_IROTH):
    # 警告：其他用户可读！
    "[bold red][!] 安全提示：config.yaml 权限过宽[/bold red]"
```

## Cookie 提取机制

`agent_reach/cookie_extract.py` 负责从浏览器自动提取 Cookie：

- **支持浏览器：** Chrome、Firefox、Edge、Brave、Opera
- **macOS：** 使用 `security find-generic-password` 从 Keychain 提取
- **导出格式：** 支持 Cookie-Editor JSON 和 Header String 两种格式

```python
# 支持的输入格式
# 1. Cookie-Editor JSON:
#    '[{"name":"auth_token","value":"xxx","domain":".twitter.com",...}, ...]'
# 2. Header String:
#    "auth_token=xxx; ct0=yyy; ..."
```

## 环境变量覆盖

所有配置项都支持通过环境变量覆盖（大写）：

| config.yaml key | 环境变量 |
|----------------|---------|
| `twitter_auth_token` | `TWITTER_AUTH_TOKEN` |
| `twitter_ct0` | `TWITTER_CT0` |
| `github_token` | `GITHUB_TOKEN` |
| `groq_api_key` | `GROQ_API_KEY` |

## 敏感信息脱敏

`to_dict()` 方法对敏感字段进行脱敏：

```python
def to_dict(self) -> dict:
    masked = {}
    for k, v in self.data.items():
        if any(s in k.lower() for s in ("key", "token", "password", "proxy")):
            masked[k] = f"{str(v)[:8]}..." if v else None
        else:
            masked[k] = v
    return masked
```

## 相关页面

- [CLI 命令参考](./cli-reference.html)
- [渠道详解](./channels.html)
