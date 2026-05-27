# 铁子后端

FastAPI 后端独立放在 `backend/` 下，前端仍通过 `src/services/tieziApi.ts` 在 mock/real API 之间切换。

本地开发默认使用 SQLite。真实 AI 能力通过后端配置的 OpenAI adapter 调用，自动化测试使用显式 stub，不需要真实密钥。

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
```
