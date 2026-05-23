# oMLX DeepWiki

> **oMLX 是为 Apple Silicon 量身打造的本地 LLM 推理服务器，把 vLLM 的连续批处理 + 分页 KV 缓存搬到了 MLX，并在此之上做了一件 vLLM 在云端做不到的事——把热的 KV 块留在 RAM、冷的卸到 SSD、跨会话甚至跨重启复用前缀缓存。它解决的核心痛点是：让本地 LLM 服务能像生产推理系统那样被日常运营。**

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | 诞生背景、与 Ollama/LM Studio/vllm-mlx 的差异化定位、核心能力全景 |
| 架构核心 | [系统架构](pages/system-architecture.md) | 三层引擎栈、单 MLX 线程序列化约束、外部 prefill 范式 |
| 架构核心 | [分层 KV 缓存](pages/tiered-kv-cache.md) | paged-SSD-only 架构、链式 SHA-256 哈希、跨重启复用机制 |
| 调度与推理 | [调度器与连续批处理](pages/scheduler-and-batching.md) | Scheduler 主循环、admission 控制、内存双水位、async store-cache |
| 调度与推理 | [引擎系统与多模型](pages/engine-system.md) | 7 种引擎子类、EnginePool LRU 驱逐、加载降级链 |
| 调度与推理 | [推测解码三条路径](pages/speculative-decoding.md) | SpecPrefill / VLM-MTP / DFlash 各自的注入点和取舍 |
| 接口与集成 | [API 兼容层](pages/api-compatibility.md) | OpenAI / Anthropic / Responses 三协议如何统一到一条推理路径 |
| 接口与集成 | [外部工具集成与 MCP](pages/integrations-and-mcp.md) | `omlx launch` 命令机制、Claude Code 上下文缩放、MCP 客户端架构 |
| 模型与管理 | [模型管理与 Admin Dashboard](pages/model-management.md) | 类型自动检测 9 层决策树、配置四层优先级、离线友好的前端 |
| 模型与管理 | [oQ 数据驱动混合精度量化](pages/oq-quantization.md) | 敏感度测量、proxy fallback、GPTQ 优化、admin 任务编排 |
| 部署与质量 | [macOS App 打包与部署](pages/packaging-and-deployment.md) | venvstacks 三层结构、PyObjC 菜单栏 app、Tahoe 可见性诊断 |
| 部署与质量 | [评估、上游 Patch 与质量保障](pages/testing-and-patches.md) | 16 个 benchmark、依赖钉版策略、patch 体系与上游协作 |

## 仓库全景

```text
omlx/
├── omlx/                            # 主包（324 个 Python 文件）
│   ├── cli.py                       # 入口：serve / launch / diagnose
│   ├── server.py                    # FastAPI 主服务（184KB）
│   ├── scheduler.py                 # 调度器中心（267KB!）
│   ├── engine_core.py               # EngineCore / AsyncEngineCore
│   ├── engine_pool.py               # 多模型 LRU 池
│   ├── settings.py                  # 全局配置 (46KB)
│   ├── model_discovery.py           # 9 层类型决策树
│   ├── model_settings.py            # 每模型配置
│   ├── oq.py                        # oQ 数据驱动量化（126KB）
│   ├── process_memory_enforcer.py   # 双水位内存防护
│   ├── memory_monitor.py            # 内存监控
│   ├── turboquant_kv.py             # KV cache 4-bit 量化
│   ├── cache/                       # 分层 KV 缓存子系统（14 模块）
│   ├── engine/                      # 7 种引擎子类
│   ├── api/                         # OpenAI / Anthropic / Responses schemas
│   ├── admin/                       # Web 管理面板（FastAPI sub-app）
│   ├── mcp/                         # MCP 客户端
│   ├── integrations/                # 9 个外部工具集成
│   ├── patches/                     # 上游 patch 集合
│   ├── speculative/                 # VLM-MTP
│   ├── eval/                        # 16 个 benchmark
│   ├── models/                      # 模型适配
│   └── utils/                       # 通用工具
├── packaging/                       # macOS App 打包
│   ├── build.py                     # venvstacks 编排 (46KB)
│   ├── venvstacks.toml              # 三层环境定义
│   └── omlx_app/                    # PyObjC 菜单栏 app
├── Formula/omlx.rb                  # Homebrew Formula
├── docs/                            # CONTRIBUTING + oQ 文档
├── tests/                           # ~140 个测试文件
├── scripts/normalize_i18n.py
└── pyproject.toml                   # 依赖钉版到 commit
```

## 核心入口

