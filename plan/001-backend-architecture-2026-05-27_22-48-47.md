---
mode: plan
change_id: add-fastapi-backend
cwd: /Users/hwaigc/太空垃圾站/铁子
task: 补齐铁子 MVP 后端架构并接入真实 AI 服务
source_document: N/A
created_at: 2026-05-27T22:48:47+08:00
qualification_status: passed
---

# Plan: 补齐铁子 MVP 后端架构并接入真实 AI 服务

## 背景与动机

铁子当前已经完成移动端前端 MVP, 可以通过本地 mock 跑通"拍器械 -> 看教程 -> 加入训练 -> 记录"闭环, 但真实后端尚未实现. 本次需求要补齐 Python + FastAPI 后端、SQL 持久化和真实 AI 服务适配, 让前端可以从 mock 模式切换到 real API 模式并继续保持现有用户流程.
<!-- 下游：proposal.md 的 motivation -->

## Goal

- 新增一个 Python + FastAPI 后端, 实现当前前端 `realApi.ts` 已声明的业务接口, 让前端在 `VITE_USE_REAL_API=true` 时可以完整跑通 MVP 主链路.
- 使用 SQL 持久化保存用户、器械、动作、今日训练、训练动作、训练记录等核心数据; 本地可用 SQLite, 部署环境可通过同一数据访问层切到 Postgres.
- 接入真实 AI 服务完成器械图片识别和一句话训练记录解析, 返回结构必须兼容现有 TypeScript API 类型.
<!-- 下游：proposal.md 的 scope -->

## Non-goals

- 不做登录注册、JWT 多用户认证或账号体系; 第一阶段沿用现有 `user_local_001` 本地用户模型.
- 不做支付、社区、私教交易、饮食管理、视频姿态纠错、医学诊断或康复训练.
- 不替换当前 React 前端页面和 V1 UI; 只允许为真实后端联调补充环境变量、接口适配或文档.
- 不要求第一阶段生产部署; 只要求本地后端、数据库、AI 服务配置和前端联调可验证.
<!-- 下游：proposal.md 的 scope -->

## 当前仓库事实

- 当前仓库是前端 MVP: `README.md:22-31` 列出已实现 React + TypeScript + Vite + PWA、Zustand、本地 mock、前后端分离 API 门面和无真实后端时的完整演示闭环.
- 本地运行和构建命令只有前端命令: `README.md:9-19` 说明 `npm install`、`npm run dev` 和默认 `http://localhost:5173/`; `README.md:54-58` 说明当前验证命令是 `npm run build`.
- 后端切换方式已经预留: `README.md:39-52` 说明默认 `VITE_USE_REAL_API=false`, 后端完成后可设置 `VITE_USE_REAL_API=true` 和 `VITE_API_BASE_URL`.
- 前后端分离层次已经写入文档: `docs/03-frontend-architecture-api-plan.md:68-80` 规定页面/组件通过 `services/tieziApi.ts` 进入 `mockApi.ts` 或 `realApi.ts`, 再到 `apiClient.ts` 和 `endpoints.ts`.
- 页面层不应直接接触后端 URL 或 fetch: `docs/03-frontend-architecture-api-plan.md:82-98` 说明页面只调用业务 API 门面, 不直接访问后端 URL、`fetch`、`apiClient` 或 mock 数据文件.
- 当前真实后端接口路径已集中声明: `src/services/endpoints.ts:1-9` 包含 `GET /api/user/profile`、`GET /api/workout/today`、`POST /api/equipment/scan`、`GET /api/exercises/:id`、`POST /api/workout/add-exercise`、`POST /api/workout/log/parse`、`POST /api/workout/log`.
- 前端会通过环境变量选择 mock 或 real API: `src/services/tieziApi.ts:5-16` 根据 `VITE_USE_REAL_API` 导出 `getUserProfile`、`getTodayWorkout`、`scanEquipment`、`addExerciseToWorkout`、`parseWorkoutLog`、`saveWorkoutLog` 等方法.
- `realApi.ts` 已定义后端请求形态: `src/services/realApi.ts:20-79` 包含用户资料、今日训练、动作详情、器械扫描、加入训练、解析训练记录和保存训练记录的真实请求封装.
- 器械扫描支持 JSON 图片 URL 和 FormData 图片上传: `src/services/realApi.ts:32-48` 对字符串发送 `image_url`, 对 Blob 发送 `FormData image/user_id/today_plan_id`.
- 训练记录解析和保存请求使用固定本地用户与 session: `src/services/realApi.ts:60-78` 提交 `user_id`, `session_id`, `exercise_id`, `text` 或 `records`.
- TypeScript 响应契约已经存在: `src/types/api.ts:19-31` 定义 `ScanResult`; `src/types/api.ts:33-40` 定义 `ParsedWorkoutLog`; `src/types/api.ts:42-53` 定义加入训练和保存记录响应.
- 核心数据模型已经存在于前端类型: `src/types/workout.ts:18-27` 定义 `WorkoutPlan`; `src/types/workout.ts:29-39` 定义 `SetRecord`; `src/types/equipment.ts:4-13` 定义 `Equipment`; `src/types/exercise.ts:3-17` 定义 `Exercise`; `src/types/user.ts:3-9` 定义 `UserProfile`.
- 前端接口计划已经给出真实接口示例: `docs/03-frontend-architecture-api-plan.md:308-320` 列出当前业务 API 方法和对应真实接口; `docs/03-frontend-architecture-api-plan.md:322-377` 给出 `POST /api/equipment/scan` 请求和响应建议; `docs/03-frontend-architecture-api-plan.md:379-477` 给出加入训练、解析记录和保存记录的请求/响应建议.
- 前端验收要求后端接入后仍保持低置信度、记录确认和疼痛安全提示: `docs/03-frontend-architecture-api-plan.md:521-534` 列出欢迎页、扫描页、置信度、教程、加入训练、记录确认、安全提示和构建通过等验收点.
- 当前仓库没有 `openspec/` 目录; `openspec list` 返回 `No OpenSpec changes directory found. Run 'openspec init' first.` 因此本 plan 没有可引用的既有 OpenSpec spec baseline.
<!-- 下游：specs baseline，proposal.md 的 context -->

