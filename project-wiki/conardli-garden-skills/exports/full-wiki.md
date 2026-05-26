# conardli-garden-skills DeepWiki 全站导出

> **这是 conardli-garden-skills 仓库的单文件技术 Wiki 导出，包含完整的架构解析与核心实现说明。**
>
> - 源仓库: `https://github.com/ConardLi/garden-skills`
> - 本轮 Commit: `ea0c0c8e88e0907906d013082b75d5d6d159c185`
> - 生成时间: 2026年5月26日

---

# 🌐 项目定位与核心痛点

在过去的工程实践中，我们常常陷入一种看似美好却处处碰壁的“Prompt 幻觉”中。我们试图通过给大语言模型（LLM）喂入成千上万字、包罗万象的 System Prompt，来指望它能够完美扮演一个资深前端开发、一个专业的视频编导，或者一个不知疲倦的文档检索助理。然而，在面对真实的生产级、长链路任务时，这种简单粗暴的 Prompt 堆砌往往会引发灾难性的系统崩溃。

**Garden Skills** 正是我们在这种痛点折磨下，摸索出的一套面向 Agent 的“解毒剂”。它不只是四套工具，更是一整套用来规范、指引、驯服 Agent 行为的**方法论框架**。

---

## 🚫 传统 Prompt 交互的四大致命硬伤

为了理解我们为什么需要设计 Garden 技能包，我们需要先剖析传统 Agent 开发中无法回避的几只“拦路虎”：

### 1. 指令漂移（Instruction Drift）与记忆遗忘
大语言模型的上下文窗口虽然在迅速扩张，但在长会话的多轮交互中，其对指令强度的注意力分配呈“U型曲线”衰减。当 Agent 开发到一个视频的第 5 章或者一个后台界面的深层组件时，它已经把最初 System Prompt 里约定的“禁止使用紫粉渐变”或“每个步骤必须是一步”等规矩忘得一干二净。模型开始按照它预训练的直觉（即大样本统计出的平庸结果）来写代码，最终导致项目前后期风格断裂，规范完全失控。

### 2. 平庸且泛滥的“AI 味”
这或许是人类设计师和高级工程师最不能容忍的现象。当把一个界面交由 Agent 自由发挥时，它会极其机械地应用以下训练集套路：
* 千篇一律的**紫粉色渐变**背景，配上粗暴的 `#3b82f6` 蓝色按钮。
* 满屏的 `🚀 ⚡ ✨` 等无意义装饰性 **Emoji**。
* 带有左侧单条彩色边框（Left Accent Border）的**圆角卡片**。
* 虚假的统计数据、拼贴的 Logo 墙与假冒的客户评价。

这种缺乏视觉呼吸感和品牌独特识别度的平庸设计，我们称之为“AI 垃圾（Slop）”。它不但不能提升产品溢价，反而稀释了品牌本该拥有的核心 recognition。

### 3. 工具调用的盲目性与 Token 爆炸（RAG 碎木机）
在传统的知识库检索场景下，当 Agent 发现有一个 20MB 的 PDF 报告或一个 10 万行的数据报表时，由于缺乏对具体文件读取的指导逻辑，它往往会做出极其愚蠢的行为──尝试直接调用 `Read` 工具整块吞入。这不仅瞬间撑爆了模型的上下文，更导致其推理能力在噪声数据中被完全淹没，产生高额 Token 费用的同时仅吐出毫无用处的垃圾回答。

### 4. 缺乏拦截导致的极高返工成本
传统的 Agent 在接收到任务（例如“帮我做个展示视频”）后，会闷头连续跑几分钟，把全部代码一次性写完，然后以一种完美的姿态向你展示最终产出。然而一旦你发现其主题配色选错、或者第二章的切分完全不合逻辑，此时除了推倒重来，没有任何中途纠偏的机制。

---

## 💡 Garden 技能生态的系统解法

针对这些痛点，我们设计了 Garden 系统的三根技术支柱，从机制上将 Agent 的操作精度提升至“工业级”：

```
+-----------------------------------------------------------------+
|                      GARDEN 技能系统三支柱                       |
+-----------------------------------------------------------------+
|                                                                 |
|   1. 模块自包含与按需加载 (On-Demand Loading)                      |
|      SKILL.md (前置触发) -> references/*.md (深度原理)             |
|                                                                 |
|   2. 极其严苛的物理隔离与契约 (Interface & Folder Contract)       |
|      隔离的 CSS 作用域 (e.g. .cd-) | narrations 作为唯一真相源     |
|                                                                 |
|   3. Checkpoint 阶段性人类拦截机制 (Human-in-the-loop Guard)       |
|      Outline 规划对齐 | 首章验收风格锚点 | 音频合成确认             |
|                                                                 |
+-----------------------------------------------------------------+
```

### 支柱一：高内聚的技能自包含与按需加载（On-Demand Loading）
我们放弃了将所有规则塞进单次 System Prompt 的做法，转而采用**按需检索（On-demand Loading）**架构。
* 每个 Skill 都是一个完全自包含的文件夹。
* **`SKILL.md`**：仅包含 YAML Frontmatter（定义名字与触发时机）和该技能的顶层工作流。它短小精炼，便于 Agent 在会话初期的浅层检索中快速捕获。
* **`references/` 目录**：存放极其详尽的 API 细节、设计 Recipe、文件解析方案等。Agent **只有在切实进入对应开发阶段时**，才会被 `SKILL.md` 强制要求去读取指定的 references 文件（例如：在开始写第一章代码前，必须读取 `references/CHAPTER-CRAFT.md`；在解析 PDF 前，必须读取 `references/pdf_reading.md`）。这最大程度地节省了会话前期的 Token，同时确保在微观实现时规则的新鲜度。

