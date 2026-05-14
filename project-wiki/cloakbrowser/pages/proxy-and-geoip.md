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
