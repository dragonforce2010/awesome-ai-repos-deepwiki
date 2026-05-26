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