### 支柱二：双源原则（Double-Source Rule）与物理隔离
我们用规范和架构来隔离复杂性：
* **双源原则**：例如在视频演示开发中，Agent 必须以 `script.md`（口播稿）定动画的节奏与节拍，但以 `article.md`（原始长文）作为画面挂载的底层数据密度（信息池）。两相结合，防止 Agent 在脑补视觉时脱离事实。
* **状态与数据契约**：例如 `narrations.ts` 是动画分步和口播的唯一真相源。它不仅决定了前端 React 舞台的 `step` 长度，也决定了 TTS 音频脚本切分的物理文件结构，五位一体，永不漂移。
* **样式隔离**：为了保证并行开发的 subagent 在合并代码时不发生样式污染，各技能强制要求使用独立的 CSS 命名空间前缀（如 `.cd-` / `.mg-`），将冲突消除在编译期之前。

### 支柱三：Checkpoint 阶段性拦截（Checkpoint Mechanics）
既然 Agent 会漂移，我们就在它的工作流中焊上不可逾越的“硬性铁闸（Checkpoints）”：
1. **Checkpoint Plan（对齐规划）**：在内容编写完成后，Agent 必须停下来，强制与用户对齐 5 件事（口播稿、开发大纲、主题配色推荐、素材准备方案、开发并行模式），确认无误后方可拉起脚手架。
2. **First Chapter Anchor（首章风格锚点）**：在开发第二章及后面的内容前，Agent 必须在主线程里将第一章完成至“可发布精度”并开启 dev server，由人类亲自验收。这不仅是代码规范的第一次落地，更为整场项目的视觉和动画定下了实体基调。
3. **Checkpoint Audio（音频合成确认）**：在录屏发布前，拦截确认是否进行旁白音频的增量合成，提供成本与发布的最终控制权。

---

## 🧭 后续维基阅读路径建议

了解了 Garden 的设计初心后，我们建议你：
* 如果想研究这些机制在代码、CI 工作流和 GitHub Actions 中是如何落地的，请看 [系统架构与组织设计](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/system-architecture.md)。
* 如果想重点攻克某一个具体的能力域，可以直接深潜到对应核心技能：
  * [Web 视频制作技能 (web-video-presentation)](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/web-video-presentation.md)
  * [前端设计工程技能 (web-design-engineer)](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/web-design-engineer.md)
  * [GPT 图像生成与编辑技能 (gpt-image-2)](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/gpt-image-2.md)
  * [本地知识库检索技能 (kb-retriever)](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/kb-retriever.md)

---

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

---

# 🎬 Web 视频制作技能解析

在传统的视频制作工作流中，文案、动画、音轨和剪辑被割裂在不同的专业软件中。而在 **Garden Skills** 中，我们提出了一种颠覆性的理念：**使用网页代码来制作精美、高对比度、具有电影感的产品 Demo 与解说视频**。 

通过利用 React 的组件化能力、CSS 的动效控制力以及 Pluggable TTS 音频生成，我们能让 Agent 自动化地产出一整套 Vite+React+TS 的视频源网页。本章将深入技术底层，解密这一“以代码演化视觉”的系统设计。

---

## 📐 1. 16:9 固定舞台与无 Chrome 视口

普通网页的核心诉求是响应式适配，而“视频网页”的核心诉求是**确定性的像素渲染**。我们必须保证视频在 1080P 或 4K 下录制时，元素位置、字号比例、动效范围绝对不发生任何错位。

### 技术实现：Viewport Scale 缩放容器
我们不使用任何响应式媒体查询，而是在最外层通过监听 resize 事件，使用 CSS `transform: scale()` 对一个物理分辨率为 `1920×1080` 的固定画布进行等比例缩放适配。
```tsx
// 缩放核心 Hook 示意
import { useEffect, useState } from 'react';

export function useViewportScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 1920;
      const baseHeight = 1080;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // 保持 16:9 比例进行等比缩放
      const scaleX = windowWidth / baseWidth;
      const scaleY = windowHeight / baseHeight;
      setScale(Math.min(scaleX, scaleY));
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return scale;
}
```
通过该 Hook 返回的 `scale` 值，我们将核心舞台容器设为 `transform: scale(${scale})` 并绝对居中，舞台外部剩余区域用纯黑的 Letterbox 栏填充。在浏览器开启 F11 全屏录制时，可以完美确保 16:9 的视频画幅不带任何浏览器导航栏、滚动条等 Chrome 杂质。

---

## 🔄 2. 状态驱动模型：(Chapter, Step) 游标设计

我们摒弃了基于定时器（`setTimeout` / `setInterval`）控制动画进度的方法，因为定时器在浏览器后台切换、系统卡顿或高帧率录制时极易发生漂移，导致音画不同步。

