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
