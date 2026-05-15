# Codex 工具调用流程详解

## 目录

1. [概述](#概述)
2. [工具发现与注册](#工具发现与注册)
3. [工具选择](#工具选择)
4. [工具调用流程](#工具调用流程)
5. [审批机制](#审批机制)
6. [结果处理](#结果处理)
7. [与外部工具的交互](#与外部工具的交互)
8. [工具调用成功判定](#工具调用成功判定)

---

## 概述

Codex 的工具调用是一个复杂的多层次系统，涉及工具发现、选择、审批、执行和结果处理等多个环节。系统支持多种类型的工具：

- **内置工具**：如 `local_shell`（执行本地命令）、`apply_patch`（应用补丁）等
- **MCP 工具**：通过 Model Context Protocol 连接的外部服务器提供的工具
- **动态工具**：运行时动态加载的工具
- **插件工具**：由插件系统提供的工具

---

## 工具发现与注册

### 工具来源

Codex 通过多个来源发现工具：

```mermaid
graph TB
    A[工具发现] --> B[内置工具]
    A --> C[MCP 服务器工具]
    A --> D[动态工具]
    A --> E[插件工具]

    B --> B1[local_shell]
    B --> B2[apply_patch]
    B --> B3[view_image]
    B --> B4[tool_search]

    C --> C1[stdio MCP 服务器]
    C --> C2[HTTP 流式 MCP 服务器]
    C --> C3[Codex Apps 工具]

    D --> D1[deferred_loading=false]
    D --> D2[deferred_loading=true]

    E --> E1[插件配置中的 mcp_servers]
```

### ToolRegistry 核心结构

`ToolRegistry` 是工具调用的中心注册表，定义在 `core/src/tools/registry.rs`：

```rust
pub struct ToolRegistry {
    handlers: HashMap<ToolName, Arc<dyn AnyToolHandler>>,
}
```

`AnyToolHandler` trait 定义了工具处理器的接口：

```rust
trait AnyToolHandler: Send + Sync {
    fn matches_kind(&self, payload: &ToolPayload) -> bool;
    fn is_mutating(&self, invocation: &ToolInvocation) -> BoxFuture<'a, bool>;
    fn pre_tool_use_payload(&self, invocation: &ToolInvocation) -> Option<PreToolUsePayload>;
    fn post_tool_use_payload(&self, invocation: &ToolInvocation, result: &Self::Output) -> Option<PostToolUsePayload>;
    fn handle_any(&self, invocation: ToolInvocation) -> BoxFuture<'a, Result<AnyToolResult, FunctionCallError>>;
}
```

### 工具规格 (ToolSpec)

每个工具都有一个 `ToolSpec` 描述其输入输出、权限要求等：

```rust
pub enum ToolSpec {
    Function(FunctionToolSpec),
    Freeform(FreeformToolSpec),
    Namespace(NamespaceToolSpec),
    ToolSearch { },
    LocalShell {},
    ImageGeneration { model: String },
    WebSearch {},
}
```

### MCP 工具发现流程

MCP 工具通过以下方式发现：

```mermaid
sequenceDiagram
    participant Client as Codex
    participant Mgr as MCP Connection Manager
    participant Server as MCP Server

    Client->>Mgr: 启动时连接配置的 MCP 服务器
    Mgr->>Server: 初始化连接 (stdio/HTTP)
    Server-->>Mgr: tools/list 响应
    Mgr->>Mgr: 缓存工具信息
    Client->>Mgr: 请求可用工具列表
    Mgr-->>Client: 返回所有已注册的 MCP 工具
```

MCP 工具信息存储在 `McpToolApprovalMetadata` 中：

```rust
pub(crate) struct McpToolApprovalMetadata {
    annotations: Option<ToolAnnotations>,
    connector_id: Option<String>,
    connector_name: Option<String>,
    connector_description: Option<String>,
    tool_title: Option<String>,
    tool_description: Option<String>,
    mcp_app_resource_uri: Option<String>,
    codex_apps_meta: Option<serde_json::Map<String, serde_json::Value>>,
    openai_file_input_params: Option<Vec<String>>,
}
```

---

## 工具选择

### 模型发起工具调用

模型通过 `ResponseItem` 发起工具调用请求：

```rust
ResponseItem::FunctionCall {
    name: String,
    namespace: Option<String>,
    arguments: Option<serde_json::Value>,
    call_id: String,
}
```

### ToolRouter 构建工具调用

`ToolRouter` 负责将模型的调用请求转换为具体的 `ToolCall` 对象：

```mermaid
flowchart TD
    A[模型生成 ResponseItem] --> B{工具类型?}

    B -->|FunctionCall| C[检查是否为 MCP 工具]
    B -->|ToolSearchCall| D[构建 ToolSearch 调用]
    B -->|CustomToolCall| E[构建自定义工具调用]
    B -->|LocalShellCall| F[构建 LocalShell 调用]

    C -->|是 MCP| G[从 MCP 服务获取 ToolInfo]
    C -->|不是 MCP| H[使用 FunctionToolSpec]

    G --> I[构建 ToolCall::Mcp]
    H --> J[构建 ToolCall::Function]
    D --> K[构建 ToolCall::ToolSearch]
    E --> L[构建 ToolCall::Custom]
    F --> M[构建 ToolCall::LocalShell]

    I --> N[返回 ToolCall]
    J --> N
    K --> N
    L --> N
    M --> N
```

`ToolCall` 结构：

```rust
pub struct ToolCall {
    pub tool_name: ToolName,
    pub call_id: String,
    pub payload: ToolPayload,
}

pub enum ToolPayload {
    Function { arguments: Option<serde_json::Value> },
    Mcp { server: String, tool: String, raw_arguments: Option<serde_json::Value> },
    ToolSearch { arguments: SearchToolCallParams },
    Custom { input: Option<serde_json::Value> },
    LocalShell { params: ShellToolCallParams },
}
```

---

## 工具调用流程

### 完整的工具调用流程

```mermaid
sequenceDiagram
    participant Model as LLM 模型
    participant Router as ToolRouter
    participant Orch as ToolOrchestrator
    participant Registry as ToolRegistry
    participant Handler as ToolHandler
    participant Sandbox as SandboxManager
    participant External as 外部工具/MCP服务器

    Model->>Router: ResponseItem::FunctionCall
    Router->>Router: build_tool_call()
    Router->>Orch: dispatch_tool_call_with_code_mode_result()

    Note over Orch: 步骤 1: 审批
    Orch->>Orch: check_approval_requirement()
    alt 需要审批
        Orch->>Model: 发送审批请求
        Model-->>Orch: 审批决策 (Approve/Deny)
        alt 审批拒绝
            Orch-->>Model: 返回拒绝错误
        end
    end

    Note over Orch: 步骤 2: 沙箱选择
    Orch->>Sandbox: select_initial()
    Sandbox-->>Orch: SandboxType (ReadOnly/WorkspaceWrite/etc)

    Note over Orch: 步骤 3: 执行工具
    Orch->>Registry: dispatch_any(ToolInvocation)
    Registry->>Handler: handle(ToolInvocation)

    alt MCP 工具
        Handler->>External: 调用 MCP 工具
        External-->>Handler: CallToolResult
    else 本地工具
        Handler->>Sandbox: 在沙箱中执行
        Sandbox-->>Handler: 执行结果
    end

    Handler-->>Registry: AnyToolResult
    Registry-->>Orch: AnyToolResult

    Note over Orch: 步骤 4: 结果处理
    alt 执行失败且可重试
        Orch->>Model: 发送重试审批请求
        Model-->>Orch: 审批决策
        alt 批准重试
            Orch->>Sandbox: 在无沙箱模式下重试
            Sandbox-->>Orch: 重试结果
        else 拒绝重试
            Orch-->>Model: 返回拒绝错误
        end
    end

    Orch-->>Router: OrchestratorRunResult
    Router-->>Model: ResponseInputItem (工具结果)
```

### ToolOrchestrator 执行逻辑

`ToolOrchestrator` 位于 `core/src/tools/orchestrator.rs`，是工具执行的核心编排器。它处理以下关键环节：

```rust
pub async fn run<Rq, Out, T>(
    &mut self,
    tool: &mut T,
    req: &Rq,
    tool_ctx: &ToolCtx,
    turn_ctx: &TurnContext,
    approval_policy: AskForApproval,
) -> Result<OrchestratorRunResult<Out>, ToolError>
where
    T: ToolRuntime<Rq, Out>,
```

---

## 审批机制

### 审批层级

```mermaid
flowchart TD
    A[工具调用请求] --> B{检查审批要求}
    B -->|Skip| C[无需审批]
    B -->|Forbidden| D[直接拒绝]
    B -->|NeedsApproval| E[需要审批]

    C --> F[记录审批决策]
    F --> G[执行工具]

    D --> H[返回拒绝错误]

    E --> I{审批路由}
    I -->|Guardian 审查| J[发送给 Guardian AI 审查]
    I -->|用户审批| K[发送 RequestUserInput]
    I -->|Hook 审批| L[检查 PermissionRequest Hooks]

    J --> M{Guardian 决策}
    M -->|Approved| F
    M -->|Denied| H

    K --> N{用户决策}
    N -->|Allow| F
    N -->|Deny| H
    N -->|Cancel| H

    L --> O{Hook 决策}
    O -->|Allow| F
    O -->|Deny| H
    O -->|None| I
```

### 审批模式 (AskForApproval)

```rust
pub enum AskForApproval {
    UnlessTrusted,   // 仅不受信任的工具需要审批
    OnFailure,       // 仅失败时需要审批
    OnRequest,       // 每次请求都需要审批
    Never,           // 永不需要审批
    Granular(GranularApprovalConfig), // 细粒度配置
}
```

### ExecApprovalRequirement

工具的审批要求：

```rust
pub enum ExecApprovalRequirement {
    Skip { },
    Forbidden { reason: String },
    NeedsApproval { reason: String, destructive: bool },
}
```

### 审批流程详细代码

审批决策通过以下路径：

```mermaid
stateDiagram-v2
    [*] --> StartApproval

    StartApproval --> CheckHooks: 检查 PermissionRequest Hooks
    CheckHooks --> HookDecision: Hook 返回决策?

    HookDecision --> HookAllow: Allow
    HookDecision --> HookDeny: Deny
    HookDecision --> CheckGuardian: None

    HookAllow --> Approved: 记录决策并继续

    HookDeny --> Rejected: 返回拒绝

    CheckGuardian --> {需要 Guardian?}
    {需要 Guardian?} --> 是: SendToGuardian
    {需要 Guardian?} --> 否: RequestUser

    SendToGuardian --> GuardianReview: Guardian AI 审查
    GuardianReview --> GuardianDecision

    GuardianDecision --> GuardianApproved: Approved
    GuardianDecision --> GuardianDenied: Rejected
    GuardianDecision --> GuardianTimeout: TimedOut

    RequestUser --> UserPrompt: 发送 RequestUserInput
    UserPrompt --> UserResponse: 等待用户响应

    UserResponse --> UserAllow: Approved
    UserResponse --> UserDeny: Rejected
    UserResponse --> UserCancel: Cancel

    Approved --> [*]
    Rejected --> [*]
    TimedOut --> [*]
    Cancel --> [*]
```

---

## 结果处理

### 工具执行结果类型

```rust
pub(crate) struct AnyToolResult {
    pub(crate) call_id: String,
    pub(crate) payload: ToolPayload,
    pub(crate) result: Box<dyn ToolOutput>,
    pub(crate) post_tool_use_payload: Option<PostToolUsePayload>,
}
```

`ToolOutput` trait 定义了结果如何转换为模型可读的形式：

```rust
pub trait ToolOutput: Send {
    fn to_response_item(&self, call_id: &str, payload: &ToolPayload) -> ResponseInputItem;
    fn code_mode_result(&self, payload: &ToolPayload) -> serde_json::Value;
}
```

### 工具结果的事件通知

工具执行结果通过一系列事件通知给客户端：

```mermaid
flowchart TD
    A[工具开始执行] --> B[McpToolCallBegin 事件]
    B --> C[工具执行中]

    C --> D[ExecCommandBegin 事件]
    D --> E[ExecCommandOutputDelta 事件]
    E --> F[ExecCommandEnd 事件]

    C --> G[PatchApplyBegin 事件]
    G --> H[PatchApplyUpdated 事件]
    H --> I[PatchApplyEnd 事件]

    F --> J{执行结果}
    I --> J

    J -->|成功| K[McpToolCallEnd 状态=Completed]
    J -->|失败| L[McpToolCallEnd 状态=Failed]

    K --> M[响应模型]
    L --> M
```

---

## 与外部工具的交互

### MCP 工具调用详细流程

MCP (Model Context Protocol) 是 Codex 与外部工具交互的主要协议：

```mermaid
sequenceDiagram
    participant LLM as LLM 模型
    participant Codex as Codex Core
    participant ConnMgr as MCP Connection Manager
    participant MCPServer as MCP 服务器

    LLM->>Codex: ResponseItem::FunctionCall<br/>(name: "mcp_server:tool_name")
    Codex->>ConnMgr: resolve_mcp_tool_info()
    ConnMgr-->>Codex: ToolInfo (server_name, tool spec)

    Codex->>Codex: 检查审批要求
    alt 需要审批
        Codex->>LLM: 发送审批请求
        LLM-->>Codex: 审批决策
        alt 拒绝
            Codex-->>LLM: 返回拒绝
        end
    end

    Codex->>ConnMgr: call_tool(server, tool, args)
    ConnMgr->>MCPServer: JSON-RPC: tools/call
    MCPServer->>MCPServer: 执行工具逻辑
    MCPServer-->>ConnMgr: CallToolResult

    alt 工具返回错误
        ConnMgr-->>Codex: Err(error_message)
        Codex-->>LLM: ResponseInputItem::FunctionCallError
    else 工具成功
        ConnMgr-->>Codex: Ok(CallToolResult)
        Codex->>Codex: 处理结果
        Codex->>Codex: 检查需要认证唤起?
        alt 需要认证
            Codex->>ConnMgr: request_mcp_server_elicitation()
            ConnMgr->>MCPServer: 服务器认证流程
            MCPServer-->>ConnMgr: 认证响应
            ConnMgr-->>Codex: ElicitationResponse
        end
        Codex-->>LLM: ResponseInputItem::FunctionCallOutput
    end
```

### MCP 连接管理

`McpConnectionManager` 管理所有 MCP 服务器的连接：

```mermaid
classDiagram
    class McpConnectionManager {
        +HashMap connections
        +connect(server, config)
        +disconnect(server)
        +call_tool(server, tool, args)
        +list_all_tools()
        +server_origin(server)
    }

    class McpConnection {
        +String server_name
        +McpTransport transport
        +HashMap tools
        +handle_message(message)
    }

    class McpTransport {
        <<interface>>
        +send_request(method, params)
        +subscribe_notifications()
    }

    class StdioMcpTransport {
        +Child process
        +stdin: ChildStdin
        +stdout: ChildStdout
    }

    class StreamableHttpMcpTransport {
        +WebSocket ws
        +HttpStream stream
    }

    McpConnectionManager "1" --> "*" McpConnection
    McpConnection "1" --> "1" McpTransport
    McpTransport <|-- StdioMcpTransport
    McpTransport <|-- StreamableHttpMcpTransport
```

### MCP 工具调用请求结构

MCP 工具调用请求包含以下元数据：

```rust
pub struct McpInvocation {
    pub server: String,
    pub tool: String,
    pub arguments: Option<serde_json::Value>,
}
```

请求元数据 (`_meta`) 包含：

```rust
// Thread ID 用于关联
MCP_TOOL_THREAD_ID_KEY = "threadId"

// Codex Apps 专用元数据
MCP_TOOL_CODEX_APPS_META_KEY = "codex/telemetry"
    - connector_id
    - connector_name
    - call_id

// 沙箱状态（如果服务器支持）
MCP_SANDBOX_STATE_META_CAPABILITY = "codex/sandbox_state"
    - permission_profile
    - sandbox_policy
    - sandbox_cwd
```

---

## 工具调用成功判定

### 成功判定逻辑

工具调用的成功判定通过 `CallToolResult.is_error` 字段：

```rust
pub struct CallToolResult {
    pub content: Vec<Content>,
    pub is_error: Option<bool>,
    pub structured_content: Option<serde_json::Value>,
    pub meta: Option<serde_json::Value>,
}
```

判定规则：

```mermaid
flowchart TD
    A[工具调用完成] --> B{检查 is_error}
    B -->|None| C[视为成功]
    B -->|Some true| D[视为失败]
    B -->|Some false| C

    C --> E{内容为空?}
    E -->|是| F[返回空文本结果]
    E -->|否| G[返回实际内容]

    D --> H{错误内容}
    H --> I[包装为 FunctionCallError]
```

### 错误处理

错误通过 `FunctionCallError` 传递：

```rust
pub enum FunctionCallError {
    RespondToModel(String),
    ToolError(String),
    ToolRejected(String),
    ToolCancelled,
    ToolTimedOut,
}
```

这些错误类型决定模型如何响应：

- `RespondToModel`: 将错误信息发送给模型，允许模型重试
- `ToolRejected`: 工具被拒绝，可能需要用户干预
- `ToolCancelled`: 工具被用户取消
- `ToolTimedOut`: 工具执行超时

### 沙箱拒绝与重试

当工具在沙箱中被拒绝时，`ToolOrchestrator` 会尝试重试：

```mermaid
flowchart TD
    A[首次执行] --> B{执行结果}
    B -->|成功| C[返回结果]
    B -->|非沙箱错误| D[返回错误]
    B -->|沙箱拒绝| E{工具支持升级?}

    E -->|不支持| F[返回拒绝错误]
    E -->|支持| G{需要重试审批?}

    G -->|是| H[发送重试审批请求]
    H --> I{审批决策}
    I -->|批准| J[在无沙箱模式重试]
    I -->|拒绝| F

    G -->|否| J

    J --> K{重试结果}
    K -->|成功| C
    K -->|失败| F
```

---

## 完整的工具调用生命周期

```mermaid
stateDiagram-v2
    [*] --> Discovery: 启动时
    Discovery --> Ready: 工具注册完成

    Ready --> ToolRequested: 模型请求工具调用
    ToolRequested --> Building: 构建 ToolCall

    Building --> Approval: 完成
    Approval --> Executing: 审批通过

    Approval --> Rejected: 审批拒绝
    Rejected --> [*]

    Executing --> SandboxedExecution: 选择初始沙箱
    SandboxedExecution --> ExternalCall: MCP/外部工具
    SandboxedExecution --> LocalExecution: 本地工具

    ExternalCall --> ProcessingResult: 收到响应
    LocalExecution --> ProcessingResult

    ProcessingResult --> CheckSuccess: 检查执行结果

    CheckSuccess --> Success: 成功
    CheckSuccess --> SandboxDenied: 沙箱拒绝
    CheckSuccess --> OtherError: 其他错误

    Success --> SendingResponse: 转换为 ResponseInputItem
    SandboxDenied --> CheckRetry: 检查重试条件
    OtherError --> ErrorResult: 返回错误

    CheckRetry --> RetryApproval: 需要重试审批?
    CheckRetry --> CannotRetry: 不能重试

    RetryApproval --> BypassSandbox: 批准
    RetryApproval --> RetryDenied: 拒绝

    BypassSandbox --> UnsandboxedExecution: 无沙箱执行
    UnsandboxedExecution --> ProcessingResult

    RetryDenied --> ErrorResult
    CannotRetry --> ErrorResult

    SendingResponse --> Ready: 返回模型
    ErrorResult --> [*]
```

---

## 关键代码文件参考

| 文件路径 | 功能描述 |
|---------|---------|
| `core/src/tools/router.rs` | 工具路由器，负责将模型调用转换为具体工具调用 |
| `core/src/tools/orchestrator.rs` | 工具编排器，处理审批、沙箱选择、重试逻辑 |
| `core/src/tools/registry.rs` | 工具注册表，管理所有可用工具处理器 |
| `core/src/mcp_tool_call.rs` | MCP 工具调用的核心逻辑 |
| `core/src/tools/handlers/` | 各种工具的具体实现处理器 |
| `codex-mcp/src/codex_tools.rs` | MCP 工具信息结构定义 |
| `mcp-server/src/message_processor.rs` | MCP 服务器端的消息处理 |
| `mcp-server/src/codex_tool_runner.rs` | Codex MCP 工具的执行器 |