我们采用**纯函数状态机**的设计：
* 整个视频被切分为 $N$ 个 **Chapter**（章节）。每个 Chapter 物理上对应一个独立的 React 组件。
* 每个 Chapter 内部包含若干步，由一个单调递增的整型游标 **`step`** 驱动。
* **画面是当前 Step 的纯函数**：
```tsx
// 章节视觉控制框架
export default function ChapterOne({ step }: { step: number }) {
  return (
    <div className="chapter-stage">
      {/* Step 0: 引入概念 */}
      <h1 className={`title ${step >= 0 ? 'visible' : ''}`}>未来已来</h1>
      
      {/* Step 1: 揭示第一条特征 */}
      <div className={`feature-card ${step >= 1 ? 'active' : ''}`}>
        智能进化
      </div>

      {/* Step 2: 揭示数据印证 */}
      {step === 2 && (
        <div className="data-panel animate-count">
          99.8% Accuracy
        </div>
      )}
    </div>
  );
}
```
通过控制 `step` 的递增（手动按空格/点击，或在自动播放模式下播放完上一段 TTS 音频后自动触发），整个动画序列得以精确控制。这保证了无论在什么硬件性能下录屏，画面动作与步进都是完全确定和可复现的。

---

## 🎙️ 3. narration-first：口播文本作为唯一真相源

要让网页视频“听起来”和“看起来”严密合拍，最容易发生的灾难就是口播音频的时长与网页动画时长脱节。为此，我们确立了一条红线铁律：**口播文本就是步骤长度的唯一 Truth Source**。

在每一个章节文件夹下，除了组件 `.tsx` 和样式 `.css` 之外，必须存在一个 `narrations.ts` 文件，声明每一页的口播台词：
```typescript
// src/chapters/01-overview/narrations.ts
export const narrations = [
  "这是我们的第一步，我们将为您展示整个系统的整体轮廓。", // step 0
  "看这里，这是我们智能演化的第一项关键特征：自主感知。",   // step 1
  "而这一项特征，经过我们在真实环境中的压测，其准确率已经突破了百分之九十九点八。" // step 2
];
```
### 🔗 物理长度契约限制
在编译校验时，我们会验证：**`.tsx` 组件中针对游标 `step` 所做分支判断的最大索引 $N$，其对应 $(N + 1)$ 必须绝对等于 `narrations.length`**。这就用物理文件绑定强行约束了 Agent：在页面里多加了一个画面动作，就必须在口播里多加一句话；多加了一句台词，就必须在页面组件里处理对应的 `step` 场景，彻底防止了两边数据“跑偏”或“漂移”。

---

## ⚙️ 4. 自动化音频合成 (Pluggable TTS)

当网页开发完毕后，系统通过零依赖的脚本提供增量 TTS 音频合成能力，使得网页具备“自动播放（Auto Mode）”成片的能力。

```
[npm run extract-narrations]
             |
             v
   扫所有 narrations.ts ──> audio-segments.json (口播文本字典)
                                     |
                                     v
                       [npm run synthesize-audio] (增量合成)
                                     |
              +----------------------+----------------------+
              | (Provider-Agnostic, 默认 minimax/openai)     |
              v                                             v
        minimax.sh (mmx-cli)                        openai.sh (OpenAI TTS)
              |                                             |
              +----------------------+----------------------+
                                     |
                                     v
                       public/audio/<chapter>/<step>.mp3 (音频文件落地)
```

1. **提取**：`npm run extract-narrations` 扫描所有章节组件下的 `narrations.ts`，按照 `[chapter-id]-[step-index]` 结构扁平化汇聚到 `audio-segments.json`。
2. **合成**：`npm run synthesize-audio` 读取段落字典，调取后台 TTS 生成物理音频文件，落盘到 `public/audio/<chapter>/<step>.mp3`。
3. **接口解耦 (Provider-Agnostic)**：音频生成被解耦为独立的 shell 契约（定义 `init`、`synthesize`、`check` 三大动作），内置了 `minimax`（使用 Feishu 办公套件下常用的 `mmx-cli`）和 `openai` 后端，开发者也可以通过模板轻松对接 ElevenLabs, edge-tts 或 Azure 等任意云端语音引擎。

---

## 📹 5. 一镜到底的自动录屏机制 (`?auto=1`)

当物理音频全部合成完毕后，系统会在本地运行的 Dev Server 上支持 `?auto=1` 自动化连播控制：

1. **自动挂载**：React 顶级控制器检测到 URL 中带有 `?auto=1` 标记，便会加载全局 Audio 播放器。
2. **连播状态机**：
   * 载入当前章节、当前 Step 对应的音频：`public/audio/chapter-id/step-index.mp3`。
   * 触发音频的 `play()`，此时画面同步渲染该 Step 的动画。
   * 监听音频的 `onEnded` 事件：一旦当前步的音频播放完毕，自动触发 `step` 递增。
   * 如果当前章节的 `step` 触顶，自动切入下一章并将 `step` 清零。
3. **完美成片**：你只需要开启 OBS Studio 或 macOS 自带的录屏功能，在浏览器中打开 `localhost:5173/?auto=1`，按一下空格键启动，整段视频将以绝对无缝的音画同步状态从头播放到尾。录制结束后剪掉头尾，即是一个完美的 16:9 产品演示视频，**后期不需要进行任何繁琐的音轨对齐剪辑**。

