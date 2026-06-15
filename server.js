import http from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const USER_ID = "user_local_001";
const LOCAL_SESSION_ID = "session_local_001";
const DATA_FILE = join(process.cwd(), ".tiezi-data", "state.json");

const now = () => new Date().toISOString();

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const equipmentLibrary = [
  {
    equipment_id: "eq_lat_pulldown",
    name_cn: "高位下拉器",
    beginner_name: "练背的下拉器械",
    category: "machine",
    target_body_parts_beginner: ["背两侧", "手臂前侧"],
    target_muscles: ["背阔肌", "肱二头肌"],
    beginner_friendly: true,
    risk_level: "low"
  },
  {
    equipment_id: "eq_seated_row",
    name_cn: "坐姿划船器",
    beginner_name: "把背夹紧的划船器械",
    category: "machine",
    target_body_parts_beginner: ["背中间", "手臂前侧"],
    target_muscles: ["菱形肌", "背阔肌", "肱二头肌"],
    beginner_friendly: true,
    risk_level: "low"
  },
  {
    equipment_id: "eq_chest_press",
    name_cn: "坐姿推胸器",
    beginner_name: "练胸前侧的推举器械",
    category: "machine",
    target_body_parts_beginner: ["胸前侧", "手臂后侧"],
    target_muscles: ["胸大肌", "肱三头肌"],
    beginner_friendly: true,
    risk_level: "low"
  },
  {
    equipment_id: "eq_leg_press",
    name_cn: "腿举机",
    beginner_name: "练大腿和屁股的蹬腿器械",
    category: "machine",
    target_body_parts_beginner: ["大腿前侧", "屁股"],
    target_muscles: ["股四头肌", "臀大肌"],
    beginner_friendly: true,
    risk_level: "medium"
  },
  {
    equipment_id: "eq_treadmill",
    name_cn: "跑步机",
    beginner_name: "热身和有氧用的跑步机",
    category: "cardio",
    target_body_parts_beginner: ["心肺", "腿部"],
    target_muscles: ["腘绳肌", "股四头肌"],
    beginner_friendly: true,
    risk_level: "low"
  },
  {
    equipment_id: "eq_unknown",
    name_cn: "暂不确定",
    beginner_name: "还需要再拍清楚一点",
    category: "machine",
    target_body_parts_beginner: [],
    target_muscles: [],
    beginner_friendly: false,
    risk_level: "medium"
  }
];

const exerciseLibrary = [
  {
    exercise_id: "ex_treadmill_warmup",
    name_cn: "跑步机热身",
    equipment_id: "eq_treadmill",
    beginner_explanation: "先让身体热起来，后面的力量训练会更顺。",
    target_body_parts_beginner: ["心肺", "腿部"],
    difficulty: "beginner",
    steps: ["速度调到能轻松说话的程度。", "肩膀放松，脚步稳定。", "走 5 分钟，身体微微发热就好。"],
    setup_tips: ["先站到两侧踏板上，再启动机器。", "安全夹能夹就夹上。"],
    common_mistakes: ["一上来速度太快。", "低头看手机导致脚步不稳。"],
    safety_notes: ["如果头晕或胸闷，先停下来休息。"],
    default_sets: 1,
    default_reps: "5 分钟",
    media_hint: "低速跑步机热身",
    video_url: "/assets/videos/ex_treadmill_warmup.gif",
    thumbnail_url: "/assets/videos/ex_treadmill_warmup.jpg"
  },
  {
    exercise_id: "ex_lat_pulldown",
    name_cn: "高位下拉",
    equipment_id: "eq_lat_pulldown",
    beginner_explanation: "主要练背两侧，也就是让背看起来更挺、更宽的地方。",
    target_body_parts_beginner: ["背两侧", "手臂前侧"],
    difficulty: "beginner",
    steps: ["双手握住横杆，比肩稍宽。", "先把肩膀从耳朵旁边放下来，不要耸肩。", "想象用手肘往下夹，把横杆拉到锁骨附近。", "放回去的时候慢一点，不要让重量弹回去。"],
    setup_tips: ["坐下后，把大腿垫调到能稳稳压住大腿的位置。", "双脚踩实地面，身体不要被重量拉起来。"],
    common_mistakes: ["用手臂硬拉，背部没感觉。", "身体后仰太多，变成借力。", "重量太大，动作变形。", "放回去太快，控制不住重量。"],
    safety_notes: ["如果肩膀或手肘疼痛，先停止训练。小铁只能提供入门建议，不能替代专业教练或医生判断。"],
    default_sets: 3,
    default_reps: "10",
    media_hint: "坐姿下拉器械，双手握横杆",
    video_url: "/assets/videos/ex_lat_pulldown.gif",
    thumbnail_url: "/assets/videos/ex_lat_pulldown.jpg"
  },
  {
    exercise_id: "ex_chest_press",
    name_cn: "坐姿推胸",
    equipment_id: "eq_chest_press",
    beginner_explanation: "主要练胸前侧，推门、推东西会用到这块力量。",
    target_body_parts_beginner: ["胸前侧", "手臂后侧"],
    difficulty: "beginner",
    steps: ["背部贴住靠垫。", "手握把手，手腕保持直。", "把把手向前推出去，不要锁死手肘。", "慢慢收回来，别让重量砸回去。"],
    setup_tips: ["座椅高度让把手大概在胸口位置。", "脚踩实地面，身体不要前后晃。"],
    common_mistakes: ["肩膀耸起来。", "手腕弯折。", "只顾推重，回来的时候太快。"],
    safety_notes: ["如果肩前侧疼，先减轻重量或停止。"],
    default_sets: 3,
    default_reps: "10",
    media_hint: "坐姿推胸器械",
    video_url: "/assets/videos/ex_chest_press.gif",
    thumbnail_url: "/assets/videos/ex_chest_press.jpg"
  },
  {
    exercise_id: "ex_seated_row",
    name_cn: "坐姿划船",
    equipment_id: "eq_seated_row",
    beginner_explanation: "主要练背中间，帮助你把背挺起来。",
    target_body_parts_beginner: ["背中间", "手臂前侧"],
    difficulty: "beginner",
    steps: ["坐稳，脚踩好踏板。", "先把胸口轻轻挺起来。", "把把手拉向肚脐附近。", "慢慢放回去，背不要塌。"],
    setup_tips: ["把胸垫或座椅调到你能自然坐直的位置。", "第一组先用偏轻重量找感觉。"],
    common_mistakes: ["耸肩拉。", "身体来回甩。", "拉太高变成耸肩。"],
    safety_notes: ["腰不舒服时先停止，不要硬撑。"],
    default_sets: 3,
    default_reps: "10",
    media_hint: "坐姿划船器械",
    video_url: "/assets/videos/ex_seated_row.gif",
    thumbnail_url: "/assets/videos/ex_seated_row.jpg"
  },
  {
    exercise_id: "ex_leg_press",
    name_cn: "腿举",
    equipment_id: "eq_leg_press",
    beginner_explanation: "主要练大腿前侧和屁股，是新手比较好上手的腿部动作。",
    target_body_parts_beginner: ["大腿前侧", "屁股"],
    difficulty: "beginner",
    steps: ["背部贴紧靠垫。", "双脚踩在踏板中间，和肩差不多宽。", "蹬出去时膝盖不要完全锁死。", "收回来时慢一点，膝盖朝脚尖方向。"],
    setup_tips: ["先确认安全挡位。", "第一组用很轻的重量试动作。"],
    common_mistakes: ["膝盖向内扣。", "蹬到膝盖完全锁死。", "重量太大导致腰离开靠垫。"],
    safety_notes: ["膝盖或腰疼时先停止训练。"],
    default_sets: 3,
    default_reps: "10",
    media_hint: "腿举机",
    video_url: "/assets/videos/ex_leg_press.gif",
    thumbnail_url: "/assets/videos/ex_leg_press.jpg"
  },
  {
    exercise_id: "ex_plank",
    name_cn: "平板支撑",
    equipment_id: "eq_unknown",
    beginner_explanation: "练肚子和身体稳定，让你做其他动作更稳。",
    target_body_parts_beginner: ["肚子", "身体稳定"],
    difficulty: "beginner",
    steps: ["手肘撑地，肩膀在手肘正上方。", "身体从头到脚保持一条线。", "像有人要轻轻打你肚子一样提前绷住。"],
    setup_tips: ["可以先从 20 秒开始。", "垫子不要太滑。"],
    common_mistakes: ["屁股翘太高。", "腰塌下去。", "憋气。"],
    safety_notes: ["腰疼时先停，不要硬撑时间。"],
    default_sets: 2,
    default_reps: "20 秒",
    media_hint: "垫上核心稳定动作",
    video_url: "/assets/videos/ex_plank.gif",
    thumbnail_url: "/assets/videos/ex_plank.jpg"
  }
];

