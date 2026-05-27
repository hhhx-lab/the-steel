# 铁子

面向健身小白的 AI 健身房上手 App。

核心口号：

> 拍一下器械，小铁带你练。

## 本地运行

前端：

```bash
npm install
npm run dev
```

默认启动地址：

```text
http://localhost:5173/
```

后端：

```bash
cd backend
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run python -m app.cli
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端默认使用 SQLite：`backend/tiezi.db`。

## 已实现范围

- React + TypeScript + Vite + PWA
- 移动端优先页面框架
- 欢迎页、首页、拍器械页、识别结果页、动作教程页、训练中页、记录页、我的页
- Zustand 本地业务状态
- TanStack Query 基础查询层
- 前后端分离 API 门面：默认 mock，后续可切真实接口
- Mock 器械识别、动作库、今日训练和一句话记录解析
- 无真实后端时可完整演示核心闭环
- FastAPI 后端、SQL 持久化、OpenAI adapter 和前端 real API 合同

## 文档

- `docs/01-page-design-and-flow.md`：页面设计与整体流转
- `docs/02-page-functional-spec.md`：页面功能、组件交互与接口说明
- `docs/03-frontend-architecture-api-plan.md`：前端架构、技术栈与接口计划

## 接口模式

默认使用 mock：

```text
VITE_USE_REAL_API=false
```

后端完成后可以在 `.env.local` 中切换：

```text
VITE_USE_REAL_API=true
VITE_API_BASE_URL=http://localhost:8000
```

后端真实 AI 配置写在 `backend/.env`：

```text
AI_PROVIDER=openai
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
AI_TEST_MODE=false
```

没有真实 key 时，后端的自动化测试使用显式 stub；本地接口会返回受控的低置信度/需手动确认响应，前端不会崩溃。

## 真实 AI 手工联调

1. 在 `backend/.env` 填入 `OPENAI_API_KEY`。
2. 启动后端和前端 real API 模式。
3. 在 `/scan` 上传器械图片或使用图片 URL，确认返回 `recognized/confidence/equipment/need_more_photo`。
4. 在 `/workout/log` 输入一句话记录，确认先展示解析结果，再由用户保存。

OpenAI adapter 使用 Responses API 的图片输入和结构化输出能力，后端会把 AI 输出归一化为前端 `ScanResult` 与 `ParsedWorkoutLog`。

## 验证

```bash
npm run build
cd backend && uv run pytest
```