| 文件 | 为什么重要 |
|---|---|
| [omlx/cli.py](../../project-repos/omlx/omlx/cli.py) | 三个子命令的入口：`serve` 启动服务、`launch` 配置外部工具、`diagnose` 排查菜单栏问题 |
| [omlx/server.py](../../project-repos/omlx/omlx/server.py) | FastAPI app 主体；OpenAI/Anthropic/Responses 三套 endpoint + admin/MCP/audio router |
| [omlx/scheduler.py](../../project-repos/omlx/omlx/scheduler.py) | 6191 行的调度核心，包含 admission / 外部 prefill / 三种推测路径 / async store-cache |
| [omlx/engine_pool.py](../../project-repos/omlx/omlx/engine_pool.py) | 多模型门面，LRU 驱逐 + TTL + pinning + 加载降级链 |
| [omlx/cache/paged_ssd_cache.py](../../project-repos/omlx/omlx/cache/paged_ssd_cache.py) | KV 缓存持久化的核心；safetensors 异步写入、版本号防御、热缓存协同 |
| [omlx/cache/prefix_cache.py](../../project-repos/omlx/omlx/cache/prefix_cache.py) | BlockAwarePrefixCache，串联 PagedCacheManager 与 SSD |
| [omlx/oq.py](../../project-repos/omlx/omlx/oq.py) | oQ 数据驱动量化的全部实现 |
| [omlx/patches/__init__.py](../../project-repos/omlx/omlx/patches/__init__.py) | 上游 patch 体系入口，每个 patch 都对应一个具体的上游 issue/PR |
| [pyproject.toml](../../project-repos/omlx/pyproject.toml) | 钉版依赖列表，每个 pin 都有注释说明原因 |
| [packaging/build.py](../../project-repos/omlx/packaging/build.py) | venvstacks 编排 + 三个特殊安装路径（mlx-audio/paroquant/spacy） |

## 你想了解什么？

- **这个项目到底做什么、跟同类怎么比？** → [项目概览](pages/overview.md)
- **怎么把它接到 Claude Code / Codex 上？** → [外部工具集成与 MCP](pages/integrations-and-mcp.md)
- **为什么 KV 缓存能跨重启复用？** → [分层 KV 缓存](pages/tiered-kv-cache.md)
- **想看顶层架构图** → [系统架构](pages/system-architecture.md)
- **scheduler.py 为什么 6191 行?** → [调度器与连续批处理](pages/scheduler-and-batching.md)
- **想给本地模型做量化** → [oQ 数据驱动混合精度量化](pages/oq-quantization.md)
- **想自己打包 .app** → [macOS App 打包与部署](pages/packaging-and-deployment.md)
- **多模型怎么共存、内存怎么管** → [引擎系统与多模型](pages/engine-system.md)
- **VLM/OCR 如何跑 + 工具调用怎么解析** → [API 兼容层](pages/api-compatibility.md)
- **想理解 patches/ 里那一堆补丁** → [评估、上游 Patch 与质量保障](pages/testing-and-patches.md)
- **推测解码三条路径有啥区别** → [推测解码三条路径](pages/speculative-decoding.md)
- **想理解 admin 怎么做的、模型类型怎么自动识别** → [模型管理与 Admin Dashboard](pages/model-management.md)

## 可继续追问的主题

- `cache reuse across restart`：阅读 [分层 KV 缓存](pages/tiered-kv-cache.md) + `omlx/cache/paged_ssd_cache.py` + `omlx/cache/paged_cache.py`，深入理解链式哈希如何实现跨进程缓存匹配。
- `single MLX thread design`：阅读 [系统架构](pages/system-architecture.md) + `omlx/engine_core.py:35-64`，理解为什么 Metal 必须单线程及对吞吐的影响。
- `三种推测路径的性能对比`：阅读 [推测解码三条路径](pages/speculative-decoding.md)，可做 DeepResearch 对比 SpecPrefill 与 MTP 在你的具体模型上的加速比。
- `oQ vs AWQ vs GPTQ-for-LLaMa`：阅读 [oQ 数据驱动混合精度量化](pages/oq-quantization.md) + `docs/oQ_Quantization.md`，理解 oQ 的差异化定位与算法细节。
- `Claude Code 上下文缩放的真实效果`：阅读 [API 兼容层](pages/api-compatibility.md) 的 "Claude Code 上下文缩放" 一节 + `omlx/server.py:1050-1079`。

## 源码信息

- **仓库**：[https://github.com/jundot/omlx](https://github.com/jundot/omlx)
- **commit**：`2f2f5087a9c9a6ef71fa165da4a299bd19d4d5b4`（main 分支）
- **作者**：[junkim.dot@gmail.com](mailto:junkim.dot@gmail.com)（[omlx.ai/me](https://omlx.ai/me)）
- **License**：Apache 2.0
- **环境要求**：macOS 15.0+（Sequoia）、Python 3.10+、Apple Silicon M1/M2/M3/M4
