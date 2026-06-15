# 铁子后端 API 合同

本文档用于把当前前端功能映射成后端接口。当前 `server.js` 已支撑 MVP 闭环：onboarding、今日训练、动作卡、训练记录、历史统计、拍照识别、小铁助手、资料和媒体。

## 设计原则

- 先保证前端所有状态可持久化，再接入真实 AI 能力。
- 接口返回统一包裹格式：`{ "success": true, "data": ... }`。错误返回：`{ "success": false, "error": { "code": "...", "message": "..." } }`。
- 第一阶段可以使用本地用户 `user_local_001`，但接口都保留 `user_id` 或从登录态解析用户。
- 所有时间字段使用 ISO 8601 字符串。
- 强度、目标、分化等枚举值保持和前端类型一致，避免多套翻译。

## 枚举

```ts
type FitnessGoal = "fat_loss" | "muscle_gain" | "shape";
type SplitPreference = "two" | "three" | "four";
type ExperienceLevel = "newbie" | "beginner" | "intermediate";
type WorkoutIntensity = "low" | "medium" | "high";
type WorkoutSessionStatus = "not_started" | "in_progress" | "completed" | "abandoned";
type WorkoutExerciseStatus = "pending" | "current" | "completed" | "skipped";
```

## 1. 用户与资料

### GET `/api/user/profile`

返回当前用户资料。

```json
{
  "success": true,
  "data": {
    "user_id": "user_local_001",
    "nickname": "新手铁友",
    "avatar_url": "/assets/cutouts/xiaotie-female-head-cutout.png",
    "experience_level": "newbie",
    "fitness_goal": "muscle_gain",
    "split_preference": "three",
    "weekly_frequency": 4,
    "focus_body_parts": ["背部"],
    "today_focus_part": "腿臀",
    "training_profile_completed": true,
    "onboarding_completed": true,
    "allow_body_photo_analysis": false
  }
}
```

### PATCH `/api/user/profile`

更新昵称、头像、训练偏好等。

```json
{
  "nickname": "新手铁友",
  "avatar_url": "https://cdn.example.com/avatar.png",
  "experience_level": "newbie",
  "allow_body_photo_analysis": false
}
```

### POST `/api/user/reset`

清空本机体验数据，用于重新演示新用户流程。

响应：

```json
{
  "success": true,
  "data": {
    "reset": true,
    "profile": {
      "user_id": "user_local_001",
      "nickname": "新手铁友"
    }
  }
}
```

## 2. 整体训练计划 Onboarding

### POST `/api/onboarding/training-profile`

保存长期训练偏好，并生成或更新整体训练计划。该步骤只会把 `training_profile_completed` 标记为 `true`，不会直接完成完整 onboarding；用户还需要继续完成今日训练设置和动作卡确认。

```json
{
  "fitness_goal": "muscle_gain",
  "split_preference": "three",
  "weekly_frequency": 4,
  "focus_body_parts": ["背部"],
  "experience_level": "newbie"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "profile_saved": true,
    "training_plan_id": "tp_001",
    "summary": "增肌优先 · 三分化 · 每周 4 次 · 重点背部"
  }
}
```

### GET `/api/training-plans/current`

获取当前整体训练计划，用于后续计划页或首页展示。

## 3. 今日训练计划

### POST `/api/workout/today/generate`

根据长期偏好和今日选择生成今日计划。

```json
{
  "today_focus_part": "腿臀",
  "duration_minutes": 60,
  "intensity": "high"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "plan_id": "dwp_001",
    "title": "今日计划",
    "subtitle": "腿臀入门训练",
    "duration_minutes": 60,
    "intensity": "high",
    "exercises": [
      {
        "exercise_id": "ex_treadmill_warmup",
        "sets": 1,
        "reps": "5 分钟",
        "status": "current",
        "weight_strategy": "trial_based"
      },
      {
        "exercise_id": "ex_leg_press",
        "sets": 3,
        "reps": "10",
        "status": "pending",
        "weight_strategy": "trial_based"
      }
    ]
  }
}
```

### GET `/api/workout/today`

获取当前今日计划。前端 `getTodayWorkout` 已接入该接口。

### PATCH `/api/workout/today/exercises`