const todayExerciseMap = {
  背部: ["ex_treadmill_warmup", "ex_lat_pulldown", "ex_seated_row", "ex_plank"],
  胸部: ["ex_treadmill_warmup", "ex_chest_press", "ex_plank"],
  腿臀: ["ex_treadmill_warmup", "ex_leg_press", "ex_plank"],
  肩臂: ["ex_treadmill_warmup", "ex_chest_press", "ex_seated_row", "ex_plank"],
  核心: ["ex_treadmill_warmup", "ex_plank", "ex_seated_row"],
  全身: ["ex_treadmill_warmup", "ex_lat_pulldown", "ex_chest_press", "ex_leg_press", "ex_plank"]
};

const goalLabel = (value) => ({
  fat_loss: "减脂优先",
  muscle_gain: "增肌优先",
  shape: "塑形体态"
}[value] ?? "减脂优先");

const splitLabel = (value) => ({
  two: "二分化",
  three: "三分化",
  four: "四分化"
}[value] ?? "三分化");

const buildWeeklyStructure = ({ split_preference = "three", focus_body_parts = ["背部"], weekly_frequency = 3 } = {}) => {
  const focus = focus_body_parts.length ? focus_body_parts : ["背部"];
  const templates = {
    two: ["上肢基础和拉推动作", "下肢臀腿和核心稳定"],
    three: ["拉力和背部基础", "腿臀和核心稳定", "推胸和全身巩固"],
    four: ["胸肩推力", "背部拉力", "腿臀力量", "核心和薄弱部位"]
  };
  const base = templates[split_preference] ?? templates.three;
  return Array.from({ length: Math.max(1, Number(weekly_frequency) || 3) }, (_, index) => {
    const baseLabel = base[index % base.length];
    const focusPart = focus[index % focus.length];
    return `${baseLabel} · 兼顾${focusPart}`;
  });
};

const buildTrainingPlan = (user = initialState.user) => {
  const weekly_frequency = Math.min(7, Math.max(1, Number(user.weekly_frequency) || 3));
  const focus_body_parts = Array.isArray(user.focus_body_parts) && user.focus_body_parts.length ? user.focus_body_parts : ["背部"];
  return {
    training_plan_id: "tp_local_001",
    summary: `${goalLabel(user.fitness_goal)} · ${splitLabel(user.split_preference)} · 每周 ${weekly_frequency} 次 · 重点 ${focus_body_parts.join("/")}`,
    fitness_goal: user.fitness_goal ?? "fat_loss",
    split_preference: user.split_preference ?? "three",
    weekly_frequency,
    focus_body_parts,
    weekly_structure: buildWeeklyStructure({
      split_preference: user.split_preference,
      focus_body_parts,
      weekly_frequency
    }),
    today_generation_hint: `长期计划重点是${focus_body_parts.join("、")}，今日计划会结合当天选择的训练部位、预计时长和强度重新落地。`,
    updated_at: now()
  };
};

const initialState = {
  user: {
    user_id: USER_ID,
    nickname: "新手铁友",
    avatar_url: "/assets/cutouts/xiaotie-female-head-cutout.png",
    experience_level: "newbie",
    fitness_goal: "fat_loss",
    split_preference: "three",
    weekly_frequency: 3,
    focus_body_parts: ["背部"],
    today_focus_part: "全身",
    training_profile_completed: false,
    onboarding_completed: false,
    allow_body_photo_analysis: false,
    home_guide_seen: false
  },
  trainingPlan: null,
  todayPlan: null,
  currentSession: null,
  workoutSessions: [],
  setRecords: [],
  trainingInsights: [],
  bodyPhotoAnalyses: [],
  scanRecords: [],
  scanFeedbackRecords: [],
  assistantMessages: [],
  mediaAssets: []
};

const loadState = () => {
  if (!existsSync(DATA_FILE)) return structuredClone(initialState);
  try {
    return { ...structuredClone(initialState), ...JSON.parse(readFileSync(DATA_FILE, "utf8")) };
  } catch {
    return structuredClone(initialState);
  }
};

const state = loadState();

if (!state.trainingPlan || !state.trainingPlan.weekly_structure) {
  state.trainingPlan = buildTrainingPlan(state.user);
}

state.user.training_profile_completed = Boolean(state.user.training_profile_completed || state.user.onboarding_completed);

if (!Array.isArray(state.workoutSessions)) {
  state.workoutSessions = state.currentSession ? [state.currentSession] : [];
}

if (!Array.isArray(state.trainingInsights)) {
  state.trainingInsights = [];
}

if (!Array.isArray(state.bodyPhotoAnalyses)) {
  state.bodyPhotoAnalyses = [];
}

const persistState = () => {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
};

const resetState = () => {
  const fresh = structuredClone(initialState);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  state.trainingPlan = buildTrainingPlan(state.user);
  generateTodayPlan({ today_focus_part: "全身", duration_minutes: 30, intensity: "medium" });
  persistState();
};

const findExercise = (exerciseId) => exerciseLibrary.find((exercise) => exercise.exercise_id === exerciseId) ?? exerciseLibrary[1];
const getExerciseById = (exerciseId) => exerciseLibrary.find((exercise) => exercise.exercise_id === exerciseId);
const findEquipment = (equipmentId) => equipmentLibrary.find((equipment) => equipment.equipment_id === equipmentId) ?? equipmentLibrary[0];

const requireExercise = (exerciseId) => {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) {
    throw new ApiError(404, "exercise_not_found", `Unknown exercise_id: ${exerciseId}`);
  }
  return exercise;
};

const normalizeExerciseIds = (exerciseIds) => {
  if (!Array.isArray(exerciseIds) || !exerciseIds.length) {
    throw new ApiError(400, "missing_exercise_ids", "exercise_ids must include at least one exercise");
  }
  return Array.from(new Set(exerciseIds)).map((exerciseId) => requireExercise(exerciseId).exercise_id);
};

const requireTodayPlan = () => {
  if (!state.todayPlan) {
    throw new ApiError(404, "today_plan_not_found", "Generate a today workout plan first");
  }
  return state.todayPlan;
};