---

# 🎨 前端设计工程技能解析

当大部分 AI 助手写出的前端界面仅仅停留在“能跑但极丑”的 Bootstrap 或默认 Tailwind 样版房水平时，**web-design-engineer** 技能立下了极高的准则：**交付的产物必须是令人惊艳（Stunning）的视觉大作。每一个像素都有出处，每一处交互都经过深思熟虑。**

这一技能不只是一份指令，它融合了传统视觉传达设计（瑞士网格、极简主义、包豪斯）与现代前端动效的最佳工程实践。本章将详细拆解它是如何通过“六步法”、“风格配方”、“反 AI Cliché 黑名单”与“实时 Tweaks 控制面板”来规范 Agent 创作的。

---

## 🛠️ 1. 设计工程六步构建法

为了防止 Agent 一上来就写出几千行不可调试、偏离主题的乱堆砌代码，技能强制推行了漏斗状的“六步生命周期模型”：

```
[步骤 0: 事实核查] ── 基于 WebSearch 验证未知的产品、版本或 specs
       │
[步骤 1: 需求理解] ── 判断任务模糊度，智能决定是否需要提问
       │
[步骤 2: 收集上下文] ── 载入设计系统、品牌 Asset 规范或特定 Recipe
       │
[步骤 3: 声明系统] ── 撰写设计系统抉择 Markdown
       │
   [🛑 Checkpoint 1: 等待人类确认设计系统]
       │
[步骤 4: 可预览 v0] ── 产出纯骨架布局与占位符
       │
   [🛑 Checkpoint 2: 等待人类验收 v0 方向]
       │
[步骤 5: 完整构建] ── 组件还原、细化微动效、丰富状态
       │
   [🛑 Checkpoint 3: 遇到重大交互/布局决策暂停对齐]
       │
[步骤 6: 校验与评估] ── 运行 Pre-delivery 清单，进行 5 维度设计评估 (Critique)
```

### 🎯 步骤零与品牌资产协议（Asset Protocol）
* **事实核查**：在涉及 2024 年以后的产品、特定 SDK 时，Agent **必须首先进行 WebSearch**，禁止仅凭训练集猜测。
* **Asset 识别度**：对品牌定制任务，技能规定**真正的 Logo 图像与产品原图**是最高识别度的真相源。**绝对禁止**使用 CSS 绘制的图形或一个简单的有色边框文本来替代官方 Logo。如果无法通过 Press Kit 或 Launch Video 提取 Logo，Agent 必须停下来向用户索要。

### 🛑 拦截 Checkpoints 的设置
* **Checkpoint 1**：在 Steps 3 结束后，Agent 必须将挑选的色盘（oklch 派生）、字体（引入的 Google Fonts 族）、圆角策略、阴影和动效曲线以 Markdown 形式声明在终端。**必须等待用户明确确认**，才允许开机写代码。
* **Checkpoint 2**：在步骤 4 交付 v0 时，只做骨架和占位，排除动画和细节。这类似于设计的 Wireframe 走查，确保在大面积动工前交互和版式方向正确。

---

## 🏛️ 2. 设计风格 Recipes 与反 AI Cliché

为了消除大模型在无规约状态下必然生成的平庸“AI 垃圾（Slop）”，技能引入了硬性过滤机制：

### 🚫 反 AI 味黑名单机制
技能列出了一张详细的视觉元素黑名单（除非品牌 spec 显式要求，否则在通用场景下默认禁用）：
1. **禁用紫粉渐变**：严禁无脑使用 Purple-to-Pink 渐变作为背景或按钮色。
2. **禁用 Emoji 填充**：禁止使用 🚀、⚡、✨ 等表情来代替真实的 Icon 库或精致的 `[▢]` 字符占位。
3. **禁用左侧色块卡片**：卡片悬浮或高亮时，严禁使用左侧粗线条色块（Left border accent）的过时 Tailwind 模板套路。
4. **禁用 Inter/Roboto 默认字体**：标题和 Hero 级大字禁止使用无性格的系统默认字体，强制在 Step 3 根据气质引入具有艺术特性的 Google Display 字体（如 Outfit, Playfair Display 等）。

### 🎨 25 款风格配方数据库（Style Recipes）
在 `references/style-recipes/` 中，我们为 Agent 注入了业界顶级设计流派的视觉指引，包括：
* **Linear 风格 (linear.md)**：深色网格微光、1px 细线分割、极细的圆角、冷调单色卡片和亮色单点聚焦。
* **Aesop 风格 (aesop.md)**：大地色暖灰、宽广优雅的留白、大字距衬线体、低对比度柔和光影，充满人文气息。
* **MUJI 风格 (muji.md)**：极简白色原木、无字型渲染、无色彩修饰、依靠空间节奏呈现宁静质感。
* **Bloomberg 风格 (bloomberg-terminal.md)**：黑底高亮霓虹工程绿、高密度表格数据、单色线图，科技与专业的碰撞。

Agent 在 Step 2 被要求读取匹配的 Recipe，将其配色和动效参数完美套用进项目中，极大地提高了视觉下限。

---

## 🎛️ 3. 参数调节板 (Tweaks Panel)

在优秀的设计走查（Design Review）中，设计师经常需要动态演示不同的色彩搭配或不同的信息密度。为此，技能强制要求在交互原型中嵌入一个**浮动的 Tweaks 调节面板**：