确认动作卡里用户最终加入的动作。

```json
{
  "plan_id": "dwp_001",
  "exercise_ids": ["ex_treadmill_warmup", "ex_leg_press", "ex_plank"]
}
```

响应返回更新后的今日计划。

### PATCH `/api/workout/today/intensity`

训练中根据体感或小铁建议调整今日强度。用于“太重 / 太累 / 强度太高”等场景。

```json
{
  "plan_id": "dwp_001",
  "session_id": "session_001",
  "intensity": "low"
}
```

响应返回更新后的 `plan` 和当前 `session`，session 的 `last_feedback` 会写入小铁提示语。

### POST `/api/workout/add-exercise`

拍照识别或小铁建议后，把单个动作加入今日计划。

```json
{
  "plan_id": "dwp_001",
  "exercise_id": "ex_seated_row",
  "source": "scan"
}
```

响应会返回更新后的 `plan`，前端以该计划为准刷新今日训练。

### POST `/api/workout/replace-exercise`

小铁建议替代器械时，把某个动作替换为另一个动作，并同步当前 session。

```json
{
  "plan_id": "dwp_001",
  "from_exercise_id": "ex_lat_pulldown",
  "to_exercise_id": "ex_seated_row"
}
```

## 4. 动作库和动态视频

### GET `/api/exercises`

支持按部位、器械、难度筛选。

Query：

```txt
body_part=背部&difficulty=beginner&equipment_id=eq_lat_pulldown
```

### GET `/api/exercises/:exerciseId`

获取动作教程、默认组数、发力部位、动作视频和封面。

响应字段：

```json
{
  "exercise_id": "ex_lat_pulldown",
  "name_cn": "高位下拉",
  "equipment_id": "eq_lat_pulldown",
  "beginner_explanation": "主要练背两侧。",
  "target_body_parts_beginner": ["背两侧", "手臂前侧"],
  "difficulty": "beginner",
  "steps": ["双手握住横杆，比肩稍宽。"],
  "setup_tips": ["大腿垫压住大腿。"],
  "common_mistakes": ["耸肩拉。"],
  "safety_notes": ["肩膀疼痛先停止。"],
  "default_sets": 3,
  "default_reps": "10",
  "media_hint": "坐姿下拉器械",
  "video_url": "https://cdn.example.com/videos/ex_lat_pulldown.mp4",
  "thumbnail_url": "https://cdn.example.com/videos/ex_lat_pulldown.jpg"
}
```

## 5. 训练 Session

### POST `/api/workout-sessions`

确认今日计划后创建一次训练。

```json
{
  "daily_workout_plan_id": "dwp_001",
  "initial_exercise_id": "ex_seated_row"
}
```

`initial_exercise_id` 可选，用于从动作教程或拍照识别结果直接开始某个动作；后端会校验该动作必须在当前今日计划内。

### GET `/api/workout-sessions`

获取历史训练 session 列表。每个 session 会带上由已保存组记录聚合出的摘要，用于记录页和后续复盘页。

```json
{
  "success": true,
  "data": [
    {
      "session_id": "session_001",
      "status": "completed",
      "daily_workout_plan_id": "dwp_001",
      "current_exercise_id": "ex_plank",
      "started_at": "2026-06-10T09:00:00.000Z",
      "ended_at": "2026-06-10T09:35:00.000Z",
      "set_count": 8,
      "total_volume": 3200,
      "duration_minutes": 35,
      "exercise_ids": ["ex_treadmill_warmup", "ex_lat_pulldown"],
      "body_parts": ["心肺", "腿部", "背两侧"]
    }
  ]
}
```

### GET `/api/workout-sessions/current`

获取进行中的训练。

### PATCH `/api/workout-sessions/current/end`

结束当前训练。已经保存的记录会继续保留在记录页。

```json
{}
```

### PATCH `/api/workout-sessions/current/exercise`

切换当前动作。

```json
{
  "exercise_id": "ex_leg_press"
}
```

## 6. 训练记录

### POST `/api/workout/log/parse`

自然语言训练记录解析。第一版可用规则/mock，后续接 LLM。