const requireMatchingPlan = (planId) => {
  const plan = requireTodayPlan();
  if (planId && planId !== plan.plan_id) {
    throw new ApiError(409, "plan_mismatch", "plan_id does not match the current today plan");
  }
  return plan;
};

const requirePlanExercise = (exerciseId) => {
  const plan = requireTodayPlan();
  if (!plan.exercises.some((item) => item.exercise_id === exerciseId)) {
    throw new ApiError(400, "exercise_not_in_plan", "exercise_id must be in the current today plan");
  }
  return plan;
};

const requireMatchingSession = (sessionId) => {
  if (sessionId && state.currentSession && sessionId !== state.currentSession.session_id) {
    throw new ApiError(409, "session_mismatch", "session_id does not match the current workout session");
  }
  if (sessionId && !state.currentSession && sessionId !== LOCAL_SESSION_ID) {
    throw new ApiError(409, "session_mismatch", "session_id does not match an active workout session");
  }
  return state.currentSession;
};

const normalizeDuration = (value, fallback = 30) => {
  const duration = Number(value);
  if (!Number.isFinite(duration)) return fallback;
  return Math.min(180, Math.max(10, Math.round(duration)));
};

const normalizeIntensity = (value) => (["low", "medium", "high"].includes(value) ? value : "medium");

const planSubtitle = (part = "全身") => `${part}入门训练`;

const normalizeTodayFocusParts = (input = {}) => {
  if (Array.isArray(input.today_focus_parts) && input.today_focus_parts.length) {
    return input.today_focus_parts.filter((part) => typeof part === "string" && part.trim()).map((part) => part.trim());
  }
  const part = input.today_focus_part ?? state.user.today_focus_part ?? "全身";
  return String(part).split(/[、/,，\s]+/).filter(Boolean);
};

const getTodayExerciseIds = (parts = ["全身"]) => {
  const selectedParts = parts.includes("全身") ? ["全身"] : parts;
  const exerciseIds = selectedParts.flatMap((part) => todayExerciseMap[part] ?? []);
  return Array.from(new Set(exerciseIds.length ? exerciseIds : todayExerciseMap["全身"]));
};

const createPlanExercises = (exerciseIds) =>
  exerciseIds.map((exerciseId, index) => {
    const exercise = findExercise(exerciseId);
    return {
      exercise_id: exercise.exercise_id,
      sets: exercise.default_sets,
      reps: exercise.default_reps,
      weight_strategy: "trial_based",
      status: index === 0 ? "current" : "pending"
    };
  });

const collectRecentTrainingInsight = () => {
  const recent = state.trainingInsights.slice(0, 8);
  const hasPain = recent.some((item) => item.flags?.includes("pain"));
  const hasHeavy = recent.some((item) => item.flags?.includes("heavy") || item.flags?.includes("tired"));
  const hasEasy = recent.length >= 2 && recent.slice(0, 3).every((item) => item.flags?.includes("easy"));
  if (hasPain) {
    return {
      suggested_intensity: "low",
      reason: "最近记录里出现疼痛或不适反馈，今天会优先保守安排。"
    };
  }
  if (hasHeavy) {
    return {
      suggested_intensity: "low",
      reason: "最近组记录里有太重或有点累的反馈，今天会先降一点强度。"
    };
  }
  if (hasEasy) {
    return {
      suggested_intensity: "medium",
      reason: "最近几组反馈比较轻松，可以保持适中强度稳定推进。"
    };
  }
  return {
    suggested_intensity: undefined,
    reason: "暂时没有明显体感风险，按今天选择生成。"
  };
};

const generateTodayPlan = (input = {}) => {
  const todayFocusParts = normalizeTodayFocusParts(input);
  const todayFocusPart = todayFocusParts.join("、") || "全身";
  const exerciseIds = getTodayExerciseIds(todayFocusParts);
  const insight = collectRecentTrainingInsight();
  const requestedIntensity = normalizeIntensity(input.intensity);
  const finalIntensity = insight.suggested_intensity === "low" && requestedIntensity === "high" ? "medium" : (insight.suggested_intensity ?? requestedIntensity);
  const plan = {
    plan_id: state.todayPlan?.plan_id ?? `dwp_${randomUUID()}`,
    user_id: USER_ID,
    plan_type: "full_body_beginner",
    duration_minutes: normalizeDuration(input.duration_minutes),
    title: "今日计划",
    subtitle: planSubtitle(todayFocusPart),
    intensity: finalIntensity,
    exercises: createPlanExercises(exerciseIds),
    today_focus_part: todayFocusPart,
    today_focus_parts: todayFocusParts,
    status: "draft",
    generated_reason: `${state.trainingPlan?.today_generation_hint ?? "根据整体偏好生成。"} 本次选择 ${todayFocusPart}、${normalizeDuration(input.duration_minutes)} 分钟、${requestedIntensity === "high" ? "挑战" : requestedIntensity === "low" ? "轻松" : "适中"}强度。${insight.reason}${finalIntensity !== requestedIntensity ? " 小铁已据此自动调整了今日强度。" : ""}`
  };
  state.todayPlan = plan;
  state.user.today_focus_part = todayFocusPart;
  return plan;
};

if (!state.todayPlan) {
  generateTodayPlan({ today_focus_part: "全身", duration_minutes: 30, intensity: "medium" });
  persistState();
}

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
};

const ok = (res, data) => sendJson(res, 200, { success: true, data });
const created = (res, data) => sendJson(res, 201, { success: true, data });
const fail = (res, status, code, message) => sendJson(res, status, { success: false, error: { code, message } });

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  const raw = buffer.toString("utf8");
  const contentType = req.headers["content-type"] ?? "";
  if (!raw) return {};
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new ApiError(400, "invalid_json", "Request body must be valid JSON");
    }
  }
  if (contentType.includes("multipart/form-data")) {
    const fields = {};
    for (const match of raw.matchAll(/name="([^"]+)"(?:;[^\r\n]*)?\r?\n(?:Content-Type:[^\r\n]+\r?\n)?\r?\n([\s\S]*?)(?=\r?\n--)/g)) {
      const [, name, value] = match;
      if (name !== "image" && name !== "file") fields[name] = value.trim();
    }
    const mimeType = raw.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] ?? "image/jpeg";
    return {
      ...fields,
      raw_body: raw,
      file_data_url: `data:${mimeType};base64,${buffer.toString("base64")}`,
      mime_type: mimeType
    };
  }
  return { raw_body: raw };
};

const parsePath = (req) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  return { pathname: url.pathname, searchParams: url.searchParams };
};