```tsx
// 悬浮 Tweaks 控制面板的实现范式
import { useState } from 'react';

export function TweaksPanel({ 
  theme, setTheme, 
  density, setDensity, 
  animationSpeed, setAnimationSpeed 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`tweaks-panel ${isOpen ? 'open' : 'collapsed'}`}>
      <button className="tweaks-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕ Close' : '⚙ Tweaks'}
      </button>
      
      {isOpen && (
        <div className="tweaks-controls">
          <h3>Tweaks</h3>
          <label>
            Theme Color:
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="slate">Slate Dark</option>
              <option value="warm-sand">Warm Sand</option>
              <option value="forest">Forest Moss</option>
            </select>
          </label>
          <label>
            Density:
            <input type="range" min="0" max="2" value={density} onChange={(e) => setDensity(Number(e.target.value))} />
          </label>
          {/* 其他微调控件 */}
        </div>
      )}
    </div>
  );
}
```
### 设计规范约束
* **面板命名**：必须严格命名为 **"Tweaks"**，浮动于右下角。
* **完全隐藏**：关闭状态下，触发按钮必须具有极低的视觉侵入度（甚至 opacity 为 0，悬浮才显现），以便在最终演示时能看到完美的无 Chrome 界面。
* **多变体整合**：如果用户要求设计多个方案（如方案 A/B/C），**禁止产出多个物理文件**，必须使用单文件，并在 Tweaks 面板中提供 Variant 切换下拉框。

---

## 📊 4. 5 维度设计评估 (Critique Mechanism)

在交付前，Agent 被要求拉起一个“自我审判法庭”，对视觉产物进行 5 维度评分打分（0-10 分）：

| 维度 (Dimension) | 考核核心 |
| :--- | :--- |
| **设计哲学对齐 (Philosophy)** | 细节是否完全溯源到所选的 Recipe？有没有混入其他流派的设计杂质？ |
| **视觉层级 (Hierarchy)** | 标题与正文字号比是否满足 $\ge 2.5\times$？眯眼测试（Squint Test）下核心焦点是否清晰？ |
| **工艺精细度 (Craft)** | 是否遵循严格的 8px 栅格网格？全页使用的颜色是否 $\le 4$ 个？圆角策略是否自洽？ |
| **功能克制性 (Functionality)** | 每一个视觉元素是否都承载了信息？如果删掉它，设计是变好还是变坏？ |
| **原创独特性 (Originality)** | 是否避免了模板式的 AI Cliché？有没有让人眼前一亮但又极其合理的细节？ |

通过这种高强度的自我审查，Garden Skills 产出的前端项目表现出极高的一致性，真正具备了人类高级设计工程师的工匠风骨。

---

# 🖼️ GPT 图像生成与编辑技能解析

在 AI 图像生成领域，最常见的问题是：**Agent 无法感知自己的运行时环境**，容易在没有 API Key 时强行调用本地脚本，或者在拥有原生绘图工具时无视自身优势，亦或是输出的提示词过于随意导致出图质量无法用于生产。

**gpt-image-2** 技能通过设计一套独创的 **三模式自适应探测机制（Mode A/B/C）**，无缝适配了 Agent 从本地沙箱、IDE 插件到纯顾问对话的不同环境。同时，它整理并沉淀了 **70+ 个场景的结构化 Prompt 模板** 以及精密的 **图像二次编辑（Inpainting）工作流**。本章将为你解密这套工业级生图辅助系统的架构。

---

## 🧭 1. 环境感知：Mode A / B / C 自适应运行机制

Agent 在启动生图任务前，必须首先在终端执行探测脚本：
```bash
node skills/gpt-image-2/scripts/check-mode.js --json
```
根据返回的模式，Agent 自动分流其执行逻辑，确保工具调用的 100% 成功率：

```
                              [生图任务启动]
                                     |
                       跑 check-mode.js 探测环境
                                     |
            +------------------------+------------------------+
            |                        |                        |
     [满足 Mode A]            [满足 Mode B]            [满足 Mode C]
 ENABLE_GARDEN_IMAGEGEN=1   本地未启用 + 宿主自带工具   本地未启用 + 宿主无工具
   + OPENAI_API_KEY 存在
            |                        |                        |
            v                        v                        v
    调用本地 Node 脚本        使用宿主 native 工具      退化为 Prompt 顾问
  generate.js / edit.js     (如 dalle / imagegen)    保存并直接打印 markdown
 产出落盘至 garden-gpt...   由客户端直接渲染并反馈图片   提示用户如何在第三方工具执行
```

### 🔴 模式 A：Garden 本地生图（持有者模式）
* **运行逻辑**：Agent 是图像工具的“完全持有者”。它会在本地渲染最终的结构化 Prompt，将其保存为 `.md` 格式，随后通过 `child_process` 调起 `scripts/generate.js`（文本生图）或 `scripts/edit.js`（图像编辑）访问 OpenAI 或第三方兼容网关。
* **物理落地**：Prompt 自动存入 `garden-gpt-image-2/prompt/`，图片存入 `garden-gpt-image-2/image/`，文件名追加精准时间戳以防覆盖。

