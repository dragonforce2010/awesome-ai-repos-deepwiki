<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [.cursor/skills/dag-task-runner/SKILL.md](../../.cursor/skills/dag-task-runner/SKILL.md)
- [.cursor/skills/dag-task-runner/scripts/sync-copyable-skill.sh](../../.cursor/skills/dag-task-runner/scripts/sync-copyable-skill.sh)

</details>

# Cursor 技能封装

在 Cursor 中，“技能” (Skill) 指的是一种可以被 Agent 理解、调用并且在各个项目之间跨库共享的能力模块。在 Cookbook 中，它以极其规范的 `.cursor/skills` 目录结构形式给出了分发、同步和引用的最佳实践，特别是 `dag-task-runner` 技能的设计。

## 本地 Skill 的结构与规范

任何一份希望被 Cursor Agent 解析的复杂高级技能，都需要遵循特定的结构。
通过分析 `dag-task-runner` 技能的内部文件，可以总结出标准的 Skill 包形态：

```text
.cursor/skills/<skill-name>/
├── SKILL.md                 # 必须。向 Agent 宣讲的核心 Markdown 指令册。
├── examples/                # 用于向 Agent 演示的样例，如示例的 dag.json。
└── scripts/                 # (可选) 当技能需要调用复杂的脚本或二进制程序时。
    ├── package.json
    ├── run_dag.ts
    └── ...
```

### 深入解读 `SKILL.md`

`SKILL.md` 就是人类开发者写给 Agent 的**大一统 Prompt 声明**。在这个文件中，你可以看到几个核心段落的设计：

1. **基本描述与触发词（Trigger）**：
   在文件最前面通常有一段声明，告诉当前这个阅读到此文件的语言模型：*“你现在拥有了切分 DAG 任务流的能力。当用户让你执行一个庞大任务或者提到 DAG 时，你应该调用我。”*
2. **处理流程（Workflow）**：
   列出 Agent 需要严格遵守的标准操作流程（SOP）。例如，在 DAG 技能中，模型必须首先起草一个 `dag.json`，让用户确认。确认无误后，再执行某个特定的终端命令启动底层脚本。
3. **命令参考（Command Reference）**：
   明确告知 Agent 可以调用 `scripts/` 下的哪些工具，必须传什么参数（比如 `--dag`, `--canvas-path`）。
4. **回滚与排错指南**：
   预判 Agent 执行脚本时可能遇到的异常。比如提醒它 *“如果你发现没有安装依赖包，请先到 scripts 目录下执行 npm install”*。

这种结构是目前规范且不易产生幻觉的（Hallucination-free）最强上下文注入手段。

## 代码复用与打包发布：`sync-copyable-skill.sh`

Cookbook 在设计上考虑到了一个工程难题：**开发态代码与发布态技能同步问题**。

`dag-task-runner` 的真实开发代码实际上是在 `sdk/dag-task-runner/src` 里的。当开发者在这里修改了核心逻辑并希望将其打包分发为 Cursor Skill 给普通用户复制时，并不需要人肉粘贴。

`sync-copyable-skill.sh` 这个 Bash 脚本扮演了构建器的作用：
- 它首先擦除掉历史的 `.cursor/skills/dag-task-runner` 目录（但不删掉它原本的 SKILL.md）。
- 它将 `sdk/dag-task-runner` 内所有相关的源码、配置全部无情地 `cp` 拷贝到技能包下的 `scripts` 文件夹。
- 特意去除了庞大且没有必要分发的 `node_modules` 目录。
  
这样就保证了 SDK 源码库作为 “Single Source of Truth”，而技能目录则始终作为一个可移植的 “发行版 Artifact”。想要将这份能力带到别的仓库的用户，只需要一键复制整个 `.cursor/skills/dag-task-runner` 文件夹粘贴到自己的根目录下即可使用。

## 相关页面

- [DAG 任务流运行器](dag-task-runner.md)