const parseNaturalRecord = (text, exerciseId, sessionId = state.currentSession?.session_id ?? "session_local_001") => {
  const exercise = findExercise(exerciseId);
  const isCardio = /跑步|热身|有氧|分钟|秒/.test(`${exercise.name_cn}${exercise.default_reps}`);
  const hasPain = /疼|痛|不舒服|旧伤|拉伤/.test(text);
  if (isCardio) {
    const durationMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:分钟|min)/i);
    const distanceMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:公里|千米|km)/i);
    const duration = durationMatch ? Number(durationMatch[1]) : Number.parseInt(exercise.default_reps, 10) || 5;
    const distance = distanceMatch ? Number(distanceMatch[1]) : 0.5;
    return {
      exercise_name: exercise.name_cn,
      exercise_id: exercise.exercise_id,
      sets: [
        {
          record_id: `record_${Date.now()}_1`,
          session_id: sessionId,
          exercise_id: exercise.exercise_id,
          set_index: 1,
          weight: 0,
          weight_unit: "kg",
          reps: 0,
          duration_minutes: duration,
          distance_km: distance,
          rpe_text: text.includes("累") ? "有点累" : undefined,
          user_note: text
        }
      ],
      need_confirmation: true,
      xiaotie_feedback: `收到，我先帮你整理成 ${duration} 分钟、${distance} km 的有氧记录。`,
      safety_warning: hasPain ? "如果有疼痛、不适或旧伤，先停止训练，并咨询专业教练或医生。" : undefined
    };
  }
  const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:公斤|kg)/i);
  const weight = weightMatch ? Number(weightMatch[1]) : 20;
  const repMatches = [...text.matchAll(/(?<!\d)(\d{1,2})(?!\d)/g)].map((match) => Number(match[1])).filter((value) => value <= 60);
  const reps = repMatches.length >= 3 ? repMatches.slice(-3) : [10, 10, text.includes("累") ? 8 : 10];
  const sets = reps.map((rep, index) => ({
    record_id: `record_${Date.now()}_${index + 1}`,
    session_id: sessionId,
    exercise_id: exercise.exercise_id,
    set_index: index + 1,
    weight,
    weight_unit: "kg",
    reps: rep,
    rpe_text: text.includes("累") && index === reps.length - 1 ? "有点累" : undefined,
    user_note: text.includes("累") && index === reps.length - 1 ? "最后一组有点累" : undefined
  }));

  return {
    exercise_name: exercise.name_cn,
    exercise_id: exercise.exercise_id,
    sets,
    need_confirmation: true,
    xiaotie_feedback: hasPain
      ? "如果这个动作让你感到疼痛，先停止训练。小铁只能提供入门建议，不能替代专业教练或医生判断。"
      : `收到，我先帮你整理成 ${sets.length} 组记录。确认没问题后就能保存。`,
    safety_warning: hasPain ? "如果有疼痛、不适或旧伤，先停止训练，并咨询专业教练或医生。" : undefined
  };
};

const dateKey = (value) => (value ?? now()).slice(0, 10);

const parseDateKey = (value) => {
  const [year, month, day] = dateKey(value).split("-").map(Number);
  return new Date(year, month - 1, day);
};

const startOfWeek = (date) => {
  const copy = new Date(date);
  const weekday = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - weekday);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isDateInRange = (value, range = "month") => {
  const date = parseDateKey(value);
  const today = parseDateKey(now());
  if (range === "day") return dateKey(value) === dateKey(today.toISOString());
  if (range === "week") {
    const weekStart = startOfWeek(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return date >= weekStart && date < weekEnd;
  }
  if (range === "year") return date.getFullYear() === today.getFullYear();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
};

const recordsForRange = (range = "month", month) =>
  state.setRecords.filter((record) => {
    const date = dateKey(record.created_at);
    if (month) return date.startsWith(month);
    return isDateInRange(date, range);
  });

const sessionsForRange = (range = "month", month) =>
  state.workoutSessions.filter((session) => {
    const date = dateKey(session.started_at ?? session.ended_at);
    if (month) return date.startsWith(month);
    return isDateInRange(date, range);
  });

const upsertWorkoutSession = (session) => {
  if (!session) return;
  state.workoutSessions = [
    session,
    ...state.workoutSessions.filter((item) => item.session_id !== session.session_id)
  ];
};

const setRecordKey = (record) => `${record.session_id}:${record.exercise_id}:${record.set_index}`;

const upsertSetRecords = (existingRecords, incomingRecords) => {
  const records = [...existingRecords];
  incomingRecords.forEach((incoming) => {
    const key = setRecordKey(incoming);
    const existingIndex = records.findIndex((record) => setRecordKey(record) === key);
    if (existingIndex >= 0) {
      const previous = records[existingIndex];
      records[existingIndex] = {
        ...previous,
        ...incoming,
        record_id: incoming.record_id ?? previous.record_id,
        created_at: previous.created_at ?? incoming.created_at
      };
      return;
    }
    records.push({
      ...incoming,
      record_id: incoming.record_id ?? `record_${randomUUID()}`,
      created_at: incoming.created_at ?? now()
    });
  });
  return records;
};

const flagsFromRecord = (record) => {
  const text = `${record.rpe_text ?? ""} ${record.user_note ?? ""}`;
  const flags = [];
  if (/疼|痛|不舒服|旧伤|拉伤/.test(text)) flags.push("pain");
  if (/太重|重量大|压不住|做不动/.test(text)) flags.push("heavy");
  if (/累|吃力|喘|力竭/.test(text)) flags.push("tired");
  if (/轻松|刚好|稳定|顺/.test(text)) flags.push("easy");
  return Array.from(new Set(flags));
};

const recordTrainingInsights = (records) => {
  const insights = records
    .map((record) => {
      const flags = flagsFromRecord(record);
      if (!flags.length) return null;
      return {
        insight_id: `insight_${randomUUID()}`,
        session_id: record.session_id,
        exercise_id: record.exercise_id,
        set_index: record.set_index,
        flags,
        note: record.user_note ?? record.rpe_text ?? "",
        created_at: now()
      };
    })
    .filter(Boolean);
  if (!insights.length) return;
  state.trainingInsights = [...insights, ...state.trainingInsights].slice(0, 60);
};

const recordDuration = (record) => Number(record.duration_minutes) || 0;

const sessionDuration = (session, records = state.setRecords.filter((record) => record.session_id === session.session_id)) => {
  const recorded = records.reduce((sum, record) => sum + recordDuration(record), 0);
  if (recorded > 0) return recorded;
  const planDuration = Number(state.todayPlan?.duration_minutes) || 0;
  if (!session.ended_at || !session.started_at) return planDuration;
  const diffMinutes = Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000);
  return Math.max(0, diffMinutes) || planDuration;
};

const summarizeWorkoutSession = (session) => {
  const records = state.setRecords.filter((record) => record.session_id === session.session_id);
  const exerciseIds = Array.from(new Set(records.map((record) => record.exercise_id)));
  const bodyParts = Array.from(new Set(exerciseIds.flatMap((exerciseId) => findExercise(exerciseId).target_body_parts_beginner)));
  return {
    ...session,
    set_count: records.length,
    total_volume: records.reduce((sum, record) => sum + (Number(record.weight) || 0) * (Number(record.reps) || 0), 0),
    duration_minutes: sessionDuration(session, records),
    exercise_ids: exerciseIds,
    body_parts: bodyParts
  };
};

const createMediaAsset = ({ purpose = "avatar", data_url, file_data_url, image_url, mime_type = "image/png" } = {}) => {
  const asset = {
    asset_id: `asset_${randomUUID()}`,
    url: data_url ?? file_data_url ?? image_url ?? "/assets/cutouts/xiaotie-female-head-cutout.png",
    mime_type,
    purpose,
    created_at: now()
  };
  state.mediaAssets.unshift(asset);
  return asset;
};

const requireMediaAsset = (assetId) => {
  const asset = state.mediaAssets.find((item) => item.asset_id === assetId);
  if (!asset) {
    throw new ApiError(404, "media_asset_not_found", "image_asset_id does not match an uploaded media asset");
  }
  return asset;
};