### 🟡 模式 B：Host-Native 委托宿主（协调者模式）
* **运行逻辑**：如果 Agent 没有本地 API Key，但发现当前客户端内置了图像生成工具（例如 Gemini App 的生图能力，或 Cursor 的生图 MCP 插件），Agent 会**自动拦截本地脚本调用**，转而利用宿主的图像生成工具，将渲染好的结构化 Prompt 作为入参传递。这避免了因缺少 Key 而报错退出，充分利用了宿主的原生生态。

### 🟢 模式 C：Advisor 纯提示词顾问（顾问模式）
* **运行逻辑**：在最受限的离线沙箱或无任何画图插件的 CLI 终端中，Agent 不会假装出图成功。它会将精心生成的结构化 Prompt 强制写入本地的 `garden-gpt-image-2/prompt/`，并在会话中以格式化 Markdown 打印给用户，诚恳说明：“已为您备好生产级 Prompt，请将其手动拷贝至 Midjourney / DALL·E 3 / ComfyUI 中运行。”

---

## 🗃️ 2. 70+ 结构化 Prompt 模板体系

为了确保在不同模式下出图的一致性与高精细度，技能在 `references/` 下分门别类地组织了 18 大类模板。这些模板采用 **结构化 JSON 提示词** 作为核心形式，将主次视觉元素、镜头、材质与文字层严格分区：

```json
{
  "CoreSubject": "A highly customized mechanical cyberpunk arm",
  "VisualEnvironment": "An elegant white studio background with diffused neon tube lighting",
  "CameraSettings": "Macro close-up lens, cinematic lighting, 8k resolution, photorealistic",
  "GraphicLayer": "Bilingual technical callouts: 'ARM-02' and 'AUTONOMOUS SENSING' in monospace typeface",
  "ColorPalette": "Mainly slate black with a single electric neon cyan indicator strip",
  "AntiPatterns": "purple gradients, cartoon illustrations, low-quality renders, disfigured anatomy"
}
```
* **为什么使用 JSON 提示词？**：因为现代先进的扩散模型（如 DALL·E 3, Midjourney v6, Imagen 等）在理解结构化数据（如键值对）方面的逻辑权重显著高于意识流式的长句。JSON 可以把“想要什么”与“绝对不要什么（AntiPatterns）”进行物理隔离，使 Agent 在拼装 Prompt 时不会互相污染。

### 🎓 学术论文配图规范（Academic Figures）
值得一提的是，针对学术论文或开题汇报，技能在 `references/academic-figures/` 下提供了极具极简主义风骨的模板（如 `method-pipeline-overview.md`），规范模型输出低饱和度（深蓝/灰蓝为主）、白底、精确几何、无定量虚构的 Publication-Ready 配图，大幅节省了科研人员修图的精力。

---

## 🖌️ 3. 图像二次编辑与局部遮罩工作流 (Inpainting)

对于工业设计或 UI 设计的演进，重绘整张图片往往会导致细节面目全非。技能提供了一套科学的**二次编辑（Edits）流**：

```
[原始图片: source.png] + [修改指示: "替换背景"]
                      │
                      v
             [scripts/edit.js]
                      │
                      ├─ (无 Mask) ──> 模型进行全局感知重绘背景
                      │
                      └─ (带 mask.png 黑白遮罩)
                                │
                                v
                   仅重绘遮罩白色区域 (Inpainting)
                   保持黑色非遮罩区像素 100% 不变
```

### 技术实现要点
* **脚本契约**：使用 `multipart/form-data` 格式，将原始 PNG 图片和黑白 Mask 遮罩作为文件流（File Streams）发送到 `/v1/images/edits` 接口。
* **精准定位**：在 Mode A 下，Agent 会提示用户先用工具或手动涂抹出一个黑底白前景的 Mask PNG（白区为要改动区域，如“将手中的水杯换成花瓶”），然后调用：
  ```bash
  node skills/gpt-image-2/scripts/edit.js \
    --image assets/source.png \
    --mask assets/mask.png \
    --prompt "A glass vase with water drops"
  ```
  模型只会重绘遮罩覆盖的白色像素，实现精确的图像局部精修与杂物擦除（Object Removal），将修改控制在最小视口内。

---

# 🔍 本地知识库检索技能解析

在 RAG（检索增强生成）系统中，我们经常看到这样的现象：Agent 在面对一个含有数十个 PDF 报告、大型 Excel 销售报表和无数 Markdown 研发文档的混合目录时，因为没有明确的检索路径指引，它会试图用 `Glob` 一股脑扫出所有文件，或者直接用 `Read` 强行加载超大文件。这种盲目检索不仅会瞬间撑爆模型的上下文窗口（Token 爆炸），更容易引入大量无关噪声，导致最终的回答严重“跑调”。

**kb-retriever** 技能是一套专为本地大文件目录设计的**深潜式检索助手**。它通过设计“分层目录索引树”、“先学习再处理（Learn-Before-Process）”规程以及“5轮迭代检索计数器”，在微观层面上严密锁定了 Agent 的检索动作。本章将详细揭示这套机制的设计。

---

## 🗺️ 1. 分层目录索引树导航：限制检索的盲目性

为了让 Agent 在海量文件中能像人一样顺着逻辑找资料，我们引入了分层目录索引契约。

