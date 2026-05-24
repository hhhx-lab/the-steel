# 02 页面功能、组件交互与接口说明

本文档描述每个页面的组件组成、用户交互、状态变化和接口调用关系。当前项目是纯前端 MVP，默认使用 mock 服务，页面不直接调用后端地址，而是通过 `src/services/tieziApi.ts` 访问业务 API 门面。

## 1. 通用组件约定

| 组件 | 文件 | 用途 |
|---|---|---|
| `AppShell` | `src/components/layout/AppShell.tsx` | 移动端页面容器，控制最大宽度、安全区和底部导航 |
| `BottomNav` | `src/components/layout/BottomNav.tsx` | 今日、拍器械、我的三个主入口 |
| `TopBar` | `src/components/layout/TopBar.tsx` | 沉浸式页面顶部返回栏 |
| `Button` | `src/components/ui/Button.tsx` | 主按钮、次按钮、危险按钮 |
| `Card` | `src/components/ui/Card.tsx` | 页面信息卡片 |
| `Tag` | `src/components/ui/Tag.tsx` | 训练部位、状态、置信度等标签 |
| `SegmentedControl` | `src/components/ui/SegmentedControl.tsx` | 记录页手动 / 一句话模式切换 |
| `XiaotieTip` | `src/features/xiaotie/XiaotieTip.tsx` | 小铁提示、安全提醒和陪练语气 |

## 2. 欢迎页 `/welcome`

### 页面目标

让新用户 3 秒内知道：

- 这是给健身小白用的 App
- 不认识器械也能开始
- 不强制上传体态照片
- 可以直接拍器械

### 组件结构

```text
AppShell(showNav=false)
├── 顶部品牌区
├── WelcomeHero
├── XiaotieTip
├── 主 CTA：拍一下器械
├── 次 CTA：先看看训练计划
└── PrivacyHint
```

### 状态交互

依赖 `userStore`：

| 行为 | 状态变化 | 跳转 |
|---|---|---|
| 点击「拍一下器械」 | `hasVisited = true` | `/scan` |
| 点击「先看看训练计划」 | `hasVisited = true` | `/home` |

### 接口

欢迎页不调用接口。

## 3. 首页 `/home`

### 页面目标

- 展示今日训练
- 提供开始训练入口
- 提供拍器械、一句话记录、新手指南入口

### 组件结构

```text
AppShell(showNav=true)
├── GreetingHeader
├── TodayWorkoutCard
├── QuickActionGrid
├── ExerciseSummaryList
├── XiaotieTip
└── GuideDialog
```

### 数据来源

| 数据 | 来源 | 说明 |
|---|---|---|
| 用户昵称 | `userStore.profile` | 本地持久化 |
| 今日训练 | `workoutStore.plan` | 本地训练状态 |
| 今日训练查询 | `getTodayWorkout()` | 当前默认 mock，后续真实接口 |
| 记录数量 | `workoutStore.records` | 本地训练记录 |

### 交互

| 行为 | 处理 |
|---|---|
| 点击「开始训练」 | 调用 `workoutStore.startSession()`，跳转 `/workout/session` |
| 点击「拍一下器械」 | 跳转 `/scan` |
| 点击「一句话记录」 | 跳转 `/workout/log` |
| 点击「新手指南」 | 打开本页轻量弹层 |
| 关闭新手指南 | 关闭弹层，不改变路由 |

### 接口

当前调用：

```ts
getTodayWorkout()
```

后续真实接口：

```text
GET /api/workout/today
```

## 4. 拍器械页 `/scan`

### 页面目标

- 打开相机
- 支持相册上传
- 展示拍摄引导
- 进入识别中状态
- 支持 mock 三种识别场景

### 组件结构

```text
AppShell(showNav=false)
├── TopBar
├── CameraPreview
├── ScanGuideCard
├── CaptureActionGrid
├── MockScenarioCard
├── XiaotieTip
└── HiddenFileInput
```

### 状态来源

依赖 `scanStore`：

```ts
status:
  | "idle"
  | "cameraReady"
  | "capturing"
  | "recognizing"
  | "success"
  | "lowConfidence"
  | "failed"
```

### 交互