const buildBodyPhotoAnalysis = (asset) => {
  const focusParts = Array.isArray(state.user.focus_body_parts) && state.user.focus_body_parts.length
    ? state.user.focus_body_parts
    : ["背部", "核心"];
  const recommendedExercises = Array.from(new Set([
    ...focusParts.flatMap((part) => {
      if (part.includes("腿") || part.includes("臀")) return ["ex_leg_press", "ex_plank"];
      if (part.includes("胸") || part.includes("肩")) return ["ex_chest_press", "ex_plank"];
      if (part.includes("核心") || part.includes("肚")) return ["ex_plank", "ex_seated_row"];
      return ["ex_lat_pulldown", "ex_seated_row"];
    }),
    "ex_plank"
  ])).slice(0, 3).map((exerciseId) => {
    const exercise = findExercise(exerciseId);
    return {
      exercise_id: exercise.exercise_id,
      name_cn: exercise.name_cn,
      difficulty: exercise.difficulty
    };
  });
  return {
    analysis_id: `body_${randomUUID()}`,
    user_id: USER_ID,
    image_asset_id: asset.asset_id,
    image_url: asset.url,
    posture_summary: `小铁会把这张体态照作为训练参考，不做医疗判断。结合你的长期重点，今天可以优先关注${focusParts.slice(0, 2).join("和")}的发力稳定性。`,
    focus_areas: [
      {
        body_part: focusParts[0] ?? "背部",
        finding: "训练前先做轻重量试动作，确认目标部位能主动发力。",
        priority: "medium"
      },
      {
        body_part: focusParts[1] ?? "核心",
        finding: "核心稳定会影响推、拉、腿部动作的控制感。",
        priority: "medium"
      },
      {
        body_part: "胸肩活动度",
        finding: "正式组前加入肩胛控制和关节热身，减少耸肩代偿。",
        priority: "low"
      }
    ],
    recommended_body_parts: Array.from(new Set([...focusParts, "核心"])).slice(0, 4),
    recommended_exercises: recommendedExercises,
    xiaotie_tip: "今天先别追重量，第一组用偏轻重量试动作。动作稳，比重量漂亮重要。",
    privacy_note: "照片只用于本机体验数据中的体态训练建议，你可以随时在个人页清除体验数据。",
    created_at: now()
  };
};

const estimatedRangeDuration = (records) => {
  const recorded = records.reduce((sum, record) => sum + recordDuration(record), 0);
  if (recorded > 0) return recorded;
  const sessions = Array.from(new Set(records.map((record) => record.session_id)))
    .map((sessionId) => state.workoutSessions.find((session) => session.session_id === sessionId))
    .filter(Boolean);
  return sessions.reduce((sum, session) => sum + sessionDuration(session), 0);
};

const longestStreakDays = (records) => {
  const days = Array.from(new Set(records.map((record) => dateKey(record.created_at)))).sort();
  if (!days.length) return 0;
  let longest = 1;
  let current = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previous = parseDateKey(days[index - 1]);
    const date = parseDateKey(days[index]);
    const diffDays = Math.round((date - previous) / 86400000);
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
};

const buildMonthlyBars = (records) => {
  const today = parseDateKey(now());
  const months = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (4 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: `${date.getMonth() + 1}月`,
      dates: new Set(),
      duration_minutes: 0
    };
  });
  const monthMap = new Map(months.map((item) => [item.key, item]));
  records.forEach((record) => {
    const date = dateKey(record.created_at);
    const month = monthMap.get(date.slice(0, 7));
    if (!month) return;
    month.dates.add(date);
    month.duration_minutes += recordDuration(record);
  });
  const fallbackDuration = Number(state.todayPlan?.duration_minutes) || 0;
  return months.map((item) => ({
    label: item.label,
    session_days: item.dates.size,
    duration_minutes: item.duration_minutes || (item.dates.size ? item.dates.size * fallbackDuration : 0)
  }));
};

const buildCalendarAnalytics = (range = "month", month) => {
  const records = recordsForRange(range, month);
  const sessions = sessionsForRange(range, month);
  const groups = records.reduce((acc, record) => {
    const date = dateKey(record.created_at);
    if (!acc[date]) {
      acc[date] = {
        date,
        session_ids: new Set(),
        set_count: 0,
        total_volume: 0,
        duration_minutes: 0,
        body_parts: new Set(),
        type: "strength"
      };
    }
    const exercise = findExercise(record.exercise_id);
    acc[date].session_ids.add(record.session_id ?? "session_local_001");
    acc[date].set_count += 1;
    acc[date].total_volume += (Number(record.weight) || 0) * (Number(record.reps) || 0);
    acc[date].duration_minutes += Number(record.duration_minutes) || 0;
    exercise.target_body_parts_beginner.forEach((part) => acc[date].body_parts.add(part));
    if (Number(record.duration_minutes) > 0) acc[date].type = "cardio";
    return acc;
  }, {});
  sessions.forEach((session) => {
    const date = dateKey(session.started_at);
    if (month && !date.startsWith(month)) return;
    if (!groups[date]) {
      groups[date] = {
        date,
        session_ids: new Set(),
        set_count: 0,
        total_volume: 0,
        duration_minutes: 0,
        body_parts: new Set(),
        type: "strength"
      };
    }
    groups[date].session_ids.add(session.session_id);
    groups[date].duration_minutes += sessionDuration(session, records.filter((record) => record.session_id === session.session_id));
  });
  const entries = Object.values(groups).map((entry) => ({
    date: entry.date,
    session_count: entry.session_ids.size,
    set_count: entry.set_count,
    total_volume: entry.total_volume,
    duration_minutes: entry.duration_minutes,
    body_parts: Array.from(entry.body_parts).slice(0, 4),
    type: entry.type
  }));
  return {
    range,
    date: month ? `${month}-01` : new Date().toISOString().slice(0, 10),
    entries
  };
};

const buildOverviewAnalytics = (range = "month") => {
  const records = recordsForRange(range);
  const sessions = sessionsForRange(range);
  const totalVolume = records.reduce((sum, record) => sum + (Number(record.weight) || 0) * (Number(record.reps) || 0), 0);
  const duration = estimatedRangeDuration(records) || sessions.reduce((sum, session) => sum + sessionDuration(session), 0);
  const trainedDates = new Set(records.map((record) => dateKey(record.created_at)));
  sessions.forEach((session) => {
    if (records.some((record) => record.session_id === session.session_id) || session.status === "completed") {
      trainedDates.add(dateKey(session.started_at));
    }
  });
  const bodyPartCounts = records.reduce((acc, record) => {
    findExercise(record.exercise_id).target_body_parts_beginner.forEach((part) => {
      acc[part] = (acc[part] ?? 0) + 1;
    });
    return acc;
  }, {});
  const bodyParts = Object.entries(bodyPartCounts)
    .map(([body_part, set_count]) => ({
      body_part,
      focus_score: records.length ? Math.min(1, Number(set_count) / records.length) : 0,
      set_count: Number(set_count)
    }))
    .sort((a, b) => b.set_count - a.set_count);
  return {
    range,
    session_days: trainedDates.size,
    set_count: records.length,
    total_volume: totalVolume,
    duration_minutes: duration,
    body_parts: bodyParts,
    longest_streak_days: longestStreakDays(records),
    monthly_bars: buildMonthlyBars(state.setRecords)
  };
};

