# CloakBrowser DeepWiki

> **CloakBrowser 是反检测 Chromium——不靠 JS 注入或 flag 调整,而是把 fingerprint 改写下沉到 C++ 源码层,编译进自己维护的 Chromium 二进制。反爬服务看到一个正常的 Chrome,因为它"就是"一个正常的 Chrome,只是 GPU 串、canvas 噪声、WebRTC IP 等数值被换掉了。**

## 目录导航

| 分区 | 页面 | 内容简介 |
|---|---|---|
| 概览 | [项目概览](pages/overview.md) | 诞生背景、核心创新四层堆叠、能力全景、阅读路线 |
| 架构 | [系统架构](pages/system-architecture.md) | wrapper / binary / cloakserve 三层模型与跨语言对偶 |
| 引擎 | [隐身引擎与指纹系统](pages/stealth-engine.md) | C++ 补丁 + `build_args` 优先级 + 完整 fingerprint flag 表 |
| API | [启动 API:四象限对偶](pages/launch-api.md) | 6 个 launch 函数的语义差异与扩展点 |
| 二进制 | [二进制生命周期](pages/binary-management.md) | 平台/版本解析、双链路下载、SHA-256 校验、自动更新 |
| 网络 | [代理、GeoIP 与 WebRTC 一致性](pages/proxy-and-geoip.md) | HTTP/SOCKS5 分流、exit IP 复用、WebRTC IP 同步 |
| 行为 | [拟人化行为层](pages/humanize-behavior.md) | Bezier 鼠标、按键级时序、滚动三段式、CDP Isolated World |
| 服务 | [cloakserve CDP 多路复用器](pages/cloakserve-cdp-multiplexer.md) | 按 fingerprint seed 维护 Chrome 池,WS 双向代理 |
| 双端 | [Python 与 JS 双 SDK 对偶](pages/python-vs-js-sdk.md) | API 一一对应映射、Puppeteer 差异、版本同步 |
| 部署 | [部署与生态集成](pages/deployment-and-integrations.md) | Docker / AWS Lambda / Nix flake / 7 大框架集成 |
| 质量 | [测试、CI 与发布管线](pages/testing-ci-release.md) | pytest + vitest、三个 workflow、cosign + SLSA 证明 |

## 仓库全景

```text
cloakbrowser/
├── cloakbrowser/                  # Python wrapper
│   ├── __init__.py                # 公开 API 入口
│   ├── browser.py                 # 6 个 launch 函数 (sync/async × 三种 context)
│   ├── config.py                  # 平台检测 + stealth args
│   ├── download.py                # 二进制下载 + 自动更新
│   ├── geoip.py                   # 代理 IP → 时区/语言/exit IP
│   ├── __main__.py                # python -m cloakbrowser CLI
│   └── human/                     # 拟人化行为补丁
├── js/                            # JS/TS wrapper
│   └── src/
│       ├── index.ts               # 入口 (Playwright 默认)
│       ├── playwright.ts          # 3 个 launch 函数
│       ├── puppeteer.ts           # Puppeteer 入口 (单独子路径)
│       ├── config.ts / args.ts    # 与 Python 端镜像
│       ├── download.ts / geoip.ts # 二进制与代理
│       ├── human/                 # Playwright 拟人化
│       └── human-puppeteer/       # Puppeteer 拟人化 (独立实现)
├── bin/
│   ├── cloakserve                 # CDP 多路复用 (aiohttp)
│   ├── cloaktest                  # 反检测一键体检
│   └── docker-entrypoint.sh       # Xvfb 启动
├── examples/                      # 集成示例
│   └── integrations/              # browser-use / Crawl4AI / Lambda / 等
├── tests/                         # pytest 套件 (29 文件)
├── js/tests/                      # vitest 套件 (9 文件)
├── Dockerfile                     # 双 wrapper + Xvfb + 字体
├── flake.nix                      # NixOS 可重现 derivation
└── .github/workflows/             # ci / publish / attest-release
```

## 核心入口

