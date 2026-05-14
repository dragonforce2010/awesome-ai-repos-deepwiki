# CloakBrowser DeepWiki

> 生成时间: 2026-05-14
> 源: https://github.com/CloakHQ/cloakbrowser
> Commit: 6f4f92e7c762507056ed053078fb7e4854448c4b

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [README.md](../../../project-repos/cloakbrowser/README.md)
- [pyproject.toml](../../../project-repos/cloakbrowser/pyproject.toml)
- [CHANGELOG.md](../../../project-repos/cloakbrowser/CHANGELOG.md)
- [cloakbrowser/__init__.py](../../../project-repos/cloakbrowser/cloakbrowser/__init__.py)
- [cloakbrowser/config.py](../../../project-repos/cloakbrowser/cloakbrowser/config.py)
- [js/src/index.ts](../../../project-repos/cloakbrowser/js/src/index.ts)
- [bin/cloakserve](../../../project-repos/cloakbrowser/bin/cloakserve)
- [Dockerfile](../../../project-repos/cloakbrowser/Dockerfile)

</details>

# 项目概览

主流的反检测工具——`playwright-stealth`、`undetected-chromedriver`、`puppeteer-extra-plugin-stealth`——都在做同一件错事:**在 Chromium 启动之后,通过 JavaScript 注入或命令行 flag 来掩盖自动化痕迹**。这种"补丁打在表面"的方法面临两个无解的死循环:其一,每次 Chrome 大版本升级,补丁内部依赖的 API 形状就可能改变,导致 stealth 失效;其二,反爬团队反向工程这些开源补丁本身,把"是否带有 stealth 注入"也变成了一种检测特征。

CloakBrowser 选择从另一头切入:**在 Chromium 的 C++ 源码层面打补丁,然后编译出一份自己的二进制**。`navigator.webdriver`、canvas 指纹、WebGL renderer、音频 fingerprint、字体枚举、屏幕属性、WebRTC ICE candidate……这些在主流 stealth 里需要 JS hook 才能改写的字段,在 CloakBrowser 二进制里就是真实的 C++ 行为——反爬代码看到一个正常的 Chrome,因为它"就是"一个正常的 Chrome,只是 GPU 厂商串、canvas 噪声等数值被换掉了。

到 0.3.28 版本(2026-05-11),Linux x64 的二进制累计了 **57 个 C++ 补丁**,Windows x64 也升级到了相同水平。Python wrapper 是 `pip install cloakbrowser`,JavaScript wrapper 是 `npm install cloakbrowser`,两边的 launch API 在写法上完全是 Playwright/Puppeteer 的复制品——换 import 就能跑。

## 它解决了什么真实痛点

|场景| 主流 stealth 工具 | CloakBrowser |
|---|---|---|
|**reCAPTCHA v3 评分**| 0.1-0.7,经常被判机器人 | **0.9**,服务端验证为人类 |
|**Cloudflare Turnstile**| 时通时不通 | **稳定通过** non-interactive + managed |
|**Chrome 大版本升级**| 注入脚本经常失效 | 重新 rebase 补丁到新版本即可 |
|**`navigator.webdriver`**| `true`(或被脚本改成 `false`,但仍可探测) | **`false`**(C++ 源头改) |
|**TLS/JA3 指纹**| 与 Chrome 不匹配 | **与真实 Chrome 完全一致** |

最关键的是,它不是 CAPTCHA 求解服务——目标是**让 CAPTCHA 根本不出现**。代码里看不到任何"反向解 hCaptcha"逻辑,代理也是"自带"(BYO proxy);用户的工作就是写常规的 Playwright 脚本,然后享受不被拦截的体验。

## 核心创新:四层堆叠

**第一层:源码级 Chromium 补丁(二进制内)**。
49 → 57 个 C++ 补丁覆盖 canvas、WebGL、audio、font、GPU、screen、WebRTC、网络计时、CDP input 行为模拟等等。补丁清单与 Chromium 版本严格绑定——0.3.26 把 Windows 升到 146.0.7680.177.4 时,所有补丁都要从 145.0.7632.x 重 rebase。详见 [`CHANGELOG.md`](../../../project-repos/cloakbrowser/CHANGELOG.md) 中标记 `[binary]` 的条目。

**第二层:wrapper 层的反检测协调**。
Python 主 wrapper [`cloakbrowser/browser.py`](../../../project-repos/cloakbrowser/cloakbrowser/browser.py) 与 JS 等价物 [`js/src/playwright.ts`](../../../project-repos/cloakbrowser/js/src/playwright.ts) 做的事远不止"加几个 flag":它把 timezone/locale 通过 `--fingerprint-timezone`/`--lang` 这两个 binary flag 而非 Playwright 的 CDP emulation 来设;它在 SOCKS5 代理与 HTTP 代理之间分流——HTTP 走 Playwright dict,SOCKS5 必须绕过 Playwright 直接用 `--proxy-server` arg;它通过 `ignore_default_args=["--enable-automation", "--enable-unsafe-swiftshader"]` 主动屏蔽 Playwright 的两个自动化泄漏点。

**第三层:拟人化行为 (`humanize=True`)**。
[`cloakbrowser/human/`](../../../project-repos/cloakbrowser/cloakbrowser/human/) 提供一组"打补丁"函数,把 `page.click`、`page.type`、`page.mouse.move`、`page.locator(...).fill` 等等替换成 Bezier 曲线鼠标、按键级别时序、加速→巡航→减速三段式滚动。两个预设——`default`(普通速度)与 `careful`(更慢、更谨慎),也可以通过 `human_config={...}` 逐参数覆盖。在 deviceandbrowserinfo.com 的 24/24 行为信号测试中通过率从 0 提升到全 pass。

**第四层:`cloakserve` CDP 多路复用器**。
[`bin/cloakserve`](../../../project-repos/cloakbrowser/bin/cloakserve) 在一个端口上代理多份 Chrome,每个 fingerprint seed 各起一个 Chrome 进程,通过 URL `?fingerprint=12345&timezone=...` 选定;客户端用 `playwright.chromium.connect_over_cdp(...)` 接入。这是为多账号、多 profile 场景设计的——一个进程负担不起几十个浏览器,但一个 CDP 端口可以代理几十份。

```mermaid
flowchart TD
    USER["开发者代码<br/>Playwright/Puppeteer 习惯"]
    PY["Python wrapper<br/>cloakbrowser/"]
    JS["JS wrapper<br/>cloakbrowser/js/src"]
    HUM["拟人化层<br/>Bezier + 按键时序 + 滚动"]
    BIN["源码级补丁 Chromium<br/>49-57 个 C++ patch"]
    BIN_LIFECYCLE["二进制生命周期<br/>下载 / SHA256 / 自动更新"]
    SERVE["cloakserve<br/>CDP 多路复用"]

    USER -->|"from cloakbrowser import launch"| PY
    USER -->|"import ❴ launch ❵ from 'cloakbrowser'"| JS
    PY --> HUM
    JS --> HUM
    PY --> BIN_LIFECYCLE
    JS --> BIN_LIFECYCLE
    BIN_LIFECYCLE --> BIN
    HUM --> BIN
    PY --> BIN
    JS --> BIN
    PY -.可选.-> SERVE
    SERVE --> BIN
```

上图勾画了项目的总体结构:开发者既可以直接以 wrapper 接入(走左侧主路径),也可以通过 `cloakserve` 接入一个多路复用的 CDP 端点(右侧);所有调用最终都落到那份打了补丁的 Chromium 二进制上。拟人化层是 wrapper 内可选的"行为补丁"。

## 能力全景

**跨语言对偶**:Python 与 JS 两边的 API 一一对应——`launch` / `launchContext` / `launchPersistentContext`,各自有同名异步版。`launch_async` 是 Python 端的异步;JS 端所有函数本身就是 async。Puppeteer 入口在 `cloakbrowser/puppeteer`,共享同一个二进制。

**自动二进制管理**:`pip install` 不携带 200MB 的 Chromium,而是首次 `launch()` 时按平台从 `https://cloakbrowser.dev/chromium-v<version>/` 下载,失败回退到 GitHub Releases;下载后用 `SHA256SUMS` 校验。环境变量 `CLOAKBROWSER_BINARY_PATH` 可指向本地编译的二进制,跳过这一切。

**代理 + GeoIP 联动**:把 `proxy="http://..."` 和 `geoip=True` 组合一起后,wrapper 通过代理 IP 自动解析时区与地区,通过 `--fingerprint-webrtc-ip=<exit_ip>` 把 WebRTC ICE candidate 改写为代理出口 IP——这是"代理 IP 与 WebRTC 报告 IP 不匹配"这一典型代理检测向量的根治方案。

**集成生态**:`examples/integrations/` 下提供了 browser-use、Crawl4AI、Crawlee、Scrapling、Stagehand、Selenium、undetected-chromedriver、AWS Lambda、LangChain Loader 等的接入样例;`Dockerfile` 出厂自带 Python+JS 双 wrapper、Xvfb headed 支持、`cloaktest`/`cloakserve` 命令。

**自动更新与签名**:`download.py:_maybe_trigger_update_check()` 在后台轮询 GitHub Releases,发现新的 `chromium-v<version>` tag 就预下载;PyPI/npm 包通过 OIDC trusted publishing 发布(无明文 token);Docker 镜像由 cosign 无密钥签名 + actions/attest-build-provenance 出具 SLSA Level 3 证明。

## 在同类方案中的定位

CloakBrowser 不是孤立的工程项目,可以在反检测浏览器赛道上和几个方案对位看:

|工具|引擎|补丁层级|API|Playwright 兼容|维护活跃度|
|---|---|---|---|---|---|
|Playwright(原生)| Chromium | 无 | 原生 | ✅ | ✅|
|`playwright-stealth`| Chromium | JS 注入 | 原生 | ✅ | 停滞|
|`undetected-chromedriver`| Chrome | flag 调整 | Selenium | ❌ | 停滞|
|Camoufox | Firefox | C++ 源码 | 自定义 | ❌ | 不稳定|
|**CloakBrowser**| **Chromium** | **C++ 源码** | **原生** | ✅ | **活跃**|

它的不可替代性在于一个**取交集**的窗口:既要 Chromium 引擎(份额最大),又要源码级补丁(可持续),又要原生 Playwright API(零迁移成本),又要活跃维护(几周一次发布)——这四点同时满足的,目前只有它。

## 技术栈速览

- **Python wrapper**:依赖 `playwright>=1.40`、`httpx>=0.24`,Python 3.9-3.13;`hatchling` 构建。可选附加件:`[geoip]`、`[patchright]`、`[serve]`、`[dev]`
- **JS wrapper**:TypeScript 编写,peer 依赖 `playwright-core>=1.53.0` 或 `puppeteer-core`;npm 通过 OIDC + provenance 发布
- **Chromium 二进制**:由 CloakHQ 自维护补丁集编译,平台覆盖 `linux-x64`、`linux-arm64`、`darwin-arm64`、`darwin-x64`、`windows-x64`;当前 Chromium 基线为 146.0.7680.177.x(macOS 滞后在 145.0.7632.109.2)
- **Docker 镜像**:`cloakhq/cloakbrowser`,基于 `python:3.12-slim`,自带 Xvfb、emoji 字体、`cloakserve`/`cloaktest` 命令,buildx 多架构(amd64+arm64),cosign 签名
- **测试**:Python `pytest` + `pytest-asyncio`,JS `vitest`;CI 在每次 push 跑非 `slow` 标签子集

```text
cloakbrowser/
├── cloakbrowser/                       # Python wrapper
│   ├── __init__.py                     # 公开 API: launch / ensure_binary / 等
│   ├── browser.py                      # 核心 launch 实现 (四象限对偶)
│   ├── config.py                       # 平台检测 / stealth args / 下载 URL
│   ├── download.py                     # 二进制生命周期 (下载 + 校验 + 自动更新)
│   ├── geoip.py                        # 代理 IP → 时区/语言/exit IP 解析
│   ├── __main__.py                     # `python -m cloakbrowser` CLI
│   └── human/                          # 拟人化行为层
│       ├── __init__.py                 # patch_browser / patch_context / patch_page
│       ├── config.py                   # HumanConfig + default/careful 预设
│       ├── mouse.py / mouse_async.py   # Bezier 鼠标
│       ├── keyboard.py / keyboard_async.py  # 按键级时序 + CDP 反检测
│       └── scroll.py / scroll_async.py # 加速 → 巡航 → 减速
├── js/                                 # JavaScript/TypeScript wrapper
│   └── src/
│       ├── index.ts                    # 公开导出
│       ├── playwright.ts               # launch / launchContext / 持久化 context
│       ├── puppeteer.ts                # Puppeteer 入口 (共享 binary)
│       ├── config.ts / args.ts         # 与 Python 端镜像
│       ├── download.ts                 # 二进制下载
│       ├── geoip.ts / proxy.ts         # 代理与 GeoIP
│       ├── human/                      # Playwright 拟人化
│       └── human-puppeteer/            # Puppeteer 拟人化
├── bin/
│   ├── cloakserve                      # CDP 多路复用器 (Python aiohttp)
│   ├── cloaktest                       # 一键反检测体检
│   └── docker-entrypoint.sh            # Xvfb 启动入口
├── examples/                           # 集成示例
│   ├── basic.py / persistent_context.py / stealth_test.py / 等
│   └── integrations/                   # 与 browser-use/Crawl4AI/Lambda 等的集成
├── tests/                              # pytest 套件
├── js/tests/                           # vitest 套件
├── Dockerfile                          # python:3.12-slim + Xvfb + 双 wrapper
├── flake.nix                           # Nix flake 入口
└── .github/workflows/                  # CI / Publish / Attest-release
```

## 阅读路线

不同读者目标对应不同的入口:

- **快速上手 + API 速查** → 先看 [启动 API 四象限对偶](launch-api.md),知道 `launch` 系列四个函数怎么挑就够开始干活
- **想理解为何 C++ 补丁能做到主流 stealth 做不到的事** → [隐身引擎与指纹系统](stealth-engine.md)
- **关心代理 + 反检测组合(SOCKS5、WebRTC、GeoIP 联动)** → [代理、GeoIP 与 WebRTC 一致性](proxy-and-geoip.md)
- **想做多账号矩阵 / 服务化** → [cloakserve CDP 多路复用器](cloakserve-cdp-multiplexer.md) + [部署与生态集成](deployment-and-integrations.md)
- **关心源码组织、跨语言对偶** → [系统架构](system-architecture.md) + [Python 与 JS 双 SDK 对偶](python-vs-js-sdk.md)
- **想给项目贡献代码** → [测试、CI 与发布管线](testing-ci-release.md) + [二进制生命周期](binary-management.md)

## 源信息

- 仓库:[https://github.com/CloakHQ/cloakbrowser](https://github.com/CloakHQ/cloakbrowser)
- 分析时的 commit hash:`6f4f92e7c762507056ed053078fb7e4854448c4b`
- 分支:`main`
- 最新发布:0.3.28(2026-05-11),Chromium 基线 146.0.7680.177.x

## 相关页面

- [系统架构](system-architecture.md) — wrapper / binary / cloakserve 三层模型与调用链
- [隐身引擎与指纹系统](stealth-engine.md) — C++ 补丁与 fingerprint flag 体系
- [启动 API:四象限对偶](launch-api.md) — `launch` 四象限语义与扩展点


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [cloakbrowser/__init__.py](../../../project-repos/cloakbrowser/cloakbrowser/__init__.py)
- [cloakbrowser/browser.py](../../../project-repos/cloakbrowser/cloakbrowser/browser.py)
- [cloakbrowser/config.py](../../../project-repos/cloakbrowser/cloakbrowser/config.py)
- [cloakbrowser/download.py](../../../project-repos/cloakbrowser/cloakbrowser/download.py)
- [js/src/index.ts](../../../project-repos/cloakbrowser/js/src/index.ts)
- [js/src/playwright.ts](../../../project-repos/cloakbrowser/js/src/playwright.ts)
- [bin/cloakserve](../../../project-repos/cloakbrowser/bin/cloakserve)

</details>

# 系统架构

CloakBrowser 的核心架构是一个**三明治**:上层是两份 wrapper(Python 与 JS),中间是一份打了源码补丁的 Chromium 二进制,下层是用于多路复用与服务化的 `cloakserve`。这一层结构看似简单,但每一层都承担一项不可分割的责任——把责任放错层,就会暴露反检测信号。

举一个具体的例子:Playwright 自身可以通过 `context.timezone_id` 给 BrowserContext 设时区,机制是 CDP `Emulation.setTimezoneOverride`——但 CDP emulation 本身可以被 fingerprinter 检测到。CloakBrowser 把这件事下沉到二进制,通过 `--fingerprint-timezone` flag(读 CommandLine,进程级生效);wrapper 层为此必须显式拦截用户的 `timezone` 参数,翻译成 binary flag,而不是透传给 Playwright。这种"上层不能信任下层默认行为"的关系,贯穿整个架构。

## 三层职责图

```mermaid
flowchart TD
    subgraph User["用户代码层"]
        UPY["Python:from cloakbrowser import launch"]
        UJS["Node:import ❴ launch ❵ from 'cloakbrowser'"]
    end

    subgraph Wrapper["Wrapper 层 (协调反检测策略)"]
        BROW["browser.py / playwright.ts<br/>launch 四象限"]
        CONF["config.py / config.ts<br/>平台 + 默认 stealth args"]
        ARGS["build_args / buildArgs<br/>去重 + 覆盖优先级"]
        PROXY["proxy 解析<br/>HTTP / SOCKS5 分流"]
        GEO["geoip.py / geoip.ts<br/>exit IP + 时区 + locale"]
        HUM["human/<br/>拟人化行为补丁"]
        DL["download.py / download.ts<br/>二进制生命周期"]
    end

    subgraph Binary["二进制层 (打了补丁的 Chromium)"]
        CHROM["Chromium binary<br/>49-57 个 C++ patch"]
    end

    subgraph Serve["服务化层 (可选)"]
        SERVE["cloakserve<br/>CDP 多路复用器"]
    end

    UPY --> BROW
    UJS --> BROW
    BROW --> CONF
    BROW --> ARGS
    BROW --> PROXY
    BROW --> GEO
    BROW --> HUM
    BROW --> DL
    DL -.下载 + 校验.-> CHROM
    ARGS --> CHROM
    PROXY --> CHROM
    GEO --> CHROM
    HUM -.通过 CDP 打补丁.-> CHROM
    SERVE --> CHROM
    UPY -.可选 connect_over_cdp.-> SERVE
```

这张图揭示了关键的设计选择:**所有的反检测决策都在 wrapper 层做完,落到 binary 时只剩一条命令行**。下文逐层拆解每一层的责任边界。

## Wrapper 层:协调反检测策略

Python 的公共入口在 [`cloakbrowser/__init__.py`](../../../project-repos/cloakbrowser/cloakbrowser/__init__.py),它把 `launch`、`launch_async`、`launch_context`、`launch_context_async`、`launch_persistent_context`、`launch_persistent_context_async` 这 6 个对偶函数,加上 `ensure_binary`、`build_args`、`maybe_resolve_geoip`、`HumanConfig` 等工具,统一暴露给用户。`HumanConfig` 与 `resolve_human_config` 用了 `__getattr__` 惰性导入——只有用户真的访问到 `humanize` 相关 API 时,`human/` 子包才会被加载,避免给不需要拟人化的用户带来导入开销。

Sources: [cloakbrowser/__init__.py:14-50](../../../project-repos/cloakbrowser/cloakbrowser/__init__.py#L14-L50)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/__init__.py:14-50`

```python
from .browser import launch, launch_async, launch_context, launch_context_async, launch_persistent_context, launch_persistent_context_async, ProxySettings, build_args, maybe_resolve_geoip
from .config import CHROMIUM_VERSION, get_default_stealth_args
from .download import binary_info, check_for_update, clear_cache, ensure_binary
from ._version import __version__

# Human-like behavioral layer (optional)
def __getattr__(name):
    if name == "HumanConfig":
        from .human.config import HumanConfig
        globals()["HumanConfig"] = HumanConfig
        return HumanConfig
    if name == "resolve_human_config":
        from .human.config import resolve_config
        globals()["resolve_human_config"] = resolve_config
        return resolve_config
    raise AttributeError(f"module 'cloakbrowser' has no attribute {name}")

__all__ = [
    "launch",
    "launch_async",
    "launch_context",
    "launch_context_async",
    "launch_persistent_context",
    "launch_persistent_context_async",
    "ensure_binary",
    "clear_cache",
    "binary_info",
    "check_for_update",
    "CHROMIUM_VERSION",
    "get_default_stealth_args",
    "build_args",
    "maybe_resolve_geoip",
    "ProxySettings",
    "HumanConfig",
    "resolve_human_config",
    "__version__",
]
```

<!-- source-snippets:end -->
</details>

JS 端的入口 [`js/src/index.ts`](../../../project-repos/cloakbrowser/js/src/index.ts) 选择了不同策略——直接把 `launch`、`launchContext`、`launchPersistentContext` 从 `./playwright.js` re-export,Puppeteer 入口则通过 package.json 的 `exports` 字段映射到 `./dist/puppeteer.js`。Python 是单一公共模块,JS 是子路径导入(`cloakbrowser` vs `cloakbrowser/puppeteer`),两边的分发哲学不同但结果一致:用户用最熟悉的 import 就能获得对应后端的 stealth 替代。

Sources: [js/src/index.ts:18-29](../../../project-repos/cloakbrowser/js/src/index.ts#L18-L29)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/index.ts:18-29`

```typescript
// Launch functions (Playwright API)
export { launch, launchContext, launchPersistentContext } from "./playwright.js";

// Binary management
export { ensureBinary, clearCache, binaryInfo, checkForUpdate } from "./download.js";

// Config
export { CHROMIUM_VERSION, getDefaultStealthArgs } from "./config.js";

// Types
export type { LaunchOptions, LaunchContextOptions, LaunchPersistentContextOptions, BinaryInfo } from "./types.js";
```

<!-- source-snippets:end -->
</details>

### launch() 内部的执行序列

`launch()` 是理解整个 wrapper 的最佳切入点。看 Python 版的核心 25 行:

```python
sync_playwright = _import_sync_playwright(_resolve_backend(backend))
binary_path = ensure_binary()
timezone, locale, exit_ip = maybe_resolve_geoip(geoip, proxy, timezone, locale)
proxy_kwargs, proxy_extra_args = _resolve_proxy_config(proxy)
args = _resolve_webrtc_args(args, proxy)
if exit_ip and not (args and any(a.startswith("--fingerprint-webrtc-ip") for a in args)):
    args = list(args or [])
    args.append(f"--fingerprint-webrtc-ip={exit_ip}")
chrome_args = build_args(stealth_args, (args or []) + proxy_extra_args, timezone=timezone, locale=locale, headless=headless)

pw = sync_playwright().start()
browser = pw.chromium.launch(
    executable_path=binary_path,
    headless=headless,
    args=chrome_args,
    ignore_default_args=IGNORE_DEFAULT_ARGS,
    **proxy_kwargs,
    **kwargs,
)
```

Sources: [cloakbrowser/browser.py:106-127](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L106-L127)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:106-127`

```python
    sync_playwright = _import_sync_playwright(_resolve_backend(backend))

    binary_path = ensure_binary()
    timezone, locale, exit_ip = maybe_resolve_geoip(geoip, proxy, timezone, locale)
    proxy_kwargs, proxy_extra_args = _resolve_proxy_config(proxy)
    args = _resolve_webrtc_args(args, proxy)
    if exit_ip and not (args and any(a.startswith("--fingerprint-webrtc-ip") for a in args)):
        args = list(args or [])
        args.append(f"--fingerprint-webrtc-ip={exit_ip}")
    chrome_args = build_args(stealth_args, (args or []) + proxy_extra_args, timezone=timezone, locale=locale, headless=headless)

    logger.debug("Launching stealth Chromium (headless=%s, args=%d)", headless, len(chrome_args))

    pw = sync_playwright().start()
    browser = pw.chromium.launch(
        executable_path=binary_path,
        headless=headless,
        args=chrome_args,
        ignore_default_args=IGNORE_DEFAULT_ARGS,
        **proxy_kwargs,
        **kwargs,
    )
```

<!-- source-snippets:end -->
</details>

```mermaid
sequenceDiagram
    participant U as 用户代码
    participant L as launch("")
    participant DL as ensure_binary("")
    participant G as maybe_resolve_geoip("")
    participant P as _resolve_proxy_config("")
    participant A as build_args("")
    participant PW as Playwright
    participant B as Chromium binary

    U->>L: launch("proxy, geoip=True, humanize=True")
    L->>L: _resolve_backend(backend) — playwright vs patchright
    L->>DL: ensure_binary("")
    DL-->>L: 返回 binary path
    L->>G: 通过代理解析 timezone/locale/exit_ip
    G-->>L: (tz, locale, exit_ip)
    L->>P: 拆分 HTTP vs SOCKS5
    P-->>L: (proxy_kwargs, proxy_extra_args)
    L->>L: 注入 --fingerprint-webrtc-ip=exit_ip
    L->>A: 合并 stealth 默认 + 用户 + tz/locale 标志
    A-->>L: 最终 args 列表
    L->>PW: chromium.launch("executable_path, args, ignore_default_args")
    PW->>B: 启动进程
    B-->>PW: BrowserContext
    PW-->>L: Browser
    L->>L: 给 close("") 打 cleanup patch
    L->>L: 如果 humanize=True 则 patch_browser("")
    L-->>U: 返回 Browser
```

序列里有两个不显眼但关键的步骤。第一个是给 `browser.close` 包了一层 cleanup:`pw.stop()` 必须被调用,否则 Playwright 后台进程会泄漏。第二个是 `ignore_default_args=IGNORE_DEFAULT_ARGS`——这个常量在 [`config.py`](../../../project-repos/cloakbrowser/cloakbrowser/config.py) 中是 `["--enable-automation", "--enable-unsafe-swiftshader"]`——Playwright 默认会加这两个,前者直接让 `navigator.webdriver=true`,后者强制 SwiftShader 软渲染 WebGL 留下可识别 renderer 字符串。屏蔽掉这两个,再加上 binary 自己的补丁,才能让"我是真 Chrome"的伪装闭环。

Sources: [cloakbrowser/browser.py:128-138](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L128-L138), [cloakbrowser/config.py:28-34](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L28-L34)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:128-138`

```python

    # Patch close() to also stop the Playwright instance
    _original_close = browser.close

    def _close_with_cleanup() -> None:
        try:
            _original_close()
        finally:
            pw.stop()

    browser.close = _close_with_cleanup
```

#### `cloakbrowser/config.py:28-34`

```python
# ---------------------------------------------------------------------------
# Playwright default args to suppress — these leak automation signals.
# --enable-automation: exposes navigator.webdriver = true
# --enable-unsafe-swiftshader: forces software WebGL rendering via SwiftShader,
#   producing a distinctive renderer string that no real user browser has
# ---------------------------------------------------------------------------
IGNORE_DEFAULT_ARGS = ["--enable-automation", "--enable-unsafe-swiftshader"]
```

<!-- source-snippets:end -->
</details>

## 二进制层:被 wrapper 严格约束的输入接口

Chromium 二进制的"接口"不是函数调用,而是命令行 flag。对 wrapper 而言,可以理解为一个超大的"参数对象",而 `build_args()` 就是把多个来源的参数合并成最终参数对象的函数。

`build_args` 实现了三个不显然的合约:

**合约 1:用 flag key 去重**。`--fingerprint=12345` 与 `--fingerprint=99999` 的 key 都是 `--fingerprint`,后者覆盖前者。用 `seen: dict[str, str]` 以 `arg.split("=", 1)[0]` 为键存储,而不是简单地 list extend。

**合约 2:优先级是 stealth 默认 < 用户 args < 专用参数(timezone/locale)**。stealth 默认先填,用户 args 覆盖,然后 wrapper 的 `timezone=` `locale=` 参数最后强制覆盖。这意味着如果用户写 `args=["--fingerprint-timezone=Foo"]` 同时又写 `timezone="America/New_York"`,后者赢。

**合约 3:headed 模式 + Windows 自动注入 `--ignore-gpu-blocklist`**。Chromium 的 GPU blocklist 会在 headed Docker/Xvfb 环境下阻断 WebGL,在 Windows 上则阻断 Basic Render Driver 的 WebGPU——这两个场景下必须让 SwiftShader 服务 WebGL,blocklist 必须被绕过。

Sources: [cloakbrowser/browser.py:954-1003](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L954-L1003)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:954-1003`

```python
def build_args(
    stealth_args: bool,
    extra_args: list[str] | None,
    timezone: str | None = None,
    locale: str | None = None,
    headless: bool = True,
) -> list[str]:
    """Combine stealth args with user-provided args and locale flags.

    Deduplicates by flag key (everything before '=').
    Priority: stealth defaults < user args < dedicated params (timezone/locale).
    """
    seen: dict[str, str] = {}

    if stealth_args:
        for arg in get_default_stealth_args():
            seen[arg.split("=", 1)[0]] = arg

    # GPU blocklist bypass:
    # - Headed mode (all platforms): Chromium blocks WebGL on software GPUs
    #   in Docker/Xvfb. Flag lets SwiftShader serve WebGL. See issue #56.
    # - Windows (all modes): Chromium's GPU blocklist blocks WebGPU for the
    #   Microsoft Basic Render Driver. Dawn's adapter_blocklist bypass alone
    #   isn't enough — need this flag too. Linux doesn't need it.
    import platform as _platform
    if not headless or _platform.system() == "Windows":
        seen["--ignore-gpu-blocklist"] = "--ignore-gpu-blocklist"

    if extra_args:
        for arg in extra_args:
            key = arg.split("=", 1)[0]
            if key in seen:
                logger.debug("Arg override: %s -> %s", seen[key], arg)
            seen[key] = arg

    # Timezone/locale flags are independent of stealth_args — always inject when set
    if timezone:
        key = "--fingerprint-timezone"
        flag = f"{key}={timezone}"
        if key in seen:
            logger.debug("Arg override: %s -> %s", seen[key], flag)
        seen[key] = flag
    if locale:
        for key in ("--lang", "--fingerprint-locale"):
            flag = f"{key}={locale}"
            if key in seen:
                logger.debug("Arg override: %s -> %s", seen[key], flag)
            seen[key] = flag

    return list(seen.values())
```

<!-- source-snippets:end -->
</details>

## cloakserve 层:服务化与多路复用

[`bin/cloakserve`](../../../project-repos/cloakbrowser/bin/cloakserve) 是一个独立的 aiohttp 服务器,把"如何启动 Chromium"这件事从客户端进程剥离出来。它的核心数据结构是 `ChromePool`,维护着一个 `seed -> ChromeProcess` 的字典:每个不同的 `fingerprint` seed 对应一个独立的 Chrome 子进程,各有自己的 CDP 端口与 user data dir;请求带 `?fingerprint=12345&timezone=America/New_York&locale=en-US&proxy=...&geoip=true` 的查询串,服务端拉起或复用一个匹配的 Chrome。

```mermaid
flowchart LR
    subgraph Clients["客户端"]
        C1["Playwright A<br/>connect_over_cdp ?fp=A1"]
        C2["Playwright B<br/>connect_over_cdp ?fp=B2"]
        C3["Playwright C<br/>connect_over_cdp ?fp=A1"]
    end

    subgraph Server["cloakserve(:9222)"]
        H["HTTP handlers<br/>/json/version /json/list"]
        WS["WS proxy<br/>/fingerprint/❴seed❵/devtools/*"]
        POOL["ChromePool<br/>seed → ChromeProcess"]
    end

    subgraph Chrome["Chromium 进程池"]
        CR1["Chrome seed=A1<br/>CDP 5100"]
        CR2["Chrome seed=B2<br/>CDP 5101"]
    end

    C1 --> H
    C2 --> H
    C3 --> H
    H --> POOL
    WS --> POOL
    POOL --> CR1
    POOL --> CR2
    C1 -.WebSocket.-> WS
    C2 -.WebSocket.-> WS
    C3 -.WebSocket.-> WS
```

注意上图中 `C1` 与 `C3` 复用同一个 `seed=A1` 的 Chrome 实例——`cloakserve` 的连接计数 `_connections[seed_key]` 帮助跟踪 Chrome 的引用,实现"首次连接拉起、最后断开清理"的语义。这一层放大了 wrapper 的能力,但不替代它——客户端依然可以直接用本地 wrapper。

Sources: [bin/cloakserve:88-150](../../../project-repos/cloakbrowser/bin/cloakserve#L88-L150)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:88-150`

```
class ChromePool:
    def __init__(
        self,
        binary: str,
        global_args: list[str],
        headless: bool,
        data_dir: str = "/tmp/cloakserve",
        default_seed: str | None = None,
        default_locale: str | None = None,
        default_timezone: str | None = None,
    ):
        self._binary = binary
        self._global_args = global_args
        self._headless = headless
        self._data_dir = data_dir
        self._default_seed = default_seed
        self._default_locale = default_locale
        self._default_timezone = default_timezone
        self._processes: dict[str, ChromeProcess] = {}
        self._default: ChromeProcess | None = None
        self._locks: dict[str, asyncio.Lock] = {}
        self._next_port = BASE_CDP_PORT
        # Connection refcounting for status reporting
        self._connections: dict[str, int] = {}

    def _get_lock(self, seed: str) -> asyncio.Lock:
        if seed not in self._locks:
            self._locks[seed] = asyncio.Lock()
        return self._locks[seed]

    def _safe_rmtree(self, path: str) -> None:
        resolved = Path(path).resolve()
        data_resolved = Path(self._data_dir).resolve()
        if resolved == data_resolved or not resolved.is_relative_to(data_resolved):
            logger.error("Refusing to delete path outside data_dir: %s", resolved)
            return
        shutil.rmtree(path, True)

    def _allocate_port(self) -> int:
        """Find a free port starting from _next_port."""
        for _ in range(100):
            port = self._next_port
            self._next_port += 1
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
        raise RuntimeError("No free ports available for Chrome CDP")

    def connect(self, seed_key: str) -> None:
        """Increment connection refcount for a seed."""
        self._connections[seed_key] = self._connections.get(seed_key, 0) + 1

    def disconnect(self, seed_key: str) -> None:
        """Decrement connection refcount for a seed."""
        count = self._connections.get(seed_key, 0) - 1
        if count <= 0:
            self._connections.pop(seed_key, None)
        else:
            self._connections[seed_key] = count

```

<!-- source-snippets:end -->
</details>

## 跨语言对偶的实现细节

Python 端 `cloakbrowser/` 和 JS 端 `js/src/` 不是简单的 API 复制——某些差异是平台特性强制的:

| 关注点 | Python 实现 | JS 实现 | 差异原因 |
|---|---|---|---|
| 异步函数 | 显式 `launch_async` | `launch` 本身就是 async | JS 没有 sync API |
| 路径分隔 | `pathlib.Path` | `node:path` | OS 抽象 |
| 平台 tag | `Linux x86_64 → linux-x64` | `process.platform + arch` | 系统信息接口不同 |
| 二进制可执行权限 | `os.chmod(..., S_IXUSR\|...)` | 提取 zip 时保留权限 | 平台 API |
| Puppeteer 适配 | 不支持 | `js/src/puppeteer.ts`:HTTP 代理需 `page.authenticate()` | Puppeteer 设计差异 |
| 拟人化 CDP 反检测 | `new_cdp_session` + Isolated World | 同 | 协议层一致 |

最有趣的差异在 Puppeteer 端:Puppeteer 不支持 inline 凭证的 HTTP 代理(只支持 `--proxy-server=host:port` + `page.authenticate({username, password})`),所以 `js/src/puppeteer.ts` 需要 monkey-patch `browser.newPage`,每次 newPage 后自动调用 `page.authenticate(auth)`。Playwright 没有这个限制,所以 `js/src/playwright.ts` 直接把 proxy dict 传给 `chromium.launch`。

Sources: [js/src/puppeteer.ts:43-88](../../../project-repos/cloakbrowser/js/src/puppeteer.ts#L43-L88)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/puppeteer.ts:43-88`

```typescript
  // HTTP: Chrome does NOT support inline credentials — strip them and
  // use page.authenticate() for Proxy-Authorization headers instead.
  let proxyAuth: { username: string; password: string } | undefined;
  if (options.proxy) {
    if (isSocksProxy(options.proxy)) {
      // SOCKS5: pass full URL with credentials to Chrome directly
      const { proxyArgs } = resolveProxyConfig(options.proxy);
      args.push(...proxyArgs);
    } else if (typeof options.proxy === "string") {
      const { server, username, password } = parseProxyUrl(options.proxy);
      args.push(`--proxy-server=${server}`);
      if (username) {
        proxyAuth = { username, password: password ?? "" };
      }
    } else {
      const parsed = parseProxyUrl(options.proxy.server);
      args.push(`--proxy-server=${parsed.server}`);
      if (options.proxy.bypass) {
        args.push(`--proxy-bypass-list=${options.proxy.bypass}`);
      }
      const username = options.proxy.username ?? parsed.username;
      const password = options.proxy.password ?? parsed.password;
      if (username) {
        proxyAuth = { username, password: password ?? "" };
      }
    }
  }

  const browser = await puppeteer.default.launch({
    executablePath: binaryPath,
    headless: options.headless ?? true,
    args,
    ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    ...options.launchOptions,
  });

  // Monkey-patch newPage() to auto-authenticate proxy credentials
  if (proxyAuth) {
    const origNewPage = browser.newPage.bind(browser);
    const auth = proxyAuth;
    browser.newPage = async (...pageArgs: Parameters<typeof origNewPage>) => {
      const page = await origNewPage(...pageArgs);
      await page.authenticate(auth);
      return page;
    };
  }
```

<!-- source-snippets:end -->
</details>

## 后端选择:Playwright vs Patchright

`launch()` 接受 `backend="playwright"` 或 `backend="patchright"` 参数(也可以用环境变量 `CLOAKBROWSER_BACKEND` 设置)。`patchright` 是 Playwright 的另一个 stealth fork,它在 CDP 层做了 stealth 处理。

从 0.3.9 起,**默认后端从 patchright 改回了 playwright**。原因写在 CHANGELOG 里:`patchright` 破坏了 proxy auth 与 `add_init_script`(#27),而由于 CloakBrowser 在 binary 层级处理 stealth,patchright 的 CDP 层 stealth 是冗余的。`backend="patchright"` 留作可选——在某些 reCAPTCHA v3 Enterprise 场景,CDP 层的额外抑制能再降低被检测概率。

Sources: [cloakbrowser/browser.py:718-751](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L718-L751), [CHANGELOG.md:170](../../../project-repos/cloakbrowser/CHANGELOG.md:170)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:718-751`

```python
def _resolve_backend(backend: str | None) -> str:
    """Resolve backend: param > env var > default ('playwright')."""
    b = backend or os.environ.get("CLOAKBROWSER_BACKEND", "playwright")
    if b not in ("playwright", "patchright"):
        raise ValueError(f"Unknown backend '{b}'. Use 'playwright' or 'patchright'.")
    return b


def _import_sync_playwright(backend: str):
    """Import sync_playwright from the resolved backend."""
    if backend == "patchright":
        try:
            from patchright.sync_api import sync_playwright
        except ModuleNotFoundError:
            raise ModuleNotFoundError(
                "patchright is not installed. Install it with: pip install cloakbrowser[patchright]"
            ) from None
        return sync_playwright
    from playwright.sync_api import sync_playwright
    return sync_playwright


def _import_async_playwright(backend: str):
    """Import async_playwright from the resolved backend."""
    if backend == "patchright":
        try:
            from patchright.async_api import async_playwright
        except ModuleNotFoundError:
            raise ModuleNotFoundError(
                "patchright is not installed. Install it with: pip install cloakbrowser[patchright]"
            ) from None
        return async_playwright
    from playwright.async_api import async_playwright
    return async_playwright
```

#### `CHANGELOG.md:170`

> 未找到引用文件：`CHANGELOG.md:170`

<!-- source-snippets:end -->
</details>

## 关键设计决策回顾

一个工程项目的真正"架构"不在文件层级,而在那些"如果不知道就会犯错"的隐藏约束:

1. **timezone/locale 必须走 binary flag**——任何走 Playwright `context.timezone_id` 或 `context.locale` 的实现都会被 CDP detection 抓到。`launch_persistent_context` 与 `launch_context` 在内部主动拦截这两个参数,显式翻译成 `--fingerprint-timezone=...` 与 `--lang=...`,并在 JS 端通过 `filterStealthCtxOptions` 警告并丢弃用户在 `contextOptions` 里写的 `locale`/`timezoneId`
2. **SOCKS5 必须绕过 Playwright**——Playwright 的 proxy dict 拒绝 SOCKS5 + 凭证,所以 SOCKS5 走 `--proxy-server=` Chrome arg,详见 [代理、GeoIP 与 WebRTC 一致性](proxy-and-geoip.md)
3. **`pw.stop()` 必须在 close 时调用**——否则 Playwright 子进程泄漏,在 Lambda/容器场景表现为内存爬升
4. **GeoIP 在 `launch` 与 `launch_context` 都要主动解析,但只在外层一次**——`launch_context` 内部传 `geoip=False` 给嵌套的 `launch`,避免双倍 HTTP 调用
5. **`--fingerprint-webrtc-ip=auto` 在 wrapper 层就要替换为真实 IP**——传给 Chrome 之前 wrapper 必须解析,因为 Chrome 不认识 `auto`
6. **macOS 与其他平台的指纹策略不同**——`get_default_stealth_args()` 在 macOS 上设 `--fingerprint-platform=macos`,让 Mac binary 报告为原生 Mac 浏览器;Linux/Windows 上则报告为 Windows desktop(更通用的指纹)

Sources: [cloakbrowser/config.py:40-61](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L40-L61)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/config.py:40-61`

```python
def get_default_stealth_args() -> list[str]:
    """Build stealth args with a random fingerprint seed per launch.

    On macOS, skips platform/GPU spoofing — runs as a native Mac browser.
    Spoofing Windows on Mac creates detectable mismatches (fonts, GPU, etc.).
    """
    seed = random.randint(10000, 99999)
    system = platform.system()

    base = [
        "--no-sandbox",
        f"--fingerprint={seed}",
    ]

    if system == "Darwin":
        # Tell the fingerprint patches we're on macOS so GPU/UA match natively
        return base + ["--fingerprint-platform=macos"]

    # Linux/Windows: Windows fingerprint profile
    # Hardware concurrency, device memory, screen, window size, and GPU are
    # auto-generated by the binary from the seed (v14+).
    return base + ["--fingerprint-platform=windows"]
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [隐身引擎与指纹系统](stealth-engine.md) — `build_args` 与 fingerprint flag 体系的深入
- [启动 API:四象限对偶](launch-api.md) — 6 个对偶函数的具体语义
- [Python 与 JS 双 SDK 对偶](python-vs-js-sdk.md) — 跨语言映射与差异
- [cloakserve CDP 多路复用器](cloakserve-cdp-multiplexer.md) — 服务化层的内部机制


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [cloakbrowser/config.py](../../../project-repos/cloakbrowser/cloakbrowser/config.py)
- [cloakbrowser/browser.py](../../../project-repos/cloakbrowser/cloakbrowser/browser.py)
- [js/src/config.ts](../../../project-repos/cloakbrowser/js/src/config.ts)
- [js/src/args.ts](../../../project-repos/cloakbrowser/js/src/args.ts)
- [README.md](../../../project-repos/cloakbrowser/README.md)
- [CHANGELOG.md](../../../project-repos/cloakbrowser/CHANGELOG.md)

</details>

# 隐身引擎与指纹系统

主流反检测工具的核心问题是把 stealth 当成了一组"补丁脚本"。CloakBrowser 把它当成了一组**编译期决策**。最直接的证据是 [`config.py:get_default_stealth_args()`](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L40-L61) 的体积:**一共只有 22 行,默认 args 列表里只有 3 个 flag**——`--no-sandbox`、`--fingerprint=<随机种子>`、`--fingerprint-platform=<macos|windows>`。

这是反直觉的:其他 stealth 工具会塞几十个 flag、注入上千行 JS。CloakBrowser 默认就这三个。**为什么够?** 因为 `navigator.webdriver`、canvas 噪声、WebGL renderer 串、屏幕属性、硬件并发数、设备内存、UA、字体枚举、GPU vendor……这些字段都在 Chromium 源码里被改写了。wrapper 只负责告诉 binary"该用哪个 seed、伪装成哪个平台",剩下的由编译进去的 49→57 个 C++ patch 在运行时完成。

## 三种参与方:不能弄混的责任

理解这层架构的关键,是分清三种参与方:**Chromium 上游代码**、**CloakBrowser 的 C++ patch**、**wrapper 的命令行 flag**。

|参与方|角色|示例|
|---|---|---|
|**Chromium 上游**| 浏览器主体行为 | navigator.webdriver 的赋值逻辑、Canvas 2D 渲染 |
|**CloakBrowser C++ patch**| 拦截、改写、随机化上游行为 | 强制 `navigator.webdriver=false`、给 canvas 加确定性噪声 |
|**wrapper flag**| 给 patch 传参数 | `--fingerprint=12345` 决定噪声的种子 |

补丁是编译进 binary 的逻辑,flag 是运行期给逻辑传参。这意味着**没有 flag 的纯 binary 已经是 stealth 的**——0.3.4 起,binary 在启动时如果没收到 `--fingerprint`,会自己生成一个随机 seed。wrapper 只是把这个机制做得更显式、可重复。

Sources: [CHANGELOG.md:195-201](../../../project-repos/cloakbrowser/CHANGELOG.md#L195-L201)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CHANGELOG.md:195-201`

```markdown
Binary v14: auto-spoof restored with seed, wrapper simplified to match.

- **[binary]** Restore full auto-spoof when `--fingerprint=seed` is set — all randomized properties now derive from the seed consistently
- **[binary]** Auto-inject random fingerprint seed at startup if none provided. Binary is stealthy with zero flags
- **[binary]** 26 source-level C++ patches (up from 25)
- **[wrapper]** Simplify default stealth args — remove flags the binary now auto-generates. Wrapper still sets platform profile on Linux and `--no-sandbox`
- **[wrapper]** Fix timezone in `launch_context()` — use Playwright's per-context timezone instead of binary flag, fixing mismatch when creating new browser contexts with geoip
```

<!-- source-snippets:end -->
</details>

```mermaid
flowchart TD
    USER["wrapper: launch(stealth_args=True, args=...)"]
    DEFAULT["get_default_stealth_args()<br/>三个默认 flag"]
    USER_ARGS["用户传入 args=❲❳<br/>专用参数: timezone/locale"]
    MERGE["build_args()<br/>按 key 去重 + 优先级"]
    BIN["Chromium binary<br/>49-57 C++ patch<br/>读取 CommandLine"]
    OUT["实际行为:<br/>navigator.webdriver=false<br/>canvas 噪声 (seed)<br/>UA = Chrome/146.0.0.0<br/>……"]

    DEFAULT --> MERGE
    USER_ARGS --> MERGE
    USER --> MERGE
    MERGE --> BIN
    BIN --> OUT
```

下文按"默认 args"、"build_args 合并逻辑"、"完整 fingerprint flag 体系"三个角度展开。

## 默认 stealth args:一个种子定终身

`get_default_stealth_args()` 的实现非常克制:

```python
def get_default_stealth_args() -> list[str]:
    seed = random.randint(10000, 99999)
    system = platform.system()

    base = [
        "--no-sandbox",
        f"--fingerprint={seed}",
    ]

    if system == "Darwin":
        return base + ["--fingerprint-platform=macos"]
    return base + ["--fingerprint-platform=windows"]
```

Sources: [cloakbrowser/config.py:40-61](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L40-L61)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/config.py:40-61`

```python
def get_default_stealth_args() -> list[str]:
    """Build stealth args with a random fingerprint seed per launch.

    On macOS, skips platform/GPU spoofing — runs as a native Mac browser.
    Spoofing Windows on Mac creates detectable mismatches (fonts, GPU, etc.).
    """
    seed = random.randint(10000, 99999)
    system = platform.system()

    base = [
        "--no-sandbox",
        f"--fingerprint={seed}",
    ]

    if system == "Darwin":
        # Tell the fingerprint patches we're on macOS so GPU/UA match natively
        return base + ["--fingerprint-platform=macos"]

    # Linux/Windows: Windows fingerprint profile
    # Hardware concurrency, device memory, screen, window size, and GPU are
    # auto-generated by the binary from the seed (v14+).
    return base + ["--fingerprint-platform=windows"]
```

<!-- source-snippets:end -->
</details>

三件事:**随机化、平台决策、容器兼容**。

**随机化**:每次 `launch()` 都生成一个新的 5 位 seed。同一个 seed 决定了 canvas 噪声、WebGL 厂商、硬件并发、设备内存、屏幕尺寸、GPU 型号——这些值在 binary v14 起完全由 seed 派生。这意味着两个 launch 一定看上去像两台不同的电脑;同样,固定 seed(`args=["--fingerprint=12345"]`)就能让两次会话像同一台电脑——这对 reCAPTCHA v3 这类基于"返回访客"判断的评分系统是关键能力。

**平台决策**:macOS 下不伪装平台,因为 Mac binary 本身就报告 macOS,加上原生 Apple GPU——伪装成 Windows 反而暴露 GPU 与 OS 不匹配。Linux 与 Windows 一律伪装成 Windows desktop,因为这是最常见的客户端环境,匿名度最高。

**`--no-sandbox`**:Docker、CI、Lambda 等环境里 Chromium 默认无法启动(没有合适的 user namespace),`--no-sandbox` 是这些场景的必需品。它确实降低浏览器进程隔离强度,但对 stealth 没有副作用。

### JS 端镜像实现

JS 端的 `getDefaultStealthArgs()` 在 [`js/src/config.ts`](../../../project-repos/cloakbrowser/js/src/config.ts#L208-L226) 与 Python 完全等价。两者通过 CHANGELOG 中明确的"双 SDK 同步"原则维持一致——一次改动,两边都要改。

Sources: [js/src/config.ts:208-226](../../../project-repos/cloakbrowser/js/src/config.ts#L208-L226)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/config.ts:208-226`

```typescript
export function getDefaultStealthArgs(): string[] {
  const seed = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
  const isMac = process.platform === "darwin";

  const base = [
    "--no-sandbox",
    `--fingerprint=${seed}`,
  ];

  if (isMac) {
    // macOS: run as native Mac browser — GPU/UA match natively
    return [...base, "--fingerprint-platform=macos"];
  }

  // Linux/Windows: spoof as Windows desktop
  // Hardware concurrency, device memory, screen, window size, and GPU are
  // auto-generated by the binary from the seed (v14+).
  return [...base, "--fingerprint-platform=windows"];
}
```

<!-- source-snippets:end -->
</details>

## build_args:三层优先级与去重

`build_args()` 是 stealth 引擎中最容易被低估的函数。它处理"用户传入 args 与 stealth 默认 args 重叠时怎么办"这一棘手问题。

### 优先级:stealth 默认 < 用户 args < 专用参数

```python
def build_args(stealth_args, extra_args, timezone, locale, headless) -> list[str]:
    seen: dict[str, str] = {}

    if stealth_args:
        for arg in get_default_stealth_args():
            seen[arg.split("=", 1)[0]] = arg

    if not headless or platform.system() == "Windows":
        seen["--ignore-gpu-blocklist"] = "--ignore-gpu-blocklist"

    if extra_args:
        for arg in extra_args:
            key = arg.split("=", 1)[0]
            seen[key] = arg

    if timezone:
        seen["--fingerprint-timezone"] = f"--fingerprint-timezone={timezone}"
    if locale:
        for key in ("--lang", "--fingerprint-locale"):
            seen[key] = f"{key}={locale}"

    return list(seen.values())
```

Sources: [cloakbrowser/browser.py:954-1003](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L954-L1003)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:954-1003`

```python
def build_args(
    stealth_args: bool,
    extra_args: list[str] | None,
    timezone: str | None = None,
    locale: str | None = None,
    headless: bool = True,
) -> list[str]:
    """Combine stealth args with user-provided args and locale flags.

    Deduplicates by flag key (everything before '=').
    Priority: stealth defaults < user args < dedicated params (timezone/locale).
    """
    seen: dict[str, str] = {}

    if stealth_args:
        for arg in get_default_stealth_args():
            seen[arg.split("=", 1)[0]] = arg

    # GPU blocklist bypass:
    # - Headed mode (all platforms): Chromium blocks WebGL on software GPUs
    #   in Docker/Xvfb. Flag lets SwiftShader serve WebGL. See issue #56.
    # - Windows (all modes): Chromium's GPU blocklist blocks WebGPU for the
    #   Microsoft Basic Render Driver. Dawn's adapter_blocklist bypass alone
    #   isn't enough — need this flag too. Linux doesn't need it.
    import platform as _platform
    if not headless or _platform.system() == "Windows":
        seen["--ignore-gpu-blocklist"] = "--ignore-gpu-blocklist"

    if extra_args:
        for arg in extra_args:
            key = arg.split("=", 1)[0]
            if key in seen:
                logger.debug("Arg override: %s -> %s", seen[key], arg)
            seen[key] = arg

    # Timezone/locale flags are independent of stealth_args — always inject when set
    if timezone:
        key = "--fingerprint-timezone"
        flag = f"{key}={timezone}"
        if key in seen:
            logger.debug("Arg override: %s -> %s", seen[key], flag)
        seen[key] = flag
    if locale:
        for key in ("--lang", "--fingerprint-locale"):
            flag = f"{key}={locale}"
            if key in seen:
                logger.debug("Arg override: %s -> %s", seen[key], flag)
            seen[key] = flag

    return list(seen.values())
```

<!-- source-snippets:end -->
</details>

合约非常清晰:

|来源|何时填入|是否会被后续覆盖|
|---|---|---|
|stealth 默认|`stealth_args=True`(默认)|是,被用户 args 与专用参数覆盖|
|`--ignore-gpu-blocklist`|headed 或 Windows 自动注入|是|
|用户 `extra_args`|无条件填入|是,被专用参数覆盖|
|`timezone` 参数|`timezone is not None` 时|否,最高优先级|
|`locale` 参数|`locale is not None` 时,同时设两个 key|否|

### 为什么 locale 要设两个 flag

注意 `locale` 一次性设 `--lang=...` **和** `--fingerprint-locale=...` 两个 flag。这背后是一个隐含的反检测规则:

- `--lang` 是 Chromium 上游的 flag,影响 `navigator.language` 与 HTTP `Accept-Language` 头
- `--fingerprint-locale` 是 CloakBrowser patch 的 flag,影响进一步的 locale 相关字段(Intl API、ICU 行为等)

两个 flag 同时设,才能让"我说自己是 en-US"在多个 vector 上一致。任何一边漏设,fingerprinter 都会看到不一致——例如 `navigator.language === "en-US"` 但 ICU date format 仍是 zh-CN,就会被立即识别为脚本伪造。

Sources: [README.md:626-627](../../../project-repos/cloakbrowser/README.md#L626-L627)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:626-627`

```markdown
| `--fingerprint-timezone` | Timezone (e.g. `America/New_York`) |
| `--fingerprint-locale` | Locale (e.g. `en-US`) |
```

<!-- source-snippets:end -->
</details>

### `--ignore-gpu-blocklist` 的两个触发条件

这个 flag 在两个非显然场景下被自动注入:

1. **headed 模式**:headed Docker/Xvfb 里 Chromium 视环境为软件 GPU,会按 blocklist 阻断 WebGL。强行 ignore blocklist 让 SwiftShader 接管,WebGL 才能工作
2. **Windows 任何模式**:Microsoft Basic Render Driver 在 Windows GPU blocklist 中被列为禁止 WebGPU,即使有 Dawn 的 adapter blocklist bypass 也不够,需要这个上游 flag 兜底

Linux headless 不需要——那里没有真正的 GPU,但也不走 blocklist 路径,binary 内部的 SwiftShader 路径直接工作。

Sources: [cloakbrowser/browser.py:973-980](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L973-L980)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:973-980`

```python
    # - Headed mode (all platforms): Chromium blocks WebGL on software GPUs
    #   in Docker/Xvfb. Flag lets SwiftShader serve WebGL. See issue #56.
    # - Windows (all modes): Chromium's GPU blocklist blocks WebGPU for the
    #   Microsoft Basic Render Driver. Dawn's adapter_blocklist bypass alone
    #   isn't enough — need this flag too. Linux doesn't need it.
    import platform as _platform
    if not headless or _platform.system() == "Windows":
        seen["--ignore-gpu-blocklist"] = "--ignore-gpu-blocklist"
```

<!-- source-snippets:end -->
</details>

## ignore_default_args:屏蔽 Playwright 自带的泄漏点

光靠 `build_args` 构建好 stealth args 不够,因为 Playwright 在 `chromium.launch` 时还会自己添加一组默认 args,其中两个对 stealth 有破坏性:

```python
IGNORE_DEFAULT_ARGS = ["--enable-automation", "--enable-unsafe-swiftshader"]
```

Sources: [cloakbrowser/config.py:28-34](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L28-L34)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/config.py:28-34`

```python
# ---------------------------------------------------------------------------
# Playwright default args to suppress — these leak automation signals.
# --enable-automation: exposes navigator.webdriver = true
# --enable-unsafe-swiftshader: forces software WebGL rendering via SwiftShader,
#   producing a distinctive renderer string that no real user browser has
# ---------------------------------------------------------------------------
IGNORE_DEFAULT_ARGS = ["--enable-automation", "--enable-unsafe-swiftshader"]
```

<!-- source-snippets:end -->
</details>

- `--enable-automation`:Playwright 默认开启,这个 flag 直接让 `navigator.webdriver = true`——这是反爬检测最简单的探针。屏蔽掉后,binary 内部的 patch 把 `navigator.webdriver` 强制设为 `false`
- `--enable-unsafe-swiftshader`:Playwright 在 Linux/Docker 默认开启,会让 Chromium 用 SwiftShader 软件渲染 WebGL,产生一个独特的 renderer 字符串"Google Inc. (Google) (SwiftShader)",反爬一眼识破。屏蔽后,binary 用自己的 GPU 伪造逻辑生成符合 seed 的 vendor/renderer 字符串

注意是 `ignore_default_args=` 而不是 `--disable-blink-features=AutomationControlled` 之类的 hack:**告诉 Playwright "你别加这两个",而不是先让它加再用 patch 抵消**。前者干净,后者有时序漏洞。

## 完整的 fingerprint flag 体系

虽然默认 args 只有三个,binary 实际支持大约二十多个 `--fingerprint-*` flag。这些**默认不设**,但用户可以通过 `args=[...]` 传入做精细控制。下表是 README 中列出的主要项与它们的作用面:

| Flag | 控制的字段 | 默认行为 |
|---|---|---|
| `--fingerprint=<seed>` | 主种子,影响所有派生字段 | 启动时随机 5 位 |
| `--fingerprint-platform=<macos\|windows\|linux>` | `navigator.platform`、UA OS、GPU 池 | wrapper 按 OS 决定 |
| `--fingerprint-gpu-vendor` | WebGL `UNMASKED_VENDOR_WEBGL` | 从 seed + platform 派生 |
| `--fingerprint-gpu-renderer` | WebGL `UNMASKED_RENDERER_WEBGL` | 从 seed + platform 派生 |
| `--fingerprint-hardware-concurrency` | `navigator.hardwareConcurrency` | 默认 8 |
| `--fingerprint-device-memory` | `navigator.deviceMemory`(GB) | 默认 8 |
| `--fingerprint-screen-width` | 屏幕宽 | Win/Linux 1920,macOS 1440 |
| `--fingerprint-screen-height` | 屏幕高 | Win/Linux 1080,macOS 900 |
| `--fingerprint-brand` | 浏览器品牌 | Chrome,可设 Edge/Opera/Vivaldi |
| `--fingerprint-brand-version` | UA + Client Hints 版本 | binary 内置 |
| `--fingerprint-timezone` | 时区(IANA) | wrapper 通过 `timezone=` 参数设 |
| `--fingerprint-locale` | locale | wrapper 通过 `locale=` 参数设 |
| `--fingerprint-storage-quota` | `storage.estimate()` 配额(MB) | 自动归一化,约 500MB |
| `--fingerprint-webrtc-ip` | WebRTC ICE candidate IP | 关闭,可设 `auto` 或具体 IP |
| `--fingerprint-noise=false` | 关闭 noise 注入,保留种子 | 默认开启 |
| `--enable-blink-features=FakeShadowRoot` | 允许访问 closed shadow DOM | 关闭 |

Sources: [README.md:611-635](../../../project-repos/cloakbrowser/README.md#L611-L635)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:611-635`

```markdown

Supported by the binary but **not set by default** — pass via `args` to customize:

| Flag | Controls |
|------|----------|
| `--fingerprint-gpu-vendor` | WebGL `UNMASKED_VENDOR_WEBGL` (auto-generated from seed + platform) |
| `--fingerprint-gpu-renderer` | WebGL `UNMASKED_RENDERER_WEBGL` (auto-generated from seed + platform) |
| `--fingerprint-hardware-concurrency` | `navigator.hardwareConcurrency` (auto-generated: `8`) |
| `--fingerprint-device-memory` | `navigator.deviceMemory` in GB (auto-generated: `8`) |
| `--fingerprint-screen-width` | Screen width (auto-generated: `1920` Win/Linux, `1440` macOS) |
| `--fingerprint-screen-height` | Screen height (auto-generated: `1080` Win/Linux, `900` macOS) |
| `--fingerprint-brand` | Browser brand: `Chrome`, `Edge`, `Opera`, `Vivaldi` |
| `--fingerprint-brand-version` | Brand version (UA + Client Hints) |
| `--fingerprint-platform-version` | Client Hints platform version |
| `--fingerprint-location` | Geolocation coordinates |
| `--fingerprint-timezone` | Timezone (e.g. `America/New_York`) |
| `--fingerprint-locale` | Locale (e.g. `en-US`) |
| `--fingerprint-storage-quota` | Override storage quota in MB — affects `storage.estimate()`, `storageBuckets`, and legacy webkit APIs. Auto-normalized when `--fingerprint` is set |
| `--fingerprint-taskbar-height` | Override taskbar height (binary defaults: Win=48, Mac=95, Linux=0) |
| `--fingerprint-fonts-dir` | Path to directory containing target-platform fonts (see [Font Setup on Linux](#font-setup-on-linux)) |
| `--fingerprint-webrtc-ip` | WebRTC ICE candidate IP replacement. Use `auto` to resolve from proxy exit IP (makes an HTTP call through the proxy), or pass an explicit IP. Auto-injected when `geoip=True` |
| `--fingerprint-noise=false` | Disable noise injection (canvas, WebGL, audio, client rects) while keeping the deterministic fingerprint seed active |
| `--enable-blink-features=FakeShadowRoot` | Access closed shadow DOM elements |

> **Note:** All stealth tests were verified with the default fingerprint config above. Changing these flags may affect detection results — test your configuration before using in production.
```

<!-- source-snippets:end -->
</details>

### 一个微妙的取舍:storage quota

`--fingerprint-storage-quota` 体现了反检测的本质矛盾。默认情况下,binary 把 storage quota 归一化到一个低值(~500MB)——这是为了让 **FingerprintJS 通过**。FingerprintJS 会拒绝那些 quota 看起来像非匿名模式的 profile。

但反过来,**BrowserScan 的 `notPrivate` 检查**会因 quota 低而判定为匿名模式,扣 10 分。两个 fingerprinter 对同一个值有相反的期望。

CloakBrowser 选择默认偏向 FingerprintJS(更常见),但暴露 `--fingerprint-storage-quota=5000` 让用户在面对 BrowserScan 时主动覆盖。这种"显式取舍而非偷偷搞定"是这个项目典型的工程哲学。

Sources: [README.md:380-389](../../../project-repos/cloakbrowser/README.md#L380-L389)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:380-389`

````markdown
**Storage quota and detection tradeoff:** By default, the binary normalizes storage quota to pass FingerprintJS, which blocks persistent contexts that report non-incognito quota values. This means detection services that penalize incognito mode (like BrowserScan's `notPrivate` check, -10 points) will still flag it. If your target site penalizes incognito but doesn't use FingerprintJS, set a higher quota to appear as a regular profile:

```python
ctx = launch_persistent_context("./my-profile", args=["--fingerprint-storage-quota=5000"])
```

| Quota setting | FingerprintJS | BrowserScan `notPrivate` |
|---|---|---|
| Default (auto, ~500MB) | PASS | -10 (flagged as incognito) |
| `--fingerprint-storage-quota=5000` | May trigger detection | PASS (appears non-incognito) |
````

<!-- source-snippets:end -->
</details>

## WebRTC IP 一致性:一个有趣的双重路径

WebRTC ICE candidate 一旦泄漏真实 IP,代理的隐藏就形同虚设。CloakBrowser 提供了两条路径解决这个问题:

```mermaid
flowchart TD
    A["用户指定:<br/>--fingerprint-webrtc-ip=auto<br/>或 geoip=True"]
    B{"用户给了 proxy 吗?"}
    C["从代理出口解析 exit_ip<br/>(ipify.org / checkip.amazonaws.com)"]
    D{"解析成功?"}
    E["注入 --fingerprint-webrtc-ip=<exit_ip>"]
    F["移除 auto flag<br/>warning 用户"]
    G["binary 改写 ICE candidate"]
    H["用户显式:<br/>args=❲'--fingerprint-webrtc-ip=1.2.3.4'❳"]

    A --> B
    H --> G
    B -->|"是"| C
    B -->|"否"| F
    C --> D
    D -->|"是"| E
    D -->|"否"| F
    E --> G
```

`_resolve_webrtc_args()` 处理 `auto` 关键字的解析时刻在 wrapper 层而非 Chrome 层——Chrome 不认识 `auto`,只能传具体 IP。`maybe_resolve_geoip()` 在做 GeoIP 查询时**免费**返回 exit IP(从 ipify 等服务回包里直接读出),`launch()` 把这个 IP 复用为 WebRTC IP——也就是说,`geoip=True` 一次 HTTP 调用同时解决了"时区、语言、WebRTC IP"三件事。

Sources: [cloakbrowser/browser.py:913-951](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L913-L951)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:913-951`

```python
def _resolve_webrtc_args(
    args: list[str] | None,
    proxy: str | ProxySettings | None,
) -> list[str] | None:
    """Replace --fingerprint-webrtc-ip=auto with the resolved proxy exit IP.

    Returns args unchanged if no ``auto`` value is present.
    """
    if not args:
        return args
    idx = None
    for i, a in enumerate(args):
        if a == "--fingerprint-webrtc-ip=auto":
            idx = i
            break
    if idx is None:
        return args
    proxy_url = _extract_proxy_url(proxy)
    if not proxy_url:
        logger.warning("--fingerprint-webrtc-ip=auto requires a proxy; removing flag")
        args = list(args)
        del args[idx]
        return args
    try:
        from .geoip import resolve_proxy_exit_ip
        exit_ip = resolve_proxy_exit_ip(proxy_url)
    except Exception:
        logger.warning("Failed to resolve proxy exit IP for WebRTC spoofing; removing --fingerprint-webrtc-ip=auto")
        args = list(args)
        del args[idx]
        return args
    if exit_ip:
        args = list(args)
        args[idx] = f"--fingerprint-webrtc-ip={exit_ip}"
    else:
        logger.warning("Could not resolve proxy exit IP for WebRTC spoofing; removing --fingerprint-webrtc-ip=auto")
        args = list(args)
        del args[idx]
    return args
```

<!-- source-snippets:end -->
</details>

## 几个"读源码才能看到"的细节

**1. random seed 上下界是 10000-99999。** 不是 0-99999,因为前导零会让 fingerprint 在某些字符串比较场景里被截短或被识别为脚本生成。

**2. macOS 不需要 `--fingerprint-platform=mac` 之类的 flag。** binary 在 Mac 上编译时就知道自己是 Mac,GPU 池、UA 都是原生 Apple 的。给它加 `windows` 反而破坏一致性。

**3. `--enable-automation` 是 Playwright 显式加的,Puppeteer 没加。** 但 Puppeteer 有自己的泄漏点(`HeadlessChrome` UA 等),binary patch 一并处理。

**4. `--fingerprint-noise=false` 的存在很微妙。** 它保留 seed 派生的"静态"字段(GPU 串、硬件并发),但关掉每次 canvas/WebGL 调用时的随机噪声。某些反爬期望"同一会话内 canvas 输出确定",noise 反而会暴露。这个 flag 是给老练用户的。

Sources: [CHANGELOG.md:88-99](../../../project-repos/cloakbrowser/CHANGELOG.md#L88-L99)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CHANGELOG.md:88-99`

```markdown

- **[binary]** Upgrade Linux x64 build to 145.0.7632.159.8 — 42 source-level C++ patches (up from 33)
- **[binary]** 9 new fingerprint patches covering additional browser APIs and cross-platform consistency
- **[binary]** New `--fingerprint-noise` flag — disable noise injection while keeping deterministic fingerprint seed active
- **[binary]** Improved fingerprint noise reliability and determinism across all patched APIs
- **[binary]** Expanded platform-aware fingerprint spoofing for more realistic cross-platform profiles
- **[binary]** Font rendering and detection accuracy improvements for Windows profiles
- **[binary]** Removed experimental patches that caused compatibility issues with certain anti-bot systems
- **[binary]** Docker/VNC environment compatibility improvements
- **[wrapper]** Fix Playwright cleanup — `pw.stop()` now runs even if `browser.close()` raises or is cancelled (fixes #60, thanks [@dgtlmoon](https://github.com/dgtlmoon))
- **[meta]** Pin GitHub Actions to commit SHAs, add Dependabot for automated dependency updates

```

<!-- source-snippets:end -->
</details>

## 相关页面

- [启动 API:四象限对偶](launch-api.md) — stealth args 如何在各个 launch 函数中流动
- [代理、GeoIP 与 WebRTC 一致性](proxy-and-geoip.md) — exit IP 复用与 WebRTC 改写的完整链路
- [系统架构](system-architecture.md) — wrapper 层与 binary 层的责任边界


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [cloakbrowser/__init__.py](../../../project-repos/cloakbrowser/cloakbrowser/__init__.py)
- [cloakbrowser/browser.py](../../../project-repos/cloakbrowser/cloakbrowser/browser.py)
- [js/src/playwright.ts](../../../project-repos/cloakbrowser/js/src/playwright.ts)
- [js/src/puppeteer.ts](../../../project-repos/cloakbrowser/js/src/puppeteer.ts)
- [js/src/types.ts](../../../project-repos/cloakbrowser/js/src/types.ts)
- [examples/basic.py](../../../project-repos/cloakbrowser/examples/basic.py)
- [examples/persistent_context.py](../../../project-repos/cloakbrowser/examples/persistent_context.py)

</details>

# 启动 API:四象限对偶

CloakBrowser 的公开 API 是 `launch()`、`launch_context()`、`launch_persistent_context()` 三个核心函数,每个都有对应的 `_async` 版本——也就是说一共 **6 个对偶函数**。表面上看像是 Playwright 的薄封装,实际上每个对偶承担了不同的反检测责任,选错了函数就会暴露不该暴露的信号。

理解四象限的最佳方式是问两个问题:

1. **要不要持久化 profile?** ——决定数据存哪里(临时 vs `user_data_dir`)
2. **是 Browser 还是 BrowserContext 是返回粒度?** ——决定生命周期管理在哪一层

```mermaid
flowchart TD
    Q1{"持久化?"}
    Q2A{"返回粒度?"}
    Q2B["BrowserContext only"]

    L1["launch()<br/>返回 Browser"]
    L2["launch_context()<br/>返回 BrowserContext<br/>(临时,无 profile)"]
    L3["launch_persistent_context()<br/>返回 BrowserContext<br/>(持久化,绑 user_data_dir)"]

    Q1 -->|"否"| Q2A
    Q1 -->|"是"| Q2B
    Q2A -->|Browser| L1
    Q2A -->|BrowserContext| L2
    Q2B --> L3
```

下面对每个函数从外向内拆解。

## launch():最小入口

`launch()` 是最薄的 wrapper,返回一个标准 Playwright `Browser` 对象——之后做什么都是 Playwright 原生流程。这是与 `launch_context` 的根本区别:它**不**自动创建 BrowserContext。

调用顺序看 [`browser.py:55-147`](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L55-L147),核心 8 步:

1. **解析 backend**:`_resolve_backend(backend)` 根据参数或 `CLOAKBROWSER_BACKEND` 环境变量决定走 `playwright` 还是 `patchright`
2. **确保 binary 就位**:`ensure_binary()` 返回可执行路径,首次调用会触发下载
3. **GeoIP 解析(可选)**:`maybe_resolve_geoip()` 如果开了 `geoip=True` 且有代理,通过代理出口解析 timezone/locale/exit_ip
4. **代理配置分流**:`_resolve_proxy_config()` 把 HTTP 代理转成 Playwright dict,SOCKS5 转成 `--proxy-server` arg
5. **WebRTC IP 注入**:`_resolve_webrtc_args()` 处理 `auto` 关键字,把 exit_ip 落到 `--fingerprint-webrtc-ip`
6. **构建最终 args**:`build_args()` 合并 stealth 默认 + 用户 + timezone/locale 三层
7. **启动 Chromium**:`pw.chromium.launch(executable_path, args, ignore_default_args=IGNORE_DEFAULT_ARGS)`
8. **包装 close + humanize(可选)**:把 `pw.stop()` 接到 `browser.close()`,如果 `humanize=True` 则 `patch_browser()`

Sources: [cloakbrowser/browser.py:55-147](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L55-L147)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:55-147`

```python
def launch(
    headless: bool = True,
    proxy: str | ProxySettings | None = None,
    args: list[str] | None = None,
    stealth_args: bool = True,
    timezone: str | None = None,
    locale: str | None = None,
    geoip: bool = False,
    backend: str | None = None,
    humanize: bool = False,
    human_preset: HumanPreset = "default",
    human_config: HumanConfigOverrides | None = None,
    **kwargs: Any,
) -> Any:
    """Launch stealth Chromium browser. Returns a Playwright Browser object.

    Args:
        headless: Run in headless mode (default True).
        proxy: Proxy URL string or Playwright proxy dict.
            String: 'http://user:pass@proxy:8080' (credentials auto-extracted).
            Dict: {"server": "http://proxy:8080", "bypass": ".google.com", ...}
            — passed directly to Playwright.
        args: Additional Chromium CLI arguments to pass.
        stealth_args: Include default stealth fingerprint args (default True).
            Set to False if you want to pass your own --fingerprint flags.
        timezone: IANA timezone (e.g. 'America/New_York'). Sets --fingerprint-timezone binary flag.
        locale: BCP 47 locale (e.g. 'en-US'). Sets --lang binary flag.
        geoip: Auto-detect timezone/locale from proxy IP (default False).
            Requires ``pip install cloakbrowser[geoip]``. Downloads ~70 MB
            GeoLite2-City database on first use.  Explicit timezone/locale
            always override geoip results.
        backend: Playwright backend — 'playwright' (default) or 'patchright'.
            Patchright suppresses CDP signals (helps reCAPTCHA v3 Enterprise)
            but breaks proxy auth and add_init_script.
            Override globally with CLOAKBROWSER_BACKEND env var.
        humanize: Enable human-like mouse, keyboard, scroll behavior (default False).
        human_preset: Humanize preset — 'default' or 'careful' (default 'default').
        human_config: Custom humanize config mapping to override preset values.
        **kwargs: Passed directly to playwright.chromium.launch().

    Returns:
        Playwright Browser object — use same API as playwright.chromium.launch().

    Example:
        >>> from cloakbrowser import launch
        >>> browser = launch()
        >>> page = browser.new_page()
        >>> page.goto("https://bot.incolumitas.com")
        >>> print(page.title())
        >>> browser.close()
    """
    sync_playwright = _import_sync_playwright(_resolve_backend(backend))

    binary_path = ensure_binary()
    timezone, locale, exit_ip = maybe_resolve_geoip(geoip, proxy, timezone, locale)
    proxy_kwargs, proxy_extra_args = _resolve_proxy_config(proxy)
    args = _resolve_webrtc_args(args, proxy)
    if exit_ip and not (args and any(a.startswith("--fingerprint-webrtc-ip") for a in args)):
        args = list(args or [])
        args.append(f"--fingerprint-webrtc-ip={exit_ip}")
    chrome_args = build_args(stealth_args, (args or []) + proxy_extra_args, timezone=timezone, locale=locale, headless=headless)

    logger.debug("Launching stealth Chromium (headless=%s, args=%d)", headless, len(chrome_args))

    pw = sync_playwright().start()
    browser = pw.chromium.launch(
        executable_path=binary_path,
        headless=headless,
        args=chrome_args,
        ignore_default_args=IGNORE_DEFAULT_ARGS,
        **proxy_kwargs,
        **kwargs,
    )

    # Patch close() to also stop the Playwright instance
    _original_close = browser.close

    def _close_with_cleanup() -> None:
        try:
            _original_close()
        finally:
            pw.stop()

    browser.close = _close_with_cleanup

    # Human-like behavioral patching
    if humanize:
        from .human import patch_browser
        from .human.config import resolve_config
        cfg = resolve_config(human_preset, human_config)
        patch_browser(browser, cfg)

    return browser
```

<!-- source-snippets:end -->
</details>

```python
from cloakbrowser import launch

browser = launch()
page = browser.new_page()
page.goto("https://protected-site.com")
print(page.title())
browser.close()
```

### close() 的暗藏 cleanup

第 8 步的 `close()` 包装,是 wrapper 不得不做的事:

```python
_original_close = browser.close

def _close_with_cleanup() -> None:
    try:
        _original_close()
    finally:
        pw.stop()

browser.close = _close_with_cleanup
```

Sources: [cloakbrowser/browser.py:128-138](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L128-L138)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:128-138`

```python

    # Patch close() to also stop the Playwright instance
    _original_close = browser.close

    def _close_with_cleanup() -> None:
        try:
            _original_close()
        finally:
            pw.stop()

    browser.close = _close_with_cleanup
```

<!-- source-snippets:end -->
</details>

为什么不能交给 GC?——因为 `sync_playwright().start()` 启动的是一个后台 Node.js 子进程,Python 进程退出时如果没主动 `pw.stop()`,这个子进程可能成孤儿。**`try/finally` 保证 `pw.stop()` 在 `close()` 即使抛异常时也执行**,这是从 #60 issue 学到的教训(参见 0.3.19 CHANGELOG)。

## launch_async():异步对偶的微妙差异

`launch_async()` 的代码量几乎是 `launch()` 的镜像翻译——但有两处 async 特有的强化:

```python
async def _close_with_cleanup() -> None:
    try:
        await _original_close()
    finally:
        await pw.stop()
```

异步版的 close 包装把 `try` 块改成 `BaseException` 捕获在嵌套 `new_context` 中——

```python
try:
    context = await browser.new_context(**context_kwargs)
except BaseException:
    try:
        await browser.close()
    except BaseException:
        pass
    raise
```

`except BaseException` 而非 `except Exception` 是关键:asyncio 的 `CancelledError` 不继承 `Exception`,**只有捕到 `BaseException` 才能在协程被取消时清理 Chromium 进程**。否则 task cancel 触发的 stack unwinding 会跳过浏览器关闭,留下泄漏的子进程。这个细节在 Lambda 等"调用方可能超时取消任务"的环境里至关重要。

Sources: [cloakbrowser/browser.py:683-690](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L683-L690)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:683-690`

```python
    try:
        context = await browser.new_context(**context_kwargs)
    except BaseException:
        try:
            await browser.close()
        except BaseException:
            pass
        raise
```

<!-- source-snippets:end -->
</details>

## launch_context():便利封装,但有反检测责任

`launch_context()` 内部调用 `launch()` 然后立即 `browser.new_context(...)`,把 user_agent、viewport、color_scheme 等 context-level 参数集中起来。但它**不只是便利封装**——它要处理几个反检测陷阱。

### 陷阱 1:timezone/locale 不能传给 Playwright context

如果照 Playwright 习惯写:

```python
ctx = browser.new_context(timezone_id="America/New_York", locale="en-US")
```

——Playwright 会通过 CDP `Emulation.setTimezoneOverride` 与 `Emulation.setLocaleOverride` 实现,而这两个 CDP 命令可以被 fingerprinter 探测到("你的页面用了 emulation,所以不是真实浏览器")。

CloakBrowser 的解法:**把 timezone/locale 截下来,翻译成 `--fingerprint-timezone` 与 `--lang` binary flag**,然后**不再传给 Playwright context**。代码体现为:

```python
browser = launch(headless=headless, proxy=proxy, args=args, stealth_args=stealth_args,
                 timezone=timezone, locale=locale, backend=backend)

context_kwargs: dict[str, Any] = {}
if user_agent:
    context_kwargs["user_agent"] = user_agent
# ... 注意:context_kwargs 里没有 timezone/locale
```

`launch_context` 在调用 `launch()` 时显式传 `timezone=` 与 `locale=`,这些参数走 `build_args()` 路径变成 binary flag;而 `context_kwargs` 不带这两个字段,Playwright 也就不会尝试 CDP emulation。

Sources: [cloakbrowser/browser.py:546-548](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L546-L548)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:546-548`

```python
    browser = launch(headless=headless, proxy=proxy, args=args, stealth_args=stealth_args,
                     timezone=timezone, locale=locale, backend=backend)

```

<!-- source-snippets:end -->
</details>

### 陷阱 2:viewport 的 sentinel

```python
_VIEWPORT_UNSET = object()  # 模块级 sentinel

def launch_context(..., viewport: dict | None = _VIEWPORT_UNSET, ...):
    if viewport is _VIEWPORT_UNSET:
        context_kwargs["viewport"] = DEFAULT_VIEWPORT
    elif viewport is None:
        context_kwargs["no_viewport"] = True
    else:
        context_kwargs["viewport"] = viewport
```

这是 Python 中处理"三态默认值"的标准技法。Playwright 的 `viewport=None` 表示**禁用 viewport emulation**(用 OS 窗口实际大小),`viewport=DEFAULT` 表示**用默认 1920x947**。两者意义完全不同,所以"用户没传 viewport"必须与"用户传了 None"区分开。

Sources: [cloakbrowser/browser.py:31](../../../project-repos/cloakbrowser/cloakbrowser/browser.py:31), [cloakbrowser/browser.py:549-558](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L549-L558)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:31`

> 未找到引用文件：`cloakbrowser/browser.py:31`

#### `cloakbrowser/browser.py:549-558`

```python
    context_kwargs: dict[str, Any] = {}
    if user_agent:
        context_kwargs["user_agent"] = user_agent
    if viewport is _VIEWPORT_UNSET:
        context_kwargs["viewport"] = DEFAULT_VIEWPORT
    elif viewport is None:
        context_kwargs["no_viewport"] = True
    else:
        context_kwargs["viewport"] = viewport
    if color_scheme:
```

<!-- source-snippets:end -->
</details>

`DEFAULT_VIEWPORT = {"width": 1920, "height": 947}` 这个数字很有讲究——1920×1080 是常见屏幕,但减去 48px 任务栏(binary 默认)与 ~85px Chrome UI(标签 + 地址栏 + 书签栏),innerHeight 就是 947。这个值看上去像真实最大化的 Windows Chrome 窗口,反爬即使比对 `window.innerHeight` 与 `screen.height` 也不会发现破绽。

Sources: [cloakbrowser/config.py:64-69](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L64-L69)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/config.py:64-69`

```python
# ---------------------------------------------------------------------------
# Default viewport — realistic maximized Chrome on 1080p Windows
# screen=1920x1080, availHeight=1032 (minus 48px taskbar, binary default),
# innerHeight=947 (minus ~85px Chrome UI: tabs + address bar + bookmarks)
# ---------------------------------------------------------------------------
DEFAULT_VIEWPORT = {"width": 1920, "height": 947}
```

<!-- source-snippets:end -->
</details>

### 陷阱 3:close() 必须级联

```python
_original_ctx_close = context.close

def _close_context_with_cleanup() -> None:
    try:
        _original_ctx_close()
    finally:
        browser.close()  # 注意:browser.close 已经被 launch() 二次 patch

context.close = _close_context_with_cleanup
```

`context.close()` 不只关闭 context,还要关闭 browser——而 browser 的 close 内部又会 `pw.stop()`。两层 patch 形成一条 cleanup chain:`context.close()` → `_original_ctx_close()` → `browser.close()` → `_original_browser_close()` → `pw.stop()`。任何一层抛异常,后续清理仍会发生。

### kwargs 透传:storage_state 等高级选项

`launch_context()` 的 `**kwargs` 最终走到 `browser.new_context(**kwargs)`,这意味着用户可以传任何 Playwright 接受的 context 选项:

```python
ctx = launch_context(
    storage_state="state.json",       # 恢复保存的 session
    permissions=["geolocation"],
    extra_http_headers={"X-Test": "1"},
    http_credentials={"username": "a", "password": "b"},
)
```

`launch_context_async()` 在 0.3.25 加入,这就是为什么 CHANGELOG 里写"async counterpart to `launch_context()`. Forwards kwargs to `browser.new_context()`"——之前异步用户必须自己开 `new_context`,现在一行搞定 storage_state 等需求。

Sources: [cloakbrowser/browser.py:589-710](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L589-L710), [CHANGELOG.md:40](../../../project-repos/cloakbrowser/CHANGELOG.md:40)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:589-710`

```python
async def launch_context_async(
    headless: bool = True,
    proxy: str | ProxySettings | None = None,
    args: list[str] | None = None,
    stealth_args: bool = True,
    user_agent: str | None = None,
    viewport: dict | None = _VIEWPORT_UNSET,
    locale: str | None = None,
    timezone: str | None = None,
    color_scheme: Literal["light", "dark", "no-preference"] | None = None,
    geoip: bool = False,
    backend: str | None = None,
    humanize: bool = False,
    human_preset: HumanPreset = "default",
    human_config: HumanConfigOverrides | None = None,
    **kwargs: Any,
) -> Any:
    """Async version of launch_context().

    Launch stealth browser and return a BrowserContext with common options pre-set.
    All extra kwargs are forwarded to ``browser.new_context()`` — use this for
    ``storage_state``, ``permissions``, ``extra_http_headers``, etc. without needing
    a persistent profile folder.

    Args:
        headless: Run in headless mode (default True).
        proxy: Proxy URL string or Playwright proxy dict (see launch() for details).
        args: Additional Chromium CLI arguments.
        stealth_args: Include default stealth fingerprint args (default True).
        user_agent: Custom user agent string.
        viewport: Viewport size dict, e.g. {"width": 1920, "height": 1080}.
            Pass None to disable viewport emulation (use OS window size).
        locale: Browser locale, e.g. "en-US".
        timezone: IANA timezone (e.g. 'America/New_York').
        color_scheme: Color scheme preference — 'light', 'dark', or 'no-preference'.
        geoip: Auto-detect timezone/locale from proxy IP (default False).
        backend: Playwright backend — 'playwright' (default) or 'patchright'.
        humanize: Enable human-like mouse, keyboard, scroll behavior (default False).
        human_preset: Humanize preset — 'default' or 'careful' (default 'default').
        human_config: Custom humanize config mapping to override preset values.
        **kwargs: Passed to browser.new_context() — e.g. storage_state, permissions.

    Returns:
        Playwright BrowserContext object (async API).
        Call ``await .close()`` when done — this also closes the underlying browser.

    Example:
        >>> import asyncio
        >>> from cloakbrowser import launch_context_async
        >>>
        >>> async def main():
        ...     # Load saved session (cookies, localStorage)
        ...     ctx = await launch_context_async(
        ...         headless=True,
        ...         storage_state="state.json",
        ...     )
        ...     page = await ctx.new_page()
        ...     await page.goto("https://example.com")
        ...     # Save state back
        ...     await ctx.storage_state(path="state.json")
        ...     await ctx.close()
        >>>
        >>> asyncio.run(main())
    """
    timezone = _resolve_timezone(timezone, kwargs)

    # Resolve geoip BEFORE launch_async() to avoid double-resolution and ensure
    # resolved values flow to binary flags
    timezone, locale, exit_ip = maybe_resolve_geoip(geoip, proxy, timezone, locale)
    if exit_ip and not (args and any(a.startswith("--fingerprint-webrtc-ip") for a in args)):
        args = list(args or [])
        args.append(f"--fingerprint-webrtc-ip={exit_ip}")
    # --fingerprint-timezone is process-wide (reads CommandLine in renderer),
    # so it applies to ALL contexts, not just the default one.
    # locale and timezone are set via binary flags only — no CDP emulation.
    browser = await launch_async(headless=headless, proxy=proxy, args=args, stealth_args=stealth_args,
                                 timezone=timezone, locale=locale, backend=backend)

    context_kwargs: dict[str, Any] = {}
    if user_agent:
        context_kwargs["user_agent"] = user_agent
    if viewport is _VIEWPORT_UNSET:
        context_kwargs["viewport"] = DEFAULT_VIEWPORT
    elif viewport is None:
        context_kwargs["no_viewport"] = True
    else:
        context_kwargs["viewport"] = viewport
    if color_scheme:
        context_kwargs["color_scheme"] = color_scheme
    context_kwargs.update(kwargs)

    # Catch BaseException (not just Exception) so that asyncio.CancelledError
    # triggers browser cleanup — otherwise the underlying Chromium process
    # leaks when the awaiting task is cancelled.
    try:
        context = await browser.new_context(**context_kwargs)
    except BaseException:
        try:
            await browser.close()
        except BaseException:
            pass
        raise

    # Patch close() to also close the browser (and its Playwright instance)
    _original_ctx_close = context.close

    async def _close_context_with_cleanup() -> None:
        try:
            await _original_ctx_close()
        finally:
            await browser.close()

    context.close = _close_context_with_cleanup

    # Human-like behavioral patching (async variant)
    if humanize:
        from .human import patch_context_async
        from .human.config import resolve_config
        cfg = resolve_config(human_preset, human_config)
        patch_context_async(context, cfg)
... snippet truncated ...
```

#### `CHANGELOG.md:40`

> 未找到引用文件：`CHANGELOG.md:40`

<!-- source-snippets:end -->
</details>

## launch_persistent_context():绕过 incognito 检测

持久化版本的存在不是为了"方便用户保留 cookie"——这只是表象。它的核心反检测价值是**避开 incognito mode 探测**。

BrowserScan 等反爬服务有个检查叫 `notPrivate`:如果你用 Playwright 默认的 `new_context()`(临时 profile),你看起来就像匿名模式,被扣 10 分。`launch_persistent_context()` 通过 `chromium.launch_persistent_context(user_data_dir=...)` 走完整的 user profile 启动路径,看起来与真实用户启动浏览器完全一样:有 cookie 历史、有 cache、有 service worker。

```python
from cloakbrowser import launch_persistent_context

# 首次:创建 profile
ctx = launch_persistent_context("./my-profile", headless=False)
page = ctx.new_page()
page.goto("https://protected-site.com")
ctx.close()

# 下次:cookies/localStorage 自动恢复
ctx = launch_persistent_context("./my-profile", headless=False)
```

Sources: [cloakbrowser/browser.py:240-361](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L240-L361)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:240-361`

```python
def launch_persistent_context(
    user_data_dir: str | os.PathLike,
    headless: bool = True,
    proxy: str | ProxySettings | None = None,
    args: list[str] | None = None,
    stealth_args: bool = True,
    user_agent: str | None = None,
    viewport: dict | None = _VIEWPORT_UNSET,
    locale: str | None = None,
    timezone: str | None = None,
    color_scheme: Literal["light", "dark", "no-preference"] | None = None,
    geoip: bool = False,
    backend: str | None = None,
    humanize: bool = False,
    human_preset: HumanPreset = "default",
    human_config: HumanConfigOverrides | None = None,
    **kwargs: Any,
) -> Any:
    """Launch stealth browser with a persistent profile and return a BrowserContext.

    This persists cookies, localStorage, cache, and other browser state across
    sessions by storing them in ``user_data_dir``. Also avoids incognito detection
    by services like BrowserScan (-10% penalty).

    Args:
        user_data_dir: Path to the directory where browser profile data is stored.
            Created automatically if it doesn't exist. Reuse the same path across
            sessions to restore cookies, localStorage, cached credentials, etc.
        headless: Run in headless mode (default True).
        proxy: Proxy URL string or Playwright proxy dict (see launch() for details).
        args: Additional Chromium CLI arguments.
        stealth_args: Include default stealth fingerprint args (default True).
        user_agent: Custom user agent string.
        viewport: Viewport size dict, e.g. {"width": 1920, "height": 1080}.
            Pass None to disable viewport emulation (use OS window size).
        locale: Browser locale, e.g. "en-US".
        timezone: IANA timezone (e.g. 'America/New_York').
        color_scheme: Color scheme preference — 'light', 'dark', or 'no-preference'.
            Default: None (uses Chromium default, which is 'light').
        geoip: Auto-detect timezone/locale from proxy IP (default False).
            Requires ``pip install cloakbrowser[geoip]``.
        backend: Playwright backend — 'playwright' (default) or 'patchright'.
        humanize: Enable human-like mouse, keyboard, scroll behavior (default False).
        human_preset: Humanize preset — 'default' or 'careful' (default 'default').
        human_config: Custom humanize config mapping to override preset values.
        **kwargs: Passed directly to playwright.chromium.launch_persistent_context().

    Returns:
        Playwright BrowserContext object backed by a persistent profile.
        Call ``.close()`` when done — this also stops the Playwright instance.

    Example:
        >>> from cloakbrowser import launch_persistent_context
        >>> ctx = launch_persistent_context("./my-profile", headless=False)
        >>> page = ctx.new_page()
        >>> page.goto("https://protected-site.com")
        >>> ctx.close()  # Profile is saved; re-use path next run to restore state.
    """
    sync_playwright = _import_sync_playwright(_resolve_backend(backend))

    timezone = _resolve_timezone(timezone, kwargs)

    binary_path = ensure_binary()
    timezone, locale, exit_ip = maybe_resolve_geoip(geoip, proxy, timezone, locale)
    proxy_kwargs, proxy_extra_args = _resolve_proxy_config(proxy)
    args = _resolve_webrtc_args(args, proxy)
    if exit_ip and not (args and any(a.startswith("--fingerprint-webrtc-ip") for a in args)):
        args = list(args or [])
        args.append(f"--fingerprint-webrtc-ip={exit_ip}")
    chrome_args = build_args(stealth_args, (args or []) + proxy_extra_args, timezone=timezone, locale=locale, headless=headless)

    logger.debug(
        "Launching persistent stealth Chromium (headless=%s, user_data_dir=%s)",
        headless,
        user_data_dir,
    )

    # locale and timezone are set via binary flags (--lang, --fingerprint-timezone)
    # — NOT via Playwright context kwargs which use detectable CDP emulation.
    context_kwargs: dict[str, Any] = {}
    if user_agent:
        context_kwargs["user_agent"] = user_agent
    if viewport is _VIEWPORT_UNSET:
        context_kwargs["viewport"] = DEFAULT_VIEWPORT
    elif viewport is None:
        context_kwargs["no_viewport"] = True
    else:
        context_kwargs["viewport"] = viewport
    if color_scheme:
        context_kwargs["color_scheme"] = color_scheme
    context_kwargs.update(kwargs)

    pw = sync_playwright().start()
    context = pw.chromium.launch_persistent_context(
        user_data_dir=os.fspath(user_data_dir),
        executable_path=binary_path,
        headless=headless,
        args=chrome_args,
        ignore_default_args=IGNORE_DEFAULT_ARGS,
        **proxy_kwargs,
        **context_kwargs,
    )

    # Patch close() to also stop the Playwright instance
    _original_close = context.close

    def _close_with_cleanup() -> None:
        try:
            _original_close()
        finally:
            pw.stop()

    context.close = _close_with_cleanup

    # Human-like behavioral patching
    if humanize:
        from .human import patch_context
        from .human.config import resolve_config
        cfg = resolve_config(human_preset, human_config)
        patch_context(context, cfg)
... snippet truncated ...
```

<!-- source-snippets:end -->
</details>

### 一个 storage quota 的额外故事

`launch_persistent_context` 默认仍然让 binary 把 storage quota 归一化到 ~500MB(为了通过 FingerprintJS),这意味着对那些做 `notPrivate` 检查的服务(如 BrowserScan)仍会显示为 incognito。

如果用户在意 BrowserScan,可以显式覆盖:

```python
ctx = launch_persistent_context(
    "./my-profile",
    args=["--fingerprint-storage-quota=5000"],  # 5 GB,看起来像正常 profile
)
```

但这样可能触发 FingerprintJS 检测——典型的"两个反爬服务对同一信号有相反期望"。这种取舍 wrapper 不替用户决定,而是暴露 flag 让用户根据目标网站选择。

Sources: [README.md:380-389](../../../project-repos/cloakbrowser/README.md#L380-L389)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:380-389`

````markdown
**Storage quota and detection tradeoff:** By default, the binary normalizes storage quota to pass FingerprintJS, which blocks persistent contexts that report non-incognito quota values. This means detection services that penalize incognito mode (like BrowserScan's `notPrivate` check, -10 points) will still flag it. If your target site penalizes incognito but doesn't use FingerprintJS, set a higher quota to appear as a regular profile:

```python
ctx = launch_persistent_context("./my-profile", args=["--fingerprint-storage-quota=5000"])
```

| Quota setting | FingerprintJS | BrowserScan `notPrivate` |
|---|---|---|
| Default (auto, ~500MB) | PASS | -10 (flagged as incognito) |
| `--fingerprint-storage-quota=5000` | May trigger detection | PASS (appears non-incognito) |
````

<!-- source-snippets:end -->
</details>

## 六个函数的对比矩阵

| 函数 | 返回 | profile | 适用场景 | 主要 kwargs |
|---|---|---|---|---|
|`launch()` | Browser | 临时(memory) | 一次性脚本、自定义 context | proxy / args / humanize |
|`launch_async()` | Browser | 临时 | 异步框架(FastAPI/aiohttp) | 同上 |
|`launch_context()` | BrowserContext | 临时 | 单 page 简单流程 | + user_agent / viewport / storage_state |
|`launch_context_async()` | BrowserContext | 临时 | 异步单 page | 同上 |
|`launch_persistent_context()` | BrowserContext | 持久 | 长期 session、多次登录、扩展 | + user_data_dir |
|`launch_persistent_context_async()` | BrowserContext | 持久 | 异步持久 session | 同上 |

实际选择上有几条经验:

- **不知道选哪个,默认 `launch_context()`** —— 1 行配齐 user_agent、viewport、proxy 等,够用 80% 场景
- **要保留 session 跨进程** —— 必须 `launch_persistent_context()`
- **要装 Chrome 扩展** —— 必须 `launch_persistent_context()`,扩展只在真实 user_data_dir 里能用
- **简单一次性脚本,不在乎 context 默认值** —— `launch()` 最快

## JavaScript 端的对偶

JS 端 [`js/src/playwright.ts`](../../../project-repos/cloakbrowser/js/src/playwright.ts) 暴露的是 `launch`、`launchContext`、`launchPersistentContext` 三个函数——JS 本身是 async-only,所以没有同步异步两套。

API 形态稍有不同:`launchContext` 接受一个 options 对象而非位置参数,内部用 `LaunchContextOptions extends LaunchOptions` 继承组合。Type 在 [`js/src/types.ts`](../../../project-repos/cloakbrowser/js/src/types.ts) 中显式定义:

```typescript
export interface LaunchContextOptions extends LaunchOptions {
  userAgent?: string;
  viewport?: { width: number; height: number } | null;
  locale?: string;
  timezoneId?: string;  // alias for `timezone`
  colorScheme?: "light" | "dark" | "no-preference";
  contextOptions?: BrowserContextOptions;  // 透传给 Playwright newContext
}
```

注意 `contextOptions` 这个字段——这是 0.3.25 引入的"escape hatch":Python 端是 `**kwargs` 自然透传,JS 没有等价物,所以专门设了一个字段。

Sources: [js/src/types.ts:38-58](../../../project-repos/cloakbrowser/js/src/types.ts#L38-L58)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/types.ts:38-58`

```typescript
export interface LaunchContextOptions extends LaunchOptions {
  /** Custom user agent string. */
  userAgent?: string;
  /** Viewport size. */
  viewport?: { width: number; height: number } | null;
  /** Browser locale, e.g. "en-US". */
  locale?: string;
  /** IANA timezone — alias for `timezone`. Either works. */
  timezoneId?: string;
  /** Color scheme preference — 'light', 'dark', or 'no-preference'. */
  colorScheme?: "light" | "dark" | "no-preference";
  /**
   * Extra options forwarded directly to Playwright's `browser.newContext()` —
   * e.g. `storageState`, `permissions`, `geolocation`, `extraHTTPHeaders`,
   * `httpCredentials`. Use this for context-level options not surfaced as
   * top-level fields. `locale` and `timezoneId` are stripped here to avoid
   * detectable CDP emulation — use the top-level `locale` and `timezone`
   * wrapper fields instead (they route through undetectable binary flags).
   */
  contextOptions?: BrowserContextOptions;
}
```

<!-- source-snippets:end -->
</details>

### JS 端的额外保护:filterStealthCtxOptions

JS 端比 Python 端多一道屏障:

```typescript
function filterStealthCtxOptions(ctx?: BrowserContextOptions): Partial<BrowserContextOptions> {
  if (!ctx) return {};
  const { locale, timezoneId, ...rest } = ctx;
  if (locale !== undefined) {
    console.warn("[cloakbrowser] contextOptions.locale ignored — use top-level `locale`...");
  }
  if (timezoneId !== undefined) {
    console.warn("[cloakbrowser] contextOptions.timezoneId ignored — use top-level `timezone`...");
  }
  return rest;
}
```

Sources: [js/src/playwright.ts:28-45](../../../project-repos/cloakbrowser/js/src/playwright.ts#L28-L45)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/playwright.ts:28-45`

```typescript
 */
function filterStealthCtxOptions(ctx?: BrowserContextOptions): Partial<BrowserContextOptions> {
  if (!ctx) return {};
  const { locale, timezoneId, ...rest } = ctx;
  if (locale !== undefined) {
    console.warn(
      "[cloakbrowser] contextOptions.locale ignored — use top-level `locale` " +
      "instead (routes through binary flag, avoids detectable CDP emulation)."
    );
  }
  if (timezoneId !== undefined) {
    console.warn(
      "[cloakbrowser] contextOptions.timezoneId ignored — use top-level `timezone` " +
      "instead (routes through binary flag, avoids detectable CDP emulation)."
    );
  }
  return rest;
}
```

<!-- source-snippets:end -->
</details>

JS 用户更习惯写 `contextOptions: { locale: "en-US" }`,这会把 stealth 破坏掉。wrapper 主动剥离这两个字段并 warn——让用户知道发生了什么,而不是悄悄忽略。Python 端依赖用户读文档不这么写,JS 端则在代码里强制。

## Puppeteer 入口的特例

`js/src/puppeteer.ts` 只暴露 `launch()` 一个函数,**没有 `launchContext` / `launchPersistentContext` 对偶**——Puppeteer 的 BrowserContext 是单独 API,不能合并到 launch。

`launch()` 内部的代理处理也与 Playwright 不同:

```typescript
let proxyAuth: { username: string; password: string } | undefined;
if (options.proxy) {
  if (isSocksProxy(options.proxy)) {
    const { proxyArgs } = resolveProxyConfig(options.proxy);
    args.push(...proxyArgs);
  } else if (typeof options.proxy === "string") {
    const { server, username, password } = parseProxyUrl(options.proxy);
    args.push(`--proxy-server=${server}`);
    if (username) {
      proxyAuth = { username, password: password ?? "" };
    }
  }
  // ...
}

// 启动后给 newPage monkey-patch 自动认证
if (proxyAuth) {
  const origNewPage = browser.newPage.bind(browser);
  browser.newPage = async (...pageArgs) => {
    const page = await origNewPage(...pageArgs);
    await page.authenticate(auth);
    return page;
  };
}
```

Sources: [js/src/puppeteer.ts:43-88](../../../project-repos/cloakbrowser/js/src/puppeteer.ts#L43-L88)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/puppeteer.ts:43-88`

```typescript
  // HTTP: Chrome does NOT support inline credentials — strip them and
  // use page.authenticate() for Proxy-Authorization headers instead.
  let proxyAuth: { username: string; password: string } | undefined;
  if (options.proxy) {
    if (isSocksProxy(options.proxy)) {
      // SOCKS5: pass full URL with credentials to Chrome directly
      const { proxyArgs } = resolveProxyConfig(options.proxy);
      args.push(...proxyArgs);
    } else if (typeof options.proxy === "string") {
      const { server, username, password } = parseProxyUrl(options.proxy);
      args.push(`--proxy-server=${server}`);
      if (username) {
        proxyAuth = { username, password: password ?? "" };
      }
    } else {
      const parsed = parseProxyUrl(options.proxy.server);
      args.push(`--proxy-server=${parsed.server}`);
      if (options.proxy.bypass) {
        args.push(`--proxy-bypass-list=${options.proxy.bypass}`);
      }
      const username = options.proxy.username ?? parsed.username;
      const password = options.proxy.password ?? parsed.password;
      if (username) {
        proxyAuth = { username, password: password ?? "" };
      }
    }
  }

  const browser = await puppeteer.default.launch({
    executablePath: binaryPath,
    headless: options.headless ?? true,
    args,
    ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    ...options.launchOptions,
  });

  // Monkey-patch newPage() to auto-authenticate proxy credentials
  if (proxyAuth) {
    const origNewPage = browser.newPage.bind(browser);
    const auth = proxyAuth;
    browser.newPage = async (...pageArgs: Parameters<typeof origNewPage>) => {
      const page = await origNewPage(...pageArgs);
      await page.authenticate(auth);
      return page;
    };
  }
```

<!-- source-snippets:end -->
</details>

Puppeteer 不支持 inline 凭证的 HTTP 代理(Chrome 自身也不支持),必须用 `page.authenticate({username, password})` 触发 `Proxy-Authorization` 头。wrapper 通过 monkey-patch `newPage` 自动注入认证——这是真正"零代码改动迁移"的代价:在 wrapper 内部承担额外复杂度。

## 相关页面

- [系统架构](system-architecture.md) — launch 在三层模型中的位置
- [代理、GeoIP 与 WebRTC 一致性](proxy-and-geoip.md) — proxy 参数的细节解析
- [拟人化行为层](humanize-behavior.md) — humanize=True 内部如何 patch
- [Python 与 JS 双 SDK 对偶](python-vs-js-sdk.md) — 双语言 API 一一对应映射


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [cloakbrowser/download.py](../../../project-repos/cloakbrowser/cloakbrowser/download.py)
- [cloakbrowser/config.py](../../../project-repos/cloakbrowser/cloakbrowser/config.py)
- [cloakbrowser/__main__.py](../../../project-repos/cloakbrowser/cloakbrowser/__main__.py)
- [js/src/download.ts](../../../project-repos/cloakbrowser/js/src/download.ts)
- [js/src/cli.ts](../../../project-repos/cloakbrowser/js/src/cli.ts)

</details>

# 二进制生命周期

CloakBrowser 把 200MB+ 的 Chromium 二进制单独管理,不打进 PyPI/npm 包——这件事看起来普通,但实现细节里有不少"教训经验"。`download.py` 模块占 579 行,远超普通下载工具,因为它要同时解决:跨平台路径、双链路下载、SHA-256 校验、原子提取、自动更新、wrapper 自检、并发安全、macOS Gatekeeper、tar/zip 路径穿越防护。

把这些拼起来,就是"用户 `pip install cloakbrowser` 然后 `launch()` 一次就能跑"的体验背后那段不显眼但关键的工程。

## 用户视角的三种入口

二进制生命周期被三种入口触发:

```mermaid
flowchart TD
    A["用户:pip/npm install"]
    B["用户:launch()"]
    C["用户:python -m cloakbrowser install"]
    D["用户:CLOAKBROWSER_BINARY_PATH 环境变量"]

    A -.不下载 binary.-> X1["仅安装 wrapper"]
    B --> E["ensure_binary()"]
    C --> F["__main__.py 直接调 ensure_binary()"]
    D --> G["跳过下载,直接用本地编译版"]

    E --> H{"本地 cache 有?"}
    H -->|"有"| I["验证 executable"]
    H -->|"无"| J["_download_and_extract()"]
    F --> J
    I --> K["返回 path"]
    J --> K
    G --> K
    K --> L["chromium.launch(executable_path=...)"]
```

`pip install` 故意不下载 binary——这是 PyPI 的礼貌(不让 200MB 卡到 pip cache)、也让用户在 Docker build 时可以选"安装 wrapper 但等运行时下载"或"build 时预下载"两种策略。`ensure_binary()` 是所有"哪里需要 binary"的统一入口。

Sources: [cloakbrowser/download.py:73-130](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L73-L130)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:73-130`

```python
def ensure_binary() -> str:
    """Ensure the stealth Chromium binary is available. Download if needed.

    Returns the path to the chrome executable as a string.

    Set CLOAKBROWSER_BINARY_PATH to skip download and use a local build.
    """
    # Check for local override first
    local_override = get_local_binary_override()
    if local_override:
        path = Path(local_override)
        if not path.exists():
            raise FileNotFoundError(
                f"CLOAKBROWSER_BINARY_PATH set to '{local_override}' but file does not exist"
            )
        logger.info("Using local binary override: %s", local_override)
        return str(path)

    # Fail fast if no binary available for this platform
    check_platform_available()

    # Check for auto-updated version first, then fall back to hardcoded
    effective = get_effective_version()
    binary_path = get_binary_path(effective)

    if binary_path.exists() and _is_executable(binary_path):
        logger.debug("Binary found in cache: %s (version %s)", binary_path, effective)
        _show_welcome()
        _maybe_trigger_update_check()
        return str(binary_path)

    # Fall back to platform's hardcoded version if effective version binary doesn't exist
    platform_version = get_chromium_version()
    if effective != platform_version:
        fallback_path = get_binary_path()
        if fallback_path.exists() and _is_executable(fallback_path):
            logger.debug("Binary found in cache: %s", fallback_path)
            _maybe_trigger_update_check()
            return str(fallback_path)

    # Download platform's hardcoded version
    logger.info(
        "Stealth Chromium %s not found. Downloading for %s...",
        platform_version,
        get_platform_tag(),
    )
    _download_and_extract()

    binary_path = get_binary_path()
    if not binary_path.exists():
        raise RuntimeError(
            f"Download completed but binary not found at expected path: {binary_path}. "
            f"This may indicate a packaging issue. Please report at "
            f"https://github.com/CloakHQ/cloakbrowser/issues"
        )

    _maybe_trigger_update_check()
    return str(binary_path)
```

<!-- source-snippets:end -->
</details>

## 平台/版本解析:三层逻辑

`get_binary_path()` 看起来简单,实际上它的"哪个版本"问题有三层来源:

1. **本地覆盖**:`CLOAKBROWSER_BINARY_PATH` 环境变量,如果设了就完全跳过 cache/下载逻辑
2. **平台对应的版本**:`PLATFORM_CHROMIUM_VERSIONS` 字典,例如 `linux-x64 → "146.0.7680.177.3"`
3. **后台更新落点**:`latest_version_<platform>` marker 文件,后台拉到的新版本写在这里

`get_effective_version()` 实现这种"以平台默认为基,被 marker 覆盖"的逻辑:

```python
def get_effective_version() -> str:
    base = get_chromium_version()  # 平台对应的硬编码版本
    cache = get_cache_dir()
    for name in (f"latest_version_{get_platform_tag()}", "latest_version"):
        marker = cache / name
        if marker.exists():
            try:
                version = marker.read_text().strip()
                if version and _version_newer(version, base):
                    binary = get_binary_path(version)
                    if binary.exists():
                        return version  # 用更新的
            except (ValueError, OSError):
                pass
    return base
```

Sources: [cloakbrowser/config.py:159-179](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L159-L179)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/config.py:159-179`

```python
def get_effective_version() -> str:
    """Return the best available version: auto-updated if available, else platform default.

    Reads a platform-scoped marker file from the cache directory.
    Returns the platform's hardcoded version if no update has been downloaded.
    """
    base = get_chromium_version()
    # Try platform-scoped marker first, fall back to legacy marker for upgrades from <0.3.0
    cache = get_cache_dir()
    for name in (f"latest_version_{get_platform_tag()}", "latest_version"):
        marker = cache / name
        if marker.exists():
            try:
                version = marker.read_text().strip()
                if version and _version_newer(version, base):
                    binary = get_binary_path(version)
                    if binary.exists():
                        return version
            except (ValueError, OSError):
                pass
    return base
```

<!-- source-snippets:end -->
</details>

### 平台 tag 表

`PLATFORM_CHROMIUM_VERSIONS` 在不同时期不同平台版本可能不同(因为补丁 rebase 节奏不同步):

| Platform tag | Chromium 版本(当前) |
|---|---|
| `linux-x64` | 146.0.7680.177.3 |
| `linux-arm64` | 146.0.7680.177.3 |
| `darwin-arm64` | 145.0.7632.109.2 |
| `darwin-x64` | 145.0.7632.109.2 |
| `windows-x64` | 146.0.7680.177.4 |

Sources: [cloakbrowser/config.py:20-26](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L20-L26)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/config.py:20-26`

```python
PLATFORM_CHROMIUM_VERSIONS: dict[str, str] = {
    "linux-x64": "146.0.7680.177.3",
    "linux-arm64": "146.0.7680.177.3",
    "darwin-arm64": "145.0.7632.109.2",
    "darwin-x64": "145.0.7632.109.2",
    "windows-x64": "146.0.7680.177.4",
}
```

<!-- source-snippets:end -->
</details>

注意:**macOS 落后两个版本号**——补丁要重 rebase 到新 Chromium 时,macOS 的工程量(签名、bundle、Gatekeeper)更大,优先级靠后。这种差异由 `get_chromium_version()` 自动选,用户感受不到。

## 双链路下载:primary + fallback

`_download_and_extract()` 默认走两个 URL,串行 fallback:

```python
primary_url = get_download_url(version)         # cloakbrowser.dev/chromium-v{v}/...
fallback_url = get_fallback_download_url(version)  # github.com/CloakHQ/cloakbrowser/releases/download/...

try:
    _download_file(primary_url, tmp_path)
except Exception as primary_err:
    if os.environ.get("CLOAKBROWSER_DOWNLOAD_URL"):
        raise  # 用户自己指定了 URL,不要 fallback
    logger.warning("Primary download failed (%s), trying GitHub Releases...", primary_err)
    _download_file(fallback_url, tmp_path)
```

Sources: [cloakbrowser/download.py:152-163](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L152-L163)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:152-163`

```python
    try:
        # Try primary, fall back to GitHub Releases (skip fallback if custom URL)
        try:
            _download_file(primary_url, tmp_path)
        except Exception as primary_err:
            if os.environ.get("CLOAKBROWSER_DOWNLOAD_URL"):
                raise
            logger.warning(
                "Primary download failed (%s), trying GitHub Releases...",
                primary_err,
            )
            _download_file(fallback_url, tmp_path)
```

<!-- source-snippets:end -->
</details>

primary 域名 `cloakbrowser.dev` 是项目自有的 CDN——速度更快,但可能停服;fallback 走 GitHub Releases,慢但稳定。**用户显式设了 `CLOAKBROWSER_DOWNLOAD_URL` 时不再 fallback**——这是给企业镜像场景的契约:"你说从这里下,失败就该报错,而不是悄悄绕到 GitHub"。

```mermaid
flowchart TD
    A["ensure_binary()"]
    B{"local override?"}
    C{"cache 有有效 binary?"}
    D{"effective != platform_version<br/>且 fallback 在?"}
    E["返回本地路径"]
    F["返回 cache binary"]
    G["返回 fallback binary"]
    H["_download_and_extract()"]
    I{"primary 成功?"}
    J["primary 下载"]
    K{"用户设了自定义 URL?"}
    L["fallback GitHub Releases"]
    M["抛错"]
    N["SHA256 校验 + 提取"]
    O["返回 binary path"]

    A --> B
    B -->|"是"| E
    B -->|"否"| C
    C -->|"是"| F
    C -->|"否"| D
    D -->|"是"| G
    D -->|"否"| H
    H --> J
    J --> I
    I -->|"否"| K
    K -->|"是"| M
    K -->|"否"| L
    L --> N
    I -->|"是"| N
    N --> O
```

## SHA-256 校验:可关闭但默认开启

二进制下载完成后,**默认会做 SHA-256 校验**:

```python
if os.environ.get("CLOAKBROWSER_SKIP_CHECKSUM", "").lower() != "true":
    _verify_download_checksum(tmp_path, version)
```

Sources: [cloakbrowser/download.py:166-167](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L166-L167)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:166-167`

```python
        if os.environ.get("CLOAKBROWSER_SKIP_CHECKSUM", "").lower() != "true":
            _verify_download_checksum(tmp_path, version)
```

<!-- source-snippets:end -->
</details>

`_fetch_checksums()` 从 release 同目录拉 `SHA256SUMS` 文件,格式是 `hash  filename` 每行一条;`_parse_checksums()` 解析后,`_verify_checksum()` 流式哈希下载文件做比对——不匹配直接抛错并提示用户上报 issue:

```python
if actual != expected_hash:
    raise RuntimeError(
        f"Checksum verification failed!\n"
        f"  Expected: {expected_hash}\n"
        f"  Got:      {actual}\n"
        f"  File may be corrupted or tampered with. ..."
    )
```

Sources: [cloakbrowser/download.py:228-242](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L228-L242)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:228-242`

```python
def _verify_checksum(file_path: Path, expected_hash: str) -> None:
    """Verify SHA-256 of a file. Raises RuntimeError on mismatch."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    actual = sha256.hexdigest().lower()
    if actual != expected_hash:
        raise RuntimeError(
            f"Checksum verification failed!\n"
            f"  Expected: {expected_hash}\n"
            f"  Got:      {actual}\n"
            f"  File may be corrupted or tampered with. "
            f"Please retry or report at https://github.com/CloakHQ/cloakbrowser/issues"
        )
```

<!-- source-snippets:end -->
</details>

注意几个 corner case 的处理:
- SHA256SUMS 不存在 → warning 但不阻塞下载("此版本无 checksum 发布")
- SHA256SUMS 存在但没对应 tarball 条目 → warning 但不阻塞
- 自定义 URL(`CLOAKBROWSER_DOWNLOAD_URL`)时,只查 primary 的 SHA256SUMS,不回退 GitHub

这种"warning 但放行"是为了不让旧版本(没发布 checksum 的)突然挂掉,同时也保证未来发布的版本能强制校验。

## 原子提取:tar 路径穿越防护

提取 tar.gz 时,`_extract_tar()` 主动检查每个成员的路径:

```python
def _extract_tar(archive_path: Path, dest_dir: Path) -> None:
    with tarfile.open(archive_path, "r:gz") as tar:
        safe_members = []
        for member in tar.getmembers():
            if member.issym() or member.islnk():
                link_target = member.linkname
                if os.path.isabs(link_target) or ".." in link_target.split("/"):
                    logger.warning("Skipping suspicious symlink: %s -> %s", member.name, link_target)
                    continue
            else:
                member_path = (dest_dir / member.name).resolve()
                if not str(member_path).startswith(str(dest_dir.resolve())):
                    raise RuntimeError(f"Archive contains path traversal: {member.name}")
            safe_members.append(member)

        tar.extractall(dest_dir, members=safe_members)
```

Sources: [cloakbrowser/download.py:313-330](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L313-L330)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:313-330`

```python
def _extract_tar(archive_path: Path, dest_dir: Path) -> None:
    """Extract tar.gz archive with path traversal protection."""
    with tarfile.open(archive_path, "r:gz") as tar:
        safe_members = []
        for member in tar.getmembers():
            # Allow symlinks — macOS .app bundles require them (Framework layout)
            if member.issym() or member.islnk():
                link_target = member.linkname
                if os.path.isabs(link_target) or ".." in link_target.split("/"):
                    logger.warning("Skipping suspicious symlink: %s -> %s", member.name, link_target)
                    continue
            else:
                member_path = (dest_dir / member.name).resolve()
                if not str(member_path).startswith(str(dest_dir.resolve())):
                    raise RuntimeError(f"Archive contains path traversal: {member.name}")
            safe_members.append(member)

        tar.extractall(dest_dir, members=safe_members)
```

<!-- source-snippets:end -->
</details>

这是 CVE-2007-4559(Python `tarfile` extractall 默认允许 `..` 穿越)的标准防御。但**为什么允许 symlink?** —— 因为 macOS `.app` bundle 里的 Framework 是 symlink 结构,完全禁掉 symlink 会破坏 macOS 包。妥协方案:**只过滤目标路径异常的 symlink**(绝对路径或带 `..`),正常相对 symlink 放行。

### 单层目录扁平化

`_flatten_single_subdir()` 处理一个体验细节:很多 tar 包会把所有文件包在一个顶层目录里(例如 `fingerprint-chromium-142-custom-v2/chrome`),我们希望 `chrome` 直接出现在 cache 根。但 macOS `.app` bundle 必须保持目录结构——如果展开 `Chromium.app` 里的内容到上一层,bundle 就坏了。

```python
if len(entries) == 1 and entries[0].is_dir():
    subdir = entries[0]
    if subdir.name.endswith(".app"):
        return  # 保留 .app 不动
    for item in subdir.iterdir():
        shutil.move(str(item), str(dest_dir / item.name))
    subdir.rmdir()
```

Sources: [cloakbrowser/download.py:345-363](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L345-L363)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:345-363`

```python
def _flatten_single_subdir(dest_dir: Path) -> None:
    """If extraction created a single subdirectory, move its contents up.

    Many tar archives wrap files in a top-level directory (e.g.
    fingerprint-chromium-142-custom-v2/chrome). We want chrome at dest_dir/chrome.
    """
    import shutil

    entries = list(dest_dir.iterdir())
    if len(entries) == 1 and entries[0].is_dir():
        subdir = entries[0]
        # Never flatten .app bundles — macOS needs the bundle structure
        if subdir.name.endswith(".app"):
            logger.debug("Keeping .app bundle intact: %s", subdir.name)
            return
        logger.debug("Flattening single subdirectory: %s", subdir.name)
        for item in subdir.iterdir():
            shutil.move(str(item), str(dest_dir / item.name))
        subdir.rmdir()
```

<!-- source-snippets:end -->
</details>

## macOS quarantine 清理

下载 Chromium 后 macOS 会自动给它打上 `com.apple.quarantine` xattr,启动时弹出"Apple 无法验证此应用"的 Gatekeeper 提示。`_remove_quarantine()` 用 `xattr -cr` 在提取完成后立即清掉:

```python
def _remove_quarantine(path: Path) -> None:
    try:
        subprocess.run(["xattr", "-cr", str(path)], capture_output=True, timeout=30)
    except Exception:
        logger.debug("Failed to remove quarantine attributes", exc_info=True)
```

Sources: [cloakbrowser/download.py:379-389](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L379-L389)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:379-389`

```python
def _remove_quarantine(path: Path) -> None:
    """Remove macOS quarantine/provenance xattrs so Gatekeeper doesn't block the binary."""
    try:
        subprocess.run(
            ["xattr", "-cr", str(path)],
            capture_output=True,
            timeout=30,
        )
        logger.debug("Removed quarantine attributes from %s", path)
    except Exception:
        logger.debug("Failed to remove quarantine attributes", exc_info=True)
```

<!-- source-snippets:end -->
</details>

`xattr` 不存在或失败时不报错——大多数 Mac 装机都有这个工具,没有也只是多一次手动确认,不应阻塞主流程。

## 自动更新:双层后台轮询

`_maybe_trigger_update_check()` 在每次 `ensure_binary()` 末尾被调用,启动两个 daemon 线程:

```python
def _maybe_trigger_update_check() -> None:
    # Wrapper update: 每个进程一次
    if not _wrapper_update_checked:
        t = threading.Thread(target=_check_wrapper_update, daemon=True)
        t.start()

    # Binary update: 每小时一次
    if not _should_check_for_update():
        return
    t = threading.Thread(target=_check_and_download_update, daemon=True)
    t.start()
```

Sources: [cloakbrowser/download.py:567-578](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L567-L578)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:567-578`

```python
def _maybe_trigger_update_check() -> None:
    """Fire-and-forget update check in a daemon thread."""
    # Wrapper update: once per process, not rate-limited
    if not _wrapper_update_checked:
        t = threading.Thread(target=_check_wrapper_update, daemon=True)
        t.start()

    # Binary update: rate-limited to once per hour
    if not _should_check_for_update():
        return
    t = threading.Thread(target=_check_and_download_update, daemon=True)
    t.start()
```

<!-- source-snippets:end -->
</details>

**Wrapper 更新检查**:hit PyPI JSON `https://pypi.org/pypi/cloakbrowser/json`,看 wrapper 版本是否新于本地,新就 warning 一句"该升级了"。`_wrapper_update_checked` 标志保证一个进程只查一次。

**Binary 更新检查**:hit GitHub Releases API,找 `chromium-v*` tag 中带本平台 tarball 的最新 release,新就在后台**下载并解压**,写 marker 文件。下次 `launch()` 时 `get_effective_version()` 就会自动选用新版本——用户感受不到任何中断。

### 限流:`.last_update_check`

后台 binary 更新检查每小时最多一次:

```python
UPDATE_CHECK_INTERVAL = 3600

def _should_check_for_update() -> bool:
    if os.environ.get("CLOAKBROWSER_AUTO_UPDATE", "").lower() == "false":
        return False
    if get_local_binary_override():
        return False
    if os.environ.get("CLOAKBROWSER_DOWNLOAD_URL"):
        return False  # 自定义 URL 用户自己管版本

    check_file = get_cache_dir() / ".last_update_check"
    if check_file.exists():
        last_check = float(check_file.read_text().strip())
        if time.time() - last_check < UPDATE_CHECK_INTERVAL:
            return False
    return True
```

Sources: [cloakbrowser/download.py:446-463](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L446-L463)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:446-463`

```python
def _should_check_for_update() -> bool:
    """Check if auto-update is enabled and rate limit hasn't been hit."""
    if os.environ.get("CLOAKBROWSER_AUTO_UPDATE", "").lower() == "false":
        return False
    if get_local_binary_override():
        return False
    if os.environ.get("CLOAKBROWSER_DOWNLOAD_URL"):
        return False

    check_file = get_cache_dir() / ".last_update_check"
    if check_file.exists():
        try:
            last_check = float(check_file.read_text().strip())
            if time.time() - last_check < UPDATE_CHECK_INTERVAL:
                return False
        except (ValueError, OSError):
            pass
    return True
```

<!-- source-snippets:end -->
</details>

三个豁免条件:用户主动禁用、用户用本地 binary、用户用自定义下载 URL——这些场景都不应该被 wrapper 替用户拉新版本。

### 后台下载完成 ≠ 立即生效

后台更新拉到新 binary 后,只写 marker 文件而**不替换当前进程的 binary path**——当前进程已经在跑 Chromium,换地址毫无意义。下次 `launch()` 时,`get_effective_version()` 看到 marker 就用新的。这种"下载与生效解耦"是后台更新不打扰用户的关键。

## CLI:`python -m cloakbrowser`

[`__main__.py`](../../../project-repos/cloakbrowser/cloakbrowser/__main__.py) 提供四个子命令:

```bash
python -m cloakbrowser install      # 强制下载 binary
python -m cloakbrowser info         # 显示版本/路径/平台
python -m cloakbrowser update       # 手动检查更新
python -m cloakbrowser clear-cache  # 清空 cache
```

`info` 输出特别有用——它列出 `binary_path`、`installed`、`cache_dir`、`download_url`,以及 `CLOAKBROWSER_BINARY_PATH` override(如果设了),足以在 issue 报告里诊断"binary 找不到"类问题。

```python
def cmd_info(args: argparse.Namespace) -> None:
    info = binary_info()
    override = get_local_binary_override()

    print(f"Version:   {info['version']}")
    print(f"Platform:  {info['platform']}")
    print(f"Binary:    {info['binary_path']}")
    print(f"Installed: {info['installed']}")
    print(f"Cache:     {info['cache_dir']}")
    if override:
        print(f"Override:  {override} (CLOAKBROWSER_BINARY_PATH)")
```

Sources: [cloakbrowser/__main__.py:36-49](../../../project-repos/cloakbrowser/cloakbrowser/__main__.py#L36-L49)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/__main__.py:36-49`

```python
def cmd_info(args: argparse.Namespace) -> None:
    from .config import get_local_binary_override
    from .download import binary_info

    info = binary_info()
    override = get_local_binary_override()

    print(f"Version:   {info['version']}")
    print(f"Platform:  {info['platform']}")
    print(f"Binary:    {info['binary_path']}")
    print(f"Installed: {info['installed']}")
    print(f"Cache:     {info['cache_dir']}")
    if override:
        print(f"Override:  {override} (CLOAKBROWSER_BINARY_PATH)")
```

<!-- source-snippets:end -->
</details>

JS 端有 `js/src/cli.ts` 提供等价的 `npx cloakbrowser install` 命令,实现细节略——主要差异是 JS 端的 `console.log` 输出不能写到 stdout 的 JSON 中(下面提到的 stderr 修复)。

## 几个易踩坑的设计选择

**`_show_welcome()` 输出到 stderr 而非 stdout**。0.3.18 之前是 stdout,导致 `python script.py | jq` 这种管道场景被 wrapper 的欢迎横幅污染。修复后所有非数据输出都走 stderr,管道安全。

Sources: [cloakbrowser/download.py:54-70](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L54-L70), [CHANGELOG.md:102](../../../project-repos/cloakbrowser/CHANGELOG.md:102)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:54-70`

```python
def _show_welcome() -> None:
    """Show welcome message on first launch. Uses a marker file to show only once."""
    marker = get_cache_dir() / ".welcome_shown"
    if marker.exists():
        return
    sys.stderr.write("\n")
    sys.stderr.write("  CloakBrowser — stealth Chromium for automation\n")
    sys.stderr.write("  https://github.com/CloakHQ/CloakBrowser\n")
    sys.stderr.write("\n")
    sys.stderr.write("  Donate?  https://ko-fi.com/cloakhq\n")
    sys.stderr.write("  Star us if CloakBrowser helps your project!\n")
    sys.stderr.write("\n")
    try:
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.write_text("")
    except OSError:
        pass
```

#### `CHANGELOG.md:102`

> 未找到引用文件：`CHANGELOG.md:102`

<!-- source-snippets:end -->
</details>

**`tempfile.NamedTemporaryFile(suffix=..., delete=False)` 然后手动 `unlink`**。这是 Python 临时文件的标准技法:必须 `delete=False` 让 with 退出后文件不被立刻删除,这样下载可以原子完成,再手动控制清理。Windows 上 `delete=True` 会因为文件句柄未关闭导致后续操作失败。

Sources: [cloakbrowser/download.py:148-173](../../../project-repos/cloakbrowser/cloakbrowser/download.py#L148-L173)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/download.py:148-173`

```python
    # Download to temp file first (atomic — no partial downloads in cache)
    with tempfile.NamedTemporaryFile(suffix=get_archive_ext(), delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        # Try primary, fall back to GitHub Releases (skip fallback if custom URL)
        try:
            _download_file(primary_url, tmp_path)
        except Exception as primary_err:
            if os.environ.get("CLOAKBROWSER_DOWNLOAD_URL"):
                raise
            logger.warning(
                "Primary download failed (%s), trying GitHub Releases...",
                primary_err,
            )
            _download_file(fallback_url, tmp_path)

        # Verify checksum before extraction
        if os.environ.get("CLOAKBROWSER_SKIP_CHECKSUM", "").lower() != "true":
            _verify_download_checksum(tmp_path, version)

        _extract_archive(tmp_path, binary_dir, binary_path)
        _show_welcome()
    finally:
        # Clean up temp file
        tmp_path.unlink(missing_ok=True)
```

<!-- source-snippets:end -->
</details>

**`get_binary_path()` 三平台分支**。Linux 是 flat `chrome` 文件,Windows 是 `chrome.exe`,macOS 是 `Chromium.app/Contents/MacOS/Chromium` bundle 路径。这种平台差异在 wrapper 内部封装,外层接口只看见一个 `binary_path` 字符串。

```python
def get_binary_path(version: str | None = None) -> Path:
    binary_dir = get_binary_dir(version)
    if platform.system() == "Darwin":
        return binary_dir / "Chromium.app" / "Contents" / "MacOS" / "Chromium"
    elif platform.system() == "Windows":
        return binary_dir / "chrome.exe"
    else:
        return binary_dir / "chrome"
```

Sources: [cloakbrowser/config.py:127-138](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L127-L138)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/config.py:127-138`

```python
def get_binary_path(version: str | None = None) -> Path:
    """Return the expected path to the chrome executable."""
    binary_dir = get_binary_dir(version)

    if platform.system() == "Darwin":
        # macOS: Chromium.app bundle
        return binary_dir / "Chromium.app" / "Contents" / "MacOS" / "Chromium"
    elif platform.system() == "Windows":
        return binary_dir / "chrome.exe"
    else:
        # Linux: flat binary
        return binary_dir / "chrome"
```

<!-- source-snippets:end -->
</details>

**`check_platform_available()` 提前失败**。如果用户在不支持平台(例如 FreeBSD 或 ARM64 macOS 早于支持时)跑,会清晰报错并提示设 `CLOAKBROWSER_BINARY_PATH`,而不是先下载半天再发现不能用。

Sources: [cloakbrowser/config.py:141-156](../../../project-repos/cloakbrowser/cloakbrowser/config.py#L141-L156)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/config.py:141-156`

```python
def check_platform_available() -> None:
    """Raise a clear error if no pre-built binary exists for this platform.

    Skipped when CLOAKBROWSER_BINARY_PATH is set (user has their own build).
    """
    if get_local_binary_override():
        return

    tag = get_platform_tag()  # raises if platform unsupported entirely
    if tag not in AVAILABLE_PLATFORMS:
        available = ", ".join(sorted(AVAILABLE_PLATFORMS))
        import sys
        sys.exit(
            f"\n\033[1mCloakBrowser\033[0m — Pre-built binaries are currently only available for: {available}.\n\n"
            f"To use CloakBrowser now, set CLOAKBROWSER_BINARY_PATH to a local Chromium binary."
        )
```

<!-- source-snippets:end -->
</details>

## 环境变量速查表

| 变量 | 默认 | 作用 |
|---|---|---|
|`CLOAKBROWSER_BINARY_PATH` | — | 跳过下载,使用本地编译版 |
|`CLOAKBROWSER_CACHE_DIR` | `~/.cloakbrowser` | binary cache 目录 |
|`CLOAKBROWSER_DOWNLOAD_URL` | `https://cloakbrowser.dev` | 自定义下载基址 |
|`CLOAKBROWSER_AUTO_UPDATE` | `true` | 设 `false` 关闭后台更新 |
|`CLOAKBROWSER_SKIP_CHECKSUM` | `false` | 设 `true` 跳过 SHA-256 校验 |
|`CLOAKBROWSER_BACKEND` | `playwright` | 切换为 `patchright` 后端 |
|`CLOAKBROWSER_GEOIP_TIMEOUT_SECONDS` | `5` | GeoIP 解析超时上限 |

## 相关页面

- [系统架构](system-architecture.md) — `ensure_binary` 在 `launch()` 序列中的位置
- [部署与生态集成](deployment-and-integrations.md) — Docker 镜像中如何预下载 binary
- [测试、CI 与发布管线](testing-ci-release.md) — release 时如何同步发布 binary 与 wrapper


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [cloakbrowser/browser.py](../../../project-repos/cloakbrowser/cloakbrowser/browser.py)
- [cloakbrowser/geoip.py](../../../project-repos/cloakbrowser/cloakbrowser/geoip.py)
- [js/src/proxy.ts](../../../project-repos/cloakbrowser/js/src/proxy.ts)
- [js/src/geoip.ts](../../../project-repos/cloakbrowser/js/src/geoip.ts)

</details>

# 代理、GeoIP 与 WebRTC 一致性

代理本身解决"我从哪个 IP 访问"——但反检测远不止于此。一个看似干净的代理配置,可能在六个不同的 vector 上同时泄漏真实身份:WebRTC ICE candidate 报告本机 IP、`navigator.language` 与代理出口国不匹配、`Intl.DateTimeFormat` 时区与 IP 时区不一致、TLS 握手指纹与真实 Chrome 不同、代理协议特征(DNS 查询时序、代理特有 HTTP 头)被识别、HTTP 代理凭证形式被反爬探测。

CloakBrowser 把这六件事打包成一条流水线:用户写 `proxy="http://user:pass@host:port", geoip=True`,wrapper 自动完成代理协议分流、凭证 URL 重编码、出口 IP 解析、时区/语言 GeoIP 查询、WebRTC IP 同步——所有改写都通过 binary flag 落到 patched Chromium,**没有任何 JS 注入**。

## 全景:一次 launch 内部的网络协调

```mermaid
flowchart TD
    USER["launch(proxy='socks5://u:p@host:1080', geoip=True)"]
    GEO["maybe_resolve_geoip()"]
    EXIT["_resolve_exit_ip()<br/>HTTP GET via proxy<br/>→ ipify.org / checkip.amazonaws.com"]
    DB["_ensure_geoip_db()<br/>下载 GeoLite2-City.mmdb (~70MB)"]
    LOOKUP["geoip2.database.Reader.city(ip)<br/>→ timezone + country"]
    MAP["COUNTRY_LOCALE_MAP❲country❳"]
    PROXY["_resolve_proxy_config()"]
    SOCKS{"SOCKS5?"}
    HTTP_PROXY["proxy_kwargs = ❴'proxy': ❴'server':..., 'username':...❵❵"]
    SOCKS_PROXY["proxy_extra_args = ❲'--proxy-server=socks5://u:p@host:1080'❳"]
    WEBRTC["注入 --fingerprint-webrtc-ip=<exit_ip>"]
    ARGS["build_args() 合并 timezone + locale flag"]
    BIN["Chromium binary"]

    USER --> GEO
    USER --> PROXY
    GEO --> EXIT
    EXIT -.exit_ip.-> WEBRTC
    GEO --> DB
    DB --> LOOKUP
    LOOKUP --> MAP
    MAP -.locale.-> ARGS
    LOOKUP -.timezone.-> ARGS
    PROXY --> SOCKS
    SOCKS -->|"是"| SOCKS_PROXY
    SOCKS -->|"否"| HTTP_PROXY
    HTTP_PROXY --> BIN
    SOCKS_PROXY --> ARGS
    WEBRTC --> ARGS
    ARGS --> BIN
```

上图揭示了一个关键事实:**`geoip=True` 一次操作同时影响三个 binary flag——`--fingerprint-timezone`、`--lang`/`--fingerprint-locale`、`--fingerprint-webrtc-ip`**。这不是巧合,而是因为代理 IP 已经成为反检测的"主键",其他字段都应当从它派生。

## 代理协议分流:HTTP 走 Playwright,SOCKS5 走 Chrome arg

`_resolve_proxy_config()` 的核心决策很简单但很关键:

```python
def _resolve_proxy_config(proxy):
    if proxy is None:
        return {}, []

    if _is_socks_proxy(proxy):
        # SOCKS5: 绕过 Playwright,直接给 Chrome arg
        if isinstance(proxy, dict):
            url = _reconstruct_socks_url(proxy)
            extra_args = [f"--proxy-server={url}"]
            if proxy.get("bypass"):
                extra_args.append(f"--proxy-bypass-list={proxy['bypass']}")
            return {}, extra_args
        return {}, [f"--proxy-server={_normalize_socks_string_url(proxy)}"]

    # HTTP/HTTPS:走 Playwright proxy dict
    if isinstance(proxy, dict):
        return {"proxy": proxy}, []
    return {"proxy": _parse_proxy_url(proxy)}, []
```

Sources: [cloakbrowser/browser.py:1049-1079](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L1049-L1079)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:1049-1079`

```python
def _resolve_proxy_config(
    proxy: str | ProxySettings | None,
) -> tuple[dict[str, Any], list[str]]:
    """Resolve proxy into Playwright kwargs and Chrome args.

    Playwright rejects SOCKS5 proxies with credentials in its proxy dict,
    so SOCKS5 is passed via --proxy-server Chrome arg instead.

    Returns:
        (proxy_kwargs, extra_chrome_args) — one or both will be empty.
    """
    if proxy is None:
        return {}, []

    if _is_socks_proxy(proxy):
        # SOCKS5: bypass Playwright, pass directly to Chrome via --proxy-server.
        # Chrome handles SOCKS5 auth natively from the URL.
        if isinstance(proxy, dict):
            url = _reconstruct_socks_url(proxy)
            extra_args = [f"--proxy-server={url}"]
            if proxy.get("bypass"):
                extra_args.append(f"--proxy-bypass-list={proxy['bypass']}")
            return {}, extra_args
        # String URL — re-encode creds to work around Chromium parser truncating
        # passwords at '=' and other special chars (#157).
        return {}, [f"--proxy-server={_normalize_socks_string_url(proxy)}"]

    # HTTP/HTTPS: use Playwright's proxy dict as before
    if isinstance(proxy, dict):
        return {"proxy": proxy}, []
    return {"proxy": _parse_proxy_url(proxy)}, []
```

<!-- source-snippets:end -->
</details>

**为什么 SOCKS5 不能走 Playwright?** —— Playwright 的 proxy dict 不接受 SOCKS5 + 凭证;它把 username/password 透传给 Chrome 时假设是 HTTP basic auth。SOCKS5 的 RFC 1929 认证是 Chrome 原生支持的,但只能通过 inline credentials 形式(`socks5://user:pass@host:1080`)。所以 wrapper 必须**绕过 Playwright**:不传 `proxy=` 给 launch,改用 `--proxy-server=socks5://...` Chrome arg。

返回值 `(proxy_kwargs, extra_args)` 一次返回两个空间:`proxy_kwargs` 是 Playwright 的 launch kwargs(HTTP 场景填),`extra_args` 是 Chrome args(SOCKS5 场景填)。两者互斥但接口对称。

### HTTP 代理的凭证抽取

`_parse_proxy_url()` 把 `"http://user:pass@host:port"` 拆成 Playwright 想要的形式:

```python
def _parse_proxy_url(proxy: str) -> dict[str, Any]:
    normalized = proxy
    if "@" in proxy and "://" not in proxy:
        normalized = f"http://{proxy}"  # 支持 bare "user:pass@host:port"

    parsed = urlparse(normalized)
    if not parsed.username:
        return {"server": proxy}

    netloc = parsed.hostname or ""
    if parsed.port:
        netloc += f":{parsed.port}"

    server = urlunparse((parsed.scheme, netloc, parsed.path, "", "", ""))

    result: dict[str, Any] = {"server": server}
    result["username"] = unquote(parsed.username)
    if parsed.password:
        result["password"] = unquote(parsed.password)
    return result
```

Sources: [cloakbrowser/browser.py:1006-1038](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L1006-L1038)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:1006-1038`

```python
def _parse_proxy_url(proxy: str) -> dict[str, Any]:
    """Parse HTTP(S) proxy URL, extracting credentials into separate Playwright fields.

    Handles: http://user:pass@host:port -> {server: "http://host:port", username: "user", password: "pass"}
    Also handles: no credentials, URL-encoded special chars, missing port,
    and bare proxy strings without a scheme (e.g. 'user:pass@host:port' -> treated as http).

    SOCKS5 URLs are NOT handled here — they take a dedicated path via
    ``_normalize_socks_string_url`` in ``_resolve_proxy_config``.
    """
    # Bare format: "user:pass@host:port" — urlparse needs a scheme to extract credentials.
    normalized = proxy
    if "@" in proxy and "://" not in proxy:
        normalized = f"http://{proxy}"

    parsed = urlparse(normalized)

    if not parsed.username:
        return {"server": proxy}  # no creds — return original unchanged

    # Rebuild server URL without credentials
    netloc = parsed.hostname or ""
    if parsed.port:
        netloc += f":{parsed.port}"

    server = urlunparse((parsed.scheme, netloc, parsed.path, "", "", ""))

    result: dict[str, Any] = {"server": server}
    result["username"] = unquote(parsed.username)
    if parsed.password:
        result["password"] = unquote(parsed.password)

    return result
```

<!-- source-snippets:end -->
</details>

两个细节:**bare 格式支持**(`user:pass@host:port` 没 scheme 也能用,因为很多代理服务商给的就是这种形式)、**`unquote` 凭证**(用户传入的 `user%40foo` 解码成 `user@foo`,与 Playwright 接口约定一致)。

### SOCKS5 凭证 URL 重编码

SOCKS5 比 HTTP 棘手得多。`_normalize_socks_string_url()` 解决一个非常实际的 bug:Chromium 内部的 SOCKS5 URL 解析器在遇到密码中包含 `=` 等特殊字符时会截断密码(issue #157)。

```python
def _normalize_socks_string_url(url: str) -> str:
    try:
        parsed = urlparse(url)
        _ = parsed.port  # 触发 ValueError 检查
    except ValueError as e:
        logger.warning("Malformed SOCKS5 proxy URL, passing through unchanged: %s", e)
        return url

    if parsed.username is None and parsed.password is None:
        return url

    raw_user = parsed.username or ""
    enc_user = quote(unquote(raw_user), safe="") if raw_user else ""

    if parsed.password is not None:
        raw_pass = parsed.password
        enc_pass = quote(unquote(raw_pass), safe="") if raw_pass else ""
    else:
        raw_pass = None
        enc_pass = None

    normalized = _assemble_socks_url(...)

    if enc_user != raw_user or enc_pass != raw_pass:
        logger.info("Auto URL-encoded SOCKS5 proxy credentials...")

    return normalized
```

Sources: [cloakbrowser/browser.py:812-859](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L812-L859)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:812-859`

```python
def _normalize_socks_string_url(url: str) -> str:
    """Re-encode credentials in a SOCKS5 URL string so Chromium's parser doesn't
    truncate them at special chars like '='. Idempotent: pre-encoded input stays
    the same (decoded then re-encoded).

    Emits an INFO log when re-encoding actually changes the URL, so users who
    previously hit silent SOCKS5 fallback (#157) can see what the wrapper did.
    Silent on already-encoded inputs (no false-positive noise).

    On unparseable input (invalid port, broken IPv6 literal, etc.) logs a
    warning and returns the original string — preserves pre-fix pass-through
    behavior so Chromium's own error handling kicks in.
    """
    try:
        parsed = urlparse(url)
        # Accessing .port raises ValueError on invalid port strings.
        _ = parsed.port
    except ValueError as e:
        logger.warning("Malformed SOCKS5 proxy URL, passing through unchanged: %s", e)
        return url
    # Skip only if no credentials at all (username AND password both absent).
    # urlparse returns None for absent components, "" for present-but-empty.
    if parsed.username is None and parsed.password is None:
        return url
    raw_user = parsed.username or ""
    enc_user = quote(unquote(raw_user), safe="") if raw_user else ""
    # Preserve the colon separator when password component is present, even if
    # empty, so `user:@host` stays `user:@host`.
    if parsed.password is not None:
        raw_pass = parsed.password
        enc_pass = quote(unquote(raw_pass), safe="") if raw_pass else ""
    else:
        raw_pass = None
        enc_pass = None
    normalized = _assemble_socks_url(
        parsed.scheme, parsed.hostname or "", parsed.port,
        enc_user, enc_pass,
        parsed.path, parsed.params, parsed.query, parsed.fragment,
    )
    # Compare credentials, not the full URL: urlparse cosmetically lowercases
    # scheme and hostname, so a full-string compare would falsely fire on
    # `socks5://USER:pass@HOST.com:1080` even when no encoding work happened.
    if enc_user != raw_user or enc_pass != raw_pass:
        logger.info(
            "Auto URL-encoded SOCKS5 proxy credentials (special characters "
            "detected). Pre-encode the URL to suppress this notice."
        )
    return normalized
```

<!-- source-snippets:end -->
</details>

逻辑:**解码再编码,幂等**。如果用户已经预编码了,decode→encode 得到原文,不打 log;如果用户没编码,decode 是 no-op,encode 后 URL 变化,打 info 提示用户("已自动编码"——这是给用户的友好警告,让他知道发生了什么)。

注意 `parsed.password is not None` vs `parsed.password` 的区别:`socks5://user:@host` 有空 password(冒号存在),`socks5://user@host` 没 password(没冒号)。两种语义不同,Chrome 也区别对待——`_assemble_socks_url` 通过 `enc_pass=None` vs `enc_pass=""` 保留这个区别。

### JS 端的镜像实现

JS 端 `js/src/proxy.ts` 的 `normalizeSocksStringUrl` 做同样的事,但用了**手工解析而非 `new URL()`**:

```typescript
const schemeMatch = urlStr.match(/^([a-z][a-z0-9+\-.]*):\/\/(.*)$/i);
if (!schemeMatch) return urlStr;
const [, scheme, rest] = schemeMatch;
const hostStart = rest.search(/[/?#]/);
const authority = hostStart === -1 ? rest : rest.slice(0, hostStart);
const suffix = hostStart === -1 ? "" : rest.slice(hostStart);
const atIdx = authority.lastIndexOf("@");
```

Sources: [js/src/proxy.ts:104-156](../../../project-repos/cloakbrowser/js/src/proxy.ts#L104-L156)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/proxy.ts:104-156`

```typescript
export function normalizeSocksStringUrl(urlStr: string): string {
  // Split userinfo from host at the LAST '@' (RFC 3986), so a raw '@' inside
  // a password like `socks5://user:p@ss@host:1080` parses correctly. Matches
  // Python urlparse's rpartition('@') behavior.
  const schemeMatch = urlStr.match(/^([a-z][a-z0-9+\-.]*):\/\/(.*)$/i);
  if (!schemeMatch) return urlStr;
  const [, scheme, rest] = schemeMatch;
  const hostStart = rest.search(/[/?#]/);
  const authority = hostStart === -1 ? rest : rest.slice(0, hostStart);
  const suffix = hostStart === -1 ? "" : rest.slice(hostStart);
  const atIdx = authority.lastIndexOf("@");
  if (atIdx === -1) return urlStr;  // no creds
  const userinfo = authority.slice(0, atIdx);
  const hostPart = authority.slice(atIdx + 1);
  // Validate port (matches Python's urlparse().port ValueError guard).
  // Extract port after last ':' — but skip IPv6 brackets (e.g. [::1]:1080).
  const bracketEnd = hostPart.lastIndexOf("]");
  const portColonIdx = hostPart.indexOf(":", Math.max(bracketEnd, 0));
  if (portColonIdx !== -1) {
    const portStr = hostPart.slice(portColonIdx + 1);
    if (portStr && !/^\d+$/.test(portStr)) {
      console.warn(`[cloakbrowser] Malformed SOCKS5 proxy URL, passing through unchanged: invalid port`);
      return urlStr;
    }
  }
  const hostAndRest = hostPart + suffix;
  const colonIdx = userinfo.indexOf(":");
  const rawUserEnc = colonIdx === -1 ? userinfo : userinfo.slice(0, colonIdx);
  const hasPassword = colonIdx !== -1;
  const rawPassEnc = hasPassword ? userinfo.slice(colonIdx + 1) : "";
  try {
    const encUser = rawUserEnc ? encodeURIComponent(lenientDecodeURIComponent(rawUserEnc)) : "";
    const encPass = hasPassword
      ? (rawPassEnc ? encodeURIComponent(lenientDecodeURIComponent(rawPassEnc)) : "")
      : null;
    const normalized = assembleSocksUrl(scheme, encUser, encPass, hostAndRest);
    // Compare credentials, not the full URL: keeps the log condition focused
    // on real encoding work, not cosmetic differences (parity with the Python
    // implementation, which has to skip urlparse's hostname lowercasing).
    const credsChanged = encUser !== rawUserEnc
      || (hasPassword ? encPass !== rawPassEnc : false);
    if (credsChanged) {
      console.info(
        "[cloakbrowser] Auto URL-encoded SOCKS5 proxy credentials (special " +
        "characters detected). Pre-encode the URL to suppress this notice.",
      );
    }
    return normalized;
  } catch (e) {
    console.warn(`[cloakbrowser] Could not normalize SOCKS5 proxy URL, passing through unchanged: ${(e as Error).message}`);
    return urlStr;
  }
}
```

<!-- source-snippets:end -->
</details>

为什么不用 WHATWG URL?——`new URL().username = "x"` 的 setter 会再编码一次,decode-then-encode 的幂等性被破坏。手工解析虽然啰嗦,但行为与 Python 端 `urllib.parse` 严格一致——这是双 SDK 必须保持的契约。

## GeoIP 解析:一次 HTTP 调用,三个产物

`maybe_resolve_geoip()` 是 GeoIP 链路的入口:

```python
def maybe_resolve_geoip(geoip, proxy, timezone, locale) -> tuple[str | None, str | None, str | None]:
    if not geoip or not proxy:
        return timezone, locale, None

    from .geoip import resolve_proxy_exit_ip, resolve_proxy_geo_with_ip

    proxy_url = _extract_proxy_url(proxy)
    if not proxy_url:
        return timezone, locale, None

    if timezone is not None and locale is not None:
        exit_ip = resolve_proxy_exit_ip(proxy_url)
        return timezone, locale, exit_ip

    geo_tz, geo_locale, exit_ip = resolve_proxy_geo_with_ip(proxy_url)
    if timezone is None:
        timezone = geo_tz
    if locale is None:
        locale = geo_locale
    return timezone, locale, exit_ip
```

Sources: [cloakbrowser/browser.py:880-910](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L880-L910)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:880-910`

```python
def maybe_resolve_geoip(
    geoip: bool,
    proxy: str | ProxySettings | None,
    timezone: str | None,
    locale: str | None,
) -> tuple[str | None, str | None, str | None]:
    """Auto-fill timezone/locale from proxy IP when geoip is enabled.

    Returns ``(timezone, locale, exit_ip)``.  *exit_ip* is a free bonus
    from the geoip lookup (no extra HTTP call) — used for WebRTC spoofing.
    """
    if not geoip or not proxy:
        return timezone, locale, None

    from .geoip import resolve_proxy_exit_ip, resolve_proxy_geo_with_ip

    proxy_url = _extract_proxy_url(proxy)
    if not proxy_url:
        return timezone, locale, None

    # When both tz/locale are explicit, still resolve exit IP for WebRTC
    if timezone is not None and locale is not None:
        exit_ip = resolve_proxy_exit_ip(proxy_url)
        return timezone, locale, exit_ip

    geo_tz, geo_locale, exit_ip = resolve_proxy_geo_with_ip(proxy_url)
    if timezone is None:
        timezone = geo_tz
    if locale is None:
        locale = geo_locale
    return timezone, locale, exit_ip
```

<!-- source-snippets:end -->
</details>

两条路径:

1. **timezone 与 locale 都已显式提供** → 跳过 GeoIP 数据库查询,只解 exit_ip(用于 WebRTC)。这是优化——既然用户已经知道时区/语言,就不需要查 mmdb 了
2. **任一为 None** → 完整 GeoIP 解析,顺便拿 exit_ip

### exit IP 是免费的

`resolve_proxy_geo_with_ip()` 内部:

```python
ip = _resolve_exit_ip(proxy_url, timeout=...)
if ip is None and not _deadline_expired(deadline):
    ip = _resolve_proxy_ip(proxy_url)  # fallback: 代理 hostname 本身

with geoip2.database.Reader(str(db_path)) as reader:
    resp = reader.city(ip)
    timezone = resp.location.time_zone
    country = resp.country.iso_code
    locale = COUNTRY_LOCALE_MAP.get(country) if country else None
    return timezone, locale, ip
```

Sources: [cloakbrowser/geoip.py:64-109](../../../project-repos/cloakbrowser/cloakbrowser/geoip.py#L64-L109)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/geoip.py:64-109`

```python
def resolve_proxy_geo_with_ip(
    proxy_url: str,
) -> tuple[str | None, str | None, str | None]:
    """Resolve timezone, locale, and exit IP from a proxy.

    Returns ``(timezone, locale, exit_ip)``.  The exit IP is a free bonus
    from the lookup — reused for WebRTC spoofing without an extra HTTP call.
    """
    try:
        import geoip2.database  # noqa: F811
    except ImportError:
        raise ImportError(
            "geoip2 is required for geoip=True. Install it with:\n"
            "  pip install cloakbrowser[geoip]"
        ) from None

    db_path = _ensure_geoip_db()
    if db_path is None:
        return None, None, None

    timeout = _get_geoip_timeout_seconds()
    deadline = _deadline_from_timeout(timeout)

    # Exit IP (through proxy) is most accurate — gateway DNS may differ from exit
    ip = _resolve_exit_ip(proxy_url, timeout=_remaining_seconds(deadline))
    if ip is None and not _deadline_expired(deadline):
        ip = _resolve_proxy_ip(proxy_url)
    if ip is None or _deadline_expired(deadline):
        if deadline is not None and _deadline_expired(deadline):
            logger.warning("GeoIP resolution timed out after %.1fs; continuing without GeoIP", timeout)
        return None, None, None

    try:
        with geoip2.database.Reader(str(db_path)) as reader:
            resp = reader.city(ip)
            timezone = resp.location.time_zone
            country = resp.country.iso_code
            locale = COUNTRY_LOCALE_MAP.get(country) if country else None
            logger.debug(
                "GeoIP: %s → tz=%s, country=%s, locale=%s",
                ip, timezone, country, locale,
            )
            return timezone, locale, ip
    except Exception as exc:
        logger.warning("GeoIP lookup failed for %s: %s", ip, exc)
        return None, None, ip
```

<!-- source-snippets:end -->
</details>

exit IP 通过实际的 HTTP 调用 `ipify.org` 等服务获得,而不是简单解析代理 hostname。**为什么这一步必不可少?** —— 代理 hostname 可能不是真正的出口 IP。例如代理网关在 IP A,但实际经它出去访问外部的报文走 IP B(常见于 cloud-based 代理池、residential proxy);DNS 解析 hostname 得到 A,但 fingerprinter 看到的是 B。**只有从代理实际出去的 HTTP 报文回来的源 IP,才是真正的 exit_ip**。

### `_IP_ECHO_URLS`:三选一容错

```python
_IP_ECHO_URLS = [
    "https://api.ipify.org",
    "https://checkip.amazonaws.com",
    "https://ifconfig.me/ip",
]
```

Sources: [cloakbrowser/geoip.py:156-161](../../../project-repos/cloakbrowser/cloakbrowser/geoip.py#L156-L161)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/geoip.py:156-161`

```python
# IP echo services — fast, no auth, return just the IP
_IP_ECHO_URLS = [
    "https://api.ipify.org",
    "https://checkip.amazonaws.com",
    "https://ifconfig.me/ip",
]
```

<!-- source-snippets:end -->
</details>

三个服务串行尝试,第一个返回的就用。这种冗余很重要:任一服务被代理 ASN 屏蔽,或暂时挂掉,都不应该让 launch 失败。

### COUNTRY_LOCALE_MAP:50+ 国家映射

```python
COUNTRY_LOCALE_MAP: dict[str, str] = {
    "US": "en-US", "GB": "en-GB", "AU": "en-AU", "CA": "en-CA", "NZ": "en-NZ",
    "DE": "de-DE", "AT": "de-AT", "CH": "de-CH",
    "FR": "fr-FR", "BE": "fr-BE",
    "JP": "ja-JP", "KR": "ko-KR", "CN": "zh-CN", "TW": "zh-TW", "HK": "zh-HK",
    # ... 50+ 条
}
```

Sources: [cloakbrowser/geoip.py:36-51](../../../project-repos/cloakbrowser/cloakbrowser/geoip.py#L36-L51)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/geoip.py:36-51`

```python
COUNTRY_LOCALE_MAP: dict[str, str] = {
    "US": "en-US", "GB": "en-GB", "AU": "en-AU", "CA": "en-CA", "NZ": "en-NZ",
    "IE": "en-IE", "ZA": "en-ZA", "SG": "en-SG",
    "DE": "de-DE", "AT": "de-AT", "CH": "de-CH",
    "FR": "fr-FR", "BE": "fr-BE",
    "ES": "es-ES", "MX": "es-MX", "AR": "es-AR", "CO": "es-CO", "CL": "es-CL",
    "BR": "pt-BR", "PT": "pt-PT",
    "IT": "it-IT", "NL": "nl-NL",
    "JP": "ja-JP", "KR": "ko-KR", "CN": "zh-CN", "TW": "zh-TW", "HK": "zh-HK",
    "RU": "ru-RU", "UA": "uk-UA", "PL": "pl-PL", "CZ": "cs-CZ", "RO": "ro-RO",
    "IL": "he-IL", "TR": "tr-TR", "SA": "ar-SA", "AE": "ar-AE", "EG": "ar-EG",
    "IN": "hi-IN", "ID": "id-ID", "PH": "en-PH",
    "TH": "th-TH", "VN": "vi-VN", "MY": "ms-MY",
    "SE": "sv-SE", "NO": "nb-NO", "DK": "da-DK", "FI": "fi-FI",
    "GR": "el-GR", "HU": "hu-HU", "BG": "bg-BG",
}
```

<!-- source-snippets:end -->
</details>

注意几个有意思的映射:**BE → fr-BE**(比利时主要选法语而非荷兰语,因为法语区在线流量更多)、**HK → zh-HK**(香港繁体中文)、**CH → de-CH**(瑞士选德语区作主语言)。这些选择带有"流量加权"的工程判断,而非严格的政治正确——目的是让伪装看起来更典型。

### 超时与 deadline 模型

GeoIP 解析整体有超时上限,通过 `CLOAKBROWSER_GEOIP_TIMEOUT_SECONDS` 配置(默认 5 秒)。`_deadline_from_timeout` 把这个 timeout 转成一个 `monotonic` deadline,后续每一步检查剩余时间:

```python
deadline = _deadline_from_timeout(timeout)
ip = _resolve_exit_ip(proxy_url, timeout=_remaining_seconds(deadline))
if ip is None and not _deadline_expired(deadline):
    ip = _resolve_proxy_ip(proxy_url)
if ip is None or _deadline_expired(deadline):
    return None, None, None
```

Sources: [cloakbrowser/geoip.py:84-94](../../../project-repos/cloakbrowser/cloakbrowser/geoip.py#L84-L94)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/geoip.py:84-94`

```python
    timeout = _get_geoip_timeout_seconds()
    deadline = _deadline_from_timeout(timeout)

    # Exit IP (through proxy) is most accurate — gateway DNS may differ from exit
    ip = _resolve_exit_ip(proxy_url, timeout=_remaining_seconds(deadline))
    if ip is None and not _deadline_expired(deadline):
        ip = _resolve_proxy_ip(proxy_url)
    if ip is None or _deadline_expired(deadline):
        if deadline is not None and _deadline_expired(deadline):
            logger.warning("GeoIP resolution timed out after %.1fs; continuing without GeoIP", timeout)
        return None, None, None
```

<!-- source-snippets:end -->
</details>

**为什么 monotonic 而非 wall clock?** —— 系统时钟可能 NTP 跳变,造成 deadline 早到或迟到。`time.monotonic()` 不可回退,deadline 始终可靠。

**为什么要 deadline 而非简单的 HTTP timeout?** —— 因为 GeoIP 是"HTTP 请求 + 数据库 mmdb 查询"两步,任一步慢都会卡 launch。0.3.28 的 #213 issue 修复就是这个:不加 deadline 时,慢代理会让 launch 永久挂起。

## GeoIP 数据库管理

`_ensure_geoip_db()` 处理 mmdb 文件的生命周期:

```python
GEOIP_DB_URL = "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb"
GEOIP_UPDATE_INTERVAL = 30 * 86_400  # 30 天

def _ensure_geoip_db() -> Path | None:
    db_path = _get_geoip_dir() / GEOIP_DB_FILENAME

    if db_path.exists():
        _maybe_trigger_update(db_path)  # 30 天以上后台更新
        return db_path

    _download_geoip_db(db_path)  # 首次下载,~70MB
    return db_path
```

Sources: [cloakbrowser/geoip.py:244-263](../../../project-repos/cloakbrowser/cloakbrowser/geoip.py#L244-L263)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/geoip.py:244-263`

```python
def _get_geoip_dir() -> Path:
    from .config import get_cache_dir

    return get_cache_dir() / "geoip"


def _ensure_geoip_db() -> Path | None:
    """Return path to GeoLite2-City.mmdb, downloading on first use."""
    db_path = _get_geoip_dir() / GEOIP_DB_FILENAME

    if db_path.exists():
        _maybe_trigger_update(db_path)
        return db_path

    try:
        _download_geoip_db(db_path)
        return db_path
    except Exception as exc:
        logger.warning("Failed to download GeoIP database: %s", exc)
        return None
```

<!-- source-snippets:end -->
</details>

几个亮点:

- **数据源**:用 P3TERX 的镜像,不直接走 MaxMind 官网(避免要 license key)
- **首次下载**:在 `geoip=True` 第一次被触发时下载,~70MB
- **30 天后台更新**:不阻塞 launch,在后台线程拉新版,失败静默(log debug)
- **原子 rename**:先写 `.tmp` 文件再 `rename()`——确保部分下载不污染主文件

## WebRTC IP 一致性:消除最后一个 vector

`_resolve_webrtc_args()` 处理 `--fingerprint-webrtc-ip=auto` 的二级解析:

```python
def _resolve_webrtc_args(args, proxy):
    if not args:
        return args
    idx = None
    for i, a in enumerate(args):
        if a == "--fingerprint-webrtc-ip=auto":
            idx = i
            break
    if idx is None:
        return args

    proxy_url = _extract_proxy_url(proxy)
    if not proxy_url:
        logger.warning("--fingerprint-webrtc-ip=auto requires a proxy; removing flag")
        args = list(args)
        del args[idx]
        return args

    try:
        from .geoip import resolve_proxy_exit_ip
        exit_ip = resolve_proxy_exit_ip(proxy_url)
    except Exception:
        logger.warning("Failed to resolve proxy exit IP for WebRTC spoofing; removing --fingerprint-webrtc-ip=auto")
        args = list(args)
        del args[idx]
        return args

    if exit_ip:
        args = list(args)
        args[idx] = f"--fingerprint-webrtc-ip={exit_ip}"
    else:
        logger.warning("Could not resolve proxy exit IP for WebRTC spoofing; removing --fingerprint-webrtc-ip=auto")
        args = list(args)
        del args[idx]
    return args
```

Sources: [cloakbrowser/browser.py:913-951](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L913-L951)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:913-951`

```python
def _resolve_webrtc_args(
    args: list[str] | None,
    proxy: str | ProxySettings | None,
) -> list[str] | None:
    """Replace --fingerprint-webrtc-ip=auto with the resolved proxy exit IP.

    Returns args unchanged if no ``auto`` value is present.
    """
    if not args:
        return args
    idx = None
    for i, a in enumerate(args):
        if a == "--fingerprint-webrtc-ip=auto":
            idx = i
            break
    if idx is None:
        return args
    proxy_url = _extract_proxy_url(proxy)
    if not proxy_url:
        logger.warning("--fingerprint-webrtc-ip=auto requires a proxy; removing flag")
        args = list(args)
        del args[idx]
        return args
    try:
        from .geoip import resolve_proxy_exit_ip
        exit_ip = resolve_proxy_exit_ip(proxy_url)
    except Exception:
        logger.warning("Failed to resolve proxy exit IP for WebRTC spoofing; removing --fingerprint-webrtc-ip=auto")
        args = list(args)
        del args[idx]
        return args
    if exit_ip:
        args = list(args)
        args[idx] = f"--fingerprint-webrtc-ip={exit_ip}"
    else:
        logger.warning("Could not resolve proxy exit IP for WebRTC spoofing; removing --fingerprint-webrtc-ip=auto")
        args = list(args)
        del args[idx]
    return args
```

<!-- source-snippets:end -->
</details>

`auto` 是 wrapper 层的关键字,Chromium 不认识——所以 wrapper 必须在 launch 前把它替换成具体 IP。两个失败路径都不阻塞 launch:**没代理或解析失败时移除 flag 而非抛错**——WebRTC 改写是"加分项"而不是"必需项"。

## 双 SDK 行为一致性

Python 端 `geoip.py` 与 JS 端 `js/src/geoip.ts` 实现等价。一个让人微笑的细节:**JS 端为了与 Python 行为一致,主动绕开了 WHATWG URL 的部分 setter**:

```typescript
// Compare credentials, not the full URL: keeps the log condition focused
// on real encoding work, not cosmetic differences (parity with the Python
// implementation, which has to skip urlparse's hostname lowercasing).
const credsChanged = encUser !== rawUserEnc
  || (hasPassword ? encPass !== rawPassEnc : false);
```

Sources: [js/src/proxy.ts:143-150](../../../project-repos/cloakbrowser/js/src/proxy.ts#L143-L150)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/proxy.ts:143-150`

```typescript
    const credsChanged = encUser !== rawUserEnc
      || (hasPassword ? encPass !== rawPassEnc : false);
    if (credsChanged) {
      console.info(
        "[cloakbrowser] Auto URL-encoded SOCKS5 proxy credentials (special " +
        "characters detected). Pre-encode the URL to suppress this notice.",
      );
    }
```

<!-- source-snippets:end -->
</details>

**Python 的 `urlparse()` 不会改大小写**,但 WHATWG URL 会把 hostname 转小写。如果 JS 端直接比较"原 URL"vs"重编码后 URL",会被 hostname 大小写差异误触 log。JS 端选择只比较凭证部分——与 Python 端对齐到"只有当凭证真的被编码改写时才打 log"。

这种"为对偶严格性而做的反工程"在双 SDK 项目中非常珍贵——少有项目会为了一句 log 的行为对齐做手动 URL 解析。

## 几个用户可能踩的坑

**1. `geoip=True` 需要单独安装依赖**

```bash
pip install cloakbrowser[geoip]
```

否则 `import geoip2.database` 抛 `ImportError`,被 wrapper 转为友好提示:

```python
except ImportError:
    raise ImportError(
        "geoip2 is required for geoip=True. Install it with:\n"
        "  pip install cloakbrowser[geoip]"
    ) from None
```

Sources: [cloakbrowser/geoip.py:73-78](../../../project-repos/cloakbrowser/cloakbrowser/geoip.py#L73-L78)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/geoip.py:73-78`

```python
        import geoip2.database  # noqa: F811
    except ImportError:
        raise ImportError(
            "geoip2 is required for geoip=True. Install it with:\n"
            "  pip install cloakbrowser[geoip]"
        ) from None
```

<!-- source-snippets:end -->
</details>

**2. SOCKS5 代理 + GeoIP 需要 socksio**

```python
except httpx.UnsupportedProtocol:
    logger.warning(
        "SOCKS5 proxy requires socksio: pip install cloakbrowser[geoip]"
    )
    return None
```

Sources: [cloakbrowser/geoip.py:228-232](../../../project-repos/cloakbrowser/cloakbrowser/geoip.py#L228-L232)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/geoip.py:228-232`

```python
        except httpx.UnsupportedProtocol:
            logger.warning(
                "SOCKS5 proxy requires socksio: pip install cloakbrowser[geoip]"
            )
            return None
```

<!-- source-snippets:end -->
</details>

`cloakbrowser[geoip]` 同时拉 `socksio`,所以一条 install 命令就够。

**3. WebRTC IP 与显式 IP 冲突时,显式赢**

```python
if exit_ip and not (args and any(a.startswith("--fingerprint-webrtc-ip") for a in args)):
    args = list(args or [])
    args.append(f"--fingerprint-webrtc-ip={exit_ip}")
```

Sources: [cloakbrowser/browser.py:112-114](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L112-L114)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:112-114`

```python
    if exit_ip and not (args and any(a.startswith("--fingerprint-webrtc-ip") for a in args)):
        args = list(args or [])
        args.append(f"--fingerprint-webrtc-ip={exit_ip}")
```

<!-- source-snippets:end -->
</details>

如果用户已经显式传了 `args=["--fingerprint-webrtc-ip=1.2.3.4"]`,即使 geoip 解析到 exit_ip,也不会覆盖——尊重用户显式选择。

**4. 显式 timezone 总是赢**

`maybe_resolve_geoip` 内部:`if timezone is None: timezone = geo_tz`——只在用户没传时用 GeoIP 结果。这意味着 `launch(proxy=..., geoip=True, timezone="Europe/London")` 永远用 `Europe/London`,即使代理在 US。

## 相关页面

- [启动 API:四象限对偶](launch-api.md) — proxy / geoip 参数如何流过各个 launch 函数
- [隐身引擎与指纹系统](stealth-engine.md) — `--fingerprint-*` flag 体系
- [cloakserve CDP 多路复用器](cloakserve-cdp-multiplexer.md) — cloakserve 中复用同一套代理逻辑


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [cloakbrowser/human/__init__.py](../../../project-repos/cloakbrowser/cloakbrowser/human/__init__.py)
- [cloakbrowser/human/config.py](../../../project-repos/cloakbrowser/cloakbrowser/human/config.py)
- [cloakbrowser/human/mouse.py](../../../project-repos/cloakbrowser/cloakbrowser/human/mouse.py)
- [cloakbrowser/human/keyboard.py](../../../project-repos/cloakbrowser/cloakbrowser/human/keyboard.py)
- [cloakbrowser/human/scroll.py](../../../project-repos/cloakbrowser/cloakbrowser/human/scroll.py)
- [js/src/human/index.ts](../../../project-repos/cloakbrowser/js/src/human/index.ts)
- [js/src/human/config.ts](../../../project-repos/cloakbrowser/js/src/human/config.ts)

</details>

# 拟人化行为层

源码级 fingerprint 补丁让 CloakBrowser 在静态信号上通过反爬,但**行为信号**——鼠标移动轨迹、键盘按键时序、滚动节奏——是另一道独立防线。Akamai、Cloudflare、Datadome 等高级反爬都会做行为指纹分析:`page.click()` 这种瞬间从 (0,0) 跳到目标坐标的鼠标轨迹、`page.fill()` 这种"瞬间填满整个输入框"的键盘行为,会被识别为脚本。

`humanize=True` 是 CloakBrowser 的第二道防线:一组对 Playwright/Puppeteer 方法的运行时 patch,把所有"人类可见的交互"替换成时序合理、轨迹自然的版本。架构上它**不**改 binary,完全在 wrapper 层用 Python/TypeScript 实现;但为了避免被反爬通过"调用栈含 evaluate"识破,它在某些场景下会绕回 CDP Isolated World——下文详述。

## 一个直观对比

```mermaid
flowchart LR
    subgraph Default["默认 Playwright"]
        D1["page.click(sel)<br/>瞬间跳到坐标"]
        D2["page.fill('xxx')<br/>瞬间填满"]
        D3["page.mouse.wheel(0, -1000)<br/>一次性滚动"]
    end
    subgraph Humanized["humanize=True"]
        H1["Bezier 曲线移动<br/>带 wobble + overshoot"]
        H2["按键级时序<br/>shift down/up 分开<br/>含 mistype 概率"]
        H3["加速 → 巡航 → 减速<br/>每次只滚 20-40px<br/>偶尔 overshoot 回弹"]
    end

    D1 -.patch.-> H1
    D2 -.patch.-> H2
    D3 -.patch.-> H3
```

在 deviceandbrowserinfo.com 行为检测上,默认配置下 24 个行为信号全部失败;开启 `humanize=True` 后 24/24 全过。

## 三层补丁:Browser → Context → Page

`patch_browser()` 是入口,它沿对象树往下,把所有现有与未来的 page 都纳管:

```python
def patch_browser(browser: Any, cfg: HumanConfig) -> None:
    for context in browser.contexts:
        patch_context(context, cfg)

    orig_new_context = browser.new_context
    def _patched_new_context(**kwargs: Any) -> Any:
        context = orig_new_context(**kwargs)
        patch_context(context, cfg)
        return context
    browser.new_context = _patched_new_context

    orig_new_page = browser.new_page
    def _patched_new_page(**kwargs: Any) -> Any:
        page = orig_new_page(**kwargs)
        if not hasattr(page, '_original'):
            patch_page(page, cfg, _CursorState())
        return page
    browser.new_page = _patched_new_page
```

Sources: [cloakbrowser/human/__init__.py:1524-1545](../../../project-repos/cloakbrowser/cloakbrowser/human/__init__.py#L1524-L1545)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/__init__.py:1524-1545`

```python
def patch_browser(browser: Any, cfg: HumanConfig) -> None:
    for context in browser.contexts:
        patch_context(context, cfg)

    orig_new_context = browser.new_context

    def _patched_new_context(**kwargs: Any) -> Any:
        context = orig_new_context(**kwargs)
        patch_context(context, cfg)
        return context

    browser.new_context = _patched_new_context

    orig_new_page = browser.new_page

    def _patched_new_page(**kwargs: Any) -> Any:
        page = orig_new_page(**kwargs)
        if not hasattr(page, '_original'):
            patch_page(page, cfg, _CursorState())
        return page

    browser.new_page = _patched_new_page
```

<!-- source-snippets:end -->
</details>

三层递归一气呵成:

1. **patch_browser** 覆盖所有现有 context + 给 `browser.new_context` 挂钩
2. **patch_context** 覆盖所有现有 page + 监听 `'page'` 事件 + 给 `context.new_page` 挂钩
3. **patch_page** 给具体 Page 对象上 patch:`click`/`type`/`fill`/`hover`/`dblclick` 以及 `mouse.*` / `keyboard.*`

每个被 patch 的 page 上挂一个 `page._original` 对象——保留原始方法引用,用户可以通过 `page._original.click(sel)` 强制走原版(用于性能敏感场景)。

```mermaid
flowchart TD
    BROWSER["Browser"]
    CTX1["Context A"]
    CTX2["Context B"]
    PAGE1["Page 1"]
    PAGE2["Page 2"]
    PAGE3["Page 3"]
    CURSOR["_CursorState<br/>(x, y, initialized)"]
    METHODS["patched methods:<br/>click / type / fill / hover<br/>mouse.move / mouse.wheel<br/>keyboard.down / .up / .type"]

    BROWSER -->|patch_context| CTX1
    BROWSER -->|patch_context| CTX2
    CTX1 -->|patch_page| PAGE1
    CTX1 -->|patch_page| PAGE2
    CTX2 -->|patch_page| PAGE3
    PAGE1 --> CURSOR
    PAGE1 --> METHODS
    PAGE2 --> CURSOR
    PAGE2 --> METHODS
    PAGE3 --> CURSOR
    PAGE3 --> METHODS
```

注意每个 Page 有自己的 `_CursorState`,但**同一 Context 内多个 page 共享一个 cursor**——这模拟人类用户:同一个浏览器窗口里切换 tab,鼠标位置保持连续。

Sources: [cloakbrowser/human/__init__.py:1507-1521](../../../project-repos/cloakbrowser/cloakbrowser/human/__init__.py#L1507-L1521)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/__init__.py:1507-1521`

```python
def patch_context(context: Any, cfg: HumanConfig) -> None:
    cursor = _CursorState()
    for page in context.pages:
        patch_page(page, cfg, cursor)
    context.on("page", lambda p: patch_page(p, cfg, _CursorState()) if not hasattr(p, '_original') else None)

    orig_new_page = context.new_page

    def _patched_new_page(**kwargs: Any) -> Any:
        page = orig_new_page(**kwargs)
        if not hasattr(page, '_original'):
            patch_page(page, cfg, _CursorState())
        return page

    context.new_page = _patched_new_page
```

<!-- source-snippets:end -->
</details>

## 鼠标:Bezier 曲线 + Wobble + Overshoot

`human_move()` 把"从 (start_x, start_y) 到 (end_x, end_y)"分解成多步插值:

```python
def human_move(raw, start_x, start_y, end_x, end_y, cfg):
    dist = math.hypot(end_x - start_x, end_y - start_y)
    if dist < 1:
        return

    steps = max(cfg.mouse_min_steps, min(cfg.mouse_max_steps, round(dist / cfg.mouse_steps_divisor)))
    start = Point(start_x, start_y)
    end = Point(end_x, end_y)
    cp1, cp2 = _random_control_points(start, end)

    for i in range(steps + 1):
        progress = i / steps
        eased_t = _ease_in_out(progress)
        pt = _bezier(start, cp1, cp2, end, eased_t)

        wobble_amp = math.sin(math.pi * progress) * cfg.mouse_wobble_max
        wx = pt.x + (random.random() - 0.5) * 2 * wobble_amp
        wy = pt.y + (random.random() - 0.5) * 2 * wobble_amp

        raw.move(round(wx), round(wy))

        burst_counter += 1
        if burst_counter >= burst_size and i < steps:
            sleep_ms(rand_range(cfg.mouse_burst_pause))
            burst_counter = 0

    if random.random() < cfg.mouse_overshoot_chance:
        # 超过目标一点点,再回拉
        ...
```

Sources: [cloakbrowser/human/mouse.py:58-99](../../../project-repos/cloakbrowser/cloakbrowser/human/mouse.py#L58-L99)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/mouse.py:58-99`

```python
def human_move(
    raw: RawMouse,
    start_x: float, start_y: float,
    end_x: float, end_y: float,
    cfg: HumanConfig,
) -> None:
    dist = math.hypot(end_x - start_x, end_y - start_y)
    if dist < 1:
        return

    steps = max(cfg.mouse_min_steps, min(cfg.mouse_max_steps, round(dist / cfg.mouse_steps_divisor)))
    start = Point(start_x, start_y)
    end = Point(end_x, end_y)
    cp1, cp2 = _random_control_points(start, end)

    burst_counter = 0
    burst_size = rand_int_range(cfg.mouse_burst_size)

    for i in range(steps + 1):
        progress = i / steps
        eased_t = _ease_in_out(progress)
        pt = _bezier(start, cp1, cp2, end, eased_t)

        wobble_amp = math.sin(math.pi * progress) * cfg.mouse_wobble_max
        wx = pt.x + (random.random() - 0.5) * 2 * wobble_amp
        wy = pt.y + (random.random() - 0.5) * 2 * wobble_amp

        raw.move(round(wx), round(wy))

        burst_counter += 1
        if burst_counter >= burst_size and i < steps:
            sleep_ms(rand_range(cfg.mouse_burst_pause))
            burst_counter = 0

    if random.random() < cfg.mouse_overshoot_chance:
        overshoot_dist = rand_range(cfg.mouse_overshoot_px)
        angle = math.atan2(end_y - start_y, end_x - start_x)
        raw.move(round(end_x + math.cos(angle) * overshoot_dist),
                 round(end_y + math.sin(angle) * overshoot_dist))
        sleep_ms(rand(30, 70))
        raw.move(round(end_x + (random.random() - 0.5) * 4),
                 round(end_y + (random.random() - 0.5) * 4))
```

<!-- source-snippets:end -->
</details>

四个让人类似真人的技法叠在一起:

| 技法 | 实现 | 模拟的人类特征 |
|---|---|---|
|**Cubic Bezier 主路径**|`_bezier(p0, cp1, cp2, p3, t)` 三次曲线,控制点位于路径两端的 25% 与 75% 处,偏移随机 -0.3~0.3 倍距离 | 真人不走直线,手会沿弧线移动 |
|**Easing**|`_ease_in_out(t)`:开始慢、中间快、结束慢的 cubic ease | 真人手部加速→匀速→减速 |
|**Wobble**|每步加 sin 包络的小随机噪声(峰值 1.5px) | 真人手部不稳,有小抖动 |
|**Overshoot**|15% 概率移动到目标外 3-6px,停顿后回到附近 | 真人鼠标常常冲过目标再修正 |

**Burst pause** 是第五个细节:每 3-5 个 step 暂停 8-18ms。这反映了真实鼠标事件流——硬件 USB 中断 + OS 调度的天然不均匀,而不是匀速的 step。

### click 不是 move 之后的瞬间点击

`human_click()` 把"点击"拆成 aim_delay + mouse_down + hold + mouse_up:

```python
def human_click(raw, is_input, cfg):
    aim_delay = rand_range(cfg.click_aim_delay_input) if is_input else rand_range(cfg.click_aim_delay_button)
    sleep_ms(aim_delay)
    hold_time = rand_range(cfg.click_hold_input) if is_input else rand_range(cfg.click_hold_button)
    raw.down()
    sleep_ms(hold_time)
    raw.up()
```

Sources: [cloakbrowser/human/mouse.py:113-119](../../../project-repos/cloakbrowser/cloakbrowser/human/mouse.py#L113-L119)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/mouse.py:113-119`

```python
def human_click(raw: RawMouse, is_input: bool, cfg: HumanConfig) -> None:
    aim_delay = rand_range(cfg.click_aim_delay_input) if is_input else rand_range(cfg.click_aim_delay_button)
    sleep_ms(aim_delay)
    hold_time = rand_range(cfg.click_hold_input) if is_input else rand_range(cfg.click_hold_button)
    raw.down()
    sleep_ms(hold_time)
    raw.up()
```

<!-- source-snippets:end -->
</details>

`aim_delay`:鼠标到位后停顿 60-200ms,模拟"瞄准"。`hold_time`:按下到松开间隔 40-150ms,而非瞬间。`is_input` 区分点击输入框(更短)与按钮(更长)——人类点输入框是"我要开始打字"的轻按,点按钮是"我决定要执行"的稍重按。

### 点击坐标不是中心

`click_target()` 决定点击落点:

```python
def click_target(box, is_input, cfg) -> Point:
    if is_input:
        x_frac = rand_range(cfg.click_input_x_range)  # 输入框左侧 5%-30%
        y_frac = rand(0.30, 0.70)
    else:
        x_frac = rand(0.35, 0.65)  # 按钮中心区 30%-70%
        y_frac = rand(0.35, 0.65)
    return Point(round(box["x"] + box["width"] * x_frac),
                 round(box["y"] + box["height"] * y_frac))
```

Sources: [cloakbrowser/human/mouse.py:102-110](../../../project-repos/cloakbrowser/cloakbrowser/human/mouse.py#L102-L110)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/mouse.py:102-110`

```python
def click_target(box: dict, is_input: bool, cfg: HumanConfig) -> Point:
    if is_input:
        x_frac = rand_range(cfg.click_input_x_range)
        y_frac = rand(0.30, 0.70)
    else:
        x_frac = rand(0.35, 0.65)
        y_frac = rand(0.35, 0.65)
    return Point(round(box["x"] + box["width"] * x_frac),
                 round(box["y"] + box["height"] * y_frac))
```

<!-- source-snippets:end -->
</details>

**输入框默认点左侧 5-30%**——真人点输入框是把光标放在前面准备打字,不会点中心;按钮则正中心区域。这种细微差异让反爬的"统计落点分布"算法很难抓——脚本通常点中心,真人不会。

## 键盘:按键级时序 + Mistype + CDP 反检测

`human_type()` 逐字符模拟键盘:

```python
def human_type(page, raw, text, cfg, cdp_session=None):
    for i, ch in enumerate(text):
        if not ch.isascii():
            sleep_ms(rand_range(cfg.key_hold))
            raw.insert_text(ch)  # 非 ASCII 走 insertText
            if i < len(text) - 1:
                _inter_char_delay(cfg)
            continue

        if random.random() < cfg.mistype_chance and ch.isalnum():
            wrong = _get_nearby_key(ch)
            _type_normal_char(raw, wrong, cfg)
            sleep_ms(rand_range(cfg.mistype_delay_notice))
            raw.down("Backspace")
            sleep_ms(rand_range(cfg.key_hold))
            raw.up("Backspace")
            sleep_ms(rand_range(cfg.mistype_delay_correct))

        if ch.isupper() and ch.isalpha():
            _type_shifted_char(page, raw, ch, cfg)
        elif ch in SHIFT_SYMBOLS:
            _type_shift_symbol(page, raw, ch, cfg, cdp_session)
        else:
            _type_normal_char(raw, ch, cfg)

        if i < len(text) - 1:
            _inter_char_delay(cfg)
```

Sources: [cloakbrowser/human/keyboard.py:66-105](../../../project-repos/cloakbrowser/cloakbrowser/human/keyboard.py#L66-L105)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/keyboard.py:66-105`

```python
def human_type(
    page: Any, raw: RawKeyboard, text: str, cfg: HumanConfig,
    cdp_session: Any = None,
) -> None:
    """Type text with human-like per-character timing.

    Args:
        cdp_session: If provided, shift symbols use CDP Input.dispatchKeyEvent
            producing isTrusted=true events with no evaluate stack trace.
            If None, falls back to page.evaluate (detectable).
    """
    for i, ch in enumerate(text):
        # Non-ASCII characters (Cyrillic, CJK, emoji) — use insertText
        if not ch.isascii():
            sleep_ms(rand_range(cfg.key_hold))
            raw.insert_text(ch)
            if i < len(text) - 1:
                _inter_char_delay(cfg)
            continue

        # Mistype chance — only for ASCII alphanumeric
        if random.random() < cfg.mistype_chance and ch.isalnum():
            wrong = _get_nearby_key(ch)
            _type_normal_char(raw, wrong, cfg)
            sleep_ms(rand_range(cfg.mistype_delay_notice))
            raw.down("Backspace")
            sleep_ms(rand_range(cfg.key_hold))
            raw.up("Backspace")
            sleep_ms(rand_range(cfg.mistype_delay_correct))

        if ch.isupper() and ch.isalpha():
            _type_shifted_char(page, raw, ch, cfg)
        elif ch in SHIFT_SYMBOLS:
            _type_shift_symbol(page, raw, ch, cfg, cdp_session)
        else:
            _type_normal_char(raw, ch, cfg)

        if i < len(text) - 1:
            _inter_char_delay(cfg)

```

<!-- source-snippets:end -->
</details>

四类字符不同处理:

|字符类型|处理|
|---|---|
|普通 ASCII|`down → hold(15-35ms) → up`|
|大写字母|`Shift down → wait → key down → hold → key up → wait → Shift up`|
|Shift 符号 `!@#$%^&*...`|与大写类似,但走 CDP `Input.dispatchKeyEvent`(详见下)|
|非 ASCII(中文/俄文/emoji)|`raw.insert_text(ch)` 直接 CDP `Input.insertText`|

### Mistype:2% 概率的错敲与回退

`mistype_chance=0.02` 意味着平均每 50 个字符敲错 1 次。错敲不是随便挑字符,而是查表选邻近键:

```python
NEARBY_KEYS = {
    'a': 'sqwz', 'b': 'vghn', 'c': 'xdfv', 'd': 'sfecx', 'e': 'wrsdf',
    # ...
}
```

Sources: [cloakbrowser/human/keyboard.py:25-34](../../../project-repos/cloakbrowser/cloakbrowser/human/keyboard.py#L25-L34)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/keyboard.py:25-34`

```python
NEARBY_KEYS = {
    'a': 'sqwz', 'b': 'vghn', 'c': 'xdfv', 'd': 'sfecx', 'e': 'wrsdf',
    'f': 'dgrtcv', 'g': 'fhtyb', 'h': 'gjybn', 'i': 'ujko', 'j': 'hkunm',
    'k': 'jloi', 'l': 'kop', 'm': 'njk', 'n': 'bhjm', 'o': 'iklp',
    'p': 'ol', 'q': 'wa', 'r': 'edft', 's': 'awedxz', 't': 'rfgy',
    'u': 'yhji', 'v': 'cfgb', 'w': 'qase', 'x': 'zsdc', 'y': 'tghu',
    'z': 'asx',
    '1': '2q', '2': '13qw', '3': '24we', '4': '35er', '5': '46rt',
    '6': '57ty', '7': '68yu', '8': '79ui', '9': '80io', '0': '9p',
}
```

<!-- source-snippets:end -->
</details>

错敲流程:
1. 敲一个邻近字符
2. 停 100-300ms("意识到错了")
3. 按 Backspace
4. 停 50-150ms("准备纠正")
5. 敲正确字符

这套行为序列**几乎无法被脚本伪造**——绝大多数自动化框架不会让自己看起来"在打错字",反爬训练数据里"输入伴随回删"是强人类信号。

### Shift 符号的 CDP 反检测

最微妙的部分是 `_type_shift_symbol()`。问题:Playwright 的 `keyboard.type("@")` 会通过 evaluate 调用 `el.dispatchEvent(new KeyboardEvent(...))`,而 `Error.stack` 会包含 `at eval (eval at evaluate...)` 字样——反爬通过 `console.trace()` 或全局 error 监听就能看到。

解法:`_type_shift_symbol()` 接收一个可选的 `cdp_session`,如果有,就走 CDP `Input.dispatchKeyEvent`:

```python
if cdp_session is not None:
    code = _SHIFT_SYMBOL_CODES.get(ch, '')
    key_code = _SHIFT_SYMBOL_KEYCODES.get(ch, 0)

    raw.down("Shift")
    sleep_ms(rand_range(cfg.shift_down_delay))

    cdp_session.send("Input.dispatchKeyEvent", {
        "type": "keyDown",
        "modifiers": 8,  # Shift modifier flag
        "key": ch,
        "code": code,
        "windowsVirtualKeyCode": key_code,
        "text": ch,
        "unmodifiedText": ch,
    })
    sleep_ms(rand_range(cfg.key_hold))
    cdp_session.send("Input.dispatchKeyEvent", { ... })

    sleep_ms(rand_range(cfg.shift_up_delay))
    raw.up("Shift")
```

Sources: [cloakbrowser/human/keyboard.py:136-164](../../../project-repos/cloakbrowser/cloakbrowser/human/keyboard.py#L136-L164)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/keyboard.py:136-164`

```python
    if cdp_session is not None:
        # --- Stealth path: CDP Input.dispatchKeyEvent ---
        code = _SHIFT_SYMBOL_CODES.get(ch, '')
        key_code = _SHIFT_SYMBOL_KEYCODES.get(ch, 0)

        raw.down("Shift")
        sleep_ms(rand_range(cfg.shift_down_delay))

        cdp_session.send("Input.dispatchKeyEvent", {
            "type": "keyDown",
            "modifiers": 8,  # Shift modifier flag
            "key": ch,
            "code": code,
            "windowsVirtualKeyCode": key_code,
            "text": ch,
            "unmodifiedText": ch,
        })
        sleep_ms(rand_range(cfg.key_hold))

        cdp_session.send("Input.dispatchKeyEvent", {
            "type": "keyUp",
            "modifiers": 8,
            "key": ch,
            "code": code,
            "windowsVirtualKeyCode": key_code,
        })

        sleep_ms(rand_range(cfg.shift_up_delay))
        raw.up("Shift")
```

<!-- source-snippets:end -->
</details>

CDP `Input.dispatchKeyEvent` 产生的事件 `isTrusted=true`,没有 evaluate 调用栈,与真实键盘输入无法区分。完整的 `_SHIFT_SYMBOL_CODES` 和 `_SHIFT_SYMBOL_KEYCODES` 表里都是 Windows VK 代码——`!` → 49(Digit1)、`@` → 50(Digit2)……这些数字是 Windows 物理键到 Chromium event 的标准映射。

## 滚动:加速 → 巡航 → 减速 + 偶尔 overshoot

`human_scroll_into_view()` 把"滚动到元素"分成三个相位:

```python
total_clicks = max(3, math.ceil(abs_distance / avg_delta))
accel_steps = rand_int_range(cfg.scroll_accel_steps)  # 2-3
decel_steps = rand_int_range(cfg.scroll_decel_steps)  # 2-3

for i in range(total_clicks):
    if i < accel_steps:
        delta = rand(80, 100)
        pause = rand_range(cfg.scroll_pause_slow)
    elif i >= total_clicks - decel_steps:
        delta = rand(60, 90)
        pause = rand_range(cfg.scroll_pause_slow)
    else:
        delta = rand_range(cfg.scroll_delta_base)
        pause = rand_range(cfg.scroll_pause_fast)

    delta *= 1 + (random.random() - 0.5) * 2 * cfg.scroll_delta_variance
    delta = round(delta) * direction

    _smooth_wheel(raw, delta, cfg)
    sleep_ms(pause)

    if i % 3 == 2 or i == total_clicks - 1:
        box = get_box()
        if box and _is_in_viewport(box, viewport_height, cfg):
            break
```

Sources: [cloakbrowser/human/scroll.py:96-122](../../../project-repos/cloakbrowser/cloakbrowser/human/scroll.py#L96-L122)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/scroll.py:96-122`

```python
    # Scroll loop: accelerate → cruise → decelerate
    scrolled = 0
    for i in range(total_clicks):
        if i < accel_steps:
            delta = rand(80, 100)
            pause = rand_range(cfg.scroll_pause_slow)
        elif i >= total_clicks - decel_steps:
            delta = rand(60, 90)
            pause = rand_range(cfg.scroll_pause_slow)
        else:
            delta = rand_range(cfg.scroll_delta_base)
            pause = rand_range(cfg.scroll_pause_fast)

        delta *= 1 + (random.random() - 0.5) * 2 * cfg.scroll_delta_variance
        delta = round(delta) * direction

        _smooth_wheel(raw, delta, cfg)
        scrolled += abs(delta)
        sleep_ms(pause)

        # Check visibility every 3 steps
        if i % 3 == 2 or i == total_clicks - 1:
            box = get_box()
            if box and _is_in_viewport(box, viewport_height, cfg):
                break
        if scrolled >= abs_distance * 1.1:
            break
```

<!-- source-snippets:end -->
</details>

```mermaid
flowchart LR
    A["加速阶段<br/>2-3 步<br/>delta 80-100px<br/>pause 慢"]
    B["巡航阶段<br/>delta 80-130px<br/>pause 快"]
    C["减速阶段<br/>2-3 步<br/>delta 60-90px<br/>pause 慢"]
    D{"看到目标?"}
    E["10% 概率<br/>overshoot 50-150px<br/>再回拉 40-80px"]
    F["静默 300-600ms"]

    A --> B
    B --> C
    C --> D
    D -->|"是,跳出循环"| E
    D -->|"否"| B
    E --> F
```

`_smooth_wheel()` 把每一次"逻辑滚动"再拆成 20-40px 的小 wheel 事件,每个事件间 8-20ms 间隔——这模拟了**鼠标滚轮硬件的惯性触发**而非软件的离散事件。每 3 步检查一次目标是否可见,可见就提前退出,避免过度滚动。

## HumanConfig:40+ 参数的预设与覆盖

```python
@dataclass
class HumanConfig:
    typing_delay: float = 70
    typing_delay_spread: float = 40
    typing_pause_chance: float = 0.1
    typing_pause_range: Range = (400, 1000)
    shift_down_delay: Range = (30, 70)
    shift_up_delay: Range = (20, 50)
    key_hold: Range = (15, 35)

    mistype_chance: float = 0.02
    mistype_delay_notice: Range = (100, 300)
    mistype_delay_correct: Range = (50, 150)

    field_switch_delay: Range = (800, 1500)

    mouse_steps_divisor: float = 8
    mouse_min_steps: int = 25
    mouse_max_steps: int = 80
    mouse_wobble_max: float = 1.5
    mouse_overshoot_chance: float = 0.15
    # ... 40+ 参数
```

Sources: [cloakbrowser/human/config.py:72-131](../../../project-repos/cloakbrowser/cloakbrowser/human/config.py#L72-L131)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/config.py:72-131`

```python
class HumanConfig:
    """All tunable parameters for human-like behavior."""

    # Keyboard
    typing_delay: float = 70
    typing_delay_spread: float = 40
    typing_pause_chance: float = 0.1
    typing_pause_range: Range = (400, 1000)
    shift_down_delay: Range = (30, 70)
    shift_up_delay: Range = (20, 50)
    key_hold: Range = (15, 35)
    
    # Mistype (typo simulation)
    mistype_chance: float = 0.02
    mistype_delay_notice: Range = (100, 300)
    mistype_delay_correct: Range = (50, 150)

    field_switch_delay: Range = (800, 1500)

    # Mouse — movement
    mouse_steps_divisor: float = 8
    mouse_min_steps: int = 25
    mouse_max_steps: int = 80
    mouse_wobble_max: float = 1.5
    mouse_overshoot_chance: float = 0.15
    mouse_overshoot_px: Range = (3, 6)
    mouse_burst_size: Range = (3, 5)
    mouse_burst_pause: Range = (8, 18)

    # Mouse — clicks
    click_aim_delay_input: Range = (60, 140)
    click_aim_delay_button: Range = (80, 200)
    click_hold_input: Range = (40, 100)
    click_hold_button: Range = (60, 150)
    click_input_x_range: Range = (0.05, 0.30)

    # Mouse — idle
    idle_drift_px: float = 3
    idle_pause_range: Range = (300, 1000)

    # Scroll
    scroll_delta_base: Range = (80, 130)
    scroll_delta_variance: float = 0.2
    scroll_pause_fast: Range = (30, 80)
    scroll_pause_slow: Range = (80, 200)
    scroll_accel_steps: Range = (2, 3)
    scroll_decel_steps: Range = (2, 3)
    scroll_overshoot_chance: float = 0.1
    scroll_overshoot_px: Range = (50, 150)
    scroll_settle_delay: Range = (300, 600)
    scroll_target_zone: Range = (0.20, 0.80)
    scroll_pre_move_delay: Range = (100, 300)

    # Initial cursor position (as if coming from the address bar area)
    initial_cursor_x: Range = (400, 700)
    initial_cursor_y: Range = (45, 60)

    # Idle micro-movements between actions (opt-in, adds latency)
    idle_between_actions: bool = False
    idle_between_duration: Range = (0.3, 0.8)
```

<!-- source-snippets:end -->
</details>

两个预设:

|预设|目标|关键差异|
|---|---|---|
|`default` | 普通速度 | typing_delay=70, mouse_overshoot_chance=0.15 |
|`careful` | 谨慎模式 | typing_delay=100, mouse_overshoot_chance=0.10, idle_between_actions=True |

`careful` 在每个动作之间加上 0.4-1.0 秒的 idle micro-movement(鼠标在原地微抖),适合面对极敏感反爬的场景——但代价是慢 1.5-2 倍。

### 三种覆盖路径

1. **预设级**:`launch(humanize=True, human_preset="careful")`
2. **配置级**:`launch(humanize=True, human_config={"mistype_chance": 0.05, "typing_delay": 100})`
3. **方法级**:`page.click(sel, human_config={"click_hold_button": (100, 200)})` ——这是 0.3.27 加的 per-call override

`merge_config()` 在 [`human/config.py:204-220`](../../../project-repos/cloakbrowser/cloakbrowser/human/config.py#L204-L220) 实现配置合并,不修改 base,返回新实例。这意味着同一个 page 可以对每个 selector 使用不同时序——例如让某个输入框输入更慢,或对某个按钮 click 更长按。

## CDP Isolated World:patch 内部的反检测

`humanize` 是 wrapper 层补丁,理论上也会留下"我是 patched 实现"的痕迹——尤其当 patch 调用 `page.evaluate(...)` 检查元素时,evaluate 本身就是反爬可以检测的信号。

解法:`_SyncIsolatedWorld` / `_AsyncIsolatedWorld`,用 CDP 创建一个 isolated execution context,所有 DOM 查询走它:

```python
class _SyncIsolatedWorld:
    def _create_world(self) -> int:
        cdp = self._ensure_cdp()
        tree = cdp.send("Page.getFrameTree")
        frame_id = tree["frameTree"]["frame"]["id"]
        result = cdp.send("Page.createIsolatedWorld", {
            "frameId": frame_id,
            "worldName": "",
            "grantUniveralAccess": True,
        })
        self._context_id = result["executionContextId"]
        return self._context_id

    def evaluate(self, expression: str) -> Any:
        if self._context_id is None:
            self._create_world()

        for attempt in range(2):
            try:
                result = self._cdp.send("Runtime.evaluate", {
                    "expression": expression,
                    "contextId": self._context_id,
                    "returnByValue": True,
                })
                # ...
```

Sources: [cloakbrowser/human/__init__.py:47-106](../../../project-repos/cloakbrowser/cloakbrowser/human/__init__.py#L47-L106)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/__init__.py:47-106`

```python
class _SyncIsolatedWorld:
    """Manages a CDP isolated execution context for DOM reads (sync).

    Produces clean Error.stack traces (no 'eval at evaluate :302:')
    and is invisible to querySelector monkey-patches in the main world.
    Context ID is invalidated on navigation and auto-recreated on next call.
    """

    __slots__ = ("_page", "_cdp", "_context_id")

    def __init__(self, page: Any):
        self._page = page
        self._cdp: Any = None
        self._context_id: Optional[int] = None

    def _ensure_cdp(self) -> Any:
        if self._cdp is None:
            self._cdp = self._page.context.new_cdp_session(self._page)
        return self._cdp

    def _create_world(self) -> int:
        cdp = self._ensure_cdp()
        tree = cdp.send("Page.getFrameTree")
        frame_id = tree["frameTree"]["frame"]["id"]
        result = cdp.send("Page.createIsolatedWorld", {
            "frameId": frame_id,
            "worldName": "",
            "grantUniveralAccess": True,
        })
        self._context_id = result["executionContextId"]
        return self._context_id

    def evaluate(self, expression: str) -> Any:
        """Evaluate JS in isolated world. Auto-recreates on stale context."""
        if self._context_id is None:
            self._create_world()

        for attempt in range(2):
            try:
                result = self._cdp.send("Runtime.evaluate", {
                    "expression": expression,
                    "contextId": self._context_id,
                    "returnByValue": True,
                })
                if "exceptionDetails" in result:
                    if attempt == 0:
                        self._create_world()
                        continue
                    return None
                return result.get("result", {}).get("value")
            except Exception:
                if attempt == 0:
                    self._context_id = None
                    try:
                        self._create_world()
                    except Exception:
                        return None
                    continue
                return None
        return None
```

<!-- source-snippets:end -->
</details>

Isolated world 的两个核心优势:

1. **Error.stack 干净**:不会出现 `eval at evaluate` 字样,而主世界的 evaluate 会留下这个痕迹
2. **对主世界 monkey-patch 免疫**:某些反爬会 hook `document.querySelector`,记录所有 selector 调用。isolated world 看不到主世界的 patch,反爬也看不到 isolated world 的查询

`invalidate()` 在每次导航后被调用——context ID 会因为 navigation 失效,wrapper 必须重新创建。`_human_goto()` 在 `originals.goto()` 之后立即 `stealth.invalidate()`。

Sources: [cloakbrowser/human/__init__.py:861-866](../../../project-repos/cloakbrowser/cloakbrowser/human/__init__.py#L861-L866)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/__init__.py:861-866`

```python
    def _human_goto(url: str, **kwargs: Any) -> Any:
        response = originals.goto(url, **kwargs)
        # Invalidate isolated world after navigation (context ID becomes stale)
        if stealth is not None:
            stealth.invalidate()
        return response
```

<!-- source-snippets:end -->
</details>

## Locator API 的元类补丁

Playwright 的 `page.locator(sel).click()` 走的不是 page.click 路径,而是 Locator 类的方法。要让 Locator 也走 humanize,需要 monkey-patch Locator 类本身——这是 `_patch_locator_class_sync()` 干的事。代码 230 行(L336-L566),核心思路:

- 拿到 `Locator` 类(从 `page.locator(...)` 实例的 `__class__` 反射)
- 给类上的 `click` / `type` / `fill` / `hover` 等方法做 patch
- patch 同样支持 `human_config={}` 参数透传

注意这是**类级 patch**,不是实例级,所以一次 patch 影响所有 Locator 实例——这是有意为之,因为 `page.locator()` 每次返回新实例,实例级 patch 会丢失。

Sources: [cloakbrowser/human/__init__.py:336-566](../../../project-repos/cloakbrowser/cloakbrowser/human/__init__.py#L336-L566)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/__init__.py:336-566`

```python
def _patch_locator_class_sync():
    """Patch all Locator interaction methods to go through humanized page methods."""
    global _locator_sync_patched
    if _locator_sync_patched:
        return
    _locator_sync_patched = True

    from playwright.sync_api._generated import Locator

    _orig_fill = Locator.fill
    _orig_click = Locator.click
    _orig_type = Locator.type
    _orig_dblclick = Locator.dblclick
    _orig_hover = Locator.hover
    _orig_check = Locator.check
    _orig_uncheck = Locator.uncheck
    _orig_set_checked = Locator.set_checked
    _orig_select_option = Locator.select_option
    _orig_press = Locator.press
    _orig_press_sequentially = Locator.press_sequentially
    _orig_tap = Locator.tap
    _orig_drag_to = Locator.drag_to
    _orig_clear = Locator.clear
    _orig_scroll_into_view = getattr(Locator, 'scroll_into_view_if_needed', None)

    def _get_selector(self):
        return self._impl_obj._selector

    def _is_humanized(self):
        return hasattr(self.page, '_original')

    def _get_cfg(self):
        return getattr(self.page, '_human_cfg', None)

    # Forward only options the page-level humanized methods understand
    # (timeout, human_config). Other Locator-specific kwargs (force, trial,
    # noWaitAfter, ...) are silently dropped — the humanized path doesn't
    # consult them.
    def _forward_kwargs(kwargs):
        out = {}
        if "timeout" in kwargs:
            out["timeout"] = kwargs["timeout"]
        if "human_config" in kwargs:
            out["human_config"] = kwargs["human_config"]
        return out

    def _humanized_fill(self, value, **kwargs):
        if _is_humanized(self):
            self.page.fill(_get_selector(self), value, **_forward_kwargs(kwargs))
        else:
            _orig_fill(self, value, **kwargs)

    def _humanized_click(self, **kwargs):
        if _is_humanized(self):
            self.page.click(_get_selector(self), **_forward_kwargs(kwargs))
        else:
            _orig_click(self, **kwargs)

    def _humanized_type(self, text, **kwargs):
        if _is_humanized(self):
            self.page.type(_get_selector(self), text, **_forward_kwargs(kwargs))
        else:
            _orig_type(self, text, **kwargs)

    def _humanized_dblclick(self, **kwargs):
        if _is_humanized(self):
            self.page.dblclick(_get_selector(self), **_forward_kwargs(kwargs))
        else:
            _orig_dblclick(self, **kwargs)

    def _humanized_hover(self, **kwargs):
        if _is_humanized(self):
            self.page.hover(_get_selector(self), **_forward_kwargs(kwargs))
        else:
            _orig_hover(self, **kwargs)

    def _humanized_scroll_into_view_if_needed(self, **kwargs):
        if _is_humanized(self):
            page = self.page
            cfg = _get_cfg(self)
            cursor = getattr(page, '_human_cursor', None)
            raw = getattr(page, '_human_raw_mouse', None)
            call_cfg = merge_config(cfg, kwargs.get("human_config")) if cfg else None
            if call_cfg is None or cursor is None or raw is None:
                if _orig_scroll_into_view is not None:
                    native_kwargs = {k: v for k, v in kwargs.items() if k != "human_config"}
                    return _orig_scroll_into_view(self, **native_kwargs)
                return
            timeout = kwargs.get("timeout", 30000)
            try:
                _, nx, ny = human_scroll_into_view(
                    page, raw,
                    lambda: self.bounding_box(timeout=timeout),
                    cursor.x, cursor.y, call_cfg,
                )
                cursor.x = nx
                cursor.y = ny
            except Exception:
                if _orig_scroll_into_view is not None:
                    native_kwargs = {k: v for k, v in kwargs.items() if k != "human_config"}
                    _orig_scroll_into_view(self, **native_kwargs)
        elif _orig_scroll_into_view is not None:
            _orig_scroll_into_view(self, **kwargs)

    def _humanized_check(self, **kwargs):
        if _is_humanized(self):
            cfg = _get_cfg(self)
            if cfg and cfg.idle_between_actions:
                raw = type("_R", (), {"move": self.page._original.mouse_move})()
                human_idle(raw, rand(cfg.idle_between_duration[0], cfg.idle_between_duration[1]), 0, 0, cfg)
            checked = self.is_checked()
            if not checked:
                self.page.click(_get_selector(self))
        else:
            _orig_check(self, **kwargs)

    def _humanized_uncheck(self, **kwargs):
        if _is_humanized(self):
            cfg = _get_cfg(self)
            if cfg and cfg.idle_between_actions:
... snippet truncated ...
```

<!-- source-snippets:end -->
</details>

## ElementHandle 的特例

`page.query_selector()` 返回 ElementHandle 对象,这个对象的 `.click()` / `.type()` 走的是底层 protocol 调用,**完全绕过** page.click / Locator.click。`_patch_single_element_handle_sync()` 处理每个 ElementHandle 实例。

但 0.3.24 之前 Python 端 ElementHandle 不支持 humanize——CHANGELOG 显示 PR #133 由 @evelaa123 补齐。这是个"为什么不要用 ElementHandle"的最佳例证:**Locator 是 Playwright 推荐的新 API,ElementHandle 是老 API,patch 起来麻烦,生态支持也滞后**。README 直接给出建议:"Always use `page.click(selector)`, `page.type(selector, text)`, `page.hover(selector)`, or `page.locator(selector).*`"。

Sources: [cloakbrowser/human/__init__.py:1035-1294](../../../project-repos/cloakbrowser/cloakbrowser/human/__init__.py#L1035-L1294), [README.md:557-562](../../../project-repos/cloakbrowser/README.md#L557-L562)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/__init__.py:1035-1294`

```python
def _patch_single_element_handle_sync(
    el: Any, page: Any, cfg: HumanConfig, cursor: _CursorState,
    raw_mouse: RawMouse, raw_keyboard: RawKeyboard, originals: Any,
    stealth: Any, cdp_session: Any,
) -> None:
    """Patch all interaction methods on a sync Playwright ElementHandle."""
    if getattr(el, '_human_patched', False):
        return
    el._human_patched = True

    # Save originals
    _orig_click = el.click
    _orig_dblclick = el.dblclick
    _orig_hover = el.hover
    _orig_type = el.type
    _orig_fill = el.fill
    _orig_press = el.press
    _orig_select_option = el.select_option
    _orig_check = el.check
    _orig_uncheck = el.uncheck
    _orig_set_checked = getattr(el, 'set_checked', None)
    _orig_tap = el.tap
    _orig_focus = el.focus
    _orig_scroll_into_view = getattr(el, 'scroll_into_view_if_needed', None)

    # Nested selectors
    _orig_qs = el.query_selector
    _orig_qsa = el.query_selector_all
    _orig_wfs = el.wait_for_selector

    def _patched_qs(selector: str, **kwargs: Any) -> Any:
        child = _orig_qs(selector, **kwargs)
        if child is not None:
            _patch_single_element_handle_sync(
                child, page, cfg, cursor, raw_mouse, raw_keyboard, originals, stealth, cdp_session
            )
        return child

    def _patched_qsa(selector: str, **kwargs: Any) -> Any:
        children = _orig_qsa(selector, **kwargs)
        for child in children:
            _patch_single_element_handle_sync(
                child, page, cfg, cursor, raw_mouse, raw_keyboard, originals, stealth, cdp_session
            )
        return children

    def _patched_wfs(selector: str, **kwargs: Any) -> Any:
        child = _orig_wfs(selector, **kwargs)
        if child is not None:
            _patch_single_element_handle_sync(
                child, page, cfg, cursor, raw_mouse, raw_keyboard, originals, stealth, cdp_session
            )
        return child

    el.query_selector = _patched_qs
    el.query_selector_all = _patched_qsa
    el.wait_for_selector = _patched_wfs

    # Helper: move cursor to element. Accepts optional ``call_cfg`` so per-call
    # ``human_config`` overrides on type/fill carry through to mouse timing.
    # Also scrolls into view first so off-screen elements don't silently fall
    # back to the unpatched native method (#129, #172 follow-up).
    def _move_to_element(call_cfg: HumanConfig = cfg):
        if not cursor.initialized:
            cursor.x = rand(call_cfg.initial_cursor_x[0], call_cfg.initial_cursor_x[1])
            cursor.y = rand(call_cfg.initial_cursor_y[0], call_cfg.initial_cursor_y[1])
            originals.mouse_move(cursor.x, cursor.y)
            cursor.initialized = True

        # Scroll into view first — best-effort. If the element can't be located
        # we fall through to bounding_box() below which returns None and lets
        # the caller fall back to the original Playwright method.
        try:
            _, nx, ny = human_scroll_into_view(
                page, raw_mouse, lambda: el.bounding_box(),
                cursor.x, cursor.y, call_cfg,
            )
            cursor.x = nx
            cursor.y = ny
        except Exception:
            pass

        box = el.bounding_box()
        if not box:
            return None

        is_inp = _is_input_element_handle_sync(el)
        target = click_target(box, is_inp, call_cfg)

        if call_cfg.idle_between_actions:
            human_idle(raw_mouse, rand(call_cfg.idle_between_duration[0], call_cfg.idle_between_duration[1]), cursor.x, cursor.y, call_cfg)

        human_move(raw_mouse, cursor.x, cursor.y, target.x, target.y, call_cfg)
        cursor.x = target.x
        cursor.y = target.y
        return {'box': box, 'is_inp': is_inp}

    # --- el.click() ---
    def _human_el_click(**kwargs: Any) -> None:
        call_cfg = merge_config(cfg, kwargs.get("human_config"))
        info = _move_to_element(call_cfg)
        if info is None:
            return _orig_click(**kwargs)
        human_click(raw_mouse, info['is_inp'], call_cfg)

    # --- el.dblclick() ---
    def _human_el_dblclick(**kwargs: Any) -> None:
        call_cfg = merge_config(cfg, kwargs.get("human_config"))
        info = _move_to_element(call_cfg)
        if info is None:
            return _orig_dblclick(**kwargs)
        raw_mouse.down(click_count=2)
        sleep_ms(rand(30, 60))
        raw_mouse.up(click_count=2)

    # --- el.hover() ---
    def _human_el_hover(**kwargs: Any) -> None:
        call_cfg = merge_config(cfg, kwargs.get("human_config"))
        info = _move_to_element(call_cfg)
        if info is None:
... snippet truncated ...
```

#### `README.md:557-562`

```markdown

> **Note (Playwright):** Always use `page.click(selector)`, `page.type(selector, text)`, `page.hover(selector)`, or `page.locator(selector).*` — these go through the full humanize pipeline. Avoid `page.query_selector()` — `ElementHandle` objects bypass all patches, so mouse movement teleports, keyboard events fire without timing, and scroll has no human curve.
>
> **Note (Puppeteer):** Both selector-based methods (`page.click()`, `page.type()`) and ElementHandle methods (`el.click()`, `el.type()`) are fully humanized. `page.$()`, `page.$$()`, and `page.waitForSelector()` return patched handles automatically.

> Contributed by [@evelaa123](https://github.com/evelaa123) — full Playwright and Puppeteer API coverage.
```

<!-- source-snippets:end -->
</details>

## 双 SDK 差异

| 维度 | Python | JS |
|---|---|---|
|sync API|有 (`patch_browser`)|无 |
|async API|有 (`patch_browser_async`)|默认就是 async |
|Locator/ElementHandle 覆盖|是|是 |
|iframe 覆盖|`_patch_frames_*`|`_patch_frames_*` |
|Puppeteer 兼容|无|`js/src/human-puppeteer/`(单独实现) |
|CDP Isolated World|`new_cdp_session`|同|

JS 的 `human-puppeteer/` 是独立的实现:Puppeteer API 与 Playwright 完全不同,`page.click` 签名、`ElementHandle` 行为都需要单独适配。这是 0.3.23 的工作量(@evelaa123 全量贡献),让 Puppeteer 用户也能享受 humanize。

Sources: [js/src/human-puppeteer/index.ts:1-30](../../../project-repos/cloakbrowser/js/src/human-puppeteer/index.ts#L1-L30)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/human-puppeteer/index.ts:1-30`

```typescript
/**
 * Human-like behavioral layer for cloakbrowser — Puppeteer edition.
 *
 * Mirrors Playwright humanize architecture, adapted for Puppeteer API.
 *
 * Patches ALL native Puppeteer interaction surfaces:
 *
 * PAGE-LEVEL:
 *   click (with clickCount support for dblclick), hover, type,
 *   select, focus, tap, goto
 *
 * MOUSE:
 *   move, click (with clickCount support for dblclick), wheel,
 *   dragAndDrop
 *
 * KEYBOARD:
 *   type, down, up, press, sendCharacter
 *
 * FRAME-LEVEL:
 *   click, hover, type, select, focus, tap
 *   + $, $$, waitForSelector (return patched ElementHandles)
 *
 * ELEMENTHANDLE-LEVEL (Puppeteer-specific, no Playwright equivalent):
 *   click (with clickCount), hover, type, press, tap, select,
 *   focus, drop, dragAndDrop
 *   + $, $$, waitForSelector (nested elements are also patched)
 *
 * BROWSER-LEVEL:
 *   newPage, createBrowserContext / createIncognitoBrowserContext,
 *   targetcreated event
```

<!-- source-snippets:end -->
</details>

## 几个"读源码才能知道"的细节

**1. 初始光标位置在地址栏附近**

```python
initial_cursor_x: Range = (400, 700)
initial_cursor_y: Range = (45, 60)
```

Sources: [cloakbrowser/human/config.py:125-127](../../../project-repos/cloakbrowser/cloakbrowser/human/config.py#L125-L127)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/human/config.py:125-127`

```python
    # Initial cursor position (as if coming from the address bar area)
    initial_cursor_x: Range = (400, 700)
    initial_cursor_y: Range = (45, 60)
```

<!-- source-snippets:end -->
</details>

不是 (0, 0) 或屏幕中心——而是地址栏的位置(顶部 45-60px,横坐标 400-700px)。模拟"用户刚输完 URL 按下回车"的鼠标位置。

**2. `goto` 也被 patch 了**

不是为了让导航变慢,而是为了在导航后 `stealth.invalidate()`——清掉 isolated world context ID。如果不 patch,humanize 在新页面会用旧 context ID 失败。

**3. iframe 也支持**

`_patch_frames_sync()` 会给每个 frame 单独 patch,frame_locator 也走 humanize。这意味着登录 iframe 里的输入框也能用 `humanize=True` 触发 Bezier + 按键级输入。

**4. 自动添加 `--disable-blink-features=AutomationControlled` 不再需要**

0.3.21 移除了这个 flag。原因:binary 内部已经从 C++ 源码层面处理 `navigator.webdriver`,wrapper 不需要在 Chrome flag 上做兜底。这种"binary 进化让 wrapper 简化"是项目的良性循环。

Sources: [CHANGELOG.md:67-72](../../../project-repos/cloakbrowser/CHANGELOG.md#L67-L72)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CHANGELOG.md:67-72`

```markdown

- **[wrapper]** Remove dead `--disable-blink-features=AutomationControlled` flag -- binary patch 009 already handles `navigator.webdriver` at source level
- **[wrapper]** Remove hardcoded GPU vendor/renderer flags -- binary auto-generates diverse, realistic GPU profiles from the fingerprint seed. Each seed gets a unique GPU instead of every user sharing the same one
- **[wrapper]** Allow `viewport=None` to disable viewport emulation in both Python and JS wrappers (thanks [@kitiho](https://github.com/kitiho), #107)
- **[wrapper]** Enable `geoip=True` in stealth test example to fix FingerprintJS detection
- **[meta]** Remove npm self-upgrade step in CI -- Node 22 ships with compatible npm
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [启动 API:四象限对偶](launch-api.md) — `humanize=True` 在 launch 中的开关
- [系统架构](system-architecture.md) — 拟人化层在三层架构中的位置
- [测试、CI 与发布管线](testing-ci-release.md) — humanize 的视觉/单元测试 (`test_human_visual.py`、`humanize.test.ts`)


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [bin/cloakserve](../../../project-repos/cloakbrowser/bin/cloakserve)
- [cloakbrowser/browser.py](../../../project-repos/cloakbrowser/cloakbrowser/browser.py)
- [Dockerfile](../../../project-repos/cloakbrowser/Dockerfile)

</details>

# cloakserve:CDP 多路复用器

需要同时跑十几个甚至几十个 stealth Chromium 实例,每个有不同 fingerprint、不同代理、不同时区,常见做法是每个 worker 进程各开一个 `launch()`。但这种"一对一"方式有两个问题:**首次 launch 的开销**(下载/解压 binary、启动 Playwright Node.js 子进程)在每个 worker 重复;**进程数线性扩展**(N 个 worker = N 个 Playwright 进程 + N 个 Chrome 进程)对内存与文件句柄都不友好。

`cloakserve` 解决的就是这件事:**单个端口、多个 Chrome 进程、按 fingerprint seed 路由**。一个客户端写 `playwright.chromium.connect_over_cdp("http://localhost:9222?fingerprint=A1")`,服务端如果 A1 还没起就启动一个新 Chrome 进程,如果已经在跑就复用——客户端永远只通过 `:9222` 这一个端口与服务端对话,真正的 Chrome CDP 端口由服务端内部管理。

它是个独立的 Python 脚本(`bin/cloakserve`,694 行),依赖 `aiohttp` 与 `websockets`,通过 `cloakbrowser[serve]` 可选附加件安装。Docker 镜像默认带它,容器一启动就能服务。

## 它解决的问题图

```mermaid
flowchart TD
    subgraph Before["未使用 cloakserve"]
        W1["Worker 1<br/>launch(fp=A1)"]
        W2["Worker 2<br/>launch(fp=B2)"]
        W3["Worker 3<br/>launch(fp=A1) — 又一个 A1"]
        C1["Chrome A1 v1"]
        C2["Chrome B2 v1"]
        C3["Chrome A1 v2 — 浪费!"]
        W1 -.各自 launch.-> C1
        W2 -.各自 launch.-> C2
        W3 -.各自 launch.-> C3
    end

    subgraph After["使用 cloakserve"]
        WA1["Worker 1<br/>connect_over_cdp ?fp=A1"]
        WA2["Worker 2<br/>connect_over_cdp ?fp=B2"]
        WA3["Worker 3<br/>connect_over_cdp ?fp=A1"]
        SERVE["cloakserve:9222"]
        CA1["Chrome A1 — 复用"]
        CB2["Chrome B2"]
        WA1 --> SERVE
        WA2 --> SERVE
        WA3 --> SERVE
        SERVE --> CA1
        SERVE --> CB2
    end
```

`Worker 3` 在右侧场景下复用 `Worker 1` 的 Chrome——只要它们用同一个 fingerprint seed,语义上就是"用同一份浏览器身份"。这种共享是 fingerprint 一致性的天然延伸:**同一个 seed → 同一个身份 → 同一个 Chrome 进程**。

## ChromePool:核心数据结构

`ChromePool` 维护 seed 到 Chrome 进程的映射。它有四个字典:

```python
class ChromePool:
    def __init__(self, binary, global_args, headless, data_dir, ...):
        self._processes: dict[str, ChromeProcess] = {}
        self._default: ChromeProcess | None = None
        self._locks: dict[str, asyncio.Lock] = {}
        self._next_port = BASE_CDP_PORT  # 5100
        self._connections: dict[str, int] = {}
```

Sources: [bin/cloakserve:88-111](../../../project-repos/cloakbrowser/bin/cloakserve#L88-L111)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:88-111`

```
class ChromePool:
    def __init__(
        self,
        binary: str,
        global_args: list[str],
        headless: bool,
        data_dir: str = "/tmp/cloakserve",
        default_seed: str | None = None,
        default_locale: str | None = None,
        default_timezone: str | None = None,
    ):
        self._binary = binary
        self._global_args = global_args
        self._headless = headless
        self._data_dir = data_dir
        self._default_seed = default_seed
        self._default_locale = default_locale
        self._default_timezone = default_timezone
        self._processes: dict[str, ChromeProcess] = {}
        self._default: ChromeProcess | None = None
        self._locks: dict[str, asyncio.Lock] = {}
        self._next_port = BASE_CDP_PORT
        # Connection refcounting for status reporting
        self._connections: dict[str, int] = {}
```

<!-- source-snippets:end -->
</details>

- `_processes`:seed_key → ChromeProcess(包含 subprocess.Popen、cdp_port、user_data_dir、timezone/locale/proxy)
- `_default`:无 seed 请求的共享 Chrome
- `_locks`:每个 seed 一个 lock,避免并发请求同时拉起多个 Chrome
- `_connections`:每个 seed 的活跃 WS 连接数,用于状态报告

`BASE_CDP_PORT = 5100` 意味着内部 Chrome 从 5100、5101、5102 ... 递增分配端口。`_allocate_port()` 实际尝试 bind 检测空闲端口,跳过占用的:

```python
def _allocate_port(self) -> int:
    for _ in range(100):
        port = self._next_port
        self._next_port += 1
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("127.0.0.1", port))
            return port
        except OSError:
            continue
    raise RuntimeError("No free ports available for Chrome CDP")
```

Sources: [bin/cloakserve:126-137](../../../project-repos/cloakbrowser/bin/cloakserve#L126-L137)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:126-137`

```
    def _allocate_port(self) -> int:
        """Find a free port starting from _next_port."""
        for _ in range(100):
            port = self._next_port
            self._next_port += 1
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
        raise RuntimeError("No free ports available for Chrome CDP")
```

<!-- source-snippets:end -->
</details>

## get_or_launch:核心方法

`get_or_launch()` 是整个 server 的心脏:

```python
async def get_or_launch(self, seed, extra_args, timezone, locale, proxy, geoip) -> ChromeProcess:
    if seed is None and self._default_seed:
        seed = self._default_seed
    if locale is None:
        locale = self._default_locale
    if timezone is None:
        timezone = self._default_timezone

    if seed is None:
        seed_key = "__default__"
        actual_seed = str(random.randint(10000, 99999))
    else:
        if not SAFE_SEED_RE.match(seed) or seed in RESERVED_SEEDS:
            raise web.HTTPBadRequest(...)
        seed_key = seed
        actual_seed = seed

    lock = self._get_lock(seed_key)
    async with lock:
        if seed_key in self._processes:
            proc = self._processes[seed_key]
            if proc.process.poll() is None:
                if any([extra_args, timezone, locale, proxy, geoip]):
                    logger.warning("Seed %s already running ... first-launch wins")
                return proc
            await self._cleanup_process(seed_key)

        # 拉起新 Chrome ...
```

Sources: [bin/cloakserve:151-200](../../../project-repos/cloakbrowser/bin/cloakserve#L151-L200)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:151-200`

```
    async def get_or_launch(
        self,
        seed: str | None,
        extra_args: list[str] | None = None,
        timezone: str | None = None,
        locale: str | None = None,
        proxy: str | None = None,
        geoip: bool = False,
    ) -> ChromeProcess:
        """Get existing or launch new Chrome process for a seed."""
        # Apply CLI defaults when query params don't provide values
        if seed is None and self._default_seed:
            seed = self._default_seed
        if locale is None:
            locale = self._default_locale
        if timezone is None:
            timezone = self._default_timezone

        # No seed = default shared process
        if seed is None:
            seed_key = "__default__"
            actual_seed = str(random.randint(10000, 99999))
        else:
            if not SAFE_SEED_RE.match(seed) or seed in RESERVED_SEEDS:
                raise web.HTTPBadRequest(
                    text=json.dumps({"error": "Invalid fingerprint seed"}),
                    content_type="application/json",
                )
            seed_key = seed
            actual_seed = seed

        lock = self._get_lock(seed_key)
        async with lock:
            # Check if already running (including default fast-path)
            if seed_key in self._processes:
                proc = self._processes[seed_key]
                if proc.process.poll() is None:
                    if any([extra_args, timezone, locale, proxy, geoip]):
                        logger.warning(
                            "Seed %s already running (port %d, tz=%s, locale=%s, proxy=%s) — "
                            "ignoring new params (first-launch wins)",
                            seed_key, proc.cdp_port,
                            proc.timezone, proc.locale, proc.proxy,
                        )
                    return proc
                # Dead — clean up
                await self._cleanup_process(seed_key)

            # Resolve geoip if requested
            exit_ip = None
```

<!-- source-snippets:end -->
</details>

几个关键合约:

**合约 1:无 seed 共享 default**。客户端不带 `?fingerprint=` 时,所有这种请求共享一个 Chrome,内部 seed 是启动时随机生成的 5 位数。这是面向"我只想要一个 stealth Chrome,fingerprint 不重要"的场景。

**合约 2:seed 必须匹配 `^[A-Za-z0-9_-]{1,128}$`**。`SAFE_SEED_RE` 防止 seed 中带路径字符或注入,因为 seed 会用作目录名 (`user_data_dir = data_dir/seed_key`)。0.3.28 的 #217 是这个修复——避免 seed 路径穿越漏洞。

Sources: [bin/cloakserve:65-66](../../../project-repos/cloakbrowser/bin/cloakserve#L65-L66), [CHANGELOG.md:13](../../../project-repos/cloakbrowser/CHANGELOG.md:13)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:65-66`

```
SAFE_SEED_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
RESERVED_SEEDS = {"__default__"}
```

#### `CHANGELOG.md:13`

> 未找到引用文件：`CHANGELOG.md:13`

<!-- source-snippets:end -->
</details>

**合约 3:first-launch wins**。如果某个 seed 已经在跑,新请求即使带不同 timezone/proxy/extra_args 也**不会**重新启动 Chrome——会复用已有的并 warn。这是有意为之的隔离:同一个 seed 必须有一致行为,允许参数漂移会让"seed = identity"承诺失效。

**合约 4:每个 seed 一个 lock**。`async with lock:` 保证并发请求同一个 seed 时不会重复启动 Chrome。但不同 seed 的并发是放行的——A1 和 B2 可以同时 cold-start。

## Chrome 启动:复用 wrapper 的 build_args

`cloakserve` 不重新实现 stealth args 组装,而是**复用 wrapper**:

```python
from cloakbrowser.browser import build_args, maybe_resolve_geoip, _resolve_webrtc_args, _normalize_socks_string_url

# 在 get_or_launch 内:
fp_extra = [f"--fingerprint={actual_seed}"]
if extra_args:
    fp_extra.extend(extra_args)
if proxy:
    fp_extra.append(f"--proxy-server={_normalize_socks_string_url(proxy)}")

fp_extra = _resolve_webrtc_args(fp_extra, proxy)
if exit_ip and not any(a.startswith("--fingerprint-webrtc-ip") for a in (fp_extra or [])):
    fp_extra = list(fp_extra or [])
    fp_extra.append(f"--fingerprint-webrtc-ip={exit_ip}")

chrome_args = build_args(
    stealth_args=True,
    extra_args=fp_extra,
    timezone=timezone,
    locale=locale,
    headless=self._headless,
)
```

Sources: [bin/cloakserve:200-223](../../../project-repos/cloakbrowser/bin/cloakserve#L200-L223)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:200-223`

```
            exit_ip = None
            if geoip and proxy:
                timezone, locale, exit_ip = maybe_resolve_geoip(True, proxy, timezone, locale)

            # Build Chrome args via shared logic
            fp_extra = [f"--fingerprint={actual_seed}"]
            if extra_args:
                fp_extra.extend(extra_args)
            if proxy:
                fp_extra.append(f"--proxy-server={_normalize_socks_string_url(proxy)}")

            # WebRTC IP spoofing: resolve auto, inject geoip exit IP
            fp_extra = _resolve_webrtc_args(fp_extra, proxy)
            if exit_ip and not any(a.startswith("--fingerprint-webrtc-ip") for a in (fp_extra or [])):
                fp_extra = list(fp_extra or [])
                fp_extra.append(f"--fingerprint-webrtc-ip={exit_ip}")

            chrome_args = build_args(
                stealth_args=True,
                extra_args=fp_extra,
                timezone=timezone,
                locale=locale,
                headless=self._headless,
            )
```

<!-- source-snippets:end -->
</details>

这种重用很重要——意味着 wrapper 与 cloakserve 在 stealth 行为上严格一致,bug 一处修两处生效。`build_args` 的去重、优先级、`--ignore-gpu-blocklist` 自动注入逻辑,cloakserve 也享受到。

### subprocess + CDP ready 探测

Chrome 用 `subprocess.Popen(full_args, stdout=subprocess.DEVNULL)` 启动,然后**轮询 `/json/version` endpoint 直到响应**:

```python
@staticmethod
async def _wait_for_cdp(port: int, timeout: float = 10.0) -> bool:
    deadline = time.monotonic() + timeout
    delay = 0.1
    session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=1))
    try:
        while time.monotonic() < deadline:
            try:
                async with session.get(f"http://127.0.0.1:{port}/json/version") as resp:
                    if resp.status == 200:
                        return True
            except Exception:
                pass
            await asyncio.sleep(delay)
            delay = min(delay * 2, 1.0)
        return False
    finally:
        await session.close()
```

Sources: [bin/cloakserve:298-320](../../../project-repos/cloakbrowser/bin/cloakserve#L298-L320)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:298-320`

```
    @staticmethod
    async def _wait_for_cdp(port: int, timeout: float = 10.0) -> bool:
        """Poll Chrome's /json/version until ready."""
        deadline = time.monotonic() + timeout
        delay = 0.1
        session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=1)
        )
        try:
            while time.monotonic() < deadline:
                try:
                    async with session.get(
                        f"http://127.0.0.1:{port}/json/version"
                    ) as resp:
                        if resp.status == 200:
                            return True
                except Exception:
                    pass
                await asyncio.sleep(delay)
                delay = min(delay * 2, 1.0)
            return False
        finally:
            await session.close()
```

<!-- source-snippets:end -->
</details>

**指数退避**:0.1s → 0.2s → 0.4s → ... 上限 1s。Chrome 启动通常需要 1-3 秒,退避避免每秒打十几次空响应。10 秒超时——如果 Chrome 在这之内没起来,kill 进程并 422 报错。

## HTTP 路由:三个 endpoint

```python
app.router.add_get("/", handle_root)
app.router.add_get("/json/version", handle_json_version)
app.router.add_get("/json/list", handle_json_list)
app.router.add_get("/json", handle_json_list)
app.router.add_get("/fingerprint/{seed}/devtools/{path:.+}", handle_ws_seed)
app.router.add_get("/devtools/{path:.+}", handle_ws_default)
```

Sources: [bin/cloakserve:665-676](../../../project-repos/cloakbrowser/bin/cloakserve#L665-L676)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:665-676`

```
    app.router.add_get("/", handle_root)
    app.router.add_get("/json/version", handle_json_version)
    app.router.add_get("/json/version/", handle_json_version)
    app.router.add_get("/json/list", handle_json_list)
    app.router.add_get("/json/list/", handle_json_list)
    app.router.add_get("/json", handle_json_list)
    app.router.add_get("/json/", handle_json_list)

    # WebSocket routes — seed-specific (must be before default to match first)
    app.router.add_get("/fingerprint/{seed}/devtools/{path:.+}", handle_ws_seed)
    # WebSocket routes — default (no seed)
    app.router.add_get("/devtools/{path:.+}", handle_ws_default)
```

<!-- source-snippets:end -->
</details>

**`/`**:健康检查,返回当前进程池状态——pid、端口、seed、连接数、timezone/locale/proxy。

**`/json/version` 与 `/json/list`**:Chrome DevTools Protocol 的发现 endpoint。Playwright 的 `connect_over_cdp` 先打这两个再建立 WS 连接。`cloakserve` 在转发 Chrome 响应时**改写 `webSocketDebuggerUrl`**:

```python
seed_key = params["seed"]
if seed_key:
    ws_path = f"fingerprint/{seed_key}/devtools/browser"
else:
    ws_path = "devtools/browser"

orig_ws = data.get("webSocketDebuggerUrl", "")
guid = orig_ws.rsplit("/", 1)[-1] if "/devtools/" in orig_ws else ""

scheme = _ws_scheme(request)
data["webSocketDebuggerUrl"] = f"{scheme}://{host}/{ws_path}/{guid}"
return web.json_response(data)
```

Sources: [bin/cloakserve:395-434](../../../project-repos/cloakbrowser/bin/cloakserve#L395-L434)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:395-434`

```
async def handle_json_version(request: web.Request) -> web.Response:
    """Proxy /json/version with optional per-seed routing."""
    pool: ChromePool = request.app["pool"]
    params = parse_connection_params(request.query_string)

    cp = await pool.get_or_launch(
        seed=params["seed"],
        extra_args=params["extra_args"] or None,
        timezone=params["timezone"],
        locale=params["locale"],
        proxy=params["proxy"],
        geoip=params["geoip"],
    )

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"http://127.0.0.1:{cp.cdp_port}/json/version",
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                data = await resp.json()
    except Exception as exc:
        logger.error("Failed to reach Chrome CDP (port %d): %s", cp.cdp_port, exc)
        return web.json_response({"error": "CDP endpoint unreachable"}, status=502)

    # Rewrite webSocketDebuggerUrl to route through our multiplexer
    host = request.headers.get("Host", f"localhost:{request.app['port']}")
    seed_key = params["seed"]
    if seed_key:
        ws_path = f"fingerprint/{seed_key}/devtools/browser"
    else:
        ws_path = "devtools/browser"

    # Extract the browser GUID from Chrome's original URL
    orig_ws = data.get("webSocketDebuggerUrl", "")
    guid = orig_ws.rsplit("/", 1)[-1] if "/devtools/" in orig_ws else ""

    scheme = _ws_scheme(request)
    data["webSocketDebuggerUrl"] = f"{scheme}://{host}/{ws_path}/{guid}"
    return web.json_response(data)
```

<!-- source-snippets:end -->
</details>

Chrome 原始的 `webSocketDebuggerUrl` 形如 `ws://127.0.0.1:5100/devtools/browser/<guid>`,这指向内部端口。cloakserve 改写成 `ws://localhost:9222/fingerprint/A1/devtools/browser/<guid>`——客户端永远只看到 `:9222`,内部端口分配对客户端透明。

`_ws_scheme()` 处理 TLS 终止反代场景:如果有 `X-Forwarded-Proto: https`,返回 `wss`。

## WebSocket 代理:双向转发

WS 路由 `/fingerprint/{seed}/devtools/{path:.+}` 进入 `handle_ws_seed`,核心是 `proxy_cdp_websocket()`:

```python
async def proxy_cdp_websocket(client_ws, target_url, label):
    async with websockets.connect(target_url, max_size=None, ping_interval=None, ping_timeout=None) as cdp_ws:
        async def client_to_cdp():
            async for msg in client_ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    await cdp_ws.send(msg.data)
                elif msg.type == aiohttp.WSMsgType.BINARY:
                    await cdp_ws.send(msg.data)
                elif msg.type in (CLOSE, CLOSING, CLOSED):
                    break

        async def cdp_to_client():
            async for msg in cdp_ws:
                if isinstance(msg, str):
                    await client_ws.send_str(msg)
                else:
                    await client_ws.send_bytes(msg)

        c2d = asyncio.create_task(client_to_cdp(), name="c2d")
        d2c = asyncio.create_task(cdp_to_client(), name="d2c")
        done, pending = await asyncio.wait([c2d, d2c], return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            task.cancel()
```

Sources: [bin/cloakserve:483-524](../../../project-repos/cloakbrowser/bin/cloakserve#L483-L524)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:483-524`

```
async def proxy_cdp_websocket(
    client_ws: web.WebSocketResponse,
    target_url: str,
    label: str,
) -> None:
    """Bidirectional WebSocket proxy between client and Chrome CDP."""
    try:
        async with websockets.connect(
            target_url, max_size=None, ping_interval=None, ping_timeout=None,
        ) as cdp_ws:
            logger.info("%s: connected to %s", label, target_url)

            async def client_to_cdp():
                try:
                    async for msg in client_ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            await cdp_ws.send(msg.data)
                        elif msg.type == aiohttp.WSMsgType.BINARY:
                            await cdp_ws.send(msg.data)
                        elif msg.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.CLOSING, aiohttp.WSMsgType.CLOSED):
                            break
                except Exception as exc:
                    logger.debug("%s [c->cdp]: %s", label, exc)

            async def cdp_to_client():
                try:
                    async for msg in cdp_ws:
                        if isinstance(msg, str):
                            await client_ws.send_str(msg)
                        else:
                            await client_ws.send_bytes(msg)
                except Exception as exc:
                    logger.debug("%s [cdp->c]: %s", label, exc)

            c2d = asyncio.create_task(client_to_cdp(), name="c2d")
            d2c = asyncio.create_task(cdp_to_client(), name="d2c")
            done, pending = await asyncio.wait(
                [c2d, d2c], return_when=asyncio.FIRST_COMPLETED,
            )
            for task in pending:
                task.cancel()
            logger.info("%s: disconnected", label)
```

<!-- source-snippets:end -->
</details>

```mermaid
sequenceDiagram
    participant C as Client (Playwright)
    participant P as cloakserve :9222
    participant CH as Chrome internal :5100

    C->>P: GET /json/version?fingerprint=A1
    P->>P: get_or_launch("seed=A1")
    P->>CH: spawn subprocess
    CH-->>P: CDP ready
    P->>CH: GET /json/version
    CH-->>P: {webSocketDebuggerUrl: ws://127.0.0.1:5100/.../guid}
    P-->>C: 改写为 ws://localhost:9222/fingerprint/A1/devtools/browser/guid

    C->>P: WS upgrade /fingerprint/A1/devtools/browser/guid
    P->>CH: WS connect ws://127.0.0.1:5100/devtools/browser/guid
    Note over P,CH: 双向转发开始
    par 客户端 → Chrome
        C->>P: CDP command
        P->>CH: 转发
    and Chrome → 客户端
        CH->>P: CDP event
        P->>C: 转发
    end
    C-->>P: WS close
    P->>P: pool.disconnect(A1) refcount--
```

`max_size=None` 与 `ping_interval=None`:CDP 消息可能很大(截图、HTML),不能限大小;CDP 自己有 keepalive,WS 层不要 ping/pong 干扰。`FIRST_COMPLETED` 保证任一方向出错或断开,另一方向也立即结束。

## 查询参数:解析与路由

`parse_connection_params()` 把 URL 查询串变成 Chrome 启动参数:

```python
SPECIAL_PARAMS = {"fingerprint", "proxy", "geoip", "locale", "timezone"}

def parse_connection_params(query_string: str) -> dict:
    qs = parse_qs(query_string, keep_blank_values=False)
    result = {
        "seed": None, "timezone": None, "locale": None,
        "proxy": None, "geoip": False, "extra_args": [],
    }
    for key, values in qs.items():
        val = values[0]
        if key == "fingerprint":
            result["seed"] = val
        elif key == "timezone":
            result["timezone"] = val
        elif key == "locale":
            result["locale"] = val
        elif key == "proxy":
            result["proxy"] = val
        elif key == "geoip":
            result["geoip"] = val.lower() in ("true", "1", "yes")
        elif key not in SPECIAL_PARAMS:
            result["extra_args"].append(f"--fingerprint-{key}={val}")
    return result
```

Sources: [bin/cloakserve:328-360](../../../project-repos/cloakbrowser/bin/cloakserve#L328-L360)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:328-360`

```
SPECIAL_PARAMS = {"fingerprint", "proxy", "geoip", "locale", "timezone"}


def parse_connection_params(query_string: str) -> dict:
    """Parse query params into connection config."""
    qs = parse_qs(query_string, keep_blank_values=False)

    result: dict = {
        "seed": None,
        "timezone": None,
        "locale": None,
        "proxy": None,
        "geoip": False,
        "extra_args": [],
    }

    for key, values in qs.items():
        val = values[0]
        if key == "fingerprint":
            result["seed"] = val
        elif key == "timezone":
            result["timezone"] = val
        elif key == "locale":
            result["locale"] = val
        elif key == "proxy":
            result["proxy"] = val
        elif key == "geoip":
            result["geoip"] = val.lower() in ("true", "1", "yes")
        elif key not in SPECIAL_PARAMS:
            # Generic fingerprint param: map to --fingerprint-{key}={val}
            result["extra_args"].append(f"--fingerprint-{key}={val}")

    return result
```

<!-- source-snippets:end -->
</details>

**特殊参数**单独处理,**其他参数**自动转 `--fingerprint-<key>=<val>`。例如 `?gpu-vendor=NVIDIA&hardware-concurrency=16` 会变成 `--fingerprint-gpu-vendor=NVIDIA --fingerprint-hardware-concurrency=16`——客户端可以直接通过 URL 控制 binary 的任何 `--fingerprint-*` flag。

例子:

```bash
curl 'http://localhost:9222/json/version?fingerprint=test123&timezone=Asia/Shanghai&locale=zh-CN&gpu-vendor=NVIDIA'
```

→ 启动一个 seed=test123、时区=上海、语言=中文、GPU 厂商=NVIDIA 的 Chrome。

## CLI 与启动入口

`parse_cli_args()` 处理命令行:

```python
config: dict = {
    "port": 9222,
    "headless": True,
    "data_dir": None,
    "default_seed": None,
    "default_locale": None,
    "default_timezone": None,
}

for arg in argv:
    if arg.startswith("--port="):
        config["port"] = int(arg.split("=", 1)[1])
    elif arg.startswith("--data-dir="):
        config["data_dir"] = arg.split("=", 1)[1]
    elif arg == "--headless=false":
        config["headless"] = False
        passthrough.append(arg)
    elif arg.startswith("--fingerprint-locale="):
        config["default_locale"] = arg.split("=", 1)[1]
    elif arg.startswith("--fingerprint-timezone="):
        config["default_timezone"] = arg.split("=", 1)[1]
    elif arg.startswith("--fingerprint="):
        config["default_seed"] = arg.split("=", 1)[1]
    else:
        passthrough.append(arg)
```

Sources: [bin/cloakserve:584-632](../../../project-repos/cloakbrowser/bin/cloakserve#L584-L632)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:584-632`

```
def parse_cli_args(argv: list[str]) -> tuple[dict, list[str]]:
    """Parse cloakserve-specific args, return (config, passthrough_args).

    --fingerprint, --fingerprint-locale, and --fingerprint-timezone are
    extracted into config defaults so they route through build_args()
    (e.g. locale needs both --lang and --fingerprint-locale).
    Query-string params override these defaults per-connection.
    """
    config: dict = {
        "port": 9222,
        "headless": True,
        "data_dir": None,
        "default_seed": None,
        "default_locale": None,
        "default_timezone": None,
    }
    passthrough = []
    # Flags consumed by cloakserve (not passed to Chrome)
    consumed_prefixes = (
        "--port=",
        "--data-dir=",
        "--remote-debugging-port=",
        "--remote-debugging-address=",
    )

    for arg in argv:
        if arg.startswith("--port="):
            config["port"] = int(arg.split("=", 1)[1])
        elif arg.startswith("--data-dir="):
            config["data_dir"] = arg.split("=", 1)[1]
        elif arg == "--headless=false" or arg == "--headless=False":
            config["headless"] = False
            passthrough.append(arg)
        elif arg.startswith(consumed_prefixes):
            pass  # Strip these silently
        # Route through build_args() so companion flags are set correctly
        elif arg.startswith("--fingerprint-locale="):
            config["default_locale"] = arg.split("=", 1)[1]
        elif arg.startswith("--fingerprint-timezone="):
            config["default_timezone"] = arg.split("=", 1)[1]
        elif arg.startswith("--fingerprint="):
            config["default_seed"] = arg.split("=", 1)[1]
        else:
            passthrough.append(arg)

    if config["data_dir"] is None:
        config["data_dir"] = _default_data_dir()

    return config, passthrough
```

<!-- source-snippets:end -->
</details>

`--fingerprint=`、`--fingerprint-locale=`、`--fingerprint-timezone=` 设为 server 级默认值——客户端不传时使用。这些会**通过 build_args 注入**,确保 locale 的 `--lang` 与 `--fingerprint-locale` 双 flag 都设上。这是 0.3.23 修复的(CHANGELOG #130)。

### data dir 选择

```python
def _default_data_dir() -> str:
    if os.path.exists("/.dockerenv") or os.path.exists("/run/.containerenv"):
        return "/tmp/cloakserve"
    return str(Path.home() / ".cloakbrowser" / "cloakserve")
```

Sources: [bin/cloakserve:577-581](../../../project-repos/cloakbrowser/bin/cloakserve#L577-L581)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:577-581`

```
def _default_data_dir() -> str:
    """Smart default: container → /tmp/cloakserve, bare metal → ~/.cloakbrowser/cloakserve."""
    if os.path.exists("/.dockerenv") or os.path.exists("/run/.containerenv"):
        return "/tmp/cloakserve"
    return str(Path.home() / ".cloakbrowser" / "cloakserve")
```

<!-- source-snippets:end -->
</details>

容器内用 `/tmp`,容器外用 home 目录——`/.dockerenv` 是 Docker 标准标记,`/run/.containerenv` 是 Podman 标准标记。这种"自动适应容器"的小动作让 Docker 部署不需要任何配置。

### bind 地址

```python
in_container = os.path.exists("/.dockerenv") or os.path.exists("/run/.containerenv")
host = "0.0.0.0" if in_container else "127.0.0.1"
web.run_app(app, host=host, port=port, print=None)
```

Sources: [bin/cloakserve:687-690](../../../project-repos/cloakbrowser/bin/cloakserve#L687-L690)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:687-690`

```

    in_container = os.path.exists("/.dockerenv") or os.path.exists("/run/.containerenv")
    host = "0.0.0.0" if in_container else "127.0.0.1"
    web.run_app(app, host=host, port=port, print=None)
```

<!-- source-snippets:end -->
</details>

容器内 bind `0.0.0.0`(必须,否则宿主机访问不到);容器外 bind `127.0.0.1`(默认安全,不监听公网)。这是 0.3.28 的安全加固——之前默认 0.0.0.0 在裸金属上会暴露 CDP 到 LAN。

## 客户端使用

```python
# Python — Playwright
from playwright.sync_api import sync_playwright

pw = sync_playwright().start()
browser = pw.chromium.connect_over_cdp("http://localhost:9222?fingerprint=user_A&timezone=America/New_York")
page = browser.new_page()
page.goto("https://protected-site.com")
```

```javascript
// JS — Playwright
import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP(
  'http://localhost:9222?fingerprint=user_A&timezone=America/New_York'
);
```

```bash
# Docker 部署
docker run -p 9222:9222 cloakhq/cloakbrowser cloakserve --port=9222
```

## 几个非显然的设计点

**1. 同 seed 多客户端可以并发**

```python
def connect(self, seed_key: str) -> None:
    self._connections[seed_key] = self._connections.get(seed_key, 0) + 1

def disconnect(self, seed_key: str) -> None:
    count = self._connections.get(seed_key, 0) - 1
    if count <= 0:
        self._connections.pop(seed_key, None)
    else:
        self._connections[seed_key] = count
```

Sources: [bin/cloakserve:139-150](../../../project-repos/cloakbrowser/bin/cloakserve#L139-L150)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:139-150`

```
    def connect(self, seed_key: str) -> None:
        """Increment connection refcount for a seed."""
        self._connections[seed_key] = self._connections.get(seed_key, 0) + 1

    def disconnect(self, seed_key: str) -> None:
        """Decrement connection refcount for a seed."""
        count = self._connections.get(seed_key, 0) - 1
        if count <= 0:
            self._connections.pop(seed_key, None)
        else:
            self._connections[seed_key] = count

```

<!-- source-snippets:end -->
</details>

connection 是引用计数。两个客户端可以同时连同一个 seed 的 Chrome(它会有两个 BrowserContext),互相不干扰。

**2. WebSocket 路由顺序很重要**

```python
app.router.add_get("/fingerprint/{seed}/devtools/{path:.+}", handle_ws_seed)
app.router.add_get("/devtools/{path:.+}", handle_ws_default)
```

`/fingerprint/...` 必须**先**于 `/devtools/...` 注册,因为 aiohttp 路由器按注册顺序匹配。否则 `/fingerprint/A1/devtools/browser/guid` 会被 `handle_ws_default` 匹配走 `__default__` 池,导致错误的 Chrome 接管连接。

**3. `_safe_rmtree` 防误删**

```python
def _safe_rmtree(self, path: str) -> None:
    resolved = Path(path).resolve()
    data_resolved = Path(self._data_dir).resolve()
    if resolved == data_resolved or not resolved.is_relative_to(data_resolved):
        logger.error("Refusing to delete path outside data_dir: %s", resolved)
        return
    shutil.rmtree(path, True)
```

Sources: [bin/cloakserve:118-124](../../../project-repos/cloakbrowser/bin/cloakserve#L118-L124)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:118-124`

```
    def _safe_rmtree(self, path: str) -> None:
        resolved = Path(path).resolve()
        data_resolved = Path(self._data_dir).resolve()
        if resolved == data_resolved or not resolved.is_relative_to(data_resolved):
            logger.error("Refusing to delete path outside data_dir: %s", resolved)
            return
        shutil.rmtree(path, True)
```

<!-- source-snippets:end -->
</details>

清理 Chrome 进程时会删它的 user_data_dir。但 `user_data_dir = self._data_dir / seed_key`,如果 `seed_key` 含 `..` 或绝对路径,可能造成根目录被删——`_safe_rmtree` 把"必须在 data_dir 之内"作为前置检查,任何外部路径都拒绝删除。

**4. 退出时 graceful shutdown**

```python
async def on_shutdown(app: web.Application) -> None:
    await app["pool"].shutdown()

app.on_shutdown.append(on_shutdown)
```

Sources: [bin/cloakserve:569-571](../../../project-repos/cloakbrowser/bin/cloakserve#L569-L571), [bin/cloakserve:680](../../../project-repos/cloakbrowser/bin/cloakserve:680)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/cloakserve:569-571`

```
async def on_shutdown(app: web.Application) -> None:
    await app["pool"].shutdown()

```

#### `bin/cloakserve:680`

> 未找到引用文件：`bin/cloakserve:680`

<!-- source-snippets:end -->
</details>

aiohttp 收到 SIGTERM 时调 `pool.shutdown()`,逐个 SIGTERM Chrome 进程,5 秒不退就 SIGKILL,然后清理 user_data_dir。Docker `docker stop` 默认 SIGTERM,这套链路保证容器停止时不留僵尸 Chrome。

## 相关页面

- [系统架构](system-architecture.md) — cloakserve 在三层模型中的位置
- [启动 API:四象限对偶](launch-api.md) — wrapper 与 cloakserve 共享的 build_args 路径
- [代理、GeoIP 与 WebRTC 一致性](proxy-and-geoip.md) — cloakserve 中 proxy 参数的处理
- [部署与生态集成](deployment-and-integrations.md) — Docker 部署 cloakserve 的实操


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [cloakbrowser/__init__.py](../../../project-repos/cloakbrowser/cloakbrowser/__init__.py)
- [cloakbrowser/browser.py](../../../project-repos/cloakbrowser/cloakbrowser/browser.py)
- [js/src/index.ts](../../../project-repos/cloakbrowser/js/src/index.ts)
- [js/src/playwright.ts](../../../project-repos/cloakbrowser/js/src/playwright.ts)
- [js/src/puppeteer.ts](../../../project-repos/cloakbrowser/js/src/puppeteer.ts)
- [js/src/types.ts](../../../project-repos/cloakbrowser/js/src/types.ts)
- [js/package.json](../../../project-repos/cloakbrowser/js/package.json)
- [pyproject.toml](../../../project-repos/cloakbrowser/pyproject.toml)

</details>

# Python 与 JS 双 SDK 对偶

CloakBrowser 在 PyPI 与 npm 上同时存在 `cloakbrowser` 包,共用同一份 Chromium 二进制,共用同一组 fingerprint flag,共用同一套 GeoIP/proxy 处理逻辑——这意味着工程上有两份高度对偶的代码,需要严格保持行为一致。一处的修复必须同步到另一处,否则两边用户体验会出现不可预期的偏差。

这一页关注三件事:**双 SDK 的入口与发布机制**、**API 一一对应映射表**、**那些必须存在的差异**(平台 API 强制的、Puppeteer/Playwright 差异强制的)。

## 入口对偶:同名包,不同导入路径

|维度|Python|JS|
|---|---|---|
|包名|`cloakbrowser`|`cloakbrowser`|
|安装|`pip install cloakbrowser`|`npm install cloakbrowser playwright-core`|
|主要导入|`from cloakbrowser import launch`|`import { launch } from 'cloakbrowser'`|
|Puppeteer 导入|无|`import { launch } from 'cloakbrowser/puppeteer'`|
|可选附加件|`[geoip]` `[patchright]` `[serve]` `[dev]`|peer deps:`playwright-core` 或 `puppeteer-core`|
|平台兼容|Python 3.9-3.13|Node ≥ 18(隐式,看 `playwright-core` 版本)|

`pyproject.toml` 用 `hatchling` 做构建,版本通过 `cloakbrowser/_version.py` 单独管理:

```toml
[project]
name = "cloakbrowser"
dynamic = ["version"]
dependencies = [
    "playwright>=1.40",
    "httpx>=0.24",
]
[project.optional-dependencies]
geoip = ["geoip2>=4.0", "socksio>=1.0"]
patchright = ["patchright>=1.40"]
serve = ["aiohttp>=3.9", "websockets>=12.0"]
dev = ["pytest>=7.0", "pytest-asyncio>=0.23"]

[project.scripts]
cloakbrowser = "cloakbrowser.__main__:main"
```

Sources: [pyproject.toml:5-77](../../../project-repos/cloakbrowser/pyproject.toml#L5-L77)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `pyproject.toml:5-77`

```toml
[project]
name = "cloakbrowser"
dynamic = ["version"]
description = "Stealth Chromium that passes every bot detection test. Drop-in Playwright replacement with source-level fingerprint patches."
readme = "README.md"
license = "MIT"
requires-python = ">=3.9"
authors = [
    { name = "CloakHQ", email = "cloakhq@pm.me" },
]
keywords = [
    "stealth",
    "browser",
    "chromium",
    "playwright",
    "puppeteer",
    "scraping",
    "web-scraping",
    "anti-detect",
    "antidetect",
    "undetected",
    "bot-detection",
    "fingerprint",
    "recaptcha",
    "cloudflare",
    "turnstile",
    "datadome",
    "captcha",
    "headless",
    "automation",
    "ai-agent",
]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Topic :: Internet :: WWW/HTTP :: Browsers",
    "Topic :: Software Development :: Libraries :: Python Modules",
    "Topic :: Software Development :: Testing",
]
dependencies = [
    "playwright>=1.40",
    "httpx>=0.24",
]

[project.optional-dependencies]
geoip = ["geoip2>=4.0", "socksio>=1.0"]  # socksio: SOCKS5 transport for httpx
patchright = ["patchright>=1.40"]
serve = ["aiohttp>=3.9", "websockets>=12.0"]
dev = ["pytest>=7.0", "pytest-asyncio>=0.23"]

[project.scripts]
cloakbrowser = "cloakbrowser.__main__:main"

[project.urls]
Homepage = "https://github.com/CloakHQ/CloakBrowser"
Documentation = "https://github.com/CloakHQ/CloakBrowser#readme"
Repository = "https://github.com/CloakHQ/CloakBrowser"
Issues = "https://github.com/CloakHQ/CloakBrowser/issues"

[tool.hatch.version]
path = "cloakbrowser/_version.py"

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
markers = ["slow: marks tests that hit live detection sites (deselect with '-m \"not slow\"')"]
```

<!-- source-snippets:end -->
</details>

JS 端 `js/package.json` 通过 `exports` 字段提供子路径导入:

```json
{
  "name": "cloakbrowser",
  "exports": {
    ".": "./dist/index.js",
    "./puppeteer": "./dist/puppeteer.js",
    "./human": "./dist/human/index.js"
  }
}
```

这样 `cloakbrowser` 是 Playwright 入口,`cloakbrowser/puppeteer` 是 Puppeteer 入口,`cloakbrowser/human` 是给手动 patch 已存在 browser 实例用的(CDP-connected 场景)。Python 端没有这种细分,所有 humanize 工具都在主包暴露。

## 公开 API 完整映射

下表把 Python 端 `__init__.py` 暴露的 `__all__` 与 JS 端 `index.ts` 的 `export` 一一对照:

|功能|Python|JS|
|---|---|---|
|launch|`launch`|`launch`(本身就是 async)|
|launch async|`launch_async`|与 `launch` 同|
|launch + context|`launch_context`|`launchContext`|
|launch + context async|`launch_context_async`|与 `launchContext` 同|
|persistent context|`launch_persistent_context`|`launchPersistentContext`|
|persistent context async|`launch_persistent_context_async`|与 `launchPersistentContext` 同|
|二进制下载|`ensure_binary`|`ensureBinary`|
|清缓存|`clear_cache`|`clearCache`|
|信息查询|`binary_info`|`binaryInfo`|
|手动更新|`check_for_update`|`checkForUpdate`|
|默认 stealth args|`get_default_stealth_args`|`getDefaultStealthArgs`|
|构建 args|`build_args`|未暴露(`_buildArgsForTest` 内部用)|
|GeoIP 解析|`maybe_resolve_geoip`|未直接暴露|
|常量|`CHROMIUM_VERSION` `__version__` `ProxySettings`|`CHROMIUM_VERSION`|
|HumanConfig|`HumanConfig` `resolve_human_config`|TS type + `resolveConfig` 通过 `cloakbrowser/human`|

Sources: [cloakbrowser/__init__.py:14-50](../../../project-repos/cloakbrowser/cloakbrowser/__init__.py#L14-L50), [js/src/index.ts:18-29](../../../project-repos/cloakbrowser/js/src/index.ts#L18-L29)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/__init__.py:14-50`

```python
from .browser import launch, launch_async, launch_context, launch_context_async, launch_persistent_context, launch_persistent_context_async, ProxySettings, build_args, maybe_resolve_geoip
from .config import CHROMIUM_VERSION, get_default_stealth_args
from .download import binary_info, check_for_update, clear_cache, ensure_binary
from ._version import __version__

# Human-like behavioral layer (optional)
def __getattr__(name):
    if name == "HumanConfig":
        from .human.config import HumanConfig
        globals()["HumanConfig"] = HumanConfig
        return HumanConfig
    if name == "resolve_human_config":
        from .human.config import resolve_config
        globals()["resolve_human_config"] = resolve_config
        return resolve_config
    raise AttributeError(f"module 'cloakbrowser' has no attribute {name}")

__all__ = [
    "launch",
    "launch_async",
    "launch_context",
    "launch_context_async",
    "launch_persistent_context",
    "launch_persistent_context_async",
    "ensure_binary",
    "clear_cache",
    "binary_info",
    "check_for_update",
    "CHROMIUM_VERSION",
    "get_default_stealth_args",
    "build_args",
    "maybe_resolve_geoip",
    "ProxySettings",
    "HumanConfig",
    "resolve_human_config",
    "__version__",
]
```

#### `js/src/index.ts:18-29`

```typescript
// Launch functions (Playwright API)
export { launch, launchContext, launchPersistentContext } from "./playwright.js";

// Binary management
export { ensureBinary, clearCache, binaryInfo, checkForUpdate } from "./download.js";

// Config
export { CHROMIUM_VERSION, getDefaultStealthArgs } from "./config.js";

// Types
export type { LaunchOptions, LaunchContextOptions, LaunchPersistentContextOptions, BinaryInfo } from "./types.js";
```

<!-- source-snippets:end -->
</details>

### 命名风格

Python 用 snake_case,JS 用 camelCase——这两套规范不强行统一。`launch_context` ↔ `launchContext` 是 lossless 翻译,不会引起误解。但 `ensure_binary` ↔ `ensureBinary`、`clear_cache` ↔ `clearCache` 等工具函数也保持各自风格,所以两边代码风格都"原汁原味"。

### 异步对偶的不同模式

Python 是 sync-first:有 `launch()` 同步函数,也有 `launch_async()` 异步对偶。这两份代码完全独立,但内部逻辑严格镜像:

```python
# Python sync
def launch(headless=True, ...):
    sync_playwright = _import_sync_playwright(...)
    pw = sync_playwright().start()
    browser = pw.chromium.launch(...)
    # ...

# Python async
async def launch_async(headless=True, ...):
    async_playwright = _import_async_playwright(...)
    pw = await async_playwright().start()
    browser = await pw.chromium.launch(...)
    # ...
```

Sources: [cloakbrowser/browser.py:55-237](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L55-L237)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:55-237`

```python
def launch(
    headless: bool = True,
    proxy: str | ProxySettings | None = None,
    args: list[str] | None = None,
    stealth_args: bool = True,
    timezone: str | None = None,
    locale: str | None = None,
    geoip: bool = False,
    backend: str | None = None,
    humanize: bool = False,
    human_preset: HumanPreset = "default",
    human_config: HumanConfigOverrides | None = None,
    **kwargs: Any,
) -> Any:
    """Launch stealth Chromium browser. Returns a Playwright Browser object.

    Args:
        headless: Run in headless mode (default True).
        proxy: Proxy URL string or Playwright proxy dict.
            String: 'http://user:pass@proxy:8080' (credentials auto-extracted).
            Dict: {"server": "http://proxy:8080", "bypass": ".google.com", ...}
            — passed directly to Playwright.
        args: Additional Chromium CLI arguments to pass.
        stealth_args: Include default stealth fingerprint args (default True).
            Set to False if you want to pass your own --fingerprint flags.
        timezone: IANA timezone (e.g. 'America/New_York'). Sets --fingerprint-timezone binary flag.
        locale: BCP 47 locale (e.g. 'en-US'). Sets --lang binary flag.
        geoip: Auto-detect timezone/locale from proxy IP (default False).
            Requires ``pip install cloakbrowser[geoip]``. Downloads ~70 MB
            GeoLite2-City database on first use.  Explicit timezone/locale
            always override geoip results.
        backend: Playwright backend — 'playwright' (default) or 'patchright'.
            Patchright suppresses CDP signals (helps reCAPTCHA v3 Enterprise)
            but breaks proxy auth and add_init_script.
            Override globally with CLOAKBROWSER_BACKEND env var.
        humanize: Enable human-like mouse, keyboard, scroll behavior (default False).
        human_preset: Humanize preset — 'default' or 'careful' (default 'default').
        human_config: Custom humanize config mapping to override preset values.
        **kwargs: Passed directly to playwright.chromium.launch().

    Returns:
        Playwright Browser object — use same API as playwright.chromium.launch().

    Example:
        >>> from cloakbrowser import launch
        >>> browser = launch()
        >>> page = browser.new_page()
        >>> page.goto("https://bot.incolumitas.com")
        >>> print(page.title())
        >>> browser.close()
    """
    sync_playwright = _import_sync_playwright(_resolve_backend(backend))

    binary_path = ensure_binary()
    timezone, locale, exit_ip = maybe_resolve_geoip(geoip, proxy, timezone, locale)
    proxy_kwargs, proxy_extra_args = _resolve_proxy_config(proxy)
    args = _resolve_webrtc_args(args, proxy)
    if exit_ip and not (args and any(a.startswith("--fingerprint-webrtc-ip") for a in args)):
        args = list(args or [])
        args.append(f"--fingerprint-webrtc-ip={exit_ip}")
    chrome_args = build_args(stealth_args, (args or []) + proxy_extra_args, timezone=timezone, locale=locale, headless=headless)

    logger.debug("Launching stealth Chromium (headless=%s, args=%d)", headless, len(chrome_args))

    pw = sync_playwright().start()
    browser = pw.chromium.launch(
        executable_path=binary_path,
        headless=headless,
        args=chrome_args,
        ignore_default_args=IGNORE_DEFAULT_ARGS,
        **proxy_kwargs,
        **kwargs,
    )

    # Patch close() to also stop the Playwright instance
    _original_close = browser.close

    def _close_with_cleanup() -> None:
        try:
            _original_close()
        finally:
            pw.stop()

    browser.close = _close_with_cleanup

    # Human-like behavioral patching
    if humanize:
        from .human import patch_browser
        from .human.config import resolve_config
        cfg = resolve_config(human_preset, human_config)
        patch_browser(browser, cfg)

    return browser


async def launch_async(  # noqa: C901
    headless: bool = True,
    proxy: str | ProxySettings | None = None,
    args: list[str] | None = None,
    stealth_args: bool = True,
    timezone: str | None = None,
    locale: str | None = None,
    geoip: bool = False,
    backend: str | None = None,
    humanize: bool = False,
    human_preset: HumanPreset = "default",
    human_config: HumanConfigOverrides | None = None,
    **kwargs: Any,
) -> Any:
    """Async version of launch(). Returns a Playwright Browser object.

    Args:
        headless: Run in headless mode (default True).
        proxy: Proxy URL string or Playwright proxy dict (see launch() for details).
        args: Additional Chromium CLI arguments to pass.
        stealth_args: Include default stealth fingerprint args (default True).
        timezone: IANA timezone (e.g. 'America/New_York'). Sets --fingerprint-timezone binary flag.
        locale: BCP 47 locale (e.g. 'en-US'). Sets --lang binary flag.
        geoip: Auto-detect timezone/locale from proxy IP (default False).
        backend: Playwright backend — 'playwright' (default) or 'patchright'.
... snippet truncated ...
```

<!-- source-snippets:end -->
</details>

JS 没有同步 API(JS 主流框架都是 async),所以只有 `launch`:

```typescript
export async function launch(options: LaunchOptions = {}): Promise<Browser> {
    const { chromium } = await import("playwright-core");
    const browser = await chromium.launch({ ... });
    return browser;
}
```

Sources: [js/src/playwright.ts:60-93](../../../project-repos/cloakbrowser/js/src/playwright.ts#L60-L93)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/playwright.ts:60-93`

```typescript
export async function launch(options: LaunchOptions = {}): Promise<Browser> {
  const { chromium } = await import("playwright-core");

  const binaryPath = process.env.CLOAKBROWSER_BINARY_PATH || (await ensureBinary());
  const { exitIp, ...resolved } = await maybeResolveGeoip(options);
  const { proxyOption, proxyArgs } = resolveProxyConfig(options.proxy);
  let resolvedArgs = await resolveWebrtcArgs(options);
  if (exitIp && !(resolvedArgs ?? []).some(a => a.startsWith("--fingerprint-webrtc-ip"))) {
    resolvedArgs = [...(resolvedArgs ?? []), `--fingerprint-webrtc-ip=${exitIp}`];
  }
  const args = buildArgs({ ...options, ...resolved, args: [...(resolvedArgs ?? []), ...proxyArgs] });

  const browser = await chromium.launch({
    executablePath: binaryPath,
    headless: options.headless ?? true,
    args,
    ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    ...(proxyOption ? { proxy: proxyOption } : {}),
    ...options.launchOptions,
  });

  // Human-like behavioral patching
  if (options.humanize) {
    const { patchBrowser } = await import('./human/index.js');
    const { resolveConfig } = await import('./human/config.js');
    const cfg = resolveConfig(
      options.humanPreset ?? 'default',
      options.humanConfig,
    );
    patchBrowser(browser, cfg);
  }

  return browser;
}
```

<!-- source-snippets:end -->
</details>

## 配置参数对照

| 用户传参 | Python | JS |
|---|---|---|
| `headless` | `headless: bool = True` | `headless?: boolean` |
| `proxy` | `proxy: str \| ProxySettings \| None` | `proxy?: string \| ProxyDict` |
| `args` | `args: list[str] \| None` | `args?: string[]` |
| stealth 开关 | `stealth_args: bool = True` | `stealthArgs?: boolean` |
| 时区 | `timezone: str \| None` | `timezone?: string` |
| 时区别名 | (无)| `timezoneId?: string`(自动转 timezone) |
| 地区 | `locale: str \| None` | `locale?: string` |
| GeoIP | `geoip: bool = False` | `geoip?: boolean` |
| 后端 | `backend: str \| None` ("playwright"/"patchright") | (无,只 Playwright 或 Puppeteer 子路径) |
| 拟人化 | `humanize: bool = False` | `humanize?: boolean` |
| 预设 | `human_preset: HumanPreset = "default"` | `humanPreset?: HumanPreset` |
| 覆盖 | `human_config: HumanConfigOverrides \| None` | `humanConfig?: Partial<HumanConfig>` |
| 透传 | `**kwargs` → Playwright launch | `launchOptions?: Record<string, unknown>` → Playwright launch |

Sources: [cloakbrowser/browser.py:55-67](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L55-L67), [js/src/types.ts:8-36](../../../project-repos/cloakbrowser/js/src/types.ts#L8-L36)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:55-67`

```python
def launch(
    headless: bool = True,
    proxy: str | ProxySettings | None = None,
    args: list[str] | None = None,
    stealth_args: bool = True,
    timezone: str | None = None,
    locale: str | None = None,
    geoip: bool = False,
    backend: str | None = None,
    humanize: bool = False,
    human_preset: HumanPreset = "default",
    human_config: HumanConfigOverrides | None = None,
    **kwargs: Any,
```

#### `js/src/types.ts:8-36`

```typescript
export interface LaunchOptions {
  /** Run in headless mode (default: true). */
  headless?: boolean;
  /**
   * Proxy server — URL string or Playwright proxy object.
   * String: 'http://user:pass@proxy:8080' (credentials auto-extracted).
   * Object: { server: "http://proxy:8080", bypass: ".google.com", ... }
   *   — passed directly to Playwright.
   */
  proxy?: string | { server: string; bypass?: string; username?: string; password?: string };
  /** Additional Chromium CLI arguments. */
  args?: string[];
  /** Include default stealth fingerprint args (default: true). Set false to use custom --fingerprint flags. */
  stealthArgs?: boolean;
  /** IANA timezone, e.g. "America/New_York". Sets --fingerprint-timezone binary flag. */
  timezone?: string;
  /** BCP 47 locale, e.g. "en-US". Sets --lang binary flag. */
  locale?: string;
  /** Auto-detect timezone/locale from proxy IP (requires: npm install mmdb-lib). */
  geoip?: boolean;
  /** Raw options passed directly to playwright/puppeteer launch(). */
  launchOptions?: Record<string, unknown>;
  /** Enable human-like mouse, keyboard, and scroll behavior. */
  humanize?: boolean;
  /** Human behavior preset: 'default' or 'careful'. */
  humanPreset?: HumanPreset;
  /** Override individual human behavior parameters. */
  humanConfig?: Partial<HumanConfig>;
}
```

<!-- source-snippets:end -->
</details>

### timezoneId 别名:为何只在 JS 端

Python 端鼓励统一用 `timezone`(自 0.3.7 起),旧代码用 `timezone_id` 会触发 deprecation warning;JS 端则在 `LaunchContextOptions` 上保留 `timezoneId` 作为 `timezone` 的别名,**无 warning**:

```typescript
export function resolveTimezone<T extends { timezone?: string; timezoneId?: string }>(options: T): T {
  if (options.timezoneId != null) {
    const merged = { ...options, timezone: options.timezone ?? options.timezoneId };
    delete (merged as any).timezoneId;
    return merged;
  }
  return options;
}
```

Sources: [js/src/playwright.ts:15-22](../../../project-repos/cloakbrowser/js/src/playwright.ts#L15-L22)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/playwright.ts:15-22`

```typescript
export function resolveTimezone<T extends { timezone?: string; timezoneId?: string }>(options: T): T {
  if (options.timezoneId != null) {
    const merged = { ...options, timezone: options.timezone ?? options.timezoneId };
    delete (merged as any).timezoneId;
    return merged;
  }
  return options;
}
```

<!-- source-snippets:end -->
</details>

原因是 JS 用户更习惯 Playwright 的 `timezoneId` 写法(Playwright 原生 API 里就是这样命名),强行让用户改名会增加迁移成本。Python 端没有这个习惯包袱。

## 必要的差异:Puppeteer 适配

Python 端**没有** Puppeteer 入口——Python 的 Pyppeteer 项目已停止维护,使用率低,不值得维护一份对偶。

JS 端则提供 `cloakbrowser/puppeteer` 子路径,但接口形态比 Playwright 端简化:

```typescript
// Puppeteer 端只有 launch
export async function launch(options: LaunchOptions = {}): Promise<Browser>;
```

没有 `launchContext` 等同物——Puppeteer 的 BrowserContext 是单独 API,合并到 launch 会显得别扭。Puppeteer 用户:

```typescript
import { launch } from 'cloakbrowser/puppeteer';
const browser = await launch({ humanize: true });
const context = await browser.createIncognitoBrowserContext();  // 自己开 context
const page = await context.newPage();
```

### HTTP 代理凭证差异

Playwright 与 Puppeteer 对 HTTP 代理凭证处理完全不同:

| 框架 | inline 凭证(`http://user:pass@host:port`) |
|---|---|
| Playwright | 拆成 dict,Playwright 自动处理 auth |
| Puppeteer | 不支持,必须 `--proxy-server=host:port` + `page.authenticate({user, pass})` |

[`js/src/puppeteer.ts`](../../../project-repos/cloakbrowser/js/src/puppeteer.ts) 必须 monkey-patch `newPage`:

```typescript
let proxyAuth: { username: string; password: string } | undefined;
if (options.proxy) {
  if (typeof options.proxy === "string" && !isSocksProxy(options.proxy)) {
    const { server, username, password } = parseProxyUrl(options.proxy);
    args.push(`--proxy-server=${server}`);
    if (username) {
      proxyAuth = { username, password: password ?? "" };
    }
  }
  // ...
}

if (proxyAuth) {
  const origNewPage = browser.newPage.bind(browser);
  const auth = proxyAuth;
  browser.newPage = async (...pageArgs) => {
    const page = await origNewPage(...pageArgs);
    await page.authenticate(auth);
    return page;
  };
}
```

Sources: [js/src/puppeteer.ts:43-88](../../../project-repos/cloakbrowser/js/src/puppeteer.ts#L43-L88)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/puppeteer.ts:43-88`

```typescript
  // HTTP: Chrome does NOT support inline credentials — strip them and
  // use page.authenticate() for Proxy-Authorization headers instead.
  let proxyAuth: { username: string; password: string } | undefined;
  if (options.proxy) {
    if (isSocksProxy(options.proxy)) {
      // SOCKS5: pass full URL with credentials to Chrome directly
      const { proxyArgs } = resolveProxyConfig(options.proxy);
      args.push(...proxyArgs);
    } else if (typeof options.proxy === "string") {
      const { server, username, password } = parseProxyUrl(options.proxy);
      args.push(`--proxy-server=${server}`);
      if (username) {
        proxyAuth = { username, password: password ?? "" };
      }
    } else {
      const parsed = parseProxyUrl(options.proxy.server);
      args.push(`--proxy-server=${parsed.server}`);
      if (options.proxy.bypass) {
        args.push(`--proxy-bypass-list=${options.proxy.bypass}`);
      }
      const username = options.proxy.username ?? parsed.username;
      const password = options.proxy.password ?? parsed.password;
      if (username) {
        proxyAuth = { username, password: password ?? "" };
      }
    }
  }

  const browser = await puppeteer.default.launch({
    executablePath: binaryPath,
    headless: options.headless ?? true,
    args,
    ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    ...options.launchOptions,
  });

  // Monkey-patch newPage() to auto-authenticate proxy credentials
  if (proxyAuth) {
    const origNewPage = browser.newPage.bind(browser);
    const auth = proxyAuth;
    browser.newPage = async (...pageArgs: Parameters<typeof origNewPage>) => {
      const page = await origNewPage(...pageArgs);
      await page.authenticate(auth);
      return page;
    };
  }
```

<!-- source-snippets:end -->
</details>

这种"为兼容老 API 做的 wrapper 内部工作"是双 SDK 的隐性成本。Playwright 这边一行不用写,Puppeteer 这边要 monkey-patch + 维护 monkey-patch 的兼容性。

### 拟人化的双套实现

`js/src/human/` 是 Playwright 拟人化,`js/src/human-puppeteer/` 是 Puppeteer 拟人化——两份独立代码,因为 Page、Mouse、Keyboard 在两个框架的 API 完全不同。共享的只有 `config.ts`(HumanConfig)。

Python 端因为没 Puppeteer 入口,只有一份 `human/`,代码更小。这是 Python 端代码体积大约只有 JS 端 60% 的主要原因。

## 平台 API 强制的差异

| 关注点 | Python | JS |
|---|---|---|
|路径|`pathlib.Path`|`node:path` + `node:fs`|
|平台 tag 解析|`platform.system() + machine()`|`process.platform + process.arch`|
|进程启动|`subprocess.Popen`|`child_process.spawn` 或 puppeteer/playwright 内部|
|URL 解析|`urllib.parse.urlparse`|`new URL()` 或手工解析|
|HTTP 客户端|`httpx`|`node:http` / fetch / 内置|
|临时文件|`tempfile.NamedTemporaryFile`|`fs.mkdtemp` + path.join|

最有意思的差异是 **URL 解析**:JS 端 `js/src/proxy.ts` 的 SOCKS5 凭证重编码刻意**绕过 `new URL()`**,手工解析,因为 WHATWG URL 的 setter 行为与 Python `urlparse` 不一致,会导致双 SDK 输出不同的归一化结果。Python 端可以直接用 `urlparse`,JS 端要付出多写 50 行代码的代价以维持对偶——这是双 SDK 最隐性的工程负担。

Sources: [js/src/proxy.ts:104-156](../../../project-repos/cloakbrowser/js/src/proxy.ts#L104-L156)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/proxy.ts:104-156`

```typescript
export function normalizeSocksStringUrl(urlStr: string): string {
  // Split userinfo from host at the LAST '@' (RFC 3986), so a raw '@' inside
  // a password like `socks5://user:p@ss@host:1080` parses correctly. Matches
  // Python urlparse's rpartition('@') behavior.
  const schemeMatch = urlStr.match(/^([a-z][a-z0-9+\-.]*):\/\/(.*)$/i);
  if (!schemeMatch) return urlStr;
  const [, scheme, rest] = schemeMatch;
  const hostStart = rest.search(/[/?#]/);
  const authority = hostStart === -1 ? rest : rest.slice(0, hostStart);
  const suffix = hostStart === -1 ? "" : rest.slice(hostStart);
  const atIdx = authority.lastIndexOf("@");
  if (atIdx === -1) return urlStr;  // no creds
  const userinfo = authority.slice(0, atIdx);
  const hostPart = authority.slice(atIdx + 1);
  // Validate port (matches Python's urlparse().port ValueError guard).
  // Extract port after last ':' — but skip IPv6 brackets (e.g. [::1]:1080).
  const bracketEnd = hostPart.lastIndexOf("]");
  const portColonIdx = hostPart.indexOf(":", Math.max(bracketEnd, 0));
  if (portColonIdx !== -1) {
    const portStr = hostPart.slice(portColonIdx + 1);
    if (portStr && !/^\d+$/.test(portStr)) {
      console.warn(`[cloakbrowser] Malformed SOCKS5 proxy URL, passing through unchanged: invalid port`);
      return urlStr;
    }
  }
  const hostAndRest = hostPart + suffix;
  const colonIdx = userinfo.indexOf(":");
  const rawUserEnc = colonIdx === -1 ? userinfo : userinfo.slice(0, colonIdx);
  const hasPassword = colonIdx !== -1;
  const rawPassEnc = hasPassword ? userinfo.slice(colonIdx + 1) : "";
  try {
    const encUser = rawUserEnc ? encodeURIComponent(lenientDecodeURIComponent(rawUserEnc)) : "";
    const encPass = hasPassword
      ? (rawPassEnc ? encodeURIComponent(lenientDecodeURIComponent(rawPassEnc)) : "")
      : null;
    const normalized = assembleSocksUrl(scheme, encUser, encPass, hostAndRest);
    // Compare credentials, not the full URL: keeps the log condition focused
    // on real encoding work, not cosmetic differences (parity with the Python
    // implementation, which has to skip urlparse's hostname lowercasing).
    const credsChanged = encUser !== rawUserEnc
      || (hasPassword ? encPass !== rawPassEnc : false);
    if (credsChanged) {
      console.info(
        "[cloakbrowser] Auto URL-encoded SOCKS5 proxy credentials (special " +
        "characters detected). Pre-encode the URL to suppress this notice.",
      );
    }
    return normalized;
  } catch (e) {
    console.warn(`[cloakbrowser] Could not normalize SOCKS5 proxy URL, passing through unchanged: ${(e as Error).message}`);
    return urlStr;
  }
}
```

<!-- source-snippets:end -->
</details>

## 双 SDK 版本同步

`publish.yml` 的 `validate-version` job:

```yaml
- name: Check tag matches package versions
  run: |
    TAG="${GITHUB_REF_NAME#v}"
    PY=$(python -c 'import re; print(re.search(r"__version__\s*=\s*[\"'\'']([^\"'\'']+)", open("cloakbrowser/_version.py").read()).group(1))')
    JS=$(python -c 'import json; print(json.load(open("js/package.json"))["version"])')
    echo "Tag: $TAG | Python: $PY | npm: $JS"
    [ "$TAG" = "$PY" ] || { echo "ERROR: tag v$TAG != _version.py $PY"; exit 1; }
    [ "$TAG" = "$JS" ] || { echo "ERROR: tag v$TAG != package.json $JS"; exit 1; }
```

Sources: [github/workflows/publish.yml:41-56](../../../project-repos/cloakbrowser/.github/workflows/publish.yml#L41-L56)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/publish.yml:41-56`

```yaml
  validate-version:
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2
      - uses: actions/setup-python@a309ff8b426b58ec0e2a45f0f869d46889d02405  # v6.2.0
        with:
          python-version: "3.12"
      - name: Check tag matches package versions
        run: |
          TAG="${GITHUB_REF_NAME#v}"
          PY=$(python -c 'import re; print(re.search(r"__version__\s*=\s*[\"'\'']([^\"'\'']+)", open("cloakbrowser/_version.py").read()).group(1))')
          JS=$(python -c 'import json; print(json.load(open("js/package.json"))["version"])')
          echo "Tag: $TAG | Python: $PY | npm: $JS"
          [ "$TAG" = "$PY" ] || { echo "ERROR: tag v$TAG != _version.py $PY"; exit 1; }
          [ "$TAG" = "$JS" ] || { echo "ERROR: tag v$TAG != package.json $JS"; exit 1; }
```

<!-- source-snippets:end -->
</details>

发布 git tag `v0.3.28` 时,CI 会**强制**校验 `cloakbrowser/_version.py` 与 `js/package.json` 的 version 都等于 `0.3.28`,任一不一致直接 fail。这保证 PyPI 与 npm 同步发布,没有"Python 端 0.3.28 但 npm 还是 0.3.27"的混乱。

发布并行:`publish-pypi` 与 `publish-npm` 是独立 job,不互相依赖,所以发布过程是真正的并行——只要 test job 过了,两边同时推到对应 registry。Docker 镜像也作为第三个并行 job 推到 Docker Hub。

## CHANGELOG 中的标签约定

CHANGELOG 每条都打了标签:`[wrapper]`、`[binary]`、`[docker]`、`[docs]`、`[meta]`。但 `[wrapper]` 是统称——一条 wrapper 变更可能只影响 Python 端、只影响 JS 端,或两边同步。读 CHANGELOG 时常需要看条目文字判断:

```
- **[wrapper]** Python: add `launch_context_async()` ...
- **[wrapper]** JS: `launchContext()` and `launchPersistentContext()` silently dropped ...
- **[wrapper]** Native SOCKS5 proxy support — pass `proxy="socks5://..."` directly. Works across all launch functions, Python + JS.
```

明确标 `Python:` 或 `JS:` 的是单端;只写 `[wrapper]` 不写语言的通常是双端同步。这种标记习惯让用户能判断"我这个 bug 改了对端会不会跟着改"。

Sources: [CHANGELOG.md:40-52](../../../project-repos/cloakbrowser/CHANGELOG.md#L40-L52)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CHANGELOG.md:40-52`

```markdown
- **[wrapper]** Python: add `launch_context_async()` — async counterpart to `launch_context()`. Returns a BrowserContext with all kwargs forwarded to `browser.new_context()`, enabling `storage_state`, `permissions`, `extra_http_headers`, etc. without a persistent profile folder. Closes #141.
- **[wrapper]** JS: `launchContext()` and `launchPersistentContext()` silently dropped unknown options (including `storageState`). New `contextOptions` escape hatch forwards arbitrary options to Playwright's `newContext()`.
- **[wrapper]** Fix `humanConfig` TypeScript typing (#151).
- **[binary]** New build 146.0.7680.177.3 for Linux x64 + arm64 — 57 source-level fingerprint patches (up from 49): WebAuthn capabilities, AAC audio encoder, and window position spoofing; WebGL and canvas format consistency fixes; SOCKS5 warm connection pool auth fix for credentialed proxies.
- **[docs]** Add recommended anti-bot config and SOCKS5 tips to troubleshooting.

## [0.3.24] — 2026-04-10

- **[wrapper]** Native SOCKS5 proxy support — pass `proxy="socks5://user:pass@host:port"` directly. Credentials handled natively by Chrome. Works across all launch functions, Python + JS.
- **[wrapper]** Add Playwright ElementHandle humanize support — `element_handle.click()`, `.fill()`, `.type()` now use human-like behavior when `humanize=True` (thanks [@evelaa123](https://github.com/evelaa123), #133)
- **[binary]** Upgrade Linux arm64 to Chromium 146.0.7680.177.2 (49 patches) — now matches Linux x64
- **[binary]** New build 146.0.7680.177.2 for both Linux platforms: native SOCKS5 proxy with UDP ASSOCIATE (QUIC/HTTP3 over SOCKS5)
- **[docs]** Clarify humanize requires wrapper import over CDP (#126)
```

<!-- source-snippets:end -->
</details>

## 实操对比表

下表是常见用例的双 SDK 写法对照:

|场景|Python|JS|
|---|---|---|
|最简启动|`browser = launch()`|`const browser = await launch();`|
|带代理|`launch(proxy="http://user:pass@host:8080")`|`await launch({ proxy: 'http://user:pass@host:8080' })`|
|SOCKS5|`launch(proxy="socks5://user:pass@host:1080")`|`await launch({ proxy: 'socks5://user:pass@host:1080' })`|
|GeoIP 自动|`launch(proxy="...", geoip=True)`|`await launch({ proxy: '...', geoip: true })`|
|拟人化|`launch(humanize=True)`|`await launch({ humanize: true })`|
|预设|`launch(humanize=True, human_preset="careful")`|`await launch({ humanize: true, humanPreset: 'careful' })`|
|持久 profile|`launch_persistent_context("./prof", headless=False)`|`await launchPersistentContext({ userDataDir: './prof', headless: false })`|
|带 storage_state|`launch_context(storage_state="state.json")`|`await launchContext({ contextOptions: { storageState: 'state.json' } })`|
|关 stealth args|`launch(stealth_args=False, args=["--fingerprint=12345"])`|`await launch({ stealthArgs: false, args: ['--fingerprint=12345'] })`|

注意 `storage_state` 的两边差异:Python 端通过 `**kwargs` 自然透传,JS 端必须用专门的 `contextOptions` 字段——这是因为 JS 的 TypeScript 类型系统不接受任意 kwargs。

## 几个"读源码才能知道"的细节

**1. 惰性导入**

Python 端 `cloakbrowser/__init__.py` 用 `__getattr__` 惰性导入 `HumanConfig` 与 `resolve_human_config`:

```python
def __getattr__(name):
    if name == "HumanConfig":
        from .human.config import HumanConfig
        globals()["HumanConfig"] = HumanConfig
        return HumanConfig
    # ...
```

Sources: [cloakbrowser/__init__.py:21-29](../../../project-repos/cloakbrowser/cloakbrowser/__init__.py#L21-L29)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/__init__.py:21-29`

```python
    if name == "HumanConfig":
        from .human.config import HumanConfig
        globals()["HumanConfig"] = HumanConfig
        return HumanConfig
    if name == "resolve_human_config":
        from .human.config import resolve_config
        globals()["resolve_human_config"] = resolve_config
        return resolve_config
    raise AttributeError(f"module 'cloakbrowser' has no attribute {name}")
```

<!-- source-snippets:end -->
</details>

不使用拟人化的用户,根本不会触发 `human/` 子包的导入开销。JS 端通过 `import('./human/index.js')` 的动态 import 实现类似效果。

**2. JS 的 `launchOptions` 字段**

Python 的 `**kwargs` 直接展开给 Playwright;JS 没等价物,所以定义了 `launchOptions: Record<string, unknown>` 字段:

```typescript
const browser = await chromium.launch({
    executablePath: binaryPath,
    headless: options.headless ?? true,
    args,
    ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    ...(proxyOption ? { proxy: proxyOption } : {}),
    ...options.launchOptions,  // 用户额外选项
});
```

Sources: [js/src/playwright.ts:72-79](../../../project-repos/cloakbrowser/js/src/playwright.ts#L72-L79)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/playwright.ts:72-79`

```typescript
  const browser = await chromium.launch({
    executablePath: binaryPath,
    headless: options.headless ?? true,
    args,
    ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    ...(proxyOption ? { proxy: proxyOption } : {}),
    ...options.launchOptions,
  });
```

<!-- source-snippets:end -->
</details>

这个字段是 escape hatch,让用户传 Playwright 接受但 cloakbrowser 没暴露的字段(如 `slowMo`、`devtools`)。

**3. Python 端 `ProxySettings` 是 TypedDict**

```python
class _ProxySettingsRequired(TypedDict):
    server: str

class ProxySettings(_ProxySettingsRequired, total=False):
    bypass: str
    username: str
    password: str
```

Sources: [cloakbrowser/browser.py:43-53](../../../project-repos/cloakbrowser/cloakbrowser/browser.py#L43-L53)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `cloakbrowser/browser.py:43-53`

```python
class _ProxySettingsRequired(TypedDict):
    server: str


class ProxySettings(_ProxySettingsRequired, total=False):
    """Playwright-compatible proxy configuration."""

    bypass: str
    username: str
    password: str

```

<!-- source-snippets:end -->
</details>

`server` 是必填,其他三个可选——这是 Python 3.8+ 的 TypedDict 标准用法。JS 端的 `ProxyDict` 是普通 interface 字段可选:

```typescript
export type ProxyDict = {
  server: string;
  bypass?: string;
  username?: string;
  password?: string;
};
```

类型语义相同,但 Python 因为没有 TypeScript 那种 partial interface 概念,必须用继承 + `total=False`。

**4. JS 在 console.warn 时是真 warning**

```typescript
if (locale !== undefined) {
  console.warn(
    "[cloakbrowser] contextOptions.locale ignored — use top-level `locale` instead..."
  );
}
```

Sources: [js/src/playwright.ts:32-35](../../../project-repos/cloakbrowser/js/src/playwright.ts#L32-L35)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/src/playwright.ts:32-35`

```typescript
  if (locale !== undefined) {
    console.warn(
      "[cloakbrowser] contextOptions.locale ignored — use top-level `locale` " +
      "instead (routes through binary flag, avoids detectable CDP emulation)."
```

<!-- source-snippets:end -->
</details>

Python 端依赖 logger,需要用户配置 logging 才能看到;JS 端用 `console.warn` 是默认显示的——这是用户行为习惯的差异选择:JS 用户习惯 `console.*` 输出,Python 用户更习惯 logging 抑制。

## 相关页面

- [启动 API:四象限对偶](launch-api.md) — 双 SDK 函数对应关系
- [系统架构](system-architecture.md) — Python 与 JS 在三层模型中的位置
- [代理、GeoIP 与 WebRTC 一致性](proxy-and-geoip.md) — 双 SDK 在 URL 解析上的细微差异
- [测试、CI 与发布管线](testing-ci-release.md) — 双端版本同步与并行发布


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [Dockerfile](../../../project-repos/cloakbrowser/Dockerfile)
- [bin/docker-entrypoint.sh](../../../project-repos/cloakbrowser/bin/docker-entrypoint.sh)
- [examples/integrations/aws_lambda/lambda_handler.py](../../../project-repos/cloakbrowser/examples/integrations/aws_lambda/lambda_handler.py)
- [examples/integrations/aws_lambda/lambda-entrypoint.sh](../../../project-repos/cloakbrowser/examples/integrations/aws_lambda/lambda-entrypoint.sh)
- [examples/integrations/browser_use_example.py](../../../project-repos/cloakbrowser/examples/integrations/browser_use_example.py)
- [examples/integrations/crawl4ai_example.py](../../../project-repos/cloakbrowser/examples/integrations/crawl4ai_example.py)
- [examples/integrations/scrapling_example.py](../../../project-repos/cloakbrowser/examples/integrations/scrapling_example.py)
- [flake.nix](../../../project-repos/cloakbrowser/flake.nix)

</details>

# 部署与生态集成

CloakBrowser 把"如何反检测"做到了 binary,但"如何在你的实际架构里跑起来"是另一个问题。这一页梳理两类内容:**部署形态**(Docker、AWS Lambda、Nix、cloakserve 服务化)与**生态集成**(browser-use、Crawl4AI、Scrapling、Stagehand、LangChain、Selenium、undetected-chromedriver、Crawlee)。

所有集成的共同模式是"**CloakBrowser 负责浏览器层,你的框架负责业务层**":CloakBrowser `launch()` 出一个 stealth Chromium,然后通过 CDP `connect_over_cdp` 让 AI agent 框架接管。这种"浏览器层即插即换"的设计让 CloakBrowser 不和任何上层强耦合。

## Docker:出厂可用的反检测沙盒

`Dockerfile` 基于 `python:3.12-slim`,做了五件事:

```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 ... \
    fonts-noto-color-emoji fonts-unifont fonts-freefont-ttf \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-tlwg-loma-otf \
    xvfb xdotool curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs

COPY pyproject.toml README.md LICENSE BINARY-LICENSE.md CHANGELOG.md ./
COPY cloakbrowser/ cloakbrowser/
RUN pip install --no-cache-dir ".[serve,geoip]"

COPY js/ js/
RUN cd js && npm install && npm run build

COPY examples/ examples/

RUN python -c "from cloakbrowser import ensure_binary; ensure_binary()" \
    && rm -f ~/.cloakbrowser/.welcome_shown

COPY bin/cloaktest /usr/local/bin/cloaktest
COPY bin/cloakserve /usr/local/bin/cloakserve
RUN chmod +x /usr/local/bin/cloaktest /usr/local/bin/cloakserve

EXPOSE 9222
COPY bin/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV DISPLAY=:99
ENTRYPOINT ["/entrypoint.sh"]
CMD ["python"]
```

Sources: [Dockerfile:1-53](../../../project-repos/cloakbrowser/Dockerfile#L1-L53)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `Dockerfile:1-53`

```
FROM python:3.12-slim

# Chromium system deps + Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdbus-1-3 libdrm2 libxkbcommon0 libatspi2.0-0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 libx11-xcb1 libfontconfig1 libx11-6 \
    libxcb1 libxext6 libxshmfence1 \
    libglib2.0-0 libgtk-3-0 libpangocairo-1.0-0 libcairo-gobject2 \
    libgdk-pixbuf-2.0-0 libxss1 libxtst6 fonts-liberation \
    fonts-noto-color-emoji fonts-unifont fonts-freefont-ttf \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-tlwg-loma-otf \
    xvfb xdotool \
    curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python wrapper
COPY pyproject.toml README.md LICENSE BINARY-LICENSE.md CHANGELOG.md ./
COPY cloakbrowser/ cloakbrowser/
RUN pip install --no-cache-dir ".[serve,geoip]"

# JS wrapper
COPY js/ js/
RUN cd js && npm install && npm run build

# Examples
COPY examples/ examples/

# Pre-download stealth Chromium binary during build (not at runtime)
# Remove welcome marker so users see it on first container run
RUN python -c "from cloakbrowser import ensure_binary; ensure_binary()" \
    && rm -f ~/.cloakbrowser/.welcome_shown

# CLI shortcuts
COPY bin/cloaktest /usr/local/bin/cloaktest
COPY bin/cloakserve /usr/local/bin/cloakserve
RUN chmod +x /usr/local/bin/cloaktest /usr/local/bin/cloakserve

EXPOSE 9222

# Xvfb entrypoint for headed mode support
COPY bin/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV DISPLAY=:99

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python"]
```

<!-- source-snippets:end -->
</details>

五件事拆解:

**1. Chromium 系统依赖 + 字体包**。Chromium 的 `libnss3`、`libatk` 等 24 个共享库是 headless 也必需的;字体包(`fonts-noto-color-emoji`、`fonts-wqy-zenhei` 等)是 0.3.26 加入的——Kasada/Akamai 等高级反爬会在隐藏 canvas 上渲染 emoji 然后 hash,Linux 最小镜像缺这些字体会产生独特 hash,反而成为指纹。

**2. Node 20 + 双 wrapper 安装**。安装 Python wrapper(`pip install .[serve,geoip]`)与 JS wrapper(`cd js && npm install && npm run build`)。`[serve]` 拉 `aiohttp + websockets`(cloakserve 依赖),`[geoip]` 拉 `geoip2 + socksio`。

**3. Build-time 预下载 binary**。`RUN python -c "from cloakbrowser import ensure_binary; ensure_binary()"` 在 image 构建期下载 ~200MB Chromium,这样 container 启动时 0 延迟。`rm -f .welcome_shown` 移除欢迎横幅 marker——让真实用户看到一次欢迎提示。

**4. 把 cloaktest 与 cloakserve 拷到 PATH**。`docker run cloakhq/cloakbrowser cloaktest` 直接跑反检测体检,`cloakserve` 启动 CDP 多路复用器。

**5. Xvfb 入口脚本**。`docker-entrypoint.sh` 启动 Xvfb 虚拟显示器,然后 exec 用户命令。这让 `docker run` 内可以用 `headless=False` 模式——某些反爬(Cloudflare Turnstile managed challenge)在 headed 模式下表现更好。

```sh
#!/bin/bash
Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp &
sleep 1
exec "$@"
```

Sources: [bin/docker-entrypoint.sh:1-6](../../../project-repos/cloakbrowser/bin/docker-entrypoint.sh#L1-L6)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/docker-entrypoint.sh:1-6`

```bash
#!/bin/bash
# Start Xvfb for headed mode (Turnstile, CAPTCHAs), then run user command
Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp &
sleep 1
exec "$@"
```

<!-- source-snippets:end -->
</details>

### 一行体验

```bash
docker run --rm cloakhq/cloakbrowser cloaktest
```

`cloaktest` 是个微脚本(3 行),内部就是跑 `examples/stealth_test.py`。这是项目对新用户的"30 秒可用证明"——不用装任何东西,docker pull 完直接看到反检测结果。

### 多架构发布

```yaml
- name: Build and push
  uses: docker/build-push-action@bcafcacb16a39f128d818304e6c9c0c18556b85f  # v7.1.0
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: |
      cloakhq/cloakbrowser:${{ env.VERSION }}
      cloakhq/cloakbrowser:latest
    provenance: true
    sbom: true
```

Sources: [github/workflows/publish.yml:114-125](../../../project-repos/cloakbrowser/.github/workflows/publish.yml#L114-L125)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/publish.yml:114-125`

```yaml
      - name: Build and push
        id: build
        uses: docker/build-push-action@bcafcacb16a39f128d818304e6c9c0c18556b85f  # v7.1.0
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            cloakhq/cloakbrowser:${{ env.VERSION }}
            cloakhq/cloakbrowser:latest
          provenance: true
          sbom: true
```

<!-- source-snippets:end -->
</details>

buildx 同时构建 amd64 与 arm64 镜像——AWS Graviton、Apple Silicon、Oracle Ampere 都能直接 pull。`provenance: true` 与 `sbom: true` 启用 SLSA Level 3 build provenance + SBOM,镜像被 cosign 签名(详见 [测试、CI 与发布管线](testing-ci-release.md))。

## AWS Lambda:容器化无服务器反检测

`examples/integrations/aws_lambda/` 是个**完整可部署的 Lambda 模板**,占 ~500 行代码——比绝大多数 README 上的 "5 行 Lambda 例子" 严肃得多。

### 入口脚本:Xvfb + 双模检测

`lambda-entrypoint.sh` 解决了 Lambda 冷启动里几个隐蔽问题:

```sh
# 清理上次残留
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99

Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp >/tmp/Xvfb.log 2>&1 &

# 等 X11 socket
i=0
while [ ! -e /tmp/.X11-unix/X99 ] && [ "$i" -lt 200 ]; do
    i=$((i + 1))
    sleep 0.05
done
sleep 0.2

# 双模:Lambda handler vs 普通 CMD
if [ $# -eq 1 ] && \
   echo "$1" | grep -qE '^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)+$'; then
    if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
        exec /usr/local/bin/aws-lambda-rie /usr/local/bin/python -m awslambdaric "$@"
    else
        exec /usr/local/bin/python -m awslambdaric "$@"
    fi
fi
exec "$@"
```

Sources: [examples/integrations/aws_lambda/lambda-entrypoint.sh:1-52](../../../project-repos/cloakbrowser/examples/integrations/aws_lambda/lambda-entrypoint.sh#L1-L52)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `examples/integrations/aws_lambda/lambda-entrypoint.sh:1-52`

```bash
#!/bin/sh
# Dual-mode entrypoint for the CloakBrowser Lambda image.
#
#   1. Always start Xvfb on :99 (same as the canonical bin/docker-entrypoint.sh)
#      so headed Chromium works no matter how the container is invoked.
#   2. Detect whether the CMD looks like a Lambda handler (a single
#      `module.func`-shaped argument). If yes, route through the Lambda runtime
#      client (using the bundled aws-lambda-rie locally, or talking to the real
#      Lambda Runtime API when AWS_LAMBDA_RUNTIME_API is set in production).
#   3. Otherwise exec the CMD directly — preserving the canonical Dockerfile's
#      interaction surface (`python`, `cloakserve`, `cloaktest`, `node`, `bash`,
#      `python examples/basic.py`, etc.).
set -e

mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix 2>/dev/null || true

# Clean any stale Xvfb state. If a previous Xvfb died and left its lock file
# behind (we observed this in cold-start storms), a new Xvfb refuses to start
# with "Server is already active for display 99". Removing both files makes
# Xvfb start cleanly every time.
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99

Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp >/tmp/Xvfb.log 2>&1 &

# Wait for the X11 socket to appear AND for Xvfb to be ready to serve. The
# socket file appears at bind(), but listen() and the first accept() come
# slightly later — under cold-start CPU contention this gap matters.
i=0
while [ ! -e /tmp/.X11-unix/X99 ] && [ "$i" -lt 200 ]; do
    i=$((i + 1))
    sleep 0.05
done
# Small buffer after the socket appears so Xvfb has a moment to call listen()
# and start accepting clients. Cheap insurance against the bind/listen gap.
sleep 0.2

# Lambda handler shape: exactly one arg, dotted identifier (no spaces, no slashes,
# no leading dot). `python`, `cloakserve`, `cloaktest`, `bash`, `node` all fail
# this test and pass through to plain exec.
if [ $# -eq 1 ] && \
   echo "$1" | grep -qE '^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)+$'; then
    if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
        # Local invocation via bundled RIE.
        exec /usr/local/bin/aws-lambda-rie /usr/local/bin/python -m awslambdaric "$@"
    else
        # Real Lambda — runtime API endpoint already provided by the platform.
        exec /usr/local/bin/python -m awslambdaric "$@"
    fi
fi

exec "$@"
```

<!-- source-snippets:end -->
</details>

注意点:

- **Stale lock cleanup**:Lambda 容器复用时,上次 Xvfb 进程可能没干净退出,留下 `/tmp/.X99-lock` 让新 Xvfb 拒绝启动("Server is already active for display 99")。每次开机先删
- **Socket 等待 + 缓冲**:socket 文件存在不等于 Xvfb 已经 listen,加 200ms 缓冲覆盖 bind→listen 的间隙
- **双模识别**:单个参数 + 形如 `module.func` → 走 awslambdaric runtime;否则 exec 原 CMD。这让同一个镜像既能跑 Lambda invoke,也能本地 `docker run -it ... bash` 调试

### handler 的工程深度

`lambda_handler.py` 不是"5 行 demo",是 ~350 行的生产级 handler。它处理:

**URL 安全验证**:

```python
def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ("http", "https"):
        raise ValueError(f"Only http:// and https:// URLs are supported, got: {parsed.scheme!r}")
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL has no hostname")
    infos = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    for info in infos:
        addr = ipaddress.ip_address(info[4][0])
        if not addr.is_global:
            raise ValueError("URLs targeting private/internal networks are blocked")
```

Sources: [examples/integrations/aws_lambda/lambda_handler.py:79-96](../../../project-repos/cloakbrowser/examples/integrations/aws_lambda/lambda_handler.py#L79-L96)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `examples/integrations/aws_lambda/lambda_handler.py:79-96`

```python
def _validate_url(url: str) -> None:
    """Reject non-HTTP schemes and URLs that resolve to private/internal IPs."""
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ("http", "https"):
        raise ValueError(
            f"Only http:// and https:// URLs are supported, got: {parsed.scheme!r}"
        )
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL has no hostname")
    try:
        infos = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror:
        raise ValueError(f"Cannot resolve hostname: {hostname}")
    for info in infos:
        addr = ipaddress.ip_address(info[4][0])
        if not addr.is_global:
            raise ValueError("URLs targeting private/internal networks are blocked")
```

<!-- source-snippets:end -->
</details>

防 SSRF——拒绝 `http://169.254.169.254/...`(AWS metadata 服务)等内部 IP。Lambda 暴露给外部调用时,这种攻击向量必须封死。

**Smart wait**:

```python
async def _smart_wait(page, dom_stable_ms=1500, max_settle_ms=15000) -> None:
    js = f"""
    (() => {{
        if (!window.__cb_settle) {{
            window.__cb_settle = {{ len: -1, since: Date.now() }};
        }}
        const cur = document.documentElement.outerHTML.length;
        const s = window.__cb_settle;
        if (cur !== s.len) {{
            s.len = cur;
            s.since = Date.now();
            return false;
        }}
        return (Date.now() - s.since) >= {int(dom_stable_ms)};
    }})()
    """
    await page.wait_for_function(js, timeout=max_settle_ms, polling=200)
```

Sources: [examples/integrations/aws_lambda/lambda_handler.py:151-178](../../../project-repos/cloakbrowser/examples/integrations/aws_lambda/lambda_handler.py#L151-L178)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `examples/integrations/aws_lambda/lambda_handler.py:151-178`

```python
async def _smart_wait(page, dom_stable_ms: int = 1500, max_settle_ms: int = 15000) -> None:
    """Wait until the document HTML hasn't changed for `dom_stable_ms`.

    Generic stopping condition for at-scale scraping when you can't tune
    selectors per site. More robust than `networkidle` because it ignores
    network activity that doesn't mutate the DOM (analytics beacons,
    long-poll, websockets, web vitals streams).
    """
    js = f"""
    (() => {{
        if (!window.__cb_settle) {{
            window.__cb_settle = {{ len: -1, since: Date.now() }};
        }}
        const cur = document.documentElement.outerHTML.length;
        const s = window.__cb_settle;
        if (cur !== s.len) {{
            s.len = cur;
            s.since = Date.now();
            return false;
        }}
        return (Date.now() - s.since) >= {int(dom_stable_ms)};
    }})()
    """
    try:
        await page.wait_for_function(js, timeout=max_settle_ms, polling=200)
    except Exception:
        # Hit max_settle_ms cap — return what we have rather than fail the whole invoke
        logger.warning("smart_wait hit max_settle_ms=%d cap", max_settle_ms)
```

<!-- source-snippets:end -->
</details>

不依赖 `networkidle`(被 analytics beacon、long-poll、websocket 干扰)、不依赖 `domcontentloaded`(可能漏掉懒加载内容)——用"DOM HTML 长度连续 1.5 秒不变"作信号。这是 SPA 反爬场景下的标准启发式。

**重试与策略**:

```python
def _classify_error(err: Exception) -> dict | None:
    msg = str(err)
    if "ERR_CERT" in msg:
        return {"_strategy_args": ["--ignore-certificate-errors"], "goto_timeout_ms": 60000}
    if ("Timeout" in msg and "exceeded" in msg) or "ERR_CONNECTION_TIMED_OUT" in msg:
        return {"goto_timeout_ms": 90000, "max_settle_ms": 25000}
    return None
```

Sources: [examples/integrations/aws_lambda/lambda_handler.py:236-261](../../../project-repos/cloakbrowser/examples/integrations/aws_lambda/lambda_handler.py#L236-L261)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `examples/integrations/aws_lambda/lambda_handler.py:236-261`

```python
def _classify_error(err: Exception) -> dict | None:
    """Map a Playwright error to a retry-strategy override dict, or None
    if the error is unrecoverable.

    Match on str(e) because Playwright errors carry their codes inside the
    message (Error.__str__ includes ERR_CERT_AUTHORITY_INVALID etc.); there
    is no stable structured `.error_code` attribute to rely on.

    Strategies (priority order — first match wins):
      ERR_CERT_*                  -> --ignore-certificate-errors + 60s goto budget
      Timeout exceeded            -> 90s goto budget + 25s smart_wait cap
      ERR_CONNECTION_TIMED_OUT    -> same as Timeout
    Returns None for unrecoverable site issues (DNS, SSL, refused, HTTP 4xx/5xx).
    """
    msg = str(err)
    if "ERR_CERT" in msg:
        return {
            "_strategy_args": ["--ignore-certificate-errors"],
            "goto_timeout_ms": 60000,
        }
    if ("Timeout" in msg and "exceeded" in msg) or "ERR_CONNECTION_TIMED_OUT" in msg:
        return {
            "goto_timeout_ms": 90000,
            "max_settle_ms": 25000,
        }
    return None
```

<!-- source-snippets:end -->
</details>

错误分类驱动重试策略:证书错误 → 加 `--ignore-certificate-errors`、增大超时;超时 → 增大到 90s;DNS 失败/连接拒绝 → 不重试(下游问题,重试无益)。每次重试更新 `_strategy_args` 并重 launch——因为 `--ignore-certificate-errors` 是 Chrome flag,必须重启 binary 才能生效。

**冷启动 retry**:

```python
async def _launch_with_retry(event, attempts=3, backoff_s=0.3):
    for i in range(attempts):
        try:
            return await launch_context_async(**_build_launch_kwargs(event))
        except Exception as e:
            last_err = e
            logger.warning("launch attempt %d/%d failed: %s", i + 1, attempts, str(e)[:200])
            if i + 1 < attempts:
                await asyncio.sleep(backoff_s * (i + 1))
    raise last_err
```

Sources: [examples/integrations/aws_lambda/lambda_handler.py:211-233](../../../project-repos/cloakbrowser/examples/integrations/aws_lambda/lambda_handler.py#L211-L233)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `examples/integrations/aws_lambda/lambda_handler.py:211-233`

```python
async def _launch_with_retry(event: dict, attempts: int = 3, backoff_s: float = 0.3):
    """Retry launch_context_async up to `attempts` times with linear backoff.

    Lambda cold-start storms occasionally race Xvfb readiness or hit transient
    Chromium spawn failures — both surface as "Target page, context or browser
    has been closed" at launch. The failure is fast (~0.5s) so retries are
    cheap, and a retry on a now-warm container almost always succeeds.

    Pairs with the lock-cleanup + socket-poll in lambda-entrypoint.sh: the
    entrypoint catches the common case at container init; this catches the
    residual race when the first invocation hits before Xvfb is fully ready.
    """
    last_err: Exception | None = None
    for i in range(attempts):
        try:
            return await launch_context_async(**_build_launch_kwargs(event))
        except Exception as e:
            last_err = e
            logger.warning("launch attempt %d/%d failed: %s",
                           i + 1, attempts, str(e)[:200])
            if i + 1 < attempts:
                await asyncio.sleep(backoff_s * (i + 1))  # 0.3s, 0.6s
    raise last_err  # type: ignore[misc]
```

<!-- source-snippets:end -->
</details>

Lambda 冷启动里 Xvfb 与 Chromium 启动可能竞争 CPU,launch 偶尔失败("Target page, context or browser has been closed")。三次重试覆盖 99% 的冷启动 race。

## Nix Flake:可重现的开发环境

`flake.nix` 提供 Nix package + devShell,主要服务于:

1. **可重现构建**:`flake.lock` 锁定 nixpkgs 版本,任何机器 `nix build .#cloakbrowserChromium` 得到一致 Chromium 安装
2. **autoPatchelfHook**:Nix 的 `autoPatchelfHook` 自动给 binary 补上 RPATH 与 LD_LIBRARY_PATH,绕过宿主 glibc 版本差异——这对 NixOS、Alpine、Bazel build 等"非 standard libc"环境非常关键
3. **font + xdotool + xvfb-run 一并提供**:开发 shell 进去就有完整的反爬测试环境

```nix
packageInfo = {
  x86_64-linux = {
    platformTag = "linux-x64";
    version = "146.0.7680.177.3";
    hash = "sha256-WvAn+q+x/vmTPreEwJS3ZHBt4io3KizuhLwRf8SrU38=";
  };
  aarch64-linux = {
    platformTag = "linux-arm64";
    version = "146.0.7680.177.3";
    hash = "sha256-i3HOU7T9ExMnMxox+6ODXXGILRm/qr3njdD1OQvRb0U=";
  };
};
```

Sources: [flake.nix:19-30](../../../project-repos/cloakbrowser/flake.nix#L19-L30)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `flake.nix:19-30`

```
      packageInfo = {
        x86_64-linux = {
          platformTag = "linux-x64";
          version = "146.0.7680.177.3";
          hash = "sha256-WvAn+q+x/vmTPreEwJS3ZHBt4io3KizuhLwRf8SrU38=";
        };
        aarch64-linux = {
          platformTag = "linux-arm64";
          version = "146.0.7680.177.3";
          hash = "sha256-i3HOU7T9ExMnMxox+6ODXXGILRm/qr3njdD1OQvRb0U=";
        };
      };
```

<!-- source-snippets:end -->
</details>

注意 hash——Nix 强制 fetchurl 校验 SHA-256,与 wrapper 端的 `SHA256SUMS` 校验机制呼应。版本升级时这个 hash 必须更新。

### devShell 设置 CLOAKBROWSER_BINARY_PATH

```nix
devShells = forAllSystems (system:
  let
    cloakbrowserChromium = self.packages.${system}.cloakbrowserChromium;
  in
  {
    default = pkgs.mkShell {
      packages = [ cloakbrowserChromium python ... ];
      CLOAKBROWSER_BINARY_PATH = "${cloakbrowserChromium}/bin/cloakbrowser-chrome";
    };
  });
```

Sources: [flake.nix:200-235](../../../project-repos/cloakbrowser/flake.nix#L200-L235)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `flake.nix:200-235`

```
      devShells = forAllSystems (system:
        let
          pkgs = mkPkgs system;
          cloakbrowserChromium = self.packages.${system}.cloakbrowserChromium;
          python = pkgs.python312.withPackages (ps: with ps; [
            aiohttp
            geoip2
            hatchling
            httpx
            playwright
            pytest
            pytest-asyncio
            socksio
            websockets
          ]);
        in
        {
          default = pkgs.mkShell {
            packages = [
              cloakbrowserChromium
              python
              pkgs.cacert
              pkgs.curl
              pkgs.git
              pkgs.jq
              pkgs.nodejs_20
              pkgs.which
              pkgs.xdotool
              pkgs.xvfb-run
            ]
            ++ runtimeLibraries pkgs
            ++ fontPackages pkgs;

            CLOAKBROWSER_BINARY_PATH = "${cloakbrowserChromium}/bin/cloakbrowser-chrome";
          };
        });
```

<!-- source-snippets:end -->
</details>

进入 shell 后 `CLOAKBROWSER_BINARY_PATH` 已设好,wrapper 跳过下载直接用 Nix 管理的 binary——这是 Nix 与 wrapper 优雅集成的关键。

## 框架集成:CDP 桥接的标准模式

所有 `examples/integrations/` 集成几乎用同一个模式:

```mermaid
flowchart LR
    A["CloakBrowser launch_async()<br/>含 --remote-debugging-port=9242"]
    B["Chrome 在 9242 上暴露 CDP"]
    C["你的 AI agent framework<br/>connect via cdp_url='http://127.0.0.1:9242'"]
    D["framework 用这个浏览器跑业务"]

    A --> B
    B --> C
    C --> D
```

### browser-use(AI agent)

```python
from browser_use import Agent, BrowserSession, ChatOpenAI
from cloakbrowser import launch_async

cb_browser = await launch_async(
    headless=True,
    args=["--remote-debugging-port=9242", "--remote-debugging-address=127.0.0.1"],
)

session = BrowserSession(cdp_url="http://127.0.0.1:9242")
agent = Agent(task="...", llm=ChatOpenAI(model="gpt-4o-mini"), browser_session=session)
result = await agent.run()
```

Sources: [examples/integrations/browser_use_example.py:17-37](../../../project-repos/cloakbrowser/examples/integrations/browser_use_example.py#L17-L37)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `examples/integrations/browser_use_example.py:17-37`

```python
async def main():
    # Step 1: Launch CloakBrowser (handles binary, stealth args, fingerprints)
    cb_browser = await launch_async(
        headless=True,
        args=["--remote-debugging-port=9242", "--remote-debugging-address=127.0.0.1"],
    )

    # Step 2: Connect browser-use to the stealth browser via CDP
    session = BrowserSession(cdp_url="http://127.0.0.1:9242")

    # Step 3: Run your AI agent — it browses through CloakBrowser
    agent = Agent(
        task="Go to https://www.google.com and search for 'browser automation'",
        llm=ChatOpenAI(model="gpt-4o-mini"),
        browser_session=session,
    )

    result = await agent.run()
    print(result)

    await cb_browser.close()
```

<!-- source-snippets:end -->
</details>

### Crawl4AI(LLM-ready 爬虫)

```python
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from cloakbrowser import launch_async

cb_browser = await launch_async(
    args=["--remote-debugging-port=9243", "--remote-debugging-address=127.0.0.1"],
)
browser_config = BrowserConfig(browser_mode="cdp", cdp_url="http://127.0.0.1:9243")
async with AsyncWebCrawler(config=browser_config) as crawler:
    result = await crawler.arun("https://example.com", config=CrawlerRunConfig())
```

Sources: [examples/integrations/crawl4ai_example.py:16-35](../../../project-repos/cloakbrowser/examples/integrations/crawl4ai_example.py#L16-L35)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `examples/integrations/crawl4ai_example.py:16-35`

```python
async def main():
    # Step 1: Launch CloakBrowser with remote debugging
    cb_browser = await launch_async(
        headless=True,
        args=["--remote-debugging-port=9243", "--remote-debugging-address=127.0.0.1"],
    )

    # Step 2: Connect Crawl4AI to the stealth browser via CDP
    browser_config = BrowserConfig(browser_mode="cdp", cdp_url="http://127.0.0.1:9243")
    run_config = CrawlerRunConfig()

    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(
            "https://example.com",
            config=run_config,
        )
        print(f"Extracted {len(result.markdown)} chars of markdown")
        print(result.markdown[:500])

    await cb_browser.close()
```

<!-- source-snippets:end -->
</details>

### 模式总结

|集成|入口|connect 方式|
|---|---|---|
|browser-use|`BrowserSession(cdp_url=...)`|CDP|
|Crawl4AI|`BrowserConfig(browser_mode="cdp", cdp_url=...)`|CDP|
|Scrapling|类似 BrowserConfig|CDP|
|Stagehand|`new Stagehand({localBrowserLaunchOptions: {cdpUrl: ...}})`|CDP|
|Crawlee|`PlaywrightCrawler({browserPoolOptions: {browserPlugins: ...}})`|插件挂入 CDP|
|Selenium|RemoteWebDriver + ChromeDriver 配 CloakBrowser binary|WebDriver|
|undetected-chromedriver|`uc.Chrome(driver_executable_path=..., browser_executable_path=cloakbrowser_binary)`|WebDriver|
|LangChain WebBaseLoader|fetch 模式无法用,需要 PlaywrightLoader 改 cdp_url|CDP|

整体模式:**CloakBrowser 给 binary + stealth,其他框架给业务逻辑**。中间用 CDP/WebDriver 桥接,无需修改框架代码。

## 选型建议

| 场景 | 推荐 |
|---|---|
|本地开发,Python script|`pip install cloakbrowser` + `launch()`|
|本地开发,JS script|`npm install cloakbrowser playwright-core` + `launch()`|
|生产 + 多账号矩阵|Docker + `cloakserve` 集中部署|
|Serverless 单次抓取|Lambda 模板(`examples/integrations/aws_lambda/`)|
|可重现 NixOS / Bazel|`flake.nix` 提供的 Chromium derivation|
|嵌入 AI agent|launch_async + `--remote-debugging-port=PORT` + framework CDP url|
|嵌入 LangChain RAG|同上,WebBaseLoader 不行,要 PlaywrightLoader|
|集成已有 Selenium 测试|`browser_executable_path=cloakbrowser_binary` + chromedriver|
|集成 Stagehand AI 自动化|connect_over_cdp + `localBrowserLaunchOptions`|

## 几个非显然的部署陷阱

**1. Docker 中 `--no-sandbox` 是必需的**

Default stealth args 已经包含 `--no-sandbox`,所以一般用户不用操心。但如果 `stealth_args=False` 自定义 args 时容易漏——容器内 user namespace 默认不可用,sandbox 会让 Chrome 启动 crash。

**2. Lambda 内存至少 2GB**

Chromium 启动峰值内存 ~800MB,加 binary 加载、Lambda runtime,2GB 才能稳定运行。`INSTRUCTIONS.md` 文档明确写了这点。

**3. headed 模式必须有 Xvfb**

Cloudflare Turnstile managed challenge 在 headed 模式下表现更好,但需要 X11 显示器。Docker 镜像与 Lambda 模板都自带 Xvfb,本地裸金属需要 `xvfb-run python script.py` 或先 `Xvfb :99 -screen 0 1920x1080x24 & export DISPLAY=:99`。

**4. cloakserve 端口暴露**

`cloakserve` 默认监听 9222。在容器内绑 `0.0.0.0`,容器外绑 `127.0.0.1`——所以 `docker run -p 9222:9222` 是必需的,外部才能访问。不要在生产把 cloakserve 直接暴露公网,任何能访问 9222 的人都能控制你的浏览器。

**5. binary 启动权限**

`cloakbrowser-binary` 解压后需要 `chmod +x`,Dockerfile 在 `_extract_archive` 阶段自动处理。但 Nix 通过 `autoPatchelfHook` 处理动态链接,需要 `chmod +x` 后才能 patchelf——`installPhase` 显式 `chmod +x "$out/lib/cloakbrowser/chrome"`。

Sources: [flake.nix:139-140](../../../project-repos/cloakbrowser/flake.nix#L139-L140)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `flake.nix:139-140`

```
            chmod +x "$out/lib/cloakbrowser/chrome"
            chmod +x "$out/lib/cloakbrowser/chromedriver"
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [二进制生命周期](binary-management.md) — Docker 与 Nix 如何避开 wrapper 的下载逻辑
- [cloakserve CDP 多路复用器](cloakserve-cdp-multiplexer.md) — 服务化场景的核心组件
- [测试、CI 与发布管线](testing-ci-release.md) — Docker 镜像如何被签名与证明


---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件:

- [.github/workflows/ci.yml](../../../project-repos/cloakbrowser/.github/workflows/ci.yml)
- [.github/workflows/publish.yml](../../../project-repos/cloakbrowser/.github/workflows/publish.yml)
- [.github/workflows/attest-release.yml](../../../project-repos/cloakbrowser/.github/workflows/attest-release.yml)
- [tests/conftest.py](../../../project-repos/cloakbrowser/tests/conftest.py)
- [tests/test_stealth.py](../../../project-repos/cloakbrowser/tests/test_stealth.py)
- [tests/test_launch.py](../../../project-repos/cloakbrowser/tests/test_launch.py)
- [js/tests/stealth.test.ts](../../../project-repos/cloakbrowser/js/tests/stealth.test.ts)
- [pyproject.toml](../../../project-repos/cloakbrowser/pyproject.toml)

</details>

# 测试、CI 与发布管线

CloakBrowser 的发布有一个反直觉的合约:**Chromium binary 与 wrapper 包独立发布**。Chromium binary 由 CloakHQ 私有的补丁仓库编译,作为 GitHub Release 资产发布;wrapper 包(`cloakbrowser` Python + JS)从这个公开仓库发布到 PyPI 与 npm。CI 管线必须协调这两条线,同时保证供应链安全可证明。

这一页讲三件事:**测试策略**(单元 + 集成 + stealth 在线测试)、**CI 工作流**(三个 workflow 的协作)、**发布机制**(双语言版本同步 + OIDC + cosign + SLSA 证明)。

## 测试结构

```
cloakbrowser/
├── tests/                  # Python — 29 个文件
│   ├── conftest.py
│   ├── test_backend.py     # Patchright 后端切换
│   ├── test_build_args.py  # build_args 合并与去重
│   ├── test_cloakserve.py  # cloakserve 路由与池管理
│   ├── test_config.py      # 平台/路径/版本解析
│   ├── test_extract.py     # tar/zip 提取 + 路径穿越
│   ├── test_geoip.py       # GeoIP 解析(单元)
│   ├── test_human_visual.{mjs,py}    # 拟人化视觉测试
│   ├── test_humanize_unit.{mjs,py}   # 拟人化单元测试
│   ├── test_lambda_security.py       # Lambda handler 安全
│   ├── test_launch.py
│   ├── test_launch_context.py
│   ├── test_persistent_context.py
│   ├── test_proxy.py
│   ├── test_stealth.py     # 在线 stealth 测试 (slow)
│   ├── test_stealth_reproduction_110.py
│   ├── test_stealth_unit.py
│   └── test_update.py
└── js/tests/               # JS — 9 个文件
    ├── config.test.ts
    ├── geoip.test.ts
    ├── humanize.test.ts
    ├── launch.test.ts
    ├── proxy.test.ts
    ├── puppeteer.test.ts
    ├── stealth.puppeteer.test.ts
    ├── stealth.test.ts
    └── update.test.ts
```

Sources: [00-repo-inventory.md:51-81](../00-repo-inventory.md#L51-L81)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `00-repo-inventory.md:51-81`

```markdown

- `js/tests/config.test.ts`
- `js/tests/geoip.test.ts`
- `js/tests/humanize.test.ts`
- `js/tests/launch.test.ts`
- `js/tests/proxy.test.ts`
- `js/tests/puppeteer.test.ts`
- `js/tests/stealth.puppeteer.test.ts`
- `js/tests/stealth.test.ts`
- `js/tests/update.test.ts`
- `tests/__init__.py`
- `tests/conftest.py`
- `tests/test_backend.py`
- `tests/test_build_args.py`
- `tests/test_cloakserve.py`
- `tests/test_config.py`
- `tests/test_extract.py`
- `tests/test_geoip.py`
- `tests/test_human_visual.mjs`
- `tests/test_human_visual.py`
- `tests/test_humanize_unit.mjs`
- `tests/test_humanize_unit.py`
- `tests/test_lambda_security.py`
- `tests/test_launch.py`
- `tests/test_launch_context.py`
- `tests/test_persistent_context.py`
- `tests/test_proxy.py`
- `tests/test_stealth.py`
- `tests/test_stealth_reproduction_110.py`
- `tests/test_stealth_unit.py`
- `tests/test_update.py`
```

<!-- source-snippets:end -->
</details>

### slow marker:在线 stealth 测试单独标记

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
markers = ["slow: marks tests that hit live detection sites (deselect with '-m \"not slow\"')"]
```

Sources: [pyproject.toml:74-77](../../../project-repos/cloakbrowser/pyproject.toml#L74-L77)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `pyproject.toml:74-77`

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
markers = ["slow: marks tests that hit live detection sites (deselect with '-m \"not slow\"')"]
```

<!-- source-snippets:end -->
</details>

`@pytest.mark.slow` 标记那些**真的去 ping bot.incolumitas.com、deviceandbrowserinfo.com 等真实检测站**的测试——这些测试结果取决于外部服务状态,不适合在每次 push 跑。CI 默认 `-m "not slow"` 跳过它们。

这套区分让开发者本地可以单独跑 `pytest -m slow` 做端到端 stealth 验证,而 PR 流程只跑快速可重复的单元测试。

### tests/conftest.py:一行修复一个隐患

```python
@pytest.fixture(autouse=True)
def _clean_backend_env(monkeypatch):
    """Ensure CLOAKBROWSER_BACKEND doesn't leak into tests from the host environment."""
    monkeypatch.delenv("CLOAKBROWSER_BACKEND", raising=False)
```

Sources: [tests/conftest.py:1-11](../../../project-repos/cloakbrowser/tests/conftest.py#L1-L11)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `tests/conftest.py:1-11`

```python
"""Shared test fixtures."""

import os

import pytest


@pytest.fixture(autouse=True)
def _clean_backend_env(monkeypatch):
    """Ensure CLOAKBROWSER_BACKEND doesn't leak into tests from the host environment."""
    monkeypatch.delenv("CLOAKBROWSER_BACKEND", raising=False)
```

<!-- source-snippets:end -->
</details>

`autouse=True` 意味着所有测试自动应用。开发者本机可能设了 `CLOAKBROWSER_BACKEND=patchright`,如果泄漏到测试,`test_backend.py` 验证默认 backend 是 `playwright` 就会失败。这一行 fixture 杜绝了"在我机器上过,CI 也过,但 colleague 机器上挂"的最常见问题。

## test_stealth.py:在线反检测验证

```python
class TestWebDriverDetection:
    def test_navigator_webdriver_false(self, page):
        page.goto("https://example.com")
        assert page.evaluate("navigator.webdriver") is False

    def test_no_headless_chrome_ua(self, page):
        page.goto("https://example.com")
        ua = page.evaluate("navigator.userAgent")
        assert "HeadlessChrome" not in ua
        assert "Chrome/" in ua

    def test_window_chrome_exists(self, page):
        page.goto("https://example.com")
        assert page.evaluate("typeof window.chrome") == "object"

    def test_plugins_present(self, page):
        page.goto("https://example.com")
        count = page.evaluate("navigator.plugins.length")
        assert count >= 5

    def test_cdp_not_detected(self, page):
        page.goto("https://example.com")
        has_cdp = page.evaluate("""
            () => {
                try {
                    const keys = Object.keys(window);
                    return keys.some(k => k.startsWith('cdc_') || k.startsWith('__webdriver'));
                } catch(e) {
                    return false;
                }
            }
        """)
        assert has_cdp is False
```

Sources: [tests/test_stealth.py:32-79](../../../project-repos/cloakbrowser/tests/test_stealth.py#L32-L79)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `tests/test_stealth.py:32-79`

```python
class TestWebDriverDetection:
    """Tests for WebDriver/automation detection signals."""

    def test_navigator_webdriver_false(self, page):
        """navigator.webdriver must be false."""
        page.goto("https://example.com")
        assert page.evaluate("navigator.webdriver") is False

    def test_no_headless_chrome_ua(self, page):
        """User agent must not contain 'HeadlessChrome'."""
        page.goto("https://example.com")
        ua = page.evaluate("navigator.userAgent")
        assert "HeadlessChrome" not in ua
        assert "Chrome/" in ua

    def test_window_chrome_exists(self, page):
        """window.chrome must be an object (not undefined)."""
        page.goto("https://example.com")
        assert page.evaluate("typeof window.chrome") == "object"

    def test_plugins_present(self, page):
        """Must have browser plugins (real Chrome has 5)."""
        page.goto("https://example.com")
        count = page.evaluate("navigator.plugins.length")
        assert count >= 5, f"Expected 5+ plugins (real Chrome), got {count}"

    def test_languages_present(self, page):
        """navigator.languages must be populated."""
        page.goto("https://example.com")
        langs = page.evaluate("navigator.languages")
        assert len(langs) >= 1

    def test_cdp_not_detected(self, page):
        """Chrome DevTools Protocol should not be detectable."""
        page.goto("https://example.com")
        # Common CDP detection: check for Runtime.evaluate artifacts
        has_cdp = page.evaluate("""
            () => {
                try {
                    // Check common CDP leak: window.cdc_
                    const keys = Object.keys(window);
                    return keys.some(k => k.startsWith('cdc_') || k.startsWith('__webdriver'));
                } catch(e) {
                    return false;
                }
            }
        """)
        assert has_cdp is False
```

<!-- source-snippets:end -->
</details>

这些都是反检测的"核心信号"——`navigator.webdriver`、UA、`window.chrome`、`navigator.plugins.length`、`window` 上的 CDP 探针(`cdc_*`、`__webdriver`)。如果 binary 的 C++ patch 在某次升级回归,这套测试立即报警。

注意 `@pytest.fixture(scope="module")` 的 browser fixture——整个文件共享一个 browser,只在 module 级别开关。这避免每个测试反复 launch(~3s),整套测试跑得快。

### 模块级 vs 函数级 fixture

```python
@pytest.fixture(scope="module")
def browser():
    b = launch(headless=True, proxy=PROXY)
    yield b
    b.close()

@pytest.fixture
def page(browser):  # function scope
    p = browser.new_page()
    yield p
    p.close()
```

Sources: [tests/test_stealth.py:16-29](../../../project-repos/cloakbrowser/tests/test_stealth.py#L16-L29)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `tests/test_stealth.py:16-29`

```python
@pytest.fixture(scope="module")
def browser():
    """Shared browser instance for stealth tests."""
    b = launch(headless=True, proxy=PROXY)
    yield b
    b.close()


@pytest.fixture
def page(browser):
    """Fresh page for each test."""
    p = browser.new_page()
    yield p
    p.close()
```

<!-- source-snippets:end -->
</details>

`page` 是函数级——每个测试拿到一个干净的 page,避免上个测试残留 DOM/cookies。这种"共享 browser,独立 page"是 Playwright 测试的标准模式,执行时间最优。

## JS 端测试:vitest + 全面 mock

JS 端的 `js/tests/stealth.test.ts` 是**纯 mock**测试,**不启动 browser**:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

function buildMockPage(overrides: Record<string, any> = {}): any {
    const mainFrameObj = overrides.mainFrameReturn ?? {
        childFrames: vi.fn(() => []),
        click: vi.fn(async () => {}),
        // ...
    };
    // ...
}
```

Sources: [js/tests/stealth.test.ts:1-60](../../../project-repos/cloakbrowser/js/tests/stealth.test.ts#L1-L60)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `js/tests/stealth.test.ts:1-60`

```typescript
/**
 * Unit tests for stealth / anti-detection fixes (issue #110).
 *
 * Covers:
 *   - StealthEval — CDP isolated-world lifecycle (evaluate, invalidate, retry)
 *   - isInputElement / isSelectorFocused — stealth DOM queries with fallback
 *   - typeShiftSymbol — CDP Input.dispatchKeyEvent path vs evaluate fallback
 *   - humanType integration — shift symbols routed via CDP
 *   - Navigation invalidation (goto → stealth.invalidate)
 *   - patchPage stealth infrastructure wiring
 *   - SHIFT_SYMBOL_CODES / SHIFT_SYMBOL_KEYCODES completeness
 *
 * All tests are fast, mock-based, and do NOT require a browser.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveConfig, rand, randRange, sleep } from "../src/human/config.js";
import { humanType } from "../src/human/keyboard.js";
import { humanMove, humanClick, clickTarget, humanIdle } from "../src/human/mouse.js";

// =========================================================================
// Helper: build mock page / raw objects
// =========================================================================

function buildMockPage(overrides: Record<string, any> = {}): any {
  const mainFrameObj = overrides.mainFrameReturn ?? {
    childFrames: vi.fn(() => []),
    click: vi.fn(async () => {}),
    dblclick: vi.fn(async () => {}),
    hover: vi.fn(async () => {}),
    type: vi.fn(async () => {}),
    fill: vi.fn(async () => {}),
    check: vi.fn(async () => {}),
    uncheck: vi.fn(async () => {}),
    selectOption: vi.fn(async () => {}),
    press: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    dragAndDrop: vi.fn(async () => {}),
    locator: vi.fn(() => ({
      boundingBox: vi.fn(async () => ({ x: 0, y: 0, width: 100, height: 30 })),
      first: vi.fn(function (this: any) { return this; }),
    })),
  };

  const makeLocator = () => {
    const loc: any = {
      boundingBox: vi.fn(async () => ({ x: 100, y: 100, width: 200, height: 30 })),
      scrollIntoViewIfNeeded: vi.fn(async () => {}),
      isChecked: overrides.isChecked ?? vi.fn(async () => false),
    };
    loc.first = vi.fn(() => loc);
    return loc;
  };

  const page: any = {
    evaluate: overrides.evaluate ?? vi.fn(async () => false),
    addInitScript: vi.fn(async () => {}),
    mouse: {
      move: vi.fn(async () => {}),
      down: vi.fn(async () => {}),
```

<!-- source-snippets:end -->
</details>

JS 端的策略是"**单元化所有可单元的部分**",依赖完整 mock 注入 + spy 验证调用模式。这让 CI JS job 不需要真的运行 Chromium——`vitest run` 几秒搞定。stealth.test.ts 验证的不是"真实反检测能否过",而是"代码路径是否正确触发 CDP isolated world、是否正确选择 stealth 路径 vs fallback"。

JS 端有专门的 `stealth.puppeteer.test.ts` 测 Puppeteer 拟人化适配——0.3.23 加入,@evelaa123 贡献。

### 双语言测试对偶

|测试类别|Python|JS|
|---|---|---|
|单元(无 browser)|`test_*_unit.py`、`test_build_args.py`、`test_config.py`|`*.test.ts` 全部|
|集成(launch browser)|`test_launch.py`、`test_persistent_context.py` 等|无(JS 不在 CI 跑 browser 测试)|
|在线反检测|`test_stealth.py` (slow)|无|
|路径穿越/安全|`test_extract.py`、`test_lambda_security.py`|无|

Python 端因为 binary 是项目核心,集成测试不可避免;JS 端的 wrapper 完全镜像 Python 行为,所以单元 + Python 端集成已足够。这种"职责互补"的测试分工节省了 CI 时间。

## CI 工作流:ci.yml — 每次 push

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e...  # v6.0.2 (pinned by SHA)
      - uses: actions/setup-python@a309ff8b...  # v6.2.0
        with:
          python-version: "3.12"
      - name: Install dependencies
        run: pip install -e ".[dev]" pytest pytest-asyncio
      - name: Run tests
        run: pytest tests/ -v -m "not slow"

  javascript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e...
      - uses: actions/setup-node@48b55a01...
        with:
          node-version: 20
      - name: Install and build
        run: cd js && npm install && npm run build
      - name: Typecheck
        run: cd js && npm run typecheck
      - name: Run tests
        run: cd js && npm test
```

Sources: [github/workflows/ci.yml:1-34](../../../project-repos/cloakbrowser/.github/workflows/ci.yml#L1-L34)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/ci.yml:1-34`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2
      - uses: actions/setup-python@a309ff8b426b58ec0e2a45f0f869d46889d02405  # v6.2.0
        with:
          python-version: "3.12"
      - name: Install dependencies
        run: pip install -e ".[dev]" pytest pytest-asyncio
      - name: Run tests
        run: pytest tests/ -v -m "not slow"

  javascript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2
      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e  # v6.4.0
        with:
          node-version: 20
      - name: Install and build
        run: cd js && npm install && npm run build
      - name: Typecheck
        run: cd js && npm run typecheck
      - name: Run tests
        run: cd js && npm test
```

<!-- source-snippets:end -->
</details>

两个并行 job,一个测 Python 一个测 JS。CI 在 5-10 分钟内反馈,够快不阻塞迭代。

### Action 全部 pin 到 SHA

```yaml
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2
- uses: actions/setup-python@a309ff8b426b58ec0e2a45f0f869d46889d02405  # v6.2.0
```

不是 `actions/checkout@v6` 这种 tag 引用,而是 commit SHA。这是 0.3.19 引入的供应链安全加固——tag 可以被仓库 owner 移动指向恶意 commit,SHA 不可变。配合 Dependabot 自动 PR 提示新版本,既不失维护性又保安全。

```mermaid
flowchart LR
    A["Developer push to main / PR"]
    B["GitHub Actions trigger"]
    C["Python job"]
    D["JS job"]
    E["pip install -e .❲dev❳"]
    F["pytest -m 'not slow'"]
    G["npm install + build"]
    H["typecheck + vitest"]
    I["✅ merge / 🚨 fail"]

    A --> B
    B --> C
    B --> D
    C --> E
    E --> F
    D --> G
    G --> H
    F --> I
    H --> I
```

## publish.yml — tag 触发的双语言 + Docker 发布

```yaml
name: Publish

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      job:
        description: 'Job to run (leave empty to run all)'
        ...

concurrency:
  group: publish
  cancel-in-progress: false
```

Sources: [github/workflows/publish.yml:1-22](../../../project-repos/cloakbrowser/.github/workflows/publish.yml#L1-L22)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/publish.yml:1-22`

```yaml
name: Publish

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      job:
        description: 'Job to run (leave empty to run all)'
        required: false
        type: choice
        options:
          - ''
          - publish-pypi
          - publish-npm
          - publish-docker

concurrency:
  group: publish
  cancel-in-progress: false

```

<!-- source-snippets:end -->
</details>

`concurrency: group: publish` 意味着同一时间只有一个 publish 在跑——并发发布 = 灾难。`cancel-in-progress: false` 意味着新发布不会取消旧的,而是排队——一旦发布开始就让它跑完。

### 五个 job,依赖关系

```mermaid
flowchart TD
    A["test<br/>Python + JS"]
    B["validate-version<br/>tag == _version.py == package.json"]
    C["publish-pypi<br/>OIDC,无 token"]
    D["publish-npm<br/>OIDC + provenance"]
    E["publish-docker<br/>buildx + cosign + attest"]

    A --> C
    A --> D
    A --> E
    B --> C
    B --> D
    B --> E
```

`validate-version` job:

```yaml
- name: Check tag matches package versions
  run: |
    TAG="${GITHUB_REF_NAME#v}"
    PY=$(python -c 'import re; print(re.search(r"__version__\s*=\s*[\"'\'']([^\"'\'']+)", open("cloakbrowser/_version.py").read()).group(1))')
    JS=$(python -c 'import json; print(json.load(open("js/package.json"))["version"])')
    echo "Tag: $TAG | Python: $PY | npm: $JS"
    [ "$TAG" = "$PY" ] || { echo "ERROR: tag v$TAG != _version.py $PY"; exit 1; }
    [ "$TAG" = "$JS" ] || { echo "ERROR: tag v$TAG != package.json $JS"; exit 1; }
```

Sources: [github/workflows/publish.yml:41-56](../../../project-repos/cloakbrowser/.github/workflows/publish.yml#L41-L56)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/publish.yml:41-56`

```yaml
  validate-version:
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2
      - uses: actions/setup-python@a309ff8b426b58ec0e2a45f0f869d46889d02405  # v6.2.0
        with:
          python-version: "3.12"
      - name: Check tag matches package versions
        run: |
          TAG="${GITHUB_REF_NAME#v}"
          PY=$(python -c 'import re; print(re.search(r"__version__\s*=\s*[\"'\'']([^\"'\'']+)", open("cloakbrowser/_version.py").read()).group(1))')
          JS=$(python -c 'import json; print(json.load(open("js/package.json"))["version"])')
          echo "Tag: $TAG | Python: $PY | npm: $JS"
          [ "$TAG" = "$PY" ] || { echo "ERROR: tag v$TAG != _version.py $PY"; exit 1; }
          [ "$TAG" = "$JS" ] || { echo "ERROR: tag v$TAG != package.json $JS"; exit 1; }
```

<!-- source-snippets:end -->
</details>

**三个版本号必须严格相等**才能发布:git tag、Python `_version.py`、JS `package.json` 的 `version`。Python 用 dynamic version 通过 `hatch.version.path = "cloakbrowser/_version.py"`(`pyproject.toml`)实现,但 JS 的 `package.json` 没有等价机制,所以发版前必须手动同步。这个 validate 防止"忘了改一边"。

## OIDC trusted publishing:无 secret 发布

```yaml
publish-pypi:
  permissions:
    id-token: write  # OIDC trusted publishing — no PYPI_TOKEN needed
  steps:
    - uses: pypa/gh-action-pypi-publish@cef221092ed1bacb1cc03d23a2d87d1d172e277b  # v1
```

Sources: [github/workflows/publish.yml:58-74](../../../project-repos/cloakbrowser/.github/workflows/publish.yml#L58-L74)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/publish.yml:58-74`

```yaml
  publish-pypi:
    needs: [test, validate-version]
    if: always() && needs.test.result == 'success' && (needs.validate-version.result == 'success' || needs.validate-version.result == 'skipped')
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # OIDC trusted publishing — no PYPI_TOKEN needed
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2
      - uses: actions/setup-python@a309ff8b426b58ec0e2a45f0f869d46889d02405  # v6.2.0
        with:
          python-version: "3.12"
      - name: Build
        run: |
          pip install build
          python -m build
      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@cef221092ed1bacb1cc03d23a2d87d1d172e277b  # v1
```

<!-- source-snippets:end -->
</details>

**没有 `PYPI_TOKEN` secret**。PyPI 用 OIDC trusted publishing——PyPI 信任 `CloakHQ/cloakbrowser` 仓库的 GitHub Actions,工作流通过 `id-token: write` 拿到 OIDC token 直接换取上传凭证。token 短期、单次使用,没有长期 secret 可被盗。

npm 同样:

```yaml
publish-npm:
  permissions:
    id-token: write  # OIDC trusted publishing + provenance
  steps:
    - run: cd js && npm publish --provenance --access public
```

Sources: [github/workflows/publish.yml:76-91](../../../project-repos/cloakbrowser/.github/workflows/publish.yml#L76-L91)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/publish.yml:76-91`

```yaml
  publish-npm:
    needs: [test, validate-version]
    if: always() && needs.test.result == 'success' && (needs.validate-version.result == 'success' || needs.validate-version.result == 'skipped')
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # OIDC trusted publishing + provenance — no NPM_TOKEN needed
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2
      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e  # v6.4.0
        with:
          node-version: 24  # npm 11.11.0 native — no upgrade needed (Node 22.22.2 has broken npm)
          registry-url: 'https://registry.npmjs.org'
      - name: Build
        run: cd js && npm ci && npm run build
      - name: Publish to npm
        run: cd js && npm publish --provenance --access public
```

<!-- source-snippets:end -->
</details>

`--provenance` 让 npm 把 build provenance 与包一起发布。`npm view cloakbrowser` 时可以看到 provenance 链接,验证"这个包确实是从 CloakHQ/cloakbrowser 的 commit X build 出来的"。

## Docker 发布:多架构 + 签名 + provenance

```yaml
publish-docker:
  permissions:
    id-token: write
    contents: read
    attestations: write
    packages: write
  steps:
    - uses: docker/setup-qemu-action@ce360397...
    - uses: docker/setup-buildx-action@4d04d5d9...
    - uses: docker/login-action@4907a6dd...
      with:
        username: ${{ secrets.DOCKER_USER }}
        password: ${{ secrets.DOCKER_PAT }}
    - name: Build and push
      id: build
      uses: docker/build-push-action@bcafcacb...
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: |
          cloakhq/cloakbrowser:${{ env.VERSION }}
          cloakhq/cloakbrowser:latest
        provenance: true
        sbom: true
    - uses: sigstore/cosign-installer@6f9f1778...
    - name: Sign image
      run: cosign sign --yes cloakhq/cloakbrowser@${{ steps.build.outputs.digest }}
    - name: Attest build provenance
      uses: actions/attest-build-provenance@a2bbfa25...
      with:
        subject-name: index.docker.io/cloakhq/cloakbrowser
        subject-digest: ${{ steps.build.outputs.digest }}
        push-to-registry: true
```

Sources: [github/workflows/publish.yml:93-134](../../../project-repos/cloakbrowser/.github/workflows/publish.yml#L93-L134)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/publish.yml:93-134`

```yaml
  publish-docker:
    needs: [test, validate-version]
    if: always() && needs.test.result == 'success' && (needs.validate-version.result == 'success' || needs.validate-version.result == 'skipped')
    runs-on: ubuntu-latest
    permissions:
      id-token: write      # Cosign keyless signing + attestations
      contents: read
      attestations: write
      packages: write
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2
      - name: Extract version
        run: |
          VERSION=$(python -c 'import re; print(re.search(r"__version__\s*=\s*[\"'\'']([^\"'\'']+)", open("cloakbrowser/_version.py").read()).group(1))')
          echo "VERSION=$VERSION" >> $GITHUB_ENV
      - uses: docker/setup-qemu-action@ce360397dd3f832beb865e1373c09c0e9f86d70a  # v4.0.0
      - uses: docker/setup-buildx-action@4d04d5d9486b7bd6fa91e7baf45bbb4f8b9deedd  # v4.0.0
      - uses: docker/login-action@4907a6ddec9925e35a0a9e82d7399ccc52663121  # v4.1.0
        with:
          username: ${{ secrets.DOCKER_USER }}
          password: ${{ secrets.DOCKER_PAT }}
      - name: Build and push
        id: build
        uses: docker/build-push-action@bcafcacb16a39f128d818304e6c9c0c18556b85f  # v7.1.0
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            cloakhq/cloakbrowser:${{ env.VERSION }}
            cloakhq/cloakbrowser:latest
          provenance: true
          sbom: true
      - uses: sigstore/cosign-installer@6f9f17788090df1f26f669e9d70d6ae9567deba6  # v4.1.2
      - name: Sign image
        run: cosign sign --yes cloakhq/cloakbrowser@${{ steps.build.outputs.digest }}
      - name: Attest build provenance
        uses: actions/attest-build-provenance@a2bbfa25375fe432b6a289bc6b6cd05ecd0c4c32  # v4.1.0
        with:
          subject-name: index.docker.io/cloakhq/cloakbrowser
          subject-digest: ${{ steps.build.outputs.digest }}
          push-to-registry: true
```

<!-- source-snippets:end -->
</details>

四层供应链证明叠加:

1. **多架构 buildx**:`linux/amd64,linux/arm64` 一次产出两架构 manifest
2. **provenance + sbom**:`docker/build-push-action` 自带 SLSA build provenance 与 Software Bill of Materials
3. **cosign 无密钥签名**:Sigstore 透明日志记录"这个 image digest 是 CloakHQ/cloakbrowser GitHub Actions 签的",`cosign verify` 可验证
4. **attest-build-provenance push-to-registry**:SLSA Level 3 build provenance 推到 Docker Hub registry,通过 OCI artifact attachment 关联到 image

用户可以这样验证:

```bash
# 验证签名
cosign verify cloakhq/cloakbrowser@sha256:... \
  --certificate-identity 'https://github.com/CloakHQ/cloakbrowser/.github/workflows/publish.yml@refs/tags/v0.3.28' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com'

# 验证 provenance
gh attestation verify cloakhq/cloakbrowser:0.3.28 --owner CloakHQ
```

## attest-release.yml — Chromium binary 的事后证明

```yaml
name: Attest Release Binary

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Release tag (e.g. chromium-v145.0.7632.159.2)'
        required: true

jobs:
  attest:
    permissions:
      id-token: write
      attestations: write
      contents: write
    steps:
      - name: Download release binaries
        run: gh release download "$RELEASE_TAG" --repo CloakHQ/cloakbrowser --pattern "cloakbrowser-*.tar.gz" --pattern "cloakbrowser-*.zip"

      - name: Attest build provenance
        uses: actions/attest-build-provenance@a2bbfa25...
        with:
          subject-path: |
            cloakbrowser-*.tar.gz
            cloakbrowser-*.zip
```

Sources: [github/workflows/attest-release.yml:1-29](../../../project-repos/cloakbrowser/.github/workflows/attest-release.yml#L1-L29)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/attest-release.yml:1-29`

```yaml
name: Attest Release Binary

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Release tag (e.g. chromium-v145.0.7632.159.2)'
        required: true

jobs:
  attest:
    runs-on: ubuntu-latest
    permissions:
      id-token: write      # Sigstore OIDC
      attestations: write  # GitHub attestation API
      contents: write      # Download release assets
    steps:
      - name: Download release binaries
        run: gh release download "$RELEASE_TAG" --repo CloakHQ/cloakbrowser --pattern "cloakbrowser-*.tar.gz" --pattern "cloakbrowser-*.zip"
        env:
          GH_TOKEN: ${{ github.token }}
          RELEASE_TAG: ${{ github.event.inputs.tag }}

      - name: Attest build provenance
        uses: actions/attest-build-provenance@a2bbfa25375fe432b6a289bc6b6cd05ecd0c4c32  # v4.1.0
        with:
          subject-path: |
            cloakbrowser-*.tar.gz
            cloakbrowser-*.zip
```

<!-- source-snippets:end -->
</details>

这个 workflow 不在 push 触发,**只通过 manual `workflow_dispatch`** 跑。原因:Chromium binary 是在 CloakHQ 私有补丁仓库 build 完后,以 GitHub Release 形式发布到这个公开仓库;attest-release 在 release 发布后手动触发,给 release 资产打 provenance attestation。

**为什么是事后而不是 build-time?** —— 因为 build 在私有仓库进行,公开仓库的 GitHub Actions 拿不到 build 过程。事后 attest 至少能证明"这些 tar.gz/zip 是 CloakHQ 在某个时间签的"。这是供应链证明在"build 与 publish 解耦"场景下的折衷方案。

## CHANGELOG 标签:发布纪律的载体

CHANGELOG 每条都打 `[wrapper]`、`[binary]`、`[docker]`、`[docs]`、`[meta]` 标签。这不是装饰,而是**发布纪律**:

- **`[binary]` 变更触发 chromium-v* tag 与 attest-release**
- **`[wrapper]` 变更触发 v* tag 与完整 publish workflow**
- **`[docker]` 单独的 docker 镜像更新**
- **`[docs]` / `[meta]` 不触发发布**

```mermaid
flowchart LR
    A["❲binary❳ PR merged"]
    B["❲wrapper❳ PR merged"]
    C["❲docker❳ PR merged"]
    D["❲docs❳ PR merged"]

    A -.触发.-> E["私有 binary repo build<br/>→ chromium-v* release<br/>→ attest-release.yml(手动)"]
    B -.触发.-> F["bump version, tag v0.3.28<br/>→ publish.yml"]
    C -.随下个 wrapper release.-> F
    D -.无操作.-> X["仅文档"]
```

读 CHANGELOG 可以快速判断"这次升级需要换 binary 吗?"——`[binary]` 条目意味着用户的 `~/.cloakbrowser` 缓存会被自动后台更新替换,wrapper 版本不变可以不动。

## 几个非显然的实践细节

**1. Patchright 测试隔离**

`test_backend.py` 验证默认 backend 是 `playwright`、`CLOAKBROWSER_BACKEND=patchright` 切换有效——但 patchright 不是 dev 必备依赖。`pip install -e .[dev]` 只装 pytest + pytest-asyncio,不装 patchright。`test_backend.py` 用 mock 或 `pytest.importorskip("patchright")` 处理这个分裂。

**2. Lambda 安全测试是独立模块**

`test_lambda_security.py` 单独存在,验证 `_validate_url` 防 SSRF、handler 不响应私有 IP 等。Lambda 是出厂模板,如果模板有 SSRF 用户会直接复制踩坑——所以测试要单独覆盖。

**3. test_human_visual.{py,mjs}**

`.mjs` 后缀的同名 Python 测试是 JS 端的对偶——用同一个浏览器、同一个 fixture,验证两端 humanize 视觉行为一致(都画 Bezier 曲线、都做 overshoot)。这种"双端共享测试 fixture"在 stealth 项目里很罕见,需要专门的执行 runner。

**4. CI Node 版本踩坑**

`publish.yml` 的 `publish-npm` job 用 `node-version: 24`,因为 Node 22.22.2 ship 了一个有 bug 的 npm,会破坏 publish。0.3.23 的 CHANGELOG 写了这点:"Use Node 24 in CI publish workflow to work around broken npm in Node 22.22.2"。这是 CI 工程中常见的"版本兼容性陷阱",写在 workflow 注释里防止后人不小心改回 22。

Sources: [github/workflows/publish.yml:86](../../../project-repos/cloakbrowser/github/workflows/publish.yml:86), [CHANGELOG.md:60](../../../project-repos/cloakbrowser/CHANGELOG.md:60)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/publish.yml:86`

> 未找到引用文件：`github/workflows/publish.yml:86`

#### `CHANGELOG.md:60`

> 未找到引用文件：`CHANGELOG.md:60`

<!-- source-snippets:end -->
</details>

**5. 测试代理隔离**

`tests/test_stealth.py` 通过环境变量 `CLOAKBROWSER_TEST_PROXY` 接受可选代理——某些反检测站对裸 IP 已经熟悉,需要代理才能拿到真实测试结果。CI 不设这个变量,本地开发可以设。这种"测试可选增强"让本地反检测验证更接近生产环境。

## 相关页面

- [系统架构](system-architecture.md) — wrapper 与 binary 在发布管线中的分工
- [二进制生命周期](binary-management.md) — binary release 如何被 wrapper 端的自动更新机制消费
- [部署与生态集成](deployment-and-integrations.md) — Docker 镜像如何被 cosign 签名 + provenance 证明
- [Python 与 JS 双 SDK 对偶](python-vs-js-sdk.md) — 版本同步与并行发布的细节


---