```
[知识库根目录: knowledge/]
  │
  ├── data_structure.md ── (根索引：说明主要业务领域目录用途)
  │
  ├── design/ ── (架构与接口目录)
  │     ├── data_structure.md ── (子索引：说明本目录下 api_gateway.md 等文件用途)
  │     └── api_gateway.md
  │
  └── reports/ ── (数据与财务目录)
        ├── data_structure.md ── (子索引：说明 2023_sales.xlsx 等用途)
        └── 2023_sales.xlsx
```

### 导航执行规程
1. **定位根目录**：Agent 首先检查用户是否指定了路径，否则使用默认的 `knowledge/`。使用 shell 命令（如 `test -d knowledge`）严密验证其存在性，**严禁**使用模糊的 Glob 来判断目录存在性。
2. **渐进式递归钻取**：
   * Agent 首先读取根目录下的 `data_structure.md`，学习每个子目录的描述。
   * 基于用户的问题（例如“网关超时接口是多少”），Agent 识别出 `design/` 子目录最匹配，于是将当前工作目录切换为 `design/`。
   * 读取 `design/data_structure.md`，发现 `api_gateway.md` 是关于网关的详细接口设计，从而将其加入**候选检索文件列表**。
   * 这一过程就像顺着树干找树枝，Agent 在每一层只读取索引文件，不需要加载任何无关的业务文件，以最省 Token 的路径完成了定位。

---

## 🧠 2. 先学习再处理（Learn-Before-Process）硬规程

这是 kb-retriever 技能中**最核心的安全阀门**。当检索目标中出现 PDF 或 Excel 等非纯文本文件时，Agent 会被 Frontmatter 和流程指令强制拦截：

```
                    [候选列表包含 PDF 或 Excel]
                                │
                       🛑 强制拦截学习阶段
                                │
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
  [遇到 PDF 文件]                                [遇到 Excel 文件]
必须先读取:                                     必须先读取:
- references/pdf_reading.md                   - references/excel_reading.md
                                              - references/excel_analysis.md
         │                                             │
         v                                             v
  学习 pdfplumber / pdftotext                    学习 pandas 行数限制(nrows)
  表格提取、导出到文件技术                      过滤与聚合代码片段
         │                                             │
         └──────────────────────┬──────────────────────┘
                                │
                                v
                       执行文件处理与结构化
                                │
                                v
                         开始局部的 grep 检索
```

### 🚫 为什么要强制“先学习，再处理”？
因为大模型极易在多轮对话中遗忘特定命令的参数。如果直接命令它处理 PDF，它可能写出 `cat file.pdf` 或直接将几万行的 PDF text 灌入终端 stdout。
* 针对 **PDF**：通过调阅 `pdf_reading.md`，Agent 学会必须使用 `pdftotext input.pdf output.txt` 转换为物理文本文件，随后仅对 `output.txt` 进行局部的 `grep` 检索和定位，不直接输出到终端，从而控制会话 Token 长度。
* 针对 **Excel**：通过调阅 `excel_reading.md`，Agent 学会禁止整表读取，必须使用 pandas 自带的 `nrows=50` 进行表结构探索，识别出“销售额”等关键列名后，利用 pandas 行过滤指令（如 `df[df['销售额'] > 10000]`）进行增量分析，保护系统内存。

---

## 🎚️ 3. 5轮迭代检索机制：防止 Token 狂飙

当 Agent 遇到复杂的检索任务却找不到答案时，极易陷入“生成新关键词 $\rightarrow$ 检索失败 $\rightarrow$ 再生成 $\rightarrow$ 再检索”的**无限死循环**中，导致会话上下文急剧膨胀，费用狂飙。

kb-retriever 在核心逻辑中焊入了一个**多轮迭代计数器**，控制迭代次数最多为 **5 次**：

```typescript
// 迭代检索算法伪代码
let attemptCount = 0;
const maxAttempts = 5;
let hasAnswer = false;

while (attemptCount < maxAttempts && !hasAnswer) {
  attemptCount++;
  
  // 1. 基于当前上下文与已知线索，更新检索关键词
  const keywords = selectKeywords(userQuestion, currentContext);
  
  // 2. 执行精准检索（限定 include 与 path，严禁全局扫描）
  const matchLines = runGrep(keywords, targetFile);
  
  // 3. 读取匹配行上下文
  const snippet = readSnippet(targetFile, matchLines);
  currentContext.append(snippet);
  
  // 4. 自我评估是否已足够回答用户问题
  if (evaluateContext(currentContext, userQuestion)) {
    hasAnswer = true;
  }
}

if (!hasAnswer) {
  // 达到终止条件，老实向用户认输，不胡编乱造
  stopAndReportLackOfInfo(currentContext);
}
```

### 🛡️ 认输与溯源规范
* **老实认输**：如果 5 次检索后仍无结果，Agent 必须立刻终止检索。在回答中向用户清晰地列出它已经尝试检索了哪些路径、使用了哪些关键词，并邀请用户提供更精确的文件名或具体的字段名，**绝对禁止脑补或编造**数据。
* **清晰溯源**：在回答用户问题时，必须像写学术论文一样明确标出信息的出处，例如：`[依据: design/api_gateway.md 第 125 行]` 或 `[依据: reports/2023_sales.xlsx Summary 工作表]`，确保回答的每一句话都可以在本地文件系统中被严格复核。

---

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

---

