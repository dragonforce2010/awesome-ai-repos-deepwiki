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