## 改动边界

- 新增后端应用层: FastAPI 应用入口、路由注册、CORS、健康检查、错误响应和本地运行脚本.
- 新增后端契约层: 与 `src/types` 兼容的 Pydantic schema, 覆盖用户、器械、动作、训练计划、训练动作、训练记录、扫描结果、AI 解析结果.
- 新增数据层: SQLAlchemy 或等价 ORM 的模型、session 管理、迁移工具和 seed 数据, 覆盖当前 mock 里的默认用户、器械库、动作库和默认今日训练.
- 新增 AI 服务层: 真实 AI 服务适配器, 至少支持图片器械识别和自然语言训练记录解析; AI 输出必须被后端校验/归一化后再返回给前端.
- 新增 API 路由: 实现 `src/services/endpoints.ts:1-9` 中的所有接口, 并保持 `realApi.ts` 当前请求形态可用.
- 前端改动边界: 只允许补充 `.env.example`、后端 base URL 文档、必要的 `realApi.ts` 响应适配; 不重做页面和 UI.
- 可能需要新增 OpenSpec specs 领域: `backend-api`, `workout-persistence`, `ai-equipment-recognition`, `ai-workout-log-parse`.
<!-- 下游：proposal.md scope，design.md scope，spec deltas 范围 -->

## 约束

- 后端技术栈固定为 Python + FastAPI.
- 数据持久化要求覆盖 SQLite/Postgres: 本地开发默认 SQLite, 部署或长期运行通过同一 ORM/迁移体系支持 Postgres.
- AI 服务必须是真实服务, 不能只停留在前端 mock; 但具体 AI provider/API key 命名在仓库内未验证, 下游 design 需要明确 provider 适配方式、必需环境变量和无密钥时的失败行为.
- 前端页面层必须继续通过 `src/services/tieziApi.ts` 访问业务 API, 不允许直接调用后端 URL.
- 后端不得输出医学诊断; 疼痛、不适、旧伤、拉伤等关键词必须触发停止训练并咨询专业人士的安全提示.
- 图片上传接口必须同时兼容 `image_url` JSON 请求和 `multipart/form-data` Blob 请求, 因为 `realApi.ts` 当前两种路径都可能调用.
<!-- 下游：design.md 的 constraints -->

## 验收标准

