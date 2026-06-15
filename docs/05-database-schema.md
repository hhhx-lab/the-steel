# 铁子后端数据库 Schema 草案

本文档描述 MVP 后端的核心数据表。推荐第一版使用 PostgreSQL。字段命名采用 snake_case，主键使用字符串 ID，方便前端和日志排查。

## 表关系总览

```txt
users
  -> user_training_profiles
  -> training_plans
  -> daily_workout_plans
      -> daily_workout_exercises
      -> workout_sessions
          -> set_records
  -> scan_records
  -> body_photo_analyses
  -> assistant_messages
  -> media_assets

exercise_library
  -> daily_workout_exercises
  -> set_records

equipment_library
  -> exercise_library
  -> scan_records
```

## 1. users

用户基础资料。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 用户 ID |
| nickname | text | 昵称 |
| avatar_asset_id | text nullable | 头像媒体 |
| experience_level | text | newbie / beginner / intermediate |
| training_profile_completed | boolean | 是否完成长期训练偏好配置 |
| onboarding_completed | boolean | 是否完成完整 onboarding，包括今日训练设置和动作确认 |
| allow_body_photo_analysis | boolean | 是否允许身体照片分析 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `users(id)`

## 2. user_training_profiles

长期训练偏好，不保存今天临时选择。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 偏好 ID |
| user_id | text fk users.id | 用户 |
| fitness_goal | text | fat_loss / muscle_gain / shape |
| split_preference | text | two / three / four |
| weekly_frequency | int | 每周训练次数 |
| focus_body_parts | text[] | 重点训练部位 |
| source | text | onboarding / profile_edit |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `user_training_profiles(user_id)`

## 3. training_plans

整体训练计划，是长期偏好的产物。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 整体计划 ID |
| user_id | text fk users.id | 用户 |
| profile_id | text fk user_training_profiles.id | 生成时使用的偏好 |
| title | text | 计划标题 |
| goal | text | 冗余保存生成目标 |
| split_preference | text | 冗余保存分化 |
| weekly_frequency | int | 冗余保存频率 |
| status | text | active / archived |
| generated_summary | text | 面向用户的摘要 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `training_plans(user_id, status)`

## 4. equipment_library

器械库。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 器械 ID |
| name_cn | text | 中文名 |
| category | text | 器械分类 |
| target_body_parts_beginner | text[] | 新手可理解部位 |
| target_muscles | text[] | 专业肌肉 |
| beginner_friendly | boolean | 是否新手友好 |
| risk_level | text | low / medium / high |
| image_asset_id | text nullable | 器械图片 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

## 5. exercise_library

动作库。当前前端 `mockExercises` 后续迁移到这里。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 动作 ID |
| equipment_id | text fk equipment_library.id | 对应器械 |
| name_cn | text | 动作名 |
| beginner_explanation | text | 新手解释 |
| target_body_parts_beginner | text[] | 新手部位 |
| difficulty | text | beginner / intermediate / advanced |
| steps | text[] | 动作步骤 |
| setup_tips | text[] | 设置提示 |
| common_mistakes | text[] | 常见错误 |
| safety_notes | text[] | 安全提示 |
| default_sets | int | 默认组数 |
| default_reps | text | 默认次数或时间 |
| media_hint | text | 媒体提示 |
| video_asset_id | text nullable | 动态视频 |
| thumbnail_asset_id | text nullable | 封面 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `exercise_library(equipment_id)`
- `exercise_library(difficulty)`

## 6. daily_workout_plans

今日训练计划。它是“长期整体计划 + 今日临时选择”的产物。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 今日计划 ID |
| user_id | text fk users.id | 用户 |
| training_plan_id | text fk training_plans.id nullable | 对应整体计划 |
| plan_date | date | 日期 |
| title | text | 今日计划标题 |
| subtitle | text | 今日计划副标题 |
| today_focus_part | text | 今天练什么部位 |
| duration_minutes | int | 今天预计训练时长 |
| intensity | text | low / medium / high |
| status | text | draft / confirmed / completed / abandoned |
| generated_reason | text | 生成原因 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `daily_workout_plans(user_id, plan_date)`
- `daily_workout_plans(user_id, status)`

## 7. daily_workout_exercises

今日计划动作列表，支持动作闪卡里的加入/移除。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 计划动作 ID |
| daily_workout_plan_id | text fk daily_workout_plans.id | 今日计划 |
| exercise_id | text fk exercise_library.id | 动作 |
| position | int | 顺序 |
| sets | int | 组数 |
| reps | text | 次数或时间 |
| weight_strategy | text | trial_based 等 |
| status | text | pending / current / completed / skipped |
| source | text | generated / user_added / scan / assistant |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `daily_workout_exercises(daily_workout_plan_id, position)`
- `daily_workout_exercises(exercise_id)`

## 8. workout_sessions

一次实际训练。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | session ID |
| user_id | text fk users.id | 用户 |
| daily_workout_plan_id | text fk daily_workout_plans.id | 今日计划 |
| status | text | not_started / in_progress / completed / abandoned |
| current_exercise_id | text fk exercise_library.id nullable | 当前动作 |
| started_at | timestamptz nullable | 开始时间 |
| ended_at | timestamptz nullable | 结束时间 |
| last_feedback | text nullable | 小铁最后反馈 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `workout_sessions(user_id, status)`
- `workout_sessions(daily_workout_plan_id)`

