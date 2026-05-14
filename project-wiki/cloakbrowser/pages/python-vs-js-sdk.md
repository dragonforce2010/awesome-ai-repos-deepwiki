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
