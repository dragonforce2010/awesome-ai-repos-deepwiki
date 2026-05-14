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
