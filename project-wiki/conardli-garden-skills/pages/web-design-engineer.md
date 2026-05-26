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
