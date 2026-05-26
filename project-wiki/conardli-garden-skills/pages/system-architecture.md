# 🏗️ 系统架构与组织设计

在这个项目中，我们构建了一个极简、零运行时依赖且高度自动化的 **Monorepo** 技能兵工厂。每个技能都可以独立演进、独立测试、并最终通过 Tag 驱动完成独立的构建与发布。本章将为你层层解密这套工业级架构的物理组织、契约规范、以及底层 CI/CD 自动化流水线的精妙设计。

---

## 📂 仓库目录拓扑

整个 Monorepo 遵循扁平化、强约定的组织方式，杜绝了一切复杂的 npm workspaces 配置，实现了无感初始化（`npm install` 实际上是 no-op）：

```text
.
├── skills/                              # 🧱 所有 Agent 技能的核心承载地
│   ├── web-video-presentation/          # 演示视频生成技能（自包含）
│   │   ├── SKILL.md                     # Agent 载入的顶级指令契约 (必选)
│   │   ├── manifest.json                # 发布与元数据元信息契约 (必选)
│   │   ├── README.md                    # 针对人类开发者的英文指南 (必选)
│   │   ├── README.zh-CN.md              # 中文开发指南
│   │   ├── references/                  # Agent 按需动态调阅的深度设计手册 (可选)
│   │   ├── scripts/                     # 辅助 Agent 执行的确定性运行脚本 (可选)
│   │   ├── templates/                   # 脚手架模板 (可选)
│   │   └── themes/                      # 静态美学主题包 (可选)
│   ├── web-design-engineer/             # 前端设计工程师技能
│   ├── gpt-image-2/                     # 图像生成与编辑技能
│   └── kb-retriever/                    # 本地知识库检索技能
│
├── scripts/release/                     # 🚀 零依赖的发布与校验工具链 (Node ESM)
│   ├── cut-release.mjs                  # 交互式发布决策入口（主推）
│   ├── pack-skill.mjs                   # 技能目录打包为 .zip 与生成 .sha256
│   ├── update-readme.mjs                # 动态改写 README 内的下载锚点
│   ├── list-skills.mjs                  # 技能 Manifest 校验器
│   └── lib/skills.mjs                   # 公共辅助类
│
├── .github/workflows/                   # 🤖 自动化 CI / CD 管道
│   ├── validate-skills.yml              # PR 与 Push 拦截流（本地校验映射）
│   └── release-skill.yml                # 独立 Tag 触发的分发与版本化发布流
│
├── .claude-plugin/                      # 🔌 外部市场集成配置
│   └── marketplace.json                 # 供 Claude Code 插件系统拉取的声明配置
│
├── package.json                         # 维护者脚本与引擎约定
└── README.md                            # 全局 README（含自动改写的下载链条）
```

---

## 📜 技能物理契约：两个关键的声明文件

为了让自动化脚本和 downstream 客户端能够正确解析技能，每个子目录必须提供且严格遵守两个核心契约文件：

### 1. `SKILL.md`（Agent 认知边界）
这是 Agent 决定是否加载该技能的唯一真相源。它只包含 `name` 和 `description` 的 YAML Frontmatter，其余均是指令或对 `references/` 的动态调阅规程：
```yaml
---
name: web-design-engineer
description: Build polished visual web artifacts with HTML/CSS/JavaScript/React...
---
```
> [!WARNING]
> 禁止在 Frontmatter 中添加任何其他字段（例如 `version`、`author` 或自定义标签），否则本地的 validate 流程会直接报错拦截。

### 2. `manifest.json`（构建系统基石）
这是供 CI 自动化脚本、发行版本控制和 Marketplace 解析的元数据声明：
```json
{
  "name": "web-design-engineer",
  "version": "1.0.0",
  "category": "Design / Frontend",
  "description": "What it does, what it's good for.",
  "homepage": "https://github.com/ConardLi/garden-skills/tree/main/skills/web-design-engineer",
  "compat": ["claude-code", "cursor", "codex-cli", "gemini-cli"]
}
```
* **强制命名绑定**：文件夹名称、`SKILL.md` 里的 Frontmatter `name`、以及 `manifest.json` 里的 `name` 三者**必须完全一致**。

---

## 🤖 CI / CD 自动化管道设计

我们为 Monorepo 打造了闭环的质量护栏，将大部分构建与发布工作交由 GitHub Actions 实现，避免人工发布带来的一致性风险。

```
[开发者 Push 或提 PR]
         |
         v
+------------------+
| validate-skills  | (PR Guard Rails)
|   - lint 校验     |
|   - 模拟打包      |
|   - 校验 README   |
+------------------+
         |
      [Merge]
         |
         v
+------------------+
|   cut-release    | (本地交互决定版本，打 Tag 并推送)
+------------------+
         |
  [Git Tag Pushed]
         |
         v
+------------------+
|  release-skill   | (Tag-Driven Build & Sync)
|   - 校验 Tag & Ver|
|   - 导出 Zip 包   |
|   - 增量 Changelog|
|   - 发布 GitHub   |
|   - 自动回写并提交 |
+------------------+
```

