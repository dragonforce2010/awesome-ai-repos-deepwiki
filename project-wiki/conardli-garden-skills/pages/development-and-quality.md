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