| 文件 | 一句话说明 |
|---|---|
| [cloakbrowser/__init__.py](../../project-repos/cloakbrowser/cloakbrowser/__init__.py) | 公共 API 的唯一入口,惰性导入 humanize 子包 |
| [cloakbrowser/browser.py](../../project-repos/cloakbrowser/cloakbrowser/browser.py) | `launch / launch_context / launch_persistent_context` 各自的 sync/async 实现 |
| [cloakbrowser/config.py](../../project-repos/cloakbrowser/cloakbrowser/config.py) | 平台/版本表、默认 stealth args、`IGNORE_DEFAULT_ARGS` 屏蔽 Playwright 泄漏点 |
| [cloakbrowser/download.py](../../project-repos/cloakbrowser/cloakbrowser/download.py) | 平台-aware 下载、双链路 fallback、SHA-256 校验、后台自动更新 |
| [cloakbrowser/human/__init__.py](../../project-repos/cloakbrowser/cloakbrowser/human/__init__.py) | `patch_browser/context/page` 三层补丁,CDP Isolated World 反检测 |
| [bin/cloakserve](../../project-repos/cloakbrowser/bin/cloakserve) | 按 fingerprint seed 维护 Chrome 进程池,HTTP + WebSocket 代理 |
| [js/src/playwright.ts](../../project-repos/cloakbrowser/js/src/playwright.ts) | JS 端 Playwright 入口,严格镜像 Python `browser.py` |
| [js/src/puppeteer.ts](../../project-repos/cloakbrowser/js/src/puppeteer.ts) | Puppeteer 入口,monkey-patch newPage 自动处理代理认证 |
| [.github/workflows/publish.yml](../../project-repos/cloakbrowser/.github/workflows/publish.yml) | PyPI + npm + Docker 三端并行发布,OIDC + cosign + SLSA |

## 你想了解什么?

- **30 秒上手?** → 直接看 [项目概览](pages/overview.md) 末尾的代码示例
- **为什么 C++ 补丁能做到 JS 注入做不到的事?** → [隐身引擎与指纹系统](pages/stealth-engine.md)
- **`launch()` `launch_context()` `launch_persistent_context()` 三个怎么挑?** → [启动 API:四象限对偶](pages/launch-api.md)
- **怎么配代理 + WebRTC + 时区一致?** → [代理、GeoIP 与 WebRTC 一致性](pages/proxy-and-geoip.md)
- **想做多账号矩阵或服务化?** → [cloakserve CDP 多路复用器](pages/cloakserve-cdp-multiplexer.md) + [部署与生态集成](pages/deployment-and-integrations.md)
- **想给项目贡献代码?** → [测试、CI 与发布管线](pages/testing-ci-release.md) + [二进制生命周期](pages/binary-management.md)
- **关心源码组织、跨语言对偶?** → [系统架构](pages/system-architecture.md) + [Python 与 JS 双 SDK 对偶](pages/python-vs-js-sdk.md)
- **想用 humanize=True 但不知道发生了什么?** → [拟人化行为层](pages/humanize-behavior.md)

## 可继续追问的主题

- **`build_args` 的优先级如何被 cloakserve 与 wrapper 共享?**:阅读 [cloakbrowser/browser.py:954-1003](../../project-repos/cloakbrowser/cloakbrowser/browser.py#L954-L1003) 与 [bin/cloakserve:200-223](../../project-repos/cloakbrowser/bin/cloakserve#L200-L223),理解 `build_args` 如何被复用
- **每个 humanize 函数能 patch 哪些 Playwright 方法?**:`cloakbrowser/human/__init__.py` 第 802-1546 行的 `patch_page`、`patch_context`、`patch_browser` 与 ElementHandle、Locator、Frame patch 函数
- **CDP Isolated World 在 stealth 中的具体规避了哪些检测?**:`_SyncIsolatedWorld` 与 `_AsyncIsolatedWorld` 类的实现,以及它们与 `_type_shift_symbol` 的协作
- **如何在不修改 wrapper 的前提下自己编译 Chromium binary?**:`flake.nix` 与 `CLOAKBROWSER_BINARY_PATH` 环境变量
- **AWS Lambda 模板里 `_classify_error` 处理了哪些可恢复错误?**:`examples/integrations/aws_lambda/lambda_handler.py` 的 `_classify_error` 与 `_attempt_scrape`

## 源信息

- 仓库:[https://github.com/CloakHQ/cloakbrowser](https://github.com/CloakHQ/cloakbrowser)
- 分支:`main`
- 分析 commit:`6f4f92e7c762507056ed053078fb7e4854448c4b`
- 最新发布版本:0.3.28(2026-05-11),Chromium 基线 146.0.7680.177.x
- 平台覆盖:`linux-x64`、`linux-arm64`、`darwin-arm64`、`darwin-x64`、`windows-x64`
- License:wrapper MIT,binary [CloakBrowser Binary License](../../project-repos/cloakbrowser/BINARY-LICENSE.md)
