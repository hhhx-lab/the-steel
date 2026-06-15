# 02 页面功能、组件交互与接口说明

本文档描述每个页面的组件组成、用户交互、状态变化和接口调用关系。当前项目已经接入本机后端 MVP，页面不直接调用后端地址，而是通过 `src/services/tieziApi.ts` 访问业务 API 门面；无后端时仍保留 mock 兜底。

## 1. 通用组件约定

| 组件 | 文件 | 用途 |
|---|---|---|
| `AppShell` | `src/components/layout/AppShell.tsx` | 移动端页面容器，控制最大宽度、安全区和底部导航 |
| `BottomNav` | `src/components/layout/BottomNav.tsx` | 首页、训练、拍照、记录、我的五个主入口 |
| `TopBar` | `src/components/layout/TopBar.tsx` | 沉浸式页面顶部返回栏 |
| `Button` | `src/components/ui/Button.tsx` | 主按钮、次按钮、危险按钮 |
| `Card` | `src/components/ui/Card.tsx` | 页面信息卡片 |
| `Tag` | `src/components/ui/Tag.tsx` | 训练部位、状态、置信度等标签 |
| `SegmentedControl` | `src/components/ui/SegmentedControl.tsx` | 记录页手动 / 一句话模式切换 |
| `XiaotieTip` | `src/features/xiaotie/XiaotieTip.tsx` | 小铁提示、安全提醒和陪练语气 |

## 2. 欢迎页 `/welcome`

### 页面目标

让新用户完成整体训练偏好收集，并进入今日训练设置。

### 组件结构

```text
AppShell(showNav=true)
├── WelcomeHero
├── WizardQuestionCard
├── 主要目标
├── 训练分化
├── 每周频率
├── 重点部位
└── GeneratedPlanBanner
```

### 状态交互

依赖 `userStore`：

| 行为 | 状态变化 | 跳转 |
|---|---|---|
| 选择目标 | 进入训练分化题 | 当前页 |
| 选择分化 | 进入频率题 | 当前页 |
| 选择频率 | 进入重点部位题 | 当前页 |
| 选择重点部位 | 展示整体计划已生成 | 当前页 |
| 点击「继续设置今日训练」 | 保存长期偏好 | `/onboarding/today` |

### 接口

```ts
saveTrainingProfile(payload)
```

## 3. 首页 `/home`

### 页面目标

- 提供今日训练时间和强度设置
- 选择完成后创建今日训练
- 展示低置信度拍照后的重拍提醒
- 展示首次首页引导浮层

### 组件结构

```text
AppShell(showNav=true)
├── GreetingHeader
├── ScanFeedbackNotice
├── TodayWorkoutSetupCard
├── HomeGuideSheet
└── GuideDialog
```

### 数据来源

| 数据 | 来源 | 说明 |
|---|---|---|
| 用户昵称 | `getUserProfile()` + `userStore.profile` | 后端同步，本地兜底 |
| 今日训练 | `getTodayWorkout()` + `workoutStore.plan` | 后端同步，本地乐观状态 |
| 低置信度识别 | `getLatestScanResult()` + `scanStore.lastResult` | 后端同步 |

### 交互

| 行为 | 处理 |
|---|---|
| 选择训练时长 | 进入训练强度题 |
| 选择训练强度 | 展示今日训练设置完成 |
| 点击「开始训练」 | 调用 `generateTodayWorkout()` 和 `createWorkoutSession()`，跳转 `/workout/session` |
| 点击「拍一下器械」 | 跳转 `/scan` |
| 首页引导关闭 | `updateUserProfile({ home_guide_seen: true })` |

### 接口

当前调用：

```ts
getTodayWorkout()
generateTodayWorkout(payload)
createWorkoutSession(planId)
updateUserProfile(profile)
```

## 4. 拍器械页 `/scan`

### 页面目标

- 打开相机
- 支持相册上传
- 展示拍摄引导
- 进入识别中状态
- 支持高 / 中 / 低置信度体验场景

### 组件结构

```text
AppShell(showNav=true)
├── TopBar
├── CameraPreview
├── ScanGuideCard
├── CaptureActionGrid
├── ScanScenarioSwitch
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
| 相机失败 | 展示权限提示，允许相册或识别场景继续 |
| 点击「拍照」 | 从 video 截图生成 Blob，调用 `scanEquipment` |
| 点击「相册」 | 打开 file input，选择图片后调用 `scanEquipment` |
| 点击「清楚 / 可能 / 不准」 | 切换本次识别场景参数 |
| 识别成功 | 写入 `scanStore.lastResult`，跳转 `/scan/result` |
| 识别失败 | `scanStore.status = failed`，展示错误 |

### 接口

当前调用：

```ts
scanEquipment(image, scenario, todayPlanId)
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
| 加入训练 | `addExerciseToWorkout()` |
| 开始训练 | `createWorkoutSession()` |

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
| 点击「加入训练」 | 调用 `addExerciseToWorkout`，以后端返回 plan 为准，创建 session 后跳转 `/workout/session` |
| 点击「重新识别」 | 跳转 `/scan` |
| 点击「识别不准？」 | 打开反馈弹层 |
| 低置信度点击主按钮 | 跳转 `/scan` |

### 接口

当前调用：