1. 当后端启动且前端设置 `VITE_USE_REAL_API=true`、`VITE_API_BASE_URL` 指向 FastAPI 服务时, 打开 `/home` 能通过 `GET /api/workout/today` 获取真实后端返回的今日训练, 页面不依赖 `mockApi.ts`.
2. `GET /api/user/profile` 返回的 JSON 可被前端当作 `UserProfile` 使用, 至少包含 `user_id`, `nickname`, `experience_level`, `onboarding_completed`, `allow_body_photo_analysis`.
3. `GET /api/exercises/:exerciseId` 对默认训练中的每个动作返回兼容 `Exercise` 的动作详情; 不存在的动作返回明确的 404 错误.
4. `POST /api/equipment/scan` 接收 `multipart/form-data image` 时会调用真实 AI 服务识别器械, 后端校验并返回兼容 `ScanResult` 的结构; `confidence < 0.65` 时返回 `need_more_photo: true` 且不返回确定训练建议.
5. `POST /api/equipment/scan` 接收 JSON `image_url` 时与 FormData 路径返回同一响应契约.
6. `POST /api/workout/add-exercise` 接收 `user_id`, `plan_id`, `exercise_id` 后将动作持久化加入今日训练, 返回 `plan_id`, `exercise_id`, `position`, `message`; 再次查询今日训练能看到该动作.
7. `POST /api/workout/log/parse` 接收一句话训练记录后调用真实 AI 服务解析, 返回 `exercise_name`, `exercise_id`, `sets`, `need_confirmation: true`, `xiaotie_feedback`; 用户文本包含疼痛/不适/旧伤/拉伤时返回 `safety_warning`.
8. `POST /api/workout/log` 保存确认后的 `SetRecord[]`, 返回 `success`, `saved`, `message`; 后端数据库中能查到对应 `session_id` 和 `exercise_id` 的记录.
9. 后端测试覆盖 API schema、数据库持久化、AI 适配器输出归一化、疼痛关键词安全兜底; 无真实 AI key 的自动化测试可以使用 provider stub, 但至少提供一次真实 AI 服务的手工联调步骤.
10. 前端保持通过 `npm run build`, 且 real API 模式下能手工走通: 欢迎页 -> 扫描 -> 识别结果 -> 教程 -> 加入训练 -> 训练中 -> 一句话记录 -> 保存返回训练页.
<!-- 下游：spec deltas 的 Scenarios，tasks.md 的 verification -->

## 验证方式

- 运行前端现有构建命令: `npm run build`.
- 运行后端单元/接口测试命令: `pytest` 或下游 design 规定的等价 Python 测试命令.
- 使用 FastAPI 本地服务和前端 real API 环境变量进行端到端手工验收: `/scan` 上传图片或使用图片 URL, `/scan/result` 查看识别结果, `/workout/log` 解析并保存训练记录.
- 使用数据库观测点验证持久化: 查询 workout plan/exercises/set records 表, 确认加入训练和保存记录产生持久化数据.
- 使用 AI 服务观测点验证真实调用: 后端日志或测试桩以外的 provider 响应证明扫描和文本解析经过真实 AI adapter.
<!-- 下游：tasks.md 的验证步骤 -->

## 迁移 / 回滚 / 降级

- 迁移: 引入 SQL schema 时必须提供可重复执行的迁移文件, 覆盖用户、器械、动作、训练计划、训练动作、训练记录和必要索引.
- 回滚: 每个 schema 迁移需要有对应 downgrade 或明确的回滚策略; 回滚后前端可切回 `VITE_USE_REAL_API=false` 使用 mock 演示.
- 降级: AI 服务不可用、超时或返回非结构化内容时, 后端必须返回受控错误或低置信度补拍响应, 不得让前端崩溃.
- 数据安全: 第一阶段不做多用户认证, 但数据库写入必须以 `user_id` 和 `session_id` 隔离本地体验数据, 避免跨用户混淆.
<!-- 下游：proposal.md 的 risks，spec deltas 的 REMOVED/MODIFIED -->

## 参考

- `README.md:22-31`
- `README.md:39-52`
- `README.md:54-58`
- `docs/03-frontend-architecture-api-plan.md:68-80`
- `docs/03-frontend-architecture-api-plan.md:82-98`
- `docs/03-frontend-architecture-api-plan.md:308-320`
- `docs/03-frontend-architecture-api-plan.md:322-377`
- `docs/03-frontend-architecture-api-plan.md:379-477`
- `docs/03-frontend-architecture-api-plan.md:521-548`
- `src/services/endpoints.ts:1-9`
- `src/services/tieziApi.ts:5-16`
- `src/services/realApi.ts:20-79`
- `src/types/api.ts:19-53`
- `src/types/workout.ts:18-39`
- `src/types/equipment.ts:4-13`
- `src/types/exercise.ts:3-17`
- `src/types/user.ts:3-9`