| 行为 | 处理 |
|---|---|
| 页面进入 | 调用 `navigator.mediaDevices.getUserMedia` 请求后置相机 |
| 相机成功 | `scanStore.status = cameraReady`，video 展示流 |
| 相机失败 | 展示权限提示，允许相册或 mock 场景继续 |
| 点击「拍照」 | 从 video 截图生成 Blob，调用 `scanEquipment` |
| 点击「相册」 | 打开 file input，选择图片后调用 `scanEquipment` |
| 点击「高置信度」 | 调用 mock `scanEquipment(..., "high")` |
| 点击「可能是」 | 调用 mock `scanEquipment(..., "medium")` |
| 点击「需补拍」 | 调用 mock `scanEquipment(..., "low")` |
| 识别成功 | 写入 `scanStore.lastResult`，跳转 `/scan/result` |
| 识别失败 | `scanStore.status = failed`，展示错误 |

### 接口

当前调用：

```ts
scanEquipment(image, scenario)
```

后续真实接口：

```text
POST /api/equipment/scan
```

图片上传约定：

- 如果是 URL 字符串，real API 以 JSON 提交 `image_url`
- 如果是 Blob，real API 以 `FormData` 提交 `image`

## 5. 识别结果页 `/scan/result`

### 页面目标

- 展示器械识别结果
- 按置信度控制确定性表达
- 引导看教程或加入训练
- 低置信度时提示补拍

### 组件结构

```text
AppShell(showNav=false)
├── TopBar
├── RecognitionStatusCard
├── EquipmentInfoCard
├── TodayRecommendationCard
├── XiaotieTip
├── ResultActionButtons
└── FeedbackDialog
```

### 数据来源

| 数据 | 来源 |
|---|---|
| 识别结果 | `scanStore.lastResult` |
| 加入训练 | `workoutStore.addExercise` |
| 开始训练 | `workoutStore.startSession` |

如果没有 `scanStore.lastResult`，页面自动跳回 `/scan`。

### 置信度规则

| 置信度 | 展示策略 |
|---|---|
| `>= 0.80` | 展示确定结果 |
| `0.65 - 0.79` | 展示「可能是」，提示用户确认 |
| `< 0.65` | 不展示确定结论，提示补拍 |

### 交互

| 行为 | 处理 |
|---|---|
| 点击「看怎么用」 | 跳转 `/exercise/:exerciseId` |
| 点击「加入今日训练」 | 调用 `addExerciseToWorkout`，更新 `workoutStore`，跳转 `/workout/session` |
| 点击「重新识别」 | 跳转 `/scan` |
| 点击「识别不准？」 | 打开反馈弹层 |
| 低置信度点击主按钮 | 跳转 `/scan` |

### 接口

当前调用：

```ts
addExerciseToWorkout(exerciseId)
```

后续真实接口：

```text
POST /api/workout/add-exercise
```

## 6. 动作教程页 `/exercise/:exerciseId`

### 页面目标

用小白语言讲清楚：

- 练哪里
- 怎么调设备
- 怎么做动作
- 常见错误
- 安全提醒

### 组件结构

```text
AppShell(showNav=false)
├── TopBar
├── ExerciseHeroCard
├── BodyPartCard
├── SetupTipsSection
├── StepsSection
├── CommonMistakesSection
├── SafetyNotice
├── XiaotieTip
└── StickyBottomAction
```

### 数据来源

| 数据 | 来源 |
|---|---|
| 动作详情 | `getExerciseDetail(exerciseId)` |
| 今日计划 | `workoutStore.plan` |
| 加入训练 | `workoutStore.addExercise` |

### 交互

| 行为 | 处理 |
|---|---|
| 点击「加入今日训练」 | 调用 `workoutStore.addExercise(exerciseId)` |
| 动作已在计划中 | 按钮显示「已在计划」 |
| 点击「开始训练」 | 加入动作，调用 `startSession()`，跳转 `/workout/session` |

### 接口

当前调用：

```ts
getExerciseDetail(exerciseId)
```

后续真实接口：

```text
GET /api/exercises/:id
```

## 7. 训练中页 `/workout/session`

### 页面目标

- 展示训练进度
- 展示动作 checklist
- 高亮当前动作
- 提供教程和记录入口
- 完成当前动作后切换下一个动作

### 组件结构

```text
AppShell(showNav=false)
├── TopBar
├── WorkoutProgressCard
├── StartWorkoutButton
├── ExerciseChecklist
├── CurrentExerciseCard
├── XiaotieTip
└── EndWorkoutDialog
```

### 数据来源