```ts
addExerciseToWorkout(exerciseId, planId)
createWorkoutSession(planId)
submitScanFeedback(payload)
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
AppShell(showNav=true)
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
| 加入训练 | `addExerciseToWorkout()` |

### 交互

| 行为 | 处理 |
|---|---|
| 点击「加入今日训练」 | 调用 `addExerciseToWorkout(exerciseId, planId)`，以后端返回 plan 为准 |
| 动作已在计划中 | 按钮显示「已在计划」 |
| 点击「开始训练」 | 加入动作，调用 `startSession()`，跳转 `/workout/session` |

### 接口

当前调用：

```ts
getExerciseDetail(exerciseId)
addExerciseToWorkout(exerciseId, planId)
createWorkoutSession(planId)
```

## 7. 训练中页 `/workout/session`

### 页面目标

- 展示训练进度
- 展示动作 checklist
- 高亮当前动作
- 提供教程和记录入口
- 记录本组后自动完成当前动作并切换下一个动作

### 组件结构

```text
AppShell(showNav=true)
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
| 点击「开始今日训练」 | `createWorkoutSession()` |
| 点击 checklist 某动作 | `updateCurrentExercise(exerciseId)` |
| 点击「查看教程」 | 跳转 `/exercise/:exerciseId` |
| 点击「记录这一组」 | 跳转 `/workout/log?exerciseId=xxx` |
| 点击「结束」 | 打开结束确认弹层 |
| 结束弹层点击「继续练」 | 关闭弹层 |
| 结束弹层点击「结束并保存记录」 | `endCurrentWorkoutSession()`，跳转 `/workout/log` |

### 接口

```ts
getTodayWorkout()
getCurrentWorkoutSession()
getWorkoutRecords()
createWorkoutSession(planId)
updateCurrentExercise(exerciseId)
endCurrentWorkoutSession()
getWorkoutRecords(sessionId)
```

## 8. 记录确认页 `/workout/log`

### 页面目标

- 快速记录刚做完的训练
- 支持手动结构化记录
- 支持一句话记录
- AI 解析后必须用户确认

### 组件结构

```text
AppShell(showNav=true)
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
| 每组 | 可单独增删 |
| 重量 / 次数 | 力量训练逐组编辑 |
| 时间 / 距离 | 有氧训练逐组编辑 |
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
↓ 点击「让小铁帮我整理」
parseWorkoutLog(text, exerciseId)
↓
展示 ParsedLogPreview
↓ 用户可修改每组重量/次数或时间/距离
↓ 点击「保存记录」
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

## 8.1 历史统计页 `/workout/log`

历史统计页分为「日期」和「概览」两个页面：

- 日期页：支持日 / 周 / 月 / 年视图，月视图展示日历和最近训练。
- 最近训练：调用 `getWorkoutSessions()` 获取每次训练摘要，并按 `session_id` 调用 `getWorkoutRecords(sessionId)` 展开每组明细。
- 概览页：支持日 / 周 / 月 / 年视图，调用 `getAnalyticsOverview(range)` 展示训练概况、部位概览和运动时间。

当前调用：

```ts
getAnalyticsCalendar(range, month?)
getAnalyticsOverview(range)
getWorkoutSessions()
getWorkoutRecords(sessionId)
```

## 9. 我的页 `/profile`

### 页面目标

基础设置、头像上传、体态照片分析、权限开关和体验数据重置。

### 组件结构

```text
AppShell(showNav=true)
├── ProfileSummary
├── NicknameEditor
├── PrivacySettings
├── BodyPhotoAnalysisPanel
├── AboutAppCard
├── XiaotieTip
└── ClearDataDialog
```

### 数据来源

| 数据 | 来源 |
|---|---|
| 用户资料 | `getUserProfile()` + `userStore.profile` |
| 头像 | `uploadMedia()` + `updateUserProfile()` |
| 体态照片分析开关 | `updateUserProfile()` |
| 最近体态分析 | `getLatestBodyPhotoAnalysis()` |

### 交互

| 行为 | 处理 |
|---|---|
| 修改昵称并保存 | `updateUserProfile({ nickname })` |
| 上传头像 | `uploadMedia(file, "avatar")` 后更新 profile |
| 切换体态分析 | `updateUserProfile({ allow_body_photo_analysis })` |
| 上传体态照 | 开关开启后调用 `analyzeBodyPhoto(file)`，展示训练关注点和建议动作 |
| 点击建议动作 | 跳转 `/exercise/:exerciseId` 查看教程 |
| 点击清除体验数据 | 打开确认弹层 |
| 确认清除 | `resetUserData()`，清空本地 store，跳转 `/welcome` |

### 接口

```ts
updateUserProfile(profile)
uploadMedia(file, "avatar")
analyzeBodyPhoto(file)
getLatestBodyPhotoAnalysis()
resetUserData()
```

## 10. 页面与接口分离原则

所有页面必须遵守：

- 页面只 import `src/services/tieziApi.ts`，不直接拼后端 URL。
- mock 数据只允许存在于 `src/data` 和 `src/services/mockApi.ts`。
- 真实接口只允许存在于 `src/services/realApi.ts`、`apiClient.ts` 和 `endpoints.ts`。
- 页面状态只通过 `stores` 或 React 局部状态管理，不把接口细节塞进 UI 组件。
- 新增后端接口时，先补 `endpoints.ts` 和 `realApi.ts`，再调整页面。