### 1. PR 拦截流水线：`validate-skills.yml`
每当有 PR 提交、或者有人直接向 `main` 分支 Push 代码时，该工作流都会被拉起。它直接调用 `npm run validate`，背后实际串联了三个零依赖脚本：
1. **`list-skills.mjs`**：遍历扫描并校验所有技能目录的结构，检查三个 Name 字段是否对齐，元数据格式是否合法。
2. **`pack-skill.mjs`**（带 `--all` 参数）：模拟进行 `.zip` 包打包，确保没有多余的临时文件被误打入，测试打包过程是否顺畅。
3. **`update-readme.mjs`**（带 `--check` 参数）：检查根目录及多语言 README.md 中的下载链接版本号，是否与 `manifest.json` 中的当前版本完全一致。如果发现任何人手动篡改了 README 却忘记了同步，CI 将亮起红灯。

---

### 2. 独立 Tag 驱动的发布管道：`release-skill.yml`
这是整个架构中最具巧思的设计。我们支持每个技能拥有独立的生命周期。发布流程如下：

#### 步骤一：精密的 Tag 解析与防漂移校验
当监测到符合 `*-v*` 规则的 Git Tag 推送时（例如 `web-design-engineer-v1.2.0`），Actions 启动，首先在 Shell 里使用正则进行拦截校验：
```bash
TAG="${GITHUB_REF_NAME}"
if [[ ! "$TAG" =~ ^([a-z0-9][a-z0-9-]*[a-z0-9])-v([0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?)$ ]]; then
  echo "::error::Tag '$TAG' does not match <skill>-v<semver>"
  exit 1
fi
SKILL="${BASH_REMATCH[1]}"
VERSION="${BASH_REMATCH[2]}"
```
接着检查 `skills/${SKILL}/manifest.json` 里的声明版本是否等于 `${VERSION}`。**如果不匹配，流水线会立即终止**，这彻底杜绝了“Tag 叫 v1.2.0，代码里却还是 v1.1.0”的版本漂移情况。

#### 步骤二：纯 Node.js 打包与 Hash 签名
利用本地 `pack-skill.mjs`，动作管道会把 `skills/${SKILL}/` 文件夹整体压缩为 `${SKILL}-${VERSION}.zip`，并且在同级目录下为它生成一个 `.sha256` 校验和文件，方便后续 Agent 安装时进行防篡改签名验证。

#### 步骤三：基于 Git Log 的局部增量 Changelog 生成
通常在一个 Monorepo 中，生成全局变更日志会产生大量无关信息。我们通过 Git 路径过滤器，只捕获当前发布技能对应路径下的提交日志：
```bash
# 获取当前技能的前一个发布 tag 
PREV_TAG=$(git tag --list "${SKILL}-v*" --sort=-v:refname | grep -v "^${TAG}$" | head -n 1 || true)

if [ -n "$PREV_TAG" ]; then
  # 增量导出
  git log --pretty=format:"- %s (%h)" "${PREV_TAG}..${TAG}" -- "skills/${SKILL}/"
else
  # 首次发布，导出该路径下最前30条历史
  git log --pretty=format:"- %s (%h)" "${TAG}" -- "skills/${SKILL}/" | head -n 30
fi
```
这样，生成的 GitHub Release Notes 中，只会精准包含该技能相关的代码变动。

#### 步骤四：自动回写 README 并安全提交
技能发布后，它的 zip 链接发生了改变。为了让用户在 README 上点开就能下载到最新版，流水线会拉起 `npm run readme:sync`。
它会精准找到 README 中的占位注释：
```markdown
<!-- DOWNLOAD:web-design-engineer:start -->[Download v1.2.0 .zip](https://...)<!-- DOWNLOAD:web-design-engineer:end -->
```
并将其中的下载链接替换为刚刚发布的新 Release 链接。
随后，流水线使用 GitHub Actions 官方 Bot 凭证，自动把这次 README 的变更 Commit 并 Push 回 `main` 分支。这一回写过程在后台静默且安全地完成。

---

## 🛠️ 维护者日常发布工作流（cut-release.mjs）

我们并不需要人工去计算增量、改 README、打 Tag。这一切都被封装进了交互式脚本：

```bash
# 在 main 分支且工作区干净时运行：
npm run release
```
它会在终端以交互的形式：
1. 询问你每一个有变更的技能该进行 SemVer 的哪一种 Bump (major / minor / patch / skip)。
2. 在本地自动修改对应技能的 `manifest.json` 并调用 `readme:sync` 更新本地 README。
3. 自动生成一条规范的提交信息 `release(<skill>): <version>`。
4. 在本地生成对应的版本 Tag（如 `kb-retriever-v1.1.2`）。
5. **原子化推送（Atomic Push）**：通过一行命令将修改和所有 Tag 推送至 GitHub：
   ```bash
   git push origin main --tags
   ```
   这保证了远程仓库版本状态的绝对同步。