# 🛠️ 开发与质量保障指南

在 **Garden Skills** 生态中，我们信奉“将流程写入契约”的理念。为了确保每一项并入主分支的技能都具备绝对的精确性与高可用性，我们建立了一套涵盖“本地零依赖校验”、“Frontmatter 边界规约”和“多层硬性自检协议”的质量保障（QA）体系。

本章将详细介绍如何在这个 Monorepo 中开发一个新技能，以及我们是如何在各个阶段卡点、拦截与提升交付质量的。

---

## 🚀 1. 新增 Skill 的标准生命周期

当你想为生态贡献一个新的 Agent 技能时，必须遵循以下标准规程（SOP）：

```
[第 1 步: 初始化物理结构]
  - 创建 skills/<new-name>/ 文件夹
  - 放置 SKILL.md (写入 YAML frontmatter 与顶层指南)
  - 放置 manifest.json (元数据声明，设置版本为 0.1.0 或 1.0.0)
       │
[第 2 步: README 挂载锚点]
  - 在 README.md & README.zh-CN.md & README.ja-JP.md 的技能列表行尾追加：
    <!-- DOWNLOAD:<new-name>:start --><!-- DOWNLOAD:<new-name>:end -->
       │
[第 3 步: 补全占位与本地自检]
  - 运行 npm run readme:sync (自动将当前 manifest 版本号回写至 README 锚点)
  - 运行 npm run validate (在本地启动与 CI 100% 映射的零依赖质量校验)
       │
[第 4 步: 发起 PR 与 CI 验证]
  - 提交代码并推送，发起 PR
  - 触发 GitHub Actions 拦截流 validate-skills.yml
       │
[第 5 步: 交互式发布]
  - Merge 后，在 main 分支运行 npm run release
  - 本地交互式选择 Bump 类型 -> 自动改 manifest -> 生成 Tag -> 原子推送
```

---

## 🔍 2. 零依赖本地校验（validate）设计

为了让开发者在本地以毫秒级的速度完成代码质量自检，同时保证在没有 Node 环境依赖（如 npm install）的极简 CI 容器中也能顺利运行，我们的校验工具链（`scripts/release/list-skills.mjs`）是**纯原生 Node ESM 代码实现的零依赖脚本**。

### 校验器核心检查项
当你在本地运行 `npm run validate` 时，脚本会对所有技能进行如下严苛的逻辑审计：
1. **结构完整性**：技能目录下必须物理存在 `SKILL.md` 和 `manifest.json`。
2. **YAML Frontmatter 纯净审计**：
   * 必须只包含 `name` 和 `description` 两个属性。
   * **原因**：防止开发者将 `version`、`author` 等杂质字段写入 `SKILL.md`。因为 YAML 头的 description 是 Agent 在会话最初决定是否载入该技能的唯一凭证，过多的元数据噪音会稀释 Agent 的注意力焦点。
3. **三名一致性校验**：强行核对“文件夹名称 === Frontmatter name === manifest.json name”。若有任何一处发生拼写大小写或连字符不一致，立即抛出 `exit 1` 阻断发布。

---

## 🛡️ 3. 技能层面的硬性自检协议（Self-Audit Protocols）

除了上述工具链对技能元数据的“静态校验”，我们更关注 Agent 在**执行技能任务时**产出物的“动态质量”。为此，我们为每个核心技能内部都设计了严格的**硬性自检协议**。

例如，在 `web-video-presentation` 技能中，我们设立了三级质量自检清单：

| 交付产物 | 对应自检清单 | 审计核心要点 |
| :--- | :--- | :--- |
| **口播稿 (script.md)** | `SCRIPT-STYLE.md` | 念出来是否通顺？是否剔除了书面语词汇？多平台变体是否匹配？ |
| **开发大纲 (outline.md)** | `OUTLINE-FORMAT.md` | 是否只规划了节奏与信息密度，而**没有**脑补具体动画和 CSS？ |
| **单章组件 (.tsx)** | `CHAPTER-CRAFT.md` | 每一页是否都含有视觉演示？是否做到了逐步揭示？是否排除了 AI Cliché？ |

### 🤖 强制执行的 Agent Review 工作流
为了防止 Agent 敷衍了事（目测一遍就说通过），技能要求 Agent 必须按照以下**降级执行链**进行自检：

```
       [产出物落地完成]
              │
              v
     优先采用: Agent Teams 机制
  (开一个独立的 Reviewer Agent 携带清单与源码，逐项审查并给出通过/失败的结论与证据)
              │
         ┌────┴────┐
         │         │ (若不支持 Teams)
         ▼         ▼
     次优采用: subAgent 机制     ──> (拉起 subagent 专门进行 review 审计)
         │         │ (若不支持 subAgent)
         ▼         ▼
     兜底采用: 自我严格比对
  (自己分段调阅清单，将产物代码逐行比对清单，禁止粗估)
              │
              v
    [审计发现任何 Fail 项] ──> 必须先在本地修改完毕 ──> 再次审计通过 ──> 呈报人类验收
```

通过这一层层将“Review”和“修改”完全内化在 Agent 内部的闭环控制机制，Garden Skills 将人类工程师在 Review 环节的介入时间缩短了 80% 以上，保证了每一次 Checkpoint 呈报上来的都是高度生产就绪的艺术杰作。

