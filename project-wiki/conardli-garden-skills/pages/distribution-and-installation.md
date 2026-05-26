# 🔌 分发与安装机制

一个好的技能系统不仅要在开发期具备高水准的指令控制，更要在**分发与部署阶段**提供轻量、安全、零阻碍的用户体验。在 **Garden Skills** 中，我们设计了一套解耦的分发方案：它既兼容了 Agent 社区主流的 `npx skills` 动态安装协议，又为高安全限制的企业沙箱提供了离线 Pinned Zip 与 Hash 签名校验，同时借助 `marketplace.json` 实现了多端插件市场的统一宣告。

本章将详细拆解这套分发与安装机制的底层实现原理。

---

## 🚀 1. 多样化的安装路径

为了满足不同使用环境下的安全性与便利性需求，我们为用户提供了三种主流安装方式：

### 方式一：使用 `skills` CLI 一键拉取（推荐）
对于能够访问互联网的 Agent 客户端，用户可以直接通过 `skills` CLI 命令行，指向我们 GitHub 发布的特定 Tag 路径进行热安装：
```bash
npx skills add ConardLi/garden-skills/tree/web-design-engineer-v1.0.0/skills/web-design-engineer
```
`skills` 命令行工具会自动解析该 URL，定位到远程的 `skills/web-design-engineer` 目录，将其拉取并软链接到本地 Agent 的全局配置目录（如 `~/.claude/skills/`）下，实现即装即用。

### 方式二：物理 Zip 包下载与防篡改校验（适合高安全沙箱）
在金融、医疗等禁止任意网络拉取的离线开发沙箱中，我们提供每个技能独立打包的 Zip 交付物。每一份发布的 Release 资产中，都包含一个 `.zip` 文件和对应的 `.sha256` 签名文件：
```bash
# 1. 离线下载物理包
curl -fsSL -o web-design-engineer.zip \
  https://github.com/ConardLi/garden-skills/releases/download/web-design-engineer-v1.0.0/web-design-engineer-1.0.0.zip

# 2. 校验 SHA-256 签名以确保传输安全与防篡改
echo "$(cat web-design-engineer.zip.sha256)" | shasum -a 256 -c

# 3. 解压至本地 Agent 配置目录
unzip web-design-engineer.zip -d ~/.claude/skills/
```

---

## 🗃️ 2. .zip 打包与 README 链接重写算法

我们之所以不需要手动去打包和更新下载地址，全靠 `scripts/release/` 下的两个核心自动化脚本：

### 1. 独立打包器：`pack-skill.mjs`
当发布管道拉起该脚本时，它会执行以下底层打包操作：
* **元数据验证**：解析技能文件夹下的 `manifest.json`，确保版本与待打包版本绝对一致。
* **文件物理过滤**：打包时使用 `archiver` 库将技能子目录打包为 zip，期间会**强制忽略** `.DS_Store`、本地测试的 `node_modules` 垃圾文件、以及未加入 manifest 的临时资产，保证发布包的极致轻量。
* **生成校验和**：打包完成后，通过 Node 内置的 `crypto` 模块计算 zip 文件的 SHA-256：
  ```javascript
  import { createHash } from 'crypto';
  import { readFileSync, writeFileSync } from 'fs';

  const fileBuffer = readFileSync('dist/release/my-skill-1.0.0.zip');
  const hashSum = createHash('sha256');
  hashSum.update(fileBuffer);
  const hex = hashSum.digest('hex');
  
  // 按照 `shasum` 兼容格式落地："<hash>  <filename>"
  writeFileSync('dist/release/my-skill-1.0.0.zip.sha256', `${hex}  my-skill-1.0.0.zip\n`);
  ```

### 2. 锚点重写器：`update-readme.mjs`
在每个多语言 README（`README.md`、`README.zh-CN.md`、`README.ja-JP.md`）中，我们为每一个技能的“下载”按钮都预留了统一的 HTML 注释标记：
```markdown
<!-- DOWNLOAD:gpt-image-2:start -->[Download v1.0.0 .zip](https://...)<!-- DOWNLOAD:gpt-image-2:end -->
```
`update-readme.mjs` 在运行时，会读取所有技能当前的 `manifest.json` 版本，并在内存中用正则表达式对 README 文件进行扫描替换：
```javascript
const regex = new RegExp(`<!--\\s*DOWNLOAD:${skillName}:start\\s*-->[\\s\\S]*?<!--\\s*DOWNLOAD:${skillName}:end\\s*-->`, 'g');
const replacement = `<!-- DOWNLOAD:${skillName}:start -->[Download v${version} .zip](https://github.com/ConardLi/garden-skills/releases/download/${skillName}-v${version}/${skillName}-${version}.zip)<!-- DOWNLOAD:${skillName}:end -->`;
newContent = newContent.replace(regex, replacement);
```
这确保了只要 `manifest.json` 的版本发生变动，文档上的所有下载按钮会在 CI 流程里被毫秒级自动重写，杜绝了由于手动更新文档带来的死链和オフバイワン（Off-by-one）版本指向错误。

---

## 🔌 3. Claude 插件市场元数据：`marketplace.json`

除了 CLI 安装，我们也集成了 Claude Code 的插件生态。在 `.claude-plugin/marketplace.json` 中，我们将 Monorepo 下的四个技能宣告为四个独立的插件包：

```json
{
  "name": "garden-skills",
  "owner": { "name": "ConardLi" },
  "metadata": {
    "description": "A curated collection of agent skills...",
    "version": "0.3.0"
  },
  "plugins": [
    {
      "name": "presentation-skills",
      "description": "Skills for click-driven web video presentations...",
      "source": "./",
      "skills": ["./skills/web-video-presentation"]
    },
    {
      "name": "web-design-skills",
      "description": "Skills for high-quality visual / front-end design work...",
      "source": "./",
      "skills": ["./skills/web-design-engineer"]
    }
    // 更多插件包定义
  ]
}
```
### 插件机制的优势
* **按需拉取**：通过将技能打包进不同的 `plugins` 数组，客户端可以只拉取特定的技能分类（例如用户只想做网页视频，就只需执行 `/plugin install ConardLi/garden-skills/presentation-skills`），无需拉取整个 monorepo，节省了沙箱磁盘空间，保持了 Agent 运行时的清爽与专注。
