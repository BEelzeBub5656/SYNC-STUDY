# SYNC-STUDY Agent Service

这是移动端 AI 学习搭子的正式 Python 服务。目录中的 `main.py`、
`hitl_agent.py`、`state_graph_*.py` 等文件仍是 LangChain / LangGraph 学习
脚本；正式服务只从 `sync_study_agent` 包启动，两者互不依赖。

## 数据边界

```text
对话状态       LangGraph + SQLiteSaver，按 userId + threadId 隔离
长期记忆       Java/MySQL，只保存用户明确表达的姓名、兴趣和稳定学习偏好
业务数据库     Java/MySQL，保存考试、今日任务、计划和打卡等正式数据
课程知识库     Java/MySQL（后续可接向量检索），保存讲义、笔记和教材
待确认动作     Agent SQLite，按 userId + threadId 隔离并跨重启保留
```

Agent 不直接连接 MySQL。考试、任务、长期记忆和知识资料全部通过 Spring
Boot 的 `/api/internal/agent/users/{userId}/...` 内部接口访问。

## 已实现能力

- 普通学习问答及按 `threadId` 保留的多轮上下文
- 每轮注入少量跨对话长期记忆
- 明确说出“我叫……”或“我喜欢/我的爱好是……”时的保守记忆兜底
- 通过模型工具查看、修改、删除长期记忆
- 查询最近考试、今日任务和课程知识资料
- 根据考试、任务和偏好生成个性化学习建议
- 创建、修改、删除任务的二次确认
- 根据今日心情生成 80 字以内的可执行建议，且不写入聊天线程

任务写操作的安全流程：

```text
模型调用 prepare_* 工具
  -> 仅在 Agent SQLite 保存 pending action
  -> 返回操作摘要，等待下一轮
  -> 用户明确回复“确认”
  -> 原子 claim 为 executing
  -> 调用一次 Java 内部写接口
  -> completed（失败则 failed，不自动重放）
```

每个动作带唯一 `Idempotency-Key`。同一 pending action 在 Agent 层只会请求
Java 一次；失败时不会自动重试，以免网络结果不确定时造成重复写入。用户回复
“取消”会将动作标记为 `cancelled`，不会触碰业务数据库。

## 配置

复制 `.env.example` 为 `.env`，再填写本机配置。不要提交 `.env`。

必填模型配置：

- `LONGCAT_API_KEY`
- `LONGCAT_BASE_URL`
- `LONGCAT_MODEL`

Agent/Java 配置：

- `AGENT_BACKEND_BASE_URL`：默认 `http://127.0.0.1:8080`
- `AGENT_BACKEND_TIMEOUT_SECONDS`：Java 内部请求超时，默认 10 秒
- `AGENT_SERVICE_TOKEN`：Java 与 Python 共用的内部服务密钥
- `AGENT_DATABASE_PATH`：默认 `data/agent_memory.db`
- `AGENT_CONTEXT_MESSAGES`：送给模型的最近消息数，默认 16
- `AGENT_REQUEST_TIMEOUT_SECONDS`：模型请求超时，默认 60 秒
- `AGENT_MAX_RETRIES`：模型请求重试次数，默认 2

未配置模型时服务仍可启动，`GET /health` 返回 `ready: false`，聊天和心情
接口返回 HTTP 503。健康接口不会返回任何密钥。

### 网络安全

配置 `AGENT_SERVICE_TOKEN` 后，聊天与心情接口必须携带
`X-Agent-Service-Token`。未配置密钥时，这两个接口仅接受本机
`127.0.0.1` / `::1` 请求，防止局域网客户端直接伪造 `userId`。

如果 Java 和 Python 分别运行在容器、虚拟机或不同主机，必须配置相同的
`AGENT_SERVICE_TOKEN`，不能依赖“仅本机”模式。移动端不能持有该密钥。

## 安装和启动

```powershell
cd D:\AAAend\lllen\Race\my-competition-app\agent-service
uv sync
uv run uvicorn sync_study_agent.api:app --host 0.0.0.0 --port 8001
```

检查状态：

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

## HTTP 契约

### 对话

`POST /api/agent/chat`

```json
{
  "userId": 123,
  "message": "帮我安排今天的英语复习",
  "threadId": "可选的已有会话ID"
}
```

```json
{
  "status": "completed",
  "threadId": "会话ID",
  "message": "AI回复"
}
```

### 心情建议

`POST /api/agent/mood-advice`

```json
{
  "userId": 123,
  "moodId": "tired",
  "description": "今天有点累"
}
```

```json
{
  "moodId": "tired",
  "description": "今天有点累",
  "advice": "先休息五分钟，再完成一个二十分钟的小任务。"
}
```

`userId` 必须由已经验证 JWT 的 Java 后端提供，不能信任移动端自行传入。

## 离线验证

测试全部使用假模型、假 Java 客户端或 `httpx.MockTransport`，不会访问真实
LongCat，不会读取或输出 `.env`：

```powershell
uv run python -m compileall sync_study_agent tests
uv run python -m unittest discover -s tests -v
```