依赖 `workoutStore`：

| 字段 | 说明 |
|---|---|
| `plan` | 当前今日训练计划 |
| `status` | 训练状态 |
| `currentExerciseId` | 当前动作 |
| `records` | 已保存训练记录 |
| `lastFeedback` | 小铁保存后反馈 |

### 交互

| 行为 | 处理 |
|---|---|
| 点击「开始今日训练」 | `startSession()` |
| 点击 checklist 某动作 | `setCurrentExercise(exerciseId)` |
| 点击「查看教程」 | 跳转 `/exercise/:exerciseId` |
| 点击「记录这一组」 | 跳转 `/workout/log?exerciseId=xxx` |
| 点击「完成当前动作」 | `completeCurrentExercise()` |
| 点击「结束」 | 打开结束确认弹层 |
| 结束弹层点击「继续练」 | 关闭弹层 |
| 结束弹层点击「结束」 | 跳转 `/home` |

### 接口

当前仅使用本地 store。后续可接：

```text
GET  /api/workout/session/current
POST /api/workout/session/update
POST /api/workout/session/complete
```

## 8. 记录确认页 `/workout/log`

### 页面目标

- 快速记录刚做完的训练
- 支持手动结构化记录
- 支持一句话记录
- AI 解析后必须用户确认

### 组件结构

```text
AppShell(showNav=false)
├── TopBar
├── CurrentExerciseCard
├── LogModeTabs
├── ManualLogForm
├── NaturalLanguageInput
├── ParsedLogPreview
├── SafetyWarning
└── SaveButton
```

### 手动记录交互

| 字段 | 说明 |
|---|---|
| 组数 | number，默认动作推荐组数 |
| 重量 | number，默认 20kg |
| 次数 | number，默认动作推荐次数 |
| 感受 | 轻松 / 刚好 / 有点累 / 太重 |
| 备注 | 自由文本 |

保存流程：

```text
用户填写表单
↓
生成 SetRecord[]
↓
saveWorkoutLog(records)
↓
workoutStore.saveRecords(records, feedback)
↓
/workout/session
```

### 一句话记录交互

```text
用户输入文本
↓ 点击「解析这句话」
parseWorkoutLog(text, exerciseId)
↓
展示 ParsedLogPreview
↓ 用户可修改每组重量和次数
↓ 点击「确认并保存」
saveWorkoutLog(records)
↓
/workout/session
```

### 安全规则

如果文本中出现：

```text
疼、痛、不舒服、旧伤、拉伤
```

页面必须展示安全提示：

```text
如果有疼痛、不适或旧伤，先停止训练，并咨询专业教练或医生。
```

### 接口

当前调用：

```ts
parseWorkoutLog(text, exerciseId)
saveWorkoutLog(records)
```

后续真实接口：

```text
POST /api/workout/log/parse
POST /api/workout/log
```

## 9. 我的页 `/profile`

### 页面目标

第一阶段只做基础设置，不做账号系统。

### 组件结构

```text
AppShell(showNav=true)
├── ProfileSummary
├── NicknameEditor
├── PrivacySettings
├── AboutAppCard
├── XiaotieTip
└── ClearDataDialog
```

### 数据来源

| 数据 | 来源 |
|---|---|
| 昵称 | `userStore.profile.nickname` |
| 经验等级 | `userStore.profile.experience_level` |
| 体态照片分析开关 | `userStore.profile.allow_body_photo_analysis` |

### 交互

| 行为 | 处理 |
|---|---|
| 修改昵称并保存 | `userStore.updateProfile({ nickname })` |
| 点击清除本地数据 | 打开确认弹层 |
| 确认清除 | 清空 user、workout、scan store，跳转 `/welcome` |

### 接口

当前不调用接口。后续可接：

```text
GET  /api/user/profile
POST /api/user/profile
```

## 10. 页面与接口分离原则

所有页面必须遵守：

- 页面只 import `src/services/tieziApi.ts`，不直接拼后端 URL。
- mock 数据只允许存在于 `src/data` 和 `src/services/mockApi.ts`。
- 真实接口只允许存在于 `src/services/realApi.ts`、`apiClient.ts` 和 `endpoints.ts`。
- 页面状态只通过 `stores` 或 React 局部状态管理，不把接口细节塞进 UI 组件。
- 新增后端接口时，先补 `endpoints.ts` 和 `realApi.ts`，再调整页面。

