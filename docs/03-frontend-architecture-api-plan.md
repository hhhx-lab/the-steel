# 03 前端架构、技术栈与接口计划

本文档描述铁子 MVP 第一阶段前端工程架构、技术栈、状态设计、前后端分离方式和接口计划。

## 1. 技术栈

| 类型 | 技术 | 当前用途 |
|---|---|---|
| 框架 | React 18 | 页面和组件开发 |
| 构建工具 | Vite | 本地开发、生产构建 |
| 语言 | TypeScript | 类型约束和接口模型 |
| 路由 | React Router | 页面路由和跳转 |
| 状态管理 | Zustand | 本地业务状态和持久化 |
| 请求与缓存 | TanStack Query | 查询型数据加载 |
| 样式 | Tailwind CSS | 移动端 UI 样式 |
| 图标 | lucide-react | 按钮和信息图标 |
| 表单 | React Hook Form | 记录页手动表单 |
| 数据校验 | Zod | 已安装，后续接真实接口时用于响应校验 |
| PWA | vite-plugin-pwa | manifest、service worker、安装能力 |
| Mock | 本地 mock service functions | 无后端时跑通完整流程 |

## 2. 目录结构

```text
src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   └── router.tsx
├── components/
│   ├── layout/
│   └── ui/
├── data/
│   ├── mockEquipment.ts
│   ├── mockExercises.ts
│   └── mockWorkoutPlan.ts
├── features/
│   └── xiaotie/
├── pages/
│   ├── WelcomePage.tsx
│   ├── HomePage.tsx
│   ├── ScanPage.tsx
│   ├── ScanResultPage.tsx
│   ├── ExercisePage.tsx
│   ├── WorkoutSessionPage.tsx
│   ├── WorkoutLogPage.tsx
│   └── ProfilePage.tsx
├── services/
│   ├── apiClient.ts
│   ├── endpoints.ts
│   ├── mockApi.ts
│   ├── realApi.ts
│   └── tieziApi.ts
├── stores/
│   ├── scanStore.ts
│   ├── userStore.ts
│   └── workoutStore.ts
├── styles/
│   └── globals.css
└── types/
    ├── api.ts
    ├── equipment.ts
    ├── exercise.ts
    ├── user.ts
    └── workout.ts
```

## 3. 前后端分离策略

当前是纯前端 MVP，后端尚未实现。为了避免后续重构，项目采用三层服务隔离：

```text
页面 / 组件
↓
services/tieziApi.ts
↓
mockApi.ts 或 realApi.ts
↓
apiClient.ts + endpoints.ts
```

### 3.1 页面层

页面只允许调用业务 API 门面：

```ts
import { getTodayWorkout, scanEquipment } from "../services/tieziApi";
```

页面不直接访问：

- 后端 URL
- `fetch`
- `apiClient`
- mock 数据文件

少数静态展示列表可以读取 `src/data`，例如训练中根据 `exercise_id` 查动作名称；真实后端接入后，这部分可以迁移为接口返回。

### 3.2 API 门面层

`src/services/tieziApi.ts` 根据环境变量决定使用 mock 还是真实接口。

```ts
const useRealApi = import.meta.env.VITE_USE_REAL_API === "true";
export const tieziApi = useRealApi ? realApi : mockApi;
```

默认 `.env.example`：

```text
VITE_USE_REAL_API=false
VITE_API_BASE_URL=/api
```

### 3.3 Mock 层

`src/services/mockApi.ts` 负责：

- 本地延迟模拟
- 高 / 中 / 低置信度器械识别
- 默认今日训练
- 动作详情
- 加入今日训练
- 一句话记录解析
- 训练记录保存
- 疼痛关键词安全提示

Mock 层的目标是保证无后端时也能完整演示主流程。

### 3.4 Real API 层

`src/services/realApi.ts` 负责：

- 调用 `apiClient`
- 使用 `endpoints`
- 适配后端响应包裹格式
- 支持扫描图片的 JSON URL 或 FormData Blob 上传

真实后端接入时，原则上优先改 `realApi.ts`，页面不需要改。

### 3.5 API Client 层

`src/services/apiClient.ts` 负责：

- 拼接 `VITE_API_BASE_URL`
- JSON GET/POST
- FormData POST
- 统一处理 HTTP 非 2xx 错误

## 4. 状态管理

### 4.1 用户状态 `userStore`

