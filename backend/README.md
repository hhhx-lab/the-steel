# 铁子后端

FastAPI 后端独立放在 `backend/` 下，前端仍通过 `src/services/tieziApi.ts` 在 mock/real API 之间切换。

本地开发默认使用 SQLite。真实 AI 能力通过后端配置的 OpenAI adapter 调用，自动化测试使用显式 stub，不需要真实密钥。

```bash
cd backend
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run python -m app.cli
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
```

## 配置

```text
DATABASE_URL=sqlite:///./tiezi.db
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
FRONTEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Postgres 部署环境可把 `DATABASE_URL` 改为 `postgresql+psycopg://...`，应用代码仍走同一套 SQLAlchemy 模型和 Alembic 迁移。

## 接口

- `GET /api/user/profile`
- `GET /api/workout/today`
- `GET /api/exercises/{exercise_id}`
- `POST /api/equipment/scan`
- `POST /api/workout/add-exercise`
- `POST /api/workout/log/parse`
- `POST /api/workout/log`