```json
{
  "session_id": "session_001",
  "exercise_id": "ex_lat_pulldown",
  "text": "高位下拉做了三组，20 公斤，10、10、8，最后一组有点累。"
}
```

响应保持当前前端 `ParsedWorkoutLog`：

```json
{
  "success": true,
  "data": {
    "exercise_name": "高位下拉",
    "exercise_id": "ex_lat_pulldown",
    "sets": [],
    "need_confirmation": true,
    "xiaotie_feedback": "收到，我先帮你整理成 3 组记录。",
    "safety_warning": null
  }
}
```

### POST `/api/workout/log`

保存力量或有氧每组记录。保存后会推进今日计划中当前动作的完成状态，并返回更新后的 `plan` 和 `session`。

力量：

```json
{
  "session_id": "session_001",
  "records": [
    {
      "exercise_id": "ex_lat_pulldown",
      "set_index": 1,
      "weight": 20,
      "weight_unit": "kg",
      "reps": 10,
      "rpe_text": "刚好",
      "user_note": ""
    }
  ]
}
```

### GET `/api/workout/log`

获取训练记录。可选 `session_id` 过滤。

```txt
session_id=session_001
```

有氧：

```json
{
  "session_id": "session_001",
  "records": [
    {
      "exercise_id": "ex_treadmill_warmup",
      "set_index": 1,
      "weight": 0,
      "weight_unit": "kg",
      "reps": 0,
      "duration_minutes": 5,
      "distance_km": 0.5
    }
  ]
}
```

### GET `/api/workout/insights`

获取最近训练体感洞察。后端会在保存组记录时从 `rpe_text` 和 `user_note` 中提取 `pain`、`heavy`、`tired`、`easy` 等标记；今日计划生成会参考这些标记动态调整强度和生成说明。

```json
{
  "success": true,
  "data": [
    {
      "insight_id": "insight_001",
      "session_id": "session_001",
      "exercise_id": "ex_seated_row",
      "set_index": 1,
      "flags": ["tired"],
      "note": "最后几下有点吃力",
      "created_at": "2026-06-10T09:00:00.000Z"
    }
  ]
}
```

## 7. 历史和统计

### GET `/api/analytics/calendar`

日期视图：日、周、月、年。

Query：

```txt
range=month&month=2026-06
```

### GET `/api/analytics/overview`

概览视图：训练概况、部位概览、运动时间。

Query：

```txt
range=month
```

响应建议：

```json
{
  "success": true,
  "data": {
    "range": "month",
    "session_days": 8,
    "set_count": 64,
    "total_volume": 18240,
    "duration_minutes": 336,
    "body_parts": [
      { "body_part": "背部", "focus_score": 0.82, "set_count": 18 }
    ],
    "monthly_bars": [
      { "label": "2月", "session_days": 4, "duration_minutes": 160 }
    ]
  }
}
```

## 8. 拍照识别器械

### POST `/api/equipment/scan`

支持 multipart 文件或 `image_url`。`scenario` 用于本地演示高/中/低置信度。

```json
{
  "image_url": "https://cdn.example.com/uploads/scan.jpg",
  "today_plan_id": "dwp_001",
  "scenario": "low"
}
```

响应保持当前 `ScanResult`。

第一版可返回规则/mock；第二版接视觉模型识别器械、说明牌、把手位置，并根据置信度返回 `need_more_photo`。

扫描接口会同步创建一条 `media_assets` 记录，并把图片资产关联到识别结果：

```json
{
  "scan_id": "scan_001",
  "image_asset_id": "asset_scan_001",
  "image_url": "data:image/jpeg;base64,...",
  "created_at": "2026-06-10T09:00:00.000Z",
  "recognized": true,
  "confidence": 0.92
}
```

### GET `/api/equipment/scans/latest`

获取最近一次识别结果。首页用于展示低置信度重拍提醒，同时保留 `scan_id` 和 `image_asset_id`，方便后续纠错和复核。

### POST `/api/equipment/scan-feedback`

提交识别不准反馈。

```json
{
  "feedback": "这其实是坐姿划船",
  "actual_equipment_name": "坐姿划船",
  "scan_result": {}
}
```

## 9. 体态照片分析

### POST `/api/body-photo/analyze`