文件：`src/stores/userStore.ts`

职责：

- 首次进入状态
- 用户基础信息
- 本地持久化
- 清除用户数据

核心字段：

```ts
hasVisited: boolean;
profile: UserProfile;
```

### 4.2 识别状态 `scanStore`

文件：`src/stores/scanStore.ts`

职责：

- 当前识别状态
- 最后一次识别结果
- 图片预览
- 识别错误

识别状态：

```ts
type ScanStatus =
  | "idle"
  | "cameraReady"
  | "capturing"
  | "recognizing"
  | "success"
  | "lowConfidence"
  | "failed";
```

### 4.3 训练状态 `workoutStore`

文件：`src/stores/workoutStore.ts`

职责：

- 今日计划
- 当前训练 session
- 当前动作
- 动作完成状态
- 训练记录
- 小铁反馈

训练状态：

```ts
type WorkoutSessionStatus =
  | "not_started"
  | "in_progress"
  | "logging"
  | "completed"
  | "abandoned";
```

动作状态：

```ts
type WorkoutExerciseStatus =
  | "pending"
  | "current"
  | "completed"
  | "skipped";
```

## 5. 核心数据模型

### 5.1 UserProfile

```ts
type UserProfile = {
  user_id: string;
  nickname: string;
  experience_level: "newbie" | "beginner" | "intermediate";
  onboarding_completed: boolean;
  allow_body_photo_analysis: boolean;
};
```

### 5.2 Equipment

```ts
type Equipment = {
  equipment_id: string;
  name_cn: string;
  beginner_name: string;
  category: "machine" | "cable" | "free_weight" | "cardio";
  target_body_parts_beginner: string[];
  target_muscles: string[];
  beginner_friendly: boolean;
  risk_level: "low" | "medium" | "high";
};
```

### 5.3 Exercise

```ts
type Exercise = {
  exercise_id: string;
  name_cn: string;
  equipment_id: string;
  beginner_explanation: string;
  target_body_parts_beginner: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  steps: string[];
  setup_tips: string[];
  common_mistakes: string[];
  safety_notes: string[];
  default_sets: number;
  default_reps: string;
  media_hint: string;
};
```

### 5.4 WorkoutPlan

```ts
type WorkoutPlan = {
  plan_id: string;
  user_id: string;
  plan_type: "full_body_beginner";
  duration_minutes: number;
  title: string;
  subtitle: string;
  intensity: "low" | "medium" | "high";
  exercises: WorkoutPlanExercise[];
};
```

### 5.5 SetRecord

```ts
type SetRecord = {
  record_id: string;
  session_id: string;
  exercise_id: string;
  set_index: number;
  weight: number;
  weight_unit: "kg";
  reps: number;
  rpe_text?: string;
  user_note?: string;
};
```

## 6. 接口计划

### 6.1 当前业务 API 方法

| 方法 | 当前来源 | 后续真实接口 |
|---|---|---|
| `getUserProfile()` | mock / local | `GET /api/user/profile` |
| `getTodayWorkout()` | mock | `GET /api/workout/today` |
| `scanEquipment(image, scenario?)` | mock / real placeholder | `POST /api/equipment/scan` |
| `getExerciseDetail(exerciseId)` | mock | `GET /api/exercises/:id` |
| `addExerciseToWorkout(exerciseId)` | mock / real placeholder | `POST /api/workout/add-exercise` |
| `parseWorkoutLog(text, exerciseId)` | mock / real placeholder | `POST /api/workout/log/parse` |
| `saveWorkoutLog(records)` | mock / real placeholder | `POST /api/workout/log` |

### 6.2 POST `/api/equipment/scan`

请求方式一：图片 URL

```json
{
  "image_url": "https://example.com/image.jpg",
  "user_id": "user_local_001",
  "today_plan_id": "plan_beginner_day_1"
}
```

请求方式二：FormData

```text
image: Blob
user_id: user_local_001
today_plan_id: plan_beginner_day_1
```

响应建议：