## 9. set_records

每组训练记录。力量和有氧统一存一张表，用 nullable 字段区分。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 记录 ID |
| user_id | text fk users.id | 用户 |
| session_id | text fk workout_sessions.id | 训练 session |
| exercise_id | text fk exercise_library.id | 动作 |
| set_index | int | 第几组 |
| weight | numeric nullable | 重量 |
| weight_unit | text | kg |
| reps | int nullable | 次数 |
| duration_minutes | numeric nullable | 有氧时间 |
| distance_km | numeric nullable | 有氧距离 |
| rpe_text | text nullable | 体感 |
| user_note | text nullable | 备注 |
| parsed_from_text | text nullable | 原始自然语言 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

索引：

- `set_records(user_id, created_at)`
- `set_records(session_id, exercise_id, set_index)`
- `set_records(exercise_id)`

约束建议：

- 力量记录：`reps` 或 `weight` 至少一个大于 0。
- 有氧记录：`duration_minutes` 或 `distance_km` 至少一个大于 0。

## 10. scan_records

拍照识别记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 识别记录 ID |
| user_id | text fk users.id | 用户 |
| daily_workout_plan_id | text nullable | 当前计划 |
| image_asset_id | text fk media_assets.id nullable | 上传图片 |
| recognized | boolean | 是否识别成功 |
| confidence | numeric | 置信度 |
| equipment_id | text fk equipment_library.id nullable | 识别器械 |
| need_more_photo | boolean | 是否需要重拍 |
| user_facing_summary | text | 给用户看的总结 |
| raw_model_output | jsonb nullable | 模型原始输出 |
| created_at | timestamptz | 创建时间 |

索引：

- `scan_records(user_id, created_at)`
- `scan_records(equipment_id)`

## 11. assistant_messages

小铁助手消息。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 消息 ID |
| user_id | text fk users.id | 用户 |
| session_id | text fk workout_sessions.id nullable | 当前训练 |
| daily_workout_plan_id | text fk daily_workout_plans.id nullable | 当前计划 |
| role | text | user / assistant / system |
| input_type | text | text / voice |
| message | text | 消息内容 |
| suggested_actions | jsonb nullable | 替换动作、加入动作等建议 |
| model_name | text nullable | 使用模型 |
| created_at | timestamptz | 创建时间 |

索引：

- `assistant_messages(user_id, created_at)`
- `assistant_messages(session_id, created_at)`

## 12. media_assets

媒体资源，包括头像、扫描图片、动作视频、封面。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 资源 ID |
| user_id | text fk users.id nullable | 上传用户 |
| purpose | text | avatar / scan_image / body_photo / exercise_video / thumbnail |
| url | text | 访问地址 |
| storage_key | text | 存储 key |
| mime_type | text | MIME |
| size_bytes | int | 文件大小 |
| width | int nullable | 图片宽 |
| height | int nullable | 图片高 |
| duration_seconds | numeric nullable | 视频时长 |
| created_at | timestamptz | 创建时间 |

索引：

- `media_assets(user_id, created_at)`
- `media_assets(purpose)`

## 13. body_photo_analyses

用户主动上传体态照片后的训练建议记录。只保存训练关注点和动作建议，不作为医疗诊断。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text pk | 分析 ID |
| user_id | text fk users.id | 用户 |
| image_asset_id | text fk media_assets.id | 体态照片 |
| posture_summary | text | 面向用户的整体说明 |
| focus_areas | jsonb | 关注区域、发现、优先级 |
| recommended_body_parts | text[] | 建议训练部位 |
| recommended_exercises | jsonb | 建议动作快照 |
| xiaotie_tip | text | 小铁提示语 |
| privacy_note | text | 隐私说明 |
| raw_model_output | jsonb nullable | 模型原始输出 |
| created_at | timestamptz | 创建时间 |

索引：

- `body_photo_analyses(user_id, created_at)`
- `body_photo_analyses(image_asset_id)`

## MVP 建表顺序

1. `users`
2. `media_assets`
3. `user_training_profiles`
4. `equipment_library`
5. `exercise_library`
6. `training_plans`
7. `daily_workout_plans`
8. `daily_workout_exercises`
9. `workout_sessions`
10. `set_records`
11. `scan_records`
12. `assistant_messages`
13. `body_photo_analyses`

## 初始种子数据

第一版需要把前端 mock 数据迁移为 seed：

- `mockEquipment.ts` -> `equipment_library`
- `mockExercises.ts` -> `exercise_library`
- `mockWorkoutPlan.ts` 可作为默认计划模板，不建议直接作为用户计划长期复用

## 统计口径

训练容量：

```txt
strength_volume = sum(weight * reps)
```

有氧量：

```txt
cardio_minutes = sum(duration_minutes)
cardio_distance = sum(distance_km)
```

训练天数：

```txt
count(distinct date(workout_sessions.started_at))
```

部位覆盖：

```txt
按 set_records.exercise_id -> exercise_library.target_body_parts_beginner 聚合
```

## 后续可扩展

- `plan_generation_events`：记录每次 AI 生成计划的输入和输出。
- `exercise_substitutions`：沉淀器械被占时的替代关系。
- `wearable_metrics`：心率、步数、睡眠等外部设备数据。