用户开启 `allow_body_photo_analysis` 后，上传或引用一张体态照片生成训练建议。第一版只做训练关注点和动作建议，不做医疗诊断。

```json
{
  "image_asset_id": "asset_001"
}
```

也可以直接传 `data_url` / `image_url`，后端会同步创建 `media_assets`。

未开启开关时返回：

```json
{
  "success": false,
  "error": {
    "code": "body_photo_analysis_not_allowed",
    "message": "Enable body photo analysis before uploading a body photo"
  }
}
```

成功响应：

```json
{
  "success": true,
  "data": {
    "analysis_id": "body_001",
    "user_id": "user_local_001",
    "image_asset_id": "asset_001",
    "image_url": "data:image/jpeg;base64,...",
    "posture_summary": "小铁会把这张体态照作为训练参考，不做医疗判断。",
    "focus_areas": [
      {
        "body_part": "背部",
        "finding": "训练前先做轻重量试动作。",
        "priority": "medium"
      }
    ],
    "recommended_body_parts": ["背部", "核心"],
    "recommended_exercises": [
      {
        "exercise_id": "ex_lat_pulldown",
        "name_cn": "高位下拉",
        "difficulty": "beginner"
      }
    ],
    "xiaotie_tip": "今天先别追重量，第一组用偏轻重量试动作。",
    "privacy_note": "照片只用于本机体验数据中的体态训练建议。",
    "created_at": "2026-06-10T09:00:00.000Z"
  }
}
```

### GET `/api/body-photo/analyses/latest`

获取最近一次体态照片分析。个人页用于展示最近结果；重置用户数据后返回 `null`。

## 10. 小铁助手

### POST `/api/assistant/messages`

```json
{
  "session_id": "session_001",
  "message": "高位下拉器械被占了，请给我其他可替代器械。",
  "input_type": "text",
  "daily_workout_plan_id": "dwp_001",
  "context": {
    "current_exercise_id": "ex_lat_pulldown",
    "plan_id": "dwp_001",
    "current_intensity": "medium"
  }
}
```

响应：

```json
{
  "success": true,
  "data": {
    "message_id": "msg_001",
    "reply": "可以换成坐姿划船或辅助引体，今天优先推荐坐姿划船。",
    "suggested_actions": [
      {
        "type": "replace_exercise",
        "from_exercise_id": "ex_lat_pulldown",
        "to_exercise_id": "ex_seated_row",
        "label": "替换为坐姿划船"
      },
      {
        "type": "adjust_intensity",
        "intensity": "low",
        "label": "降低今日强度"
      }
    ]
  }
}
```

### GET `/api/assistant/messages`

获取最近 20 条小铁对话历史，包含 `input_type`、`session_id`、`daily_workout_plan_id`、原始 `context`，以及 assistant 消息上的 `suggested_actions`。

## 11. 媒体上传

### POST `/api/media/upload`

用于头像、扫描图片、动作视频管理。

响应：

```json
{
  "success": true,
  "data": {
    "asset_id": "asset_001",
    "url": "https://cdn.example.com/uploads/avatar.png",
    "mime_type": "image/png",
    "purpose": "avatar"
  }
}
```

## 当前实现清单

1. `GET/PATCH /api/user/profile`
2. `POST /api/onboarding/training-profile`
3. `POST/GET /api/workout/today`
4. `PATCH /api/workout/today/exercises`、`PATCH /api/workout/today/intensity`
5. `GET /api/exercises` 和 `GET /api/exercises/:id`
6. `POST /api/workout-sessions`、`GET /api/workout-sessions`、`GET /api/workout-sessions/current`、结束和切换当前动作
7. `POST /api/workout/log/parse`、`POST/GET /api/workout/log`、`GET /api/workout/insights`
8. `GET /api/analytics/calendar` 和 `GET /api/analytics/overview`
9. `POST /api/body-photo/analyze`、`GET /api/body-photo/analyses/latest`
10. `POST/GET /api/assistant/messages`
11. `POST /api/equipment/scan`、`GET /api/equipment/scans/latest`、`POST /api/equipment/scan-feedback`
12. `POST /api/workout/add-exercise` 和 `POST /api/workout/replace-exercise`
13. `POST /api/media/upload`