```json
{
  "success": true,
  "data": {
    "recognized": true,
    "confidence": 0.92,
    "equipment": {
      "equipment_id": "eq_lat_pulldown",
      "name_cn": "高位下拉器",
      "beginner_name": "练背的下拉器械",
      "category": "machine",
      "target_body_parts_beginner": ["背两侧", "手臂前侧"],
      "target_muscles": ["背阔肌", "肱二头肌"],
      "beginner_friendly": true,
      "risk_level": "low"
    },
    "recommended_exercises": [
      {
        "exercise_id": "ex_lat_pulldown",
        "name_cn": "高位下拉",
        "difficulty": "beginner"
      }
    ],
    "today_recommendation": {
      "recommended": true,
      "reason": "适合作为今天全身入门训练的背部动作，建议热身后做。",
      "suggested_sets": 3,
      "suggested_reps": "10"
    },
    "user_facing_summary": "这是一台练背为主的下拉器械，新手可以用它学习背部发力。",
    "need_more_photo": false
  }
}
```

### 6.3 POST `/api/workout/add-exercise`

请求：

```json
{
  "user_id": "user_local_001",
  "plan_id": "plan_beginner_day_1",
  "exercise_id": "ex_lat_pulldown"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "plan_id": "plan_beginner_day_1",
    "exercise_id": "ex_lat_pulldown",
    "position": 2,
    "message": "已加入今日训练"
  }
}
```

### 6.4 POST `/api/workout/log/parse`

请求：

```json
{
  "user_id": "user_local_001",
  "session_id": "session_local_001",
  "exercise_id": "ex_lat_pulldown",
  "text": "高位下拉做了三组，20 公斤，10、10、8，最后一组有点累。"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "exercise_name": "高位下拉",
    "exercise_id": "ex_lat_pulldown",
    "sets": [
      {
        "record_id": "record_001",
        "session_id": "session_local_001",
        "exercise_id": "ex_lat_pulldown",
        "set_index": 1,
        "weight": 20,
        "weight_unit": "kg",
        "reps": 10
      }
    ],
    "need_confirmation": true,
    "xiaotie_feedback": "收到，我先帮你整理成记录。确认没问题后就能保存。"
  }
}
```

### 6.5 POST `/api/workout/log`

请求：

```json
{
  "user_id": "user_local_001",
  "session_id": "session_local_001",
  "records": [
    {
      "record_id": "record_001",
      "session_id": "session_local_001",
      "exercise_id": "ex_lat_pulldown",
      "set_index": 1,
      "weight": 20,
      "weight_unit": "kg",
      "reps": 10,
      "rpe_text": "有点累",
      "user_note": "最后两下有点吃力"
    }
  ]
}
```

响应：

```json
{
  "success": true,
  "data": {
    "success": true,
    "saved": 1,
    "message": "收到，我帮你记好了。"
  }
}
```

## 7. Mock 场景

当前必须保持这些 mock 场景可用：

| 场景 | 入口 | 用途 |
|---|---|---|
| 高置信度识别 | `/scan` 高置信度按钮 | 演示完整主链路 |
| 中置信度识别 | `/scan` 可能是按钮 | 演示“可能是”确认状态 |
| 低置信度识别 | `/scan` 需补拍按钮 | 演示补拍兜底 |
| 默认今日训练 | `/home` | 跑通训练计划 |
| 一句话记录解析 | `/workout/log` | 演示自然语言记录 |
| 疼痛关键词 | `/workout/log` | 演示安全提示 |

## 8. 构建与运行

安装依赖：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 9. 验收标准

前端验收必须满足：

- 首次进入展示欢迎页。
- 点击「拍一下器械」进入扫描页。
- 无真实后端时可以通过 mock 完整跑通主流程。
- 高置信度结果展示器械名称、小白解释、训练部位、今日建议。
- 中置信度结果使用「可能是」表达。
- 低置信度结果不展示确定结论，提示补拍。
- 动作教程包含练哪里、怎么调、怎么做、常见错误、安全提醒。
- 加入今日训练后进入训练中页。
- 训练中页展示 checklist 和当前动作。
- 一句话记录必须展示可编辑解析结果并要求确认。
- 疼痛、不适、旧伤等关键词触发安全提示。
- `npm run build` 通过。

## 10. 后续接后端步骤

1. 后端按本文档接口返回数据。
2. 在本地 `.env.local` 设置：

```text
VITE_USE_REAL_API=true
VITE_API_BASE_URL=http://localhost:3000
```

3. 优先调试 `realApi.ts` 的响应适配。
4. 如果后端字段与当前类型不同，先更新 `src/types`，再更新 `realApi.ts`。
5. 页面层原则上不直接改接口细节。

