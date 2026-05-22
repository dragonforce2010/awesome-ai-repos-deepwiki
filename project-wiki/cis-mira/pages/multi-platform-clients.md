<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/lib/platform.ts](../../../project-repos/cis-mira/src/lib/platform.ts)
- [src/lib/jsbridge.ts](../../../project-repos/cis-mira/src/lib/jsbridge.ts)
- [electron-app/README.md](../../../project-repos/cis-mira/electron-app/README.md)
- [chrome-extension/README.md](../../../project-repos/cis-mira/chrome-extension/README.md)
- [electron-app/shared/lib/mira-client.ts](../../../project-repos/cis-mira/electron-app/shared/lib/mira-client.ts)
- [index.html](../../../project-repos/cis-mira/index.html)

</details>

# 多端客户端

同一套 Web  bundle 要跑在浏览器、飞书 WebView、Electron BrowserView 和 Chrome Sidepanel 里。**平台差异**集中在 `platform.ts` 检测、`jsbridge` 与客户端注入的全局变量（`MIRA_CLIENT_VERSION`、`IS_ELECTRON`），而不是维护四套业务代码。

## 平台检测

| 函数 | 判定依据 |
|------|----------|
| `getIsClientApp()` | `window.MIRA_CLIENT_VERSION` |
| `getIsElectron()` | `window.IS_ELECTRON` |
| `getIsFlutter()` | 客户端且非 Electron |
| `getPreferredScrollEngine()` | 默认 `'smart'` |

路由层用这些函数改默认首页、侧栏显隐、VPN loader 是否生效。

Sources: [src/lib/platform.ts:185-211](../../../project-repos/pages/src/lib/platform.ts#L185-L211)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/lib/platform.ts:185-211`

> 未找到引用文件：`src/lib/platform.ts`

<!-- source-snippets:end -->
</details>

## 飞书内嵌

`index.html` 在 UA 含 feishu/lark 时注入 `MIRA_CLIENT_VERSION = '0.60.0._lark'`，与纯 Web 区分埋点和能力开关。

Sources: [index.html:11-14](../../../project-repos/pages/index.html#L11-L14)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `index.html:11-14`

> 未找到引用文件：`index.html`

<!-- source-snippets:end -->
</details>

## Electron

`electron-app` 使用 Electron 28：主进程管 auth/cookie/session/update，BrowserView 加载线上 Mira Web。README 说明复用 `chrome-extension` 的 `MiraClient` 逻辑但 **去掉 iframe proxy**，并注入本地文件、划词翻译等 toolbar 能力。

Sources: [electron-app/README.md:130-150](../../../project-repos/pages/electron-app/README.md#L130-L150), [electron-app/shared/lib/mira-client.ts:1-40](../../../project-repos/pages/electron-app/shared/lib/mira-client.ts#L1-L40)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `electron-app/README.md:130-150`

> 未找到引用文件：`electron-app/README.md`

#### `electron-app/shared/lib/mira-client.ts:1-40`

> 未找到引用文件：`electron-app/shared/lib/mira-client.ts`

<!-- source-snippets:end -->
</details>

## Chrome 扩展

MV3 架构：Service Worker + Sidepanel + Content Scripts。扩展域无法直接带站点 Cookie，采用 **mira.bytedance.com iframe 三层代理** 发请求；注入 `MIRA_CLIENT_VERSION = 'extension:0.0.1'`。SSE 在 `inject-iframe-proxy.js` 解析（README 有序列说明）。

Sources: [chrome-extension/README.md:46-90](../../../project-repos/pages/chrome-extension/README.md#L46-L90), [chrome-extension/README.md:150-176](../../../project-repos/pages/chrome-extension/README.md#L150-L176)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `chrome-extension/README.md:46-90`

> 未找到引用文件：`chrome-extension/README.md`

#### `chrome-extension/README.md:150-176`

> 未找到引用文件：`chrome-extension/README.md`

<!-- source-snippets:end -->
</details>

## JSBridge

`root.tsx` 在 `AppInner` 里 `initJSBridge(emitter)`，把客户端事件接到全局 EventEmitter，供划词、下载、通知等 Native 能力回调 Web。

Sources: [src/lib/jsbridge.ts:1-50](../../../project-repos/pages/src/lib/jsbridge.ts#L1-L50), [src/root.tsx:49-53](../../../project-repos/pages/src/root.tsx#L49-L53)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/lib/jsbridge.ts:1-50`

> 未找到引用文件：`src/lib/jsbridge.ts`

#### `src/root.tsx:49-53`

> 未找到引用文件：`src/root.tsx`

<!-- source-snippets:end -->
</details>

## 相关页面

- [路由、布局与认证](routing-layouts-auth.md)
- [构建、部署与质量](build-deploy-quality.md)
