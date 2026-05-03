# Plugin 与外部 CLI Hub

<details>
<summary>相关源文件</summary>

- `src/plugin.ts`
- `src/plugin-manifest.ts`
- `src/discovery.ts`
- `src/external.ts`
- `src/cli.ts`

</details>

## 两类扩展

opencli 有两套扩展机制：

- plugin：第三方 opencli adapter 包，安装到 `~/.opencli/plugins`，monorepo clone 到 `~/.opencli/monorepos`。
- external CLI：把已有二进制工具注册到 opencli 入口，调用时透传 stdio 和 exit code。

Sources: [src/plugin.ts:1-8](../../../project-repos/opencli/src/plugin.ts#L1-L8), [src/external.ts:19-31](../../../project-repos/opencli/src/external.ts#L19-L31), [src/cli.ts:1731-1924](../../../project-repos/opencli/src/cli.ts#L1731-L1924), [src/cli.ts:2052-2104](../../../project-repos/opencli/src/cli.ts#L2052-L2104)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/plugin.ts:1-8`

> 未找到引用文件：`src/plugin.ts`

#### `src/external.ts:19-31`

> 未找到引用文件：`src/external.ts`

#### `src/cli.ts:1731-1924`

> 未找到引用文件：`src/cli.ts`

#### `src/cli.ts:2052-2104`

> 未找到引用文件：`src/cli.ts`

<!-- source-snippets:end -->
</details>
## Plugin manifest

插件 manifest 文件名是 `opencli-plugin.json`。它支持单插件和 monorepo 两种模式；monorepo 可以声明多个 subplugin 及其 path、enabled、description、version、opencliVersion。  
Sources: [src/plugin-manifest.ts:1-37](../../../project-repos/opencli/src/plugin-manifest.ts#L1-L37), [src/plugin-manifest.ts:39-83](../../../project-repos/opencli/src/plugin-manifest.ts#L39-L83)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/plugin-manifest.ts:1-37`

> 未找到引用文件：`src/plugin-manifest.ts`

#### `src/plugin-manifest.ts:39-83`

> 未找到引用文件：`src/plugin-manifest.ts`

<!-- source-snippets:end -->
</details>
兼容性检查支持简单 semver range。版本解析和范围包含逻辑在 `plugin-manifest.ts` 中实现，避免安装明显不兼容的插件。  
Sources: [src/plugin-manifest.ts:87-195](../../../project-repos/opencli/src/plugin-manifest.ts#L87-L195)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/plugin-manifest.ts:87-195`

> 未找到引用文件：`src/plugin-manifest.ts`

<!-- source-snippets:end -->
</details>
## Plugin 安装与事务

Plugin 安装涉及 clone、staging、替换目录、symlink 和 lock file。`plugin.ts` 有显式 transaction helper：每一步返回 handle，commit 时 finalize，失败时按相反顺序 rollback。替换目录时先移动到临时路径，再备份旧目录，最后 rename 到目标路径。  
Sources: [src/plugin.ts:227-252](../../../project-repos/opencli/src/plugin.ts#L227-L252), [src/plugin.ts:290-331](../../../project-repos/opencli/src/plugin.ts#L290-L331), [src/plugin.ts:333-377](../../../project-repos/opencli/src/plugin.ts#L333-L377), [src/plugin.ts:379-424](../../../project-repos/opencli/src/plugin.ts#L379-L424)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/plugin.ts:227-252`

> 未找到引用文件：`src/plugin.ts`

#### `src/plugin.ts:290-331`

> 未找到引用文件：`src/plugin.ts`

#### `src/plugin.ts:333-377`

> 未找到引用文件：`src/plugin.ts`

#### `src/plugin.ts:379-424`

> 未找到引用文件：`src/plugin.ts`

<!-- source-snippets:end -->
</details>
安全边界之一是 `resolveRepoContainedPath`：插件子路径必须留在 repo root 内，不能通过 `../` 逃逸。  
Sources: [src/plugin.ts:271-277](../../../project-repos/opencli/src/plugin.ts#L271-L277)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/plugin.ts:271-277`

> 未找到引用文件：`src/plugin.ts`

<!-- source-snippets:end -->
</details>
## Plugin discovery

发现插件时，discovery 会遍历 `~/.opencli/plugins`，处理普通插件和 symlink 插件目录，把命令注册到 registry。monorepo 插件通过 symlink 指向具体 subplugin。  
Sources: [src/discovery.ts:184-231](../../../project-repos/opencli/src/discovery.ts#L184-L231), [src/discovery.ts:243-256](../../../project-repos/opencli/src/discovery.ts#L243-L256)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/discovery.ts:184-231`

> 未找到引用文件：`src/discovery.ts`

#### `src/discovery.ts:243-256`

> 未找到引用文件：`src/discovery.ts`

<!-- source-snippets:end -->
</details>
## CLI 管理命令

`opencli plugin` 子命令包括 install、uninstall、update、list、create。install 成功后会立即 `discoverPlugins()`，让命令在当前进程中可用；list 支持 table 和 JSON 输出。  
Sources: [src/cli.ts:1731-1758](../../../project-repos/opencli/src/cli.ts#L1731-L1758), [src/cli.ts:1760-1834](../../../project-repos/opencli/src/cli.ts#L1760-L1834), [src/cli.ts:1837-1894](../../../project-repos/opencli/src/cli.ts#L1837-L1894), [src/cli.ts:1896-1924](../../../project-repos/opencli/src/cli.ts#L1896-L1924)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/cli.ts:1731-1758`

> 未找到引用文件：`src/cli.ts`

#### `src/cli.ts:1760-1834`

> 未找到引用文件：`src/cli.ts`

#### `src/cli.ts:1837-1894`

> 未找到引用文件：`src/cli.ts`

#### `src/cli.ts:1896-1924`

> 未找到引用文件：`src/cli.ts`

<!-- source-snippets:end -->
</details>
## Adapter override 管理

除了 plugin，用户也可以对内置 adapter 做本地 override：

- `adapter status` 查看 `~/.opencli/clis/` 里哪些站点覆盖了官方 baseline。
- `adapter eject <site>` 把官方 adapter 复制到用户目录。
- `adapter reset [site]` 或 `--all` 删除本地 override，恢复官方版本。

Sources: [src/cli.ts:1926-1960](../../../project-repos/opencli/src/cli.ts#L1926-L1960), [src/cli.ts:1962-1991](../../../project-repos/opencli/src/cli.ts#L1962-L1991), [src/cli.ts:1993-2039](../../../project-repos/opencli/src/cli.ts#L1993-L2039)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/cli.ts:1926-1960`

> 未找到引用文件：`src/cli.ts`

#### `src/cli.ts:1962-1991`

> 未找到引用文件：`src/cli.ts`

#### `src/cli.ts:1993-2039`

> 未找到引用文件：`src/cli.ts`

<!-- source-snippets:end -->
</details>
## External CLI Hub

外部 CLI 配置来自两个位置：

- 内置：包内 `src/external-clis.yaml`
- 用户：`~/.opencli/external-clis.yaml`

加载时用户配置覆盖同名内置项。调用时先检查 binary 是否存在，不存在则尝试执行配置的安装命令，最后用 `spawnSync(binary,args,{stdio:'inherit'})` passthrough。  
Sources: [src/external.ts:35-67](../../../project-repos/opencli/src/external.ts#L35-L67), [src/external.ts:69-87](../../../project-repos/opencli/src/external.ts#L69-L87), [src/external.ts:144-168](../../../project-repos/opencli/src/external.ts#L144-L168), [src/external.ts:170-198](../../../project-repos/opencli/src/external.ts#L170-L198)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/external.ts:35-67`

> 未找到引用文件：`src/external.ts`

#### `src/external.ts:69-87`

> 未找到引用文件：`src/external.ts`

#### `src/external.ts:144-168`

> 未找到引用文件：`src/external.ts`

#### `src/external.ts:170-198`

> 未找到引用文件：`src/external.ts`

<!-- source-snippets:end -->
</details>
## 外部 CLI 安全处理

安装命令不是直接交给 shell。`parseCommand` 会拒绝 `&&`、`||`、管道、重定向、反引号、变量展开、换行等 shell operator，并把命令拆成 binary + args 交给 `execFileSync`。  
Sources: [src/external.ts:89-123](../../../project-repos/opencli/src/external.ts#L89-L123), [src/external.ts:130-142](../../../project-repos/opencli/src/external.ts#L130-L142)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/external.ts:89-123`

> 未找到引用文件：`src/external.ts`

#### `src/external.ts:130-142`

> 未找到引用文件：`src/external.ts`

<!-- source-snippets:end -->
</details>
未知命令不会自动映射到 PATH 上的任意 binary。`command:*` fallback 只提示用户 `opencli register <binary>`，这是显式注册模型。  
Sources: [src/cli.ts:2129-2141](../../../project-repos/opencli/src/cli.ts#L2129-L2141)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/cli.ts:2129-2141`

> 未找到引用文件：`src/cli.ts`

<!-- source-snippets:end -->
</details>
## 何时用哪种扩展

| 需求 | 机制 |
|---|---|
| 给 opencli 增加可发现 adapter | plugin |
| 临时修改官方站点 adapter | adapter eject |
| 统一调用现有系统工具 | external CLI |
| 发布多个插件包在一个 repo | monorepo plugin manifest |
| 只在本机私有使用 | `~/.opencli/clis/<site>/` |

Sources: [skills/opencli-usage/SKILL.md:93-121](../skills/opencli-usage/SKILL.md#L93-L121), [skills/opencli-usage/SKILL.md:123-138](../skills/opencli-usage/SKILL.md#L123-L138)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-usage/SKILL.md:93-121`

````markdown
当 adapter 因站点变化失败（selector 漂移、API 轮换、response schema 改动），CLI 会提示 `# AutoFix: re-run with OPENCLI_DIAGNOSTIC=1 ...`。按提示重跑，读取 `RepairContext`，修改 `RepairContext.adapter.sourcePath` 指向的 adapter，然后重试。最多 3 轮修复，完整流程见 `opencli-autofix`。

## 写自己的 adapter

两种存储路径：

- **私有**：`~/.opencli/clis/<site>/<command>.js`，无构建步骤，立即可用，不进入公共包。
- **公共/PR**：`clis/<site>/<command>.js`，用于上游贡献，需要 build。

脚手架和验证：

```bash
opencli browser init <site>/<command>   # 生成骨架
opencli validate [target]               # 校验 registry，无网络无浏览器
opencli verify [target] [--smoke]       # 校验并可选跑 smoke
opencli browser verify <site>/<command> # 通过 bridge 端到端验证
```

adapter 只应导入 `@jackwener/opencli/registry` 和 `@jackwener/opencli/errors`。`columns` 必须和 `func` 返回对象的 key 名和顺序一致。完整流程见 `opencli-adapter-author`。

## Plugins

Plugins 是从 git 拉取的第三方扩展，和主 adapter registry 分离：

```bash
opencli plugin install github:user/repo
opencli plugin list [-f json]
opencli plugin update [name] | --all
opencli plugin uninstall <name>
````

#### `skills/opencli-usage/SKILL.md:123-138`

````markdown
```

## 外部 CLI passthrough

把已有命令行工具包进同一个 `opencli ...` 入口：

```bash
opencli install gh
opencli register my-tool \
    --binary my-tool \
    --install "npm i -g my-tool" \
    --desc "My internal CLI"
opencli gh pr list --limit 5
opencli docker ps
```

````

<!-- source-snippets:end -->
</details>
