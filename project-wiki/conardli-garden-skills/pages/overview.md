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
