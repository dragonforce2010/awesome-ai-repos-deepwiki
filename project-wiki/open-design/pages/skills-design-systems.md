<details>
<summary>相关源文件</summary>

- [README.md](../../../project-repos/open-design/README.md) - skills、design systems、visual directions 和设计系统目录说明。
- [docs/skills-protocol.md](../../../project-repos/open-design/docs/skills-protocol.md) - `SKILL.md` 基础格式和 OD 扩展协议。
- [docs/modes.md](../../../project-repos/open-design/docs/modes.md) - prototype/deck/template/design-system 四类模式。
- [apps/daemon/src/skills.ts](../../../project-repos/open-design/apps/daemon/src/skills.ts) - skill 扫描、frontmatter 字段解析、mode/surface/scenario 推断。
- [apps/daemon/src/design-systems.ts](../../../project-repos/open-design/apps/daemon/src/design-systems.ts) - `DESIGN.md` 扫描与 swatch 提取。
- [apps/daemon/src/prompts/system.ts](../../../project-repos/open-design/apps/daemon/src/prompts/system.ts) - design system、craft、skill 和 metadata 的 prompt 注入顺序。

</details>

# Skills、Design Systems 与 Craft 注入

Open Design 的可扩展性主要来自文件协议，而不是数据库配置。`SKILL.md` 定义工作流，`DESIGN.md` 定义品牌/视觉规则，craft references 定义跨品牌的执行约束。Daemon 扫描这些文件后，把它们组合进 agent 的 system prompt。

## Skill 协议

`docs/skills-protocol.md` 把 skill 定义成兼容 Codex/Claude 风格的 Markdown 文件，并在 frontmatter 中添加 OD 扩展。[docs/skills-protocol.md:1-11](../../../project-repos/open-design/docs/skills-protocol.md) 基础格式包含名称、描述、触发器和正文；OD 扩展在 `od:` 下声明 mode、surface、craft、platform、scenario、preview、designSystemRequired、defaultFor 等字段。[docs/skills-protocol.md:15-105](../../../project-repos/open-design/docs/skills-protocol.md)

当没有 `od:` 字段时，文档定义了默认推断策略；发现优先级则覆盖内置、项目、本地等来源。[docs/skills-protocol.md:107-146](../../../project-repos/open-design/docs/skills-protocol.md) 模式文档把 prototype、deck、template、design-system 四种主模式分别展开，说明每种模式期待的 artifact 和 UI 行为。[docs/modes.md:1-220](../../../project-repos/open-design/docs/modes.md)

## 实际解析

`apps/daemon/src/skills.ts` 会重新扫描项目 skills，并解析 id、name、description、triggers、mode、surface、craft、platform、scenario、preview、designSystemRequired、defaultFor、upstream、featured、fidelity、speakerNotes、animations、examplePrompt、body、dir 等字段。[apps/daemon/src/skills.ts:1-67](../../../project-repos/open-design/apps/daemon/src/skills.ts) 文件中还有 side-file preamble、craft requires 归一化、mode/surface/platform/scenario 推断等逻辑。[apps/daemon/src/skills.ts:69-120](../../../project-repos/open-design/apps/daemon/src/skills.ts) [apps/daemon/src/skills.ts:178-249](../../../project-repos/open-design/apps/daemon/src/skills.ts)

因此维护 skill 时要同时看两层：协议文档告诉你字段语义，`skills.ts` 告诉你 UI 和 daemon 实际会读到什么。

## Design System 解析

`apps/daemon/src/design-systems.ts` 扫描 `design-systems/*/DESIGN.md`，返回 title、category、summary、swatches、surface、body 等字段。[apps/daemon/src/design-systems.ts:1-40](../../../project-repos/open-design/apps/daemon/src/design-systems.ts) 它还提供单个 design system 读取、summary/category/surface 推断和颜色 swatch 提取。[apps/daemon/src/design-systems.ts:43-167](../../../project-repos/open-design/apps/daemon/src/design-systems.ts)

README 把 design systems 作为目录资产列出，并记录 catalog/provenance；visual directions 则提供无品牌输入时的默认视觉分支。[README.md:442-487](../../../project-repos/open-design/README.md)

## Prompt 注入顺序

`composeSystemPrompt` 的注释直接说明了 prompt 栈：discovery/philosophy、官方设计 prompt、active design system、craft references、active skill、metadata、deck framework、media contract。[apps/daemon/src/prompts/system.ts:1-31](../../../project-repos/open-design/apps/daemon/src/prompts/system.ts) 实现中 design system 先于 craft，craft 先于 skill；deck framework 在 deck 项目且无 skill seed 时最后注入；media surface 则追加 media contract。[apps/daemon/src/prompts/system.ts:109-190](../../../project-repos/open-design/apps/daemon/src/prompts/system.ts)

这个顺序非常重要：

1. Discovery 规则先压住通用设计 prompt，确保先问表单。
2. Design system 作为品牌 token 的权威来源。
3. Craft 作为跨品牌的执行规则，但 token 冲突时让品牌胜出。
4. Skill 提供当前产物类型的具体工作流和 seed/checklist。
5. Deck/media 特殊契约最后覆盖更泛化的 HTML artifact 指令。

## 本次技能镜像

源仓库包含 55 个 tracked `SKILL.md`（54 个在 `skills/` 下，1 个在 `docs/examples/saas-landing-skill/` 下）。本 DeepWiki 在 `skills/**/SKILL.md` 下生成中文镜像，保留命令、路径、代码块、frontmatter 键和协议字段，便于中文读者浏览技能库。

## 相关页面

- [Prompt 栈、发现表单与 Artifact 交付](prompt-artifact-flow.md)
- [Web 工作台、预览与导出](web-workspace.md)