const replacementExerciseFor = (exerciseId) => {
  const exercise = getExerciseById(exerciseId);
  const partText = exercise?.target_body_parts_beginner.join("") ?? "";
  const candidates = exerciseLibrary.filter((candidate) => {
    if (candidate.exercise_id === exerciseId || candidate.exercise_id === "ex_treadmill_warmup") return false;
    if (!partText) return true;
    return candidate.target_body_parts_beginner.some((part) => partText.includes(part) || part.includes(partText.slice(0, 1)));
  });
  return candidates[0] ?? exerciseLibrary.find((item) => item.exercise_id !== exerciseId && item.exercise_id !== "ex_treadmill_warmup") ?? exerciseLibrary[1];
};

const routes = {
  async "GET /api/health"(_req, res) {
    ok(res, { status: "ok", time: now() });
  },

  async "GET /api/user/profile"(_req, res) {
    ok(res, state.user);
  },

  async "PATCH /api/user/profile"(req, res) {
    const body = await readBody(req);
    state.user = { ...state.user, ...body };
    if (state.user.onboarding_completed) {
      state.user.training_profile_completed = true;
    }
    persistState();
    ok(res, state.user);
  },

  async "POST /api/user/reset"(_req, res) {
    resetState();
    ok(res, { reset: true, profile: { user_id: state.user.user_id, nickname: state.user.nickname } });
  },

  async "POST /api/onboarding/training-profile"(req, res) {
    const body = await readBody(req);
    const weeklyFrequency = Math.min(7, Math.max(1, Number(body.weekly_frequency) || state.user.weekly_frequency || 3));
    state.user = {
      ...state.user,
      fitness_goal: body.fitness_goal ?? state.user.fitness_goal,
      split_preference: body.split_preference ?? state.user.split_preference,
      weekly_frequency: weeklyFrequency,
      focus_body_parts: Array.isArray(body.focus_body_parts) && body.focus_body_parts.length ? body.focus_body_parts : state.user.focus_body_parts,
      experience_level: body.experience_level ?? state.user.experience_level,
      training_profile_completed: true,
      onboarding_completed: Boolean(body.onboarding_completed ?? state.user.onboarding_completed)
    };
    state.trainingPlan = buildTrainingPlan(state.user);
    persistState();
    ok(res, { profile_saved: true, ...state.trainingPlan });
  },

  async "GET /api/training-plans/current"(_req, res) {
    ok(res, state.trainingPlan);
  },

  async "POST /api/workout/today/generate"(req, res) {
    const body = await readBody(req);
    const plan = generateTodayPlan(body);
    persistState();
    ok(res, plan);
  },

  async "GET /api/workout/today"(_req, res) {
    ok(res, requireTodayPlan());
  },

  async "PATCH /api/workout/today/exercises"(req, res) {
    const body = await readBody(req);
    const plan = requireMatchingPlan(body.plan_id);
    const exerciseIds = normalizeExerciseIds(body.exercise_ids);
    state.todayPlan = {
      ...plan,
      exercises: createPlanExercises(exerciseIds),
      status: "confirmed"
    };
    persistState();
    ok(res, state.todayPlan);
  },

  async "PATCH /api/workout/today/intensity"(req, res) {
    const body = await readBody(req);
    const plan = requireMatchingPlan(body.plan_id);
    requireMatchingSession(body.session_id);
    const intensity = normalizeIntensity(body.intensity);
    state.todayPlan = {
      ...plan,
      intensity,
      generated_reason: `${plan.generated_reason ?? "根据整体偏好和本次训练选择生成。"} 已根据训练中反馈调整强度。`
    };
    if (state.currentSession) {
      state.currentSession = {
        ...state.currentSession,
        last_feedback: intensity === "low"
          ? "已经把今天强度降下来。先把动作做稳，重量可以保守一点。"
          : intensity === "high"
            ? "已经把今天强度调高，注意动作质量优先。"
            : "已经把今天强度调到适中。"
      };
      upsertWorkoutSession(state.currentSession);
    }
    persistState();
    ok(res, {
      success: true,
      saved: 0,
      message: "今日训练强度已调整。",
      plan: state.todayPlan,
      session: state.currentSession
    });
  },

  async "GET /api/exercises"(_req, res, context) {
    const bodyPart = context.searchParams.get("body_part");
    const difficulty = context.searchParams.get("difficulty");
    const equipmentId = context.searchParams.get("equipment_id");
    const exercises = exerciseLibrary.filter((exercise) => {
      if (bodyPart && !exercise.target_body_parts_beginner.join("").includes(bodyPart)) return false;
      if (difficulty && exercise.difficulty !== difficulty) return false;
      if (equipmentId && exercise.equipment_id !== equipmentId) return false;
      return true;
    });
    ok(res, exercises);
  },

  async "POST /api/workout-sessions"(req, res) {
    const body = await readBody(req);
    const plan = requireMatchingPlan(body.daily_workout_plan_id);
    const requestedExerciseId = body.initial_exercise_id;
    if (requestedExerciseId) {
      requireExercise(requestedExerciseId);
      requirePlanExercise(requestedExerciseId);
    }
    const firstExerciseId = requestedExerciseId ?? plan.exercises[0]?.exercise_id;
    if (!firstExerciseId) {
      throw new ApiError(400, "empty_today_plan", "today plan must include at least one exercise");
    }
    state.currentSession = {
      session_id: `session_${randomUUID()}`,
      user_id: USER_ID,
      daily_workout_plan_id: plan.plan_id,
      status: "in_progress",
      current_exercise_id: firstExerciseId,
      started_at: now(),
      ended_at: null,
      last_feedback: null
    };
    state.todayPlan = {
      ...plan,
      status: "in_progress",
      exercises: plan.exercises.map((item, index) => ({
        ...item,
        status: item.exercise_id === firstExerciseId || (!requestedExerciseId && index === 0) ? "current" : "pending"
      }))
    };
    upsertWorkoutSession(state.currentSession);
    persistState();
    created(res, state.currentSession);
  },

  async "GET /api/workout-sessions"(_req, res) {
    ok(res, state.workoutSessions.map(summarizeWorkoutSession));
  },

  async "GET /api/workout-sessions/current"(_req, res) {
    ok(res, state.currentSession);
  },

  async "PATCH /api/workout-sessions/current/end"(_req, res) {
    if (state.currentSession) {
      state.currentSession = {
        ...state.currentSession,
        status: "abandoned",
        ended_at: now(),
        last_feedback: "已结束本次训练，已经记录的内容会保留在记录页里。"
      };
      upsertWorkoutSession(state.currentSession);
    }
    if (state.todayPlan) {
      state.todayPlan = { ...state.todayPlan, status: "abandoned" };
    }
    persistState();
    ok(res, state.currentSession);
  },

  async "PATCH /api/workout-sessions/current/exercise"(req, res) {
    const body = await readBody(req);
    const exerciseId = body.exercise_id;
    if (!exerciseId) {
      fail(res, 400, "missing_exercise_id", "exercise_id is required");
      return;
    }
    requireExercise(exerciseId);
    requireMatchingSession(body.session_id);
    requirePlanExercise(exerciseId);
    if (state.currentSession) {
      state.currentSession = {
        ...state.currentSession,
        current_exercise_id: exerciseId
      };
      upsertWorkoutSession(state.currentSession);
    }
    if (state.todayPlan) {
      state.todayPlan = {
        ...state.todayPlan,
        exercises: state.todayPlan.exercises.map((item) => {
          if (item.status === "completed") return item;
          return { ...item, status: item.exercise_id === exerciseId ? "current" : "pending" };
        })
      };
    }
    persistState();
    ok(res, state.currentSession);
  },

  async "POST /api/workout/add-exercise"(req, res) {
    const body = await readBody(req);
    const exerciseId = body.exercise_id;
    const exercise = requireExercise(exerciseId);
    const plan = requireMatchingPlan(body.plan_id);
    const exists = plan.exercises.some((item) => item.exercise_id === exerciseId);
    if (!exists) {
      state.todayPlan = {
        ...plan,
        exercises: [
          ...plan.exercises,
          {
            exercise_id: exercise.exercise_id,
            sets: exercise.default_sets,
            reps: exercise.default_reps,
            weight_strategy: "trial_based",
            status: "pending"
          }
        ]
      };
    }
    persistState();
    ok(res, {
      plan_id: state.todayPlan.plan_id,
      exercise_id: exerciseId,
      position: state.todayPlan.exercises.findIndex((item) => item.exercise_id === exerciseId) + 1,
      message: "已加入今日训练",
      plan: state.todayPlan
    });
  },

  async "POST /api/workout/replace-exercise"(req, res) {
    const body = await readBody(req);
    const plan = requireMatchingPlan(body.plan_id);
    const fromExerciseId = body.from_exercise_id;
    const toExerciseId = body.to_exercise_id;
    if (fromExerciseId) requireExercise(fromExerciseId);
    const replacement = requireExercise(toExerciseId);
    const fromIndex = plan.exercises.findIndex((item) => item.exercise_id === fromExerciseId);
    const fromItem = plan.exercises[fromIndex];
    const filtered = plan.exercises.filter((item) => item.exercise_id !== fromExerciseId && item.exercise_id !== toExerciseId);
    const replacementItem = {
      exercise_id: replacement.exercise_id,
      sets: replacement.default_sets,
      reps: replacement.default_reps,
      weight_strategy: "trial_based",
      status: fromItem?.status ?? "pending"
    };
    const insertIndex = fromIndex >= 0 ? Math.min(fromIndex, filtered.length) : filtered.length;
    state.todayPlan = {
      ...plan,
      exercises: [
        ...filtered.slice(0, insertIndex),
        replacementItem,
        ...filtered.slice(insertIndex)
      ]
    };
    if (state.currentSession && (state.currentSession.current_exercise_id === fromExerciseId || replacementItem.status === "current")) {
      state.currentSession.current_exercise_id = toExerciseId;
      state.currentSession.last_feedback = `已经把当前动作替换为${replacement.name_cn}。`;
      upsertWorkoutSession(state.currentSession);
    }
    persistState();
    ok(res, {
      plan_id: state.todayPlan.plan_id,
      from_exercise_id: fromExerciseId,
      to_exercise_id: toExerciseId,
      message: `已替换为${replacement.name_cn}`,
      plan: state.todayPlan,
      session: state.currentSession
    });
  },

  async "POST /api/workout/log/parse"(req, res) {
    const body = await readBody(req);
    const exerciseId = body.exercise_id ?? "ex_lat_pulldown";
    requireExercise(exerciseId);
    requireMatchingSession(body.session_id);
    ok(res, parseNaturalRecord(body.text ?? "", exerciseId, body.session_id));
  },

  async "GET /api/workout/log"(_req, res, context) {
    const sessionId = context.searchParams.get("session_id");
    const records = sessionId
      ? state.setRecords.filter((record) => record.session_id === sessionId)
      : state.setRecords;
    ok(res, records);
  },

  async "GET /api/workout/insights"(_req, res) {
    ok(res, state.trainingInsights.slice(0, 20));
  },

  async "POST /api/workout/log"(req, res) {
    const body = await readBody(req);
    if (!Array.isArray(body.records) || !body.records.length) {
      throw new ApiError(400, "missing_records", "records must include at least one set record");
    }
    const requestedSessionId = body.session_id
      ?? body.records.find((record) => record.session_id)?.session_id
      ?? state.currentSession?.session_id
      ?? "session_local_001";
    requireMatchingSession(requestedSessionId);
    const hasRecordSessionMismatch = body.records.some((record) => record.session_id && record.session_id !== requestedSessionId);
    if (hasRecordSessionMismatch) {
      throw new ApiError(409, "session_mismatch", "record session_id must match request session_id");
    }
    const records = (body.records ?? []).map((record, index) => ({
      record_id: record.record_id,
      ...record,
      session_id: requestedSessionId,
      set_index: record.set_index ?? index + 1,
      created_at: now()
    }));
    records.forEach((record) => requireExercise(record.exercise_id));
    state.setRecords = upsertSetRecords(state.setRecords, records);
    recordTrainingInsights(records);
    const currentExerciseId = records[0]?.exercise_id;
    const shouldAdvancePlan = Boolean(
      currentExerciseId
        && state.todayPlan
        && (!state.currentSession || state.currentSession.current_exercise_id === currentExerciseId)
        && state.todayPlan.exercises.some((item) => item.exercise_id === currentExerciseId)
    );
    if (shouldAdvancePlan) {
      const currentIndex = state.todayPlan.exercises.findIndex((item) => item.exercise_id === currentExerciseId);
      const nextIndex = state.todayPlan.exercises.findIndex((item, index) => index > currentIndex && item.status !== "completed");
      state.todayPlan.exercises = state.todayPlan.exercises.map((item, index) => {
        if (index === currentIndex) return { ...item, status: "completed" };
        if (index === nextIndex) return { ...item, status: "current" };
        return item.status === "current" ? { ...item, status: "pending" } : item;
      });
      if (state.currentSession) {
        state.currentSession.current_exercise_id = nextIndex >= 0 ? state.todayPlan.exercises[nextIndex].exercise_id : currentExerciseId;
        state.currentSession.last_feedback = "这组记好了，动作也完成了。补口水，下一组继续稳住。";
        if (nextIndex < 0) {
          state.currentSession.status = "completed";
          state.currentSession.ended_at = now();
          state.todayPlan.status = "completed";
          state.currentSession.last_feedback = "今天这组训练完成啦，记得补水和拉伸。";
        }
        upsertWorkoutSession(state.currentSession);
      }
    }
    persistState();
    ok(res, {
      success: true,
      saved: records.length,
      message: "收到，我帮你记好了。这次记录已保存。",
      plan: state.todayPlan,
      session: state.currentSession
    });
  },

  async "GET /api/analytics/calendar"(_req, res, context) {
    ok(res, buildCalendarAnalytics(context.searchParams.get("range") ?? "month", context.searchParams.get("month")));
  },

  async "GET /api/analytics/overview"(_req, res, context) {
    ok(res, buildOverviewAnalytics(context.searchParams.get("range") ?? "month"));
  },

  async "POST /api/equipment/scan"(req, res) {
    const body = await readBody(req);
    requireMatchingPlan(body.today_plan_id);
    const scanId = `scan_${randomUUID()}`;
    const imageAsset = createMediaAsset({
      purpose: "scan",
      data_url: body.data_url,
      file_data_url: body.file_data_url,
      image_url: body.image_url,
      mime_type: body.mime_type ?? "image/jpeg"
    });
    const scenario = body.scenario ?? (String(body.image_url ?? "").includes("low") ? "low" : String(body.image_url ?? "").includes("medium") ? "medium" : "high");
    const exercise = findExercise(scenario === "medium" ? "ex_seated_row" : "ex_lat_pulldown");
    const equipment = scenario === "low" ? findEquipment("eq_unknown") : findEquipment(scenario === "medium" ? "eq_seated_row" : "eq_lat_pulldown");
    const confidence = scenario === "low" ? 0.48 : scenario === "medium" ? 0.72 : 0.92;
    const result = {
      scan_id: scanId,
      image_asset_id: imageAsset.asset_id,
      image_url: imageAsset.url,
      created_at: now(),
      recognized: scenario !== "low",
      confidence,
      equipment,
      target_body_parts_beginner: equipment.target_body_parts_beginner,
      target_muscles: equipment.target_muscles,
      beginner_friendly: equipment.beginner_friendly,
      risk_level: equipment.risk_level,
      recommended_exercises: scenario === "low" ? [] : [{ exercise_id: exercise.exercise_id, name_cn: exercise.name_cn, difficulty: exercise.difficulty }],
      today_recommendation: {
        recommended: scenario !== "low",
        reason: scenario === "low"
          ? "我还不太确定这是哪台器械，需要再拍一张正面、说明牌或把手位置。"
          : scenario === "medium"
            ? "可能适合作为今天的背部动作。你可以先确认器械是不是坐姿划船，再加入训练。"
            : "适合作为今天训练的背部动作，建议热身后做。",
        suggested_sets: scenario === "low" ? 0 : exercise.default_sets,
        suggested_reps: scenario === "low" ? "0" : exercise.default_reps
      },
      user_facing_summary: scenario === "low"
        ? "我还不太确定这是哪台器械。你可以再拍一张器械正面、说明牌或把手位置，我会再帮你看。"
        : scenario === "medium"
          ? "这可能是坐姿划船器，主要练背中间。小铁还想让你确认一下器械正面。"
          : "这是一台练背为主的下拉器械，新手可以用它学习背部发力。",
      need_more_photo: scenario === "low"
    };
    state.scanRecords.push({ id: scanId, image_asset_id: imageAsset.asset_id, image_url: imageAsset.url, result, created_at: result.created_at });
    persistState();
    ok(res, result);
  },

  async "GET /api/equipment/scans/latest"(_req, res) {
    const latest = state.scanRecords.filter((record) => record.result).at(-1);
    ok(res, latest?.result ?? null);
  },

  async "POST /api/equipment/scan-feedback"(req, res) {
    const body = await readBody(req);
    const feedback = {
      feedback_id: `feedback_${randomUUID()}`,
      user_id: body.user_id ?? USER_ID,
      feedback: body.feedback ?? "",
      actual_equipment_name: body.actual_equipment_name ?? null,
      scan_result: body.scan_result ?? null,
      created_at: now()
    };
    state.scanFeedbackRecords.push(feedback);
    persistState();
    ok(res, {
      feedback_id: feedback.feedback_id,
      message: "收到，我会把这条反馈用于修正这次识别记录。"
    });
  },

  async "POST /api/body-photo/analyze"(req, res) {
    if (!state.user.allow_body_photo_analysis) {
      throw new ApiError(403, "body_photo_analysis_not_allowed", "Enable body photo analysis before uploading a body photo");
    }
    const body = await readBody(req);
    const asset = body.image_asset_id
      ? requireMediaAsset(body.image_asset_id)
      : createMediaAsset({
        purpose: "body_photo",
        data_url: body.data_url,
        file_data_url: body.file_data_url,
        image_url: body.image_url,
        mime_type: body.mime_type ?? "image/jpeg"
      });
    const analysis = buildBodyPhotoAnalysis(asset);
    state.bodyPhotoAnalyses = [analysis, ...state.bodyPhotoAnalyses].slice(0, 20);
    persistState();
    created(res, analysis);
  },

  async "GET /api/body-photo/analyses/latest"(_req, res) {
    ok(res, state.bodyPhotoAnalyses[0] ?? null);
  },

  async "GET /api/assistant/messages"(_req, res) {
    ok(res, state.assistantMessages.slice(-20));
  },

  async "POST /api/assistant/messages"(req, res) {
    const body = await readBody(req);
    const message = body.message ?? "";
    const inputType = body.input_type === "voice" ? "voice" : "text";
    const sessionId = body.session_id ?? body.context?.session_id ?? state.currentSession?.session_id ?? null;
    const dailyWorkoutPlanId = body.daily_workout_plan_id ?? body.context?.plan_id ?? state.todayPlan?.plan_id ?? null;
    const context = body.context ?? {};
    const suggested = message.includes("占") || message.includes("替代");
    const needsIntensityDown = /太重|太累|强度.*高|降.*强度|轻一点|轻点/.test(message);
    const currentExerciseId = context.current_exercise_id ?? state.currentSession?.current_exercise_id ?? "ex_lat_pulldown";
    const replacement = replacementExerciseFor(currentExerciseId);
    const suggestedActions = [
      ...(suggested ? [{ type: "replace_exercise", from_exercise_id: currentExerciseId, to_exercise_id: replacement.exercise_id, label: `替换为${replacement.name_cn}` }] : []),
      ...(needsIntensityDown ? [{ type: "adjust_intensity", intensity: "low", label: "降低今日强度" }] : [])
    ];
    const data = {
      message_id: `msg_${randomUUID()}`,
      reply: suggested
        ? `可以换成${replacement.name_cn}，训练部位接近，也更容易保持稳定发力。`
        : needsIntensityDown
          ? "收到，今天先把强度降下来。你可以降低重量、少做一组，优先保证动作稳定。"
        : "收到，我会结合今天的计划和你的体感帮你调整。",
      suggested_actions: suggestedActions
    };
    state.assistantMessages.push(
      {
        id: `user_${randomUUID()}`,
        role: "user",
        message,
        input_type: inputType,
        session_id: sessionId,
        daily_workout_plan_id: dailyWorkoutPlanId,
        context,
        created_at: now()
      },
      {
        id: data.message_id,
        role: "assistant",
        message: data.reply,
        input_type: inputType,
        session_id: sessionId,
        daily_workout_plan_id: dailyWorkoutPlanId,
        context,
        created_at: now(),
        suggested_actions: data.suggested_actions
      }
    );
    state.assistantMessages = state.assistantMessages.slice(-20);
    persistState();
    ok(res, data);
  },

  async "POST /api/media/upload"(req, res) {
    const body = await readBody(req);
    const asset = createMediaAsset({
      purpose: body.purpose ?? "avatar",
      data_url: body.data_url,
      file_data_url: body.file_data_url,
      image_url: body.image_url,
      mime_type: body.mime_type ?? "image/png"
    });
    persistState();
    created(res, asset);
  }
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { success: true });
    return;
  }

  try {
    const context = parsePath(req);
    const routeKey = `${req.method} ${context.pathname}`;
    const exerciseMatch = context.pathname.match(/^\/api\/exercises\/([^/]+)$/);

    if (routes[routeKey]) {
      await routes[routeKey](req, res, context);
      return;
    }

    if (req.method === "GET" && exerciseMatch) {
      const exercise = requireExercise(exerciseMatch[1]);
      ok(res, exercise);
      return;
    }

    fail(res, 404, "not_found", `No route for ${routeKey}`);
  } catch (error) {
    if (error instanceof ApiError) {
      fail(res, error.status, error.code, error.message);
      return;
    }
    fail(res, 500, "internal_error", error instanceof Error ? error.message : "Unknown error");
  }
});

server.listen(PORT, () => {
  console.log(`Tiezi API server listening on http://localhost:${PORT}`);
});
