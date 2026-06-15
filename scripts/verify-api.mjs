const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";
import { existsSync } from "node:fs";
import { join } from "node:path";

const request = async (path, options = {}) => {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...(options.headers ?? {}) },
    ...options
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${JSON.stringify(payload)}`);
  }
  return payload.data;
};

const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });
const patch = (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) });
const expectFailure = async (path, options, code) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options
  });
  const payload = await response.json();
  assert(!response.ok || payload.success === false, `${options.method ?? "GET"} ${path} should fail`);
  assert(payload.error?.code === code, `${path} should fail with ${code}`);
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

for (const exerciseId of ["ex_treadmill_warmup", "ex_lat_pulldown", "ex_chest_press", "ex_seated_row", "ex_leg_press", "ex_plank"]) {
  assert(existsSync(join(process.cwd(), "public", "assets", "videos", `${exerciseId}.gif`)), `${exerciseId} gif media should exist`);
  assert(existsSync(join(process.cwd(), "public", "assets", "videos", `${exerciseId}.jpg`)), `${exerciseId} poster media should exist`);
}

await request("/api/health");
await post("/api/user/reset", {});

const emptyOverview = await request("/api/analytics/overview?range=month");
assert(emptyOverview.session_days === 0, "empty overview should not count unsaved sessions");
assert(emptyOverview.set_count === 0, "empty overview should not include set records");
const emptySessions = await request("/api/workout-sessions");
assert(emptySessions.length === 0, "reset state should not include workout session history");
await expectFailure("/api/body-photo/analyze", {
  method: "POST",
  body: JSON.stringify({ image_url: "data:image/jpeg;base64,blocked" })
}, "body_photo_analysis_not_allowed");

const profile = await patch("/api/user/profile", {
  nickname: "验证铁友",
  allow_body_photo_analysis: true,
  home_guide_seen: true
});
assert(profile.nickname === "验证铁友", "profile nickname should update");
assert(profile.allow_body_photo_analysis === true, "body photo analysis preference should update");
assert(profile.home_guide_seen === true, "home guide preference should update");

const trainingPlan = await post("/api/onboarding/training-profile", {
  fitness_goal: "muscle_gain",
  split_preference: "three",
  weekly_frequency: 4,
  focus_body_parts: ["背部"]
});
assert(trainingPlan.profile_saved, "training profile should be saved");
assert(trainingPlan.fitness_goal === "muscle_gain", "training plan should keep fitness goal");
assert(trainingPlan.split_preference === "three", "training plan should keep split preference");
assert(trainingPlan.weekly_structure.length === 4, "training plan should build one weekly structure item per frequency");
assert(trainingPlan.today_generation_hint.includes("背部"), "training plan should explain how today plan is generated");
const profileAfterTrainingProfile = await request("/api/user/profile");
assert(profileAfterTrainingProfile.training_profile_completed === true, "training profile step should be marked complete");
assert(profileAfterTrainingProfile.onboarding_completed === false, "training profile alone should not finish full onboarding");

const currentTrainingPlan = await request("/api/training-plans/current");
assert(currentTrainingPlan.summary.includes("每周 4 次"), "current training plan should reflect onboarding preferences");
assert(currentTrainingPlan.weekly_structure.length === 4, "current training plan should expose weekly structure");

const plan = await post("/api/workout/today/generate", {
  today_focus_part: "背部、胸部",
  today_focus_parts: ["背部", "胸部"],
  duration_minutes: 60,
  intensity: "medium"
});
assert(plan.exercises.length >= 4, "today plan should include exercises");
assert(plan.today_focus_part === "背部、胸部", "today plan should expose selected focus parts");
assert(plan.today_focus_parts.length === 2, "today plan should keep selected focus parts array");
assert(plan.exercises.some((item) => item.exercise_id === "ex_chest_press"), "multi-part today plan should merge chest exercises");
assert(plan.generated_reason.includes("本次选择 背部、胸部"), "today plan should carry generation reason from long-term plan");
const todayProfile = await patch("/api/user/profile", {
  today_focus_part: "背部、胸部",
  onboarding_completed: true
});
assert(todayProfile.today_focus_part === "背部、胸部", "today setup should persist selected focus part to profile");
assert(todayProfile.onboarding_completed === true, "today setup should finish full onboarding");

const currentTodayPlan = await request("/api/workout/today");
assert(currentTodayPlan.duration_minutes === 60, "today plan should be readable after generation");
assert(currentTodayPlan.exercises.every((item) => item.exercise_id), "today plan exercises should include ids");

const confirmedPlan = await patch("/api/workout/today/exercises", {
  plan_id: plan.plan_id,
  exercise_ids: plan.exercises.map((item) => item.exercise_id)
});
assert(confirmedPlan.status === "confirmed", "today plan should be confirmed");

const initialExerciseSession = await post("/api/workout-sessions", {
  daily_workout_plan_id: plan.plan_id,
  initial_exercise_id: "ex_seated_row"
});
assert(initialExerciseSession.current_exercise_id === "ex_seated_row", "session should support starting from a selected exercise");
const initialExercisePlan = await request("/api/workout/today");
assert(initialExercisePlan.exercises.find((item) => item.exercise_id === "ex_seated_row")?.status === "current", "selected start exercise should become current");

const session = await post("/api/workout-sessions", { daily_workout_plan_id: plan.plan_id });
assert(session.status === "in_progress", "session should start");
const sessionHistoryAfterStart = await request("/api/workout-sessions");
assert(sessionHistoryAfterStart.some((item) => item.session_id === session.session_id), "started session should appear in session history");

const switchedSession = await patch("/api/workout-sessions/current/exercise", {
  exercise_id: "ex_lat_pulldown"
});
assert(switchedSession.current_exercise_id === "ex_lat_pulldown", "current exercise should switch");

const highScan = await post("/api/equipment/scan", {
  scenario: "high",
  image_url: "high-test",
  today_plan_id: plan.plan_id
});
assert(highScan.recognized && highScan.confidence >= 0.8, "high confidence scan should recognize equipment");
assert(highScan.recommended_exercises.length > 0, "high confidence scan should include recommended exercises");
assert(highScan.scan_id && highScan.image_asset_id && highScan.image_url, "high confidence scan should keep media linkage");

const mediumScan = await post("/api/equipment/scan", {
  scenario: "medium",
  image_url: "medium-test",
  today_plan_id: plan.plan_id
});
assert(mediumScan.recognized && mediumScan.confidence < 0.8 && !mediumScan.need_more_photo, "medium confidence scan should ask for confirmation without retake");
assert(mediumScan.scan_id && mediumScan.image_asset_id, "medium confidence scan should keep media linkage");

const lowScan = await post("/api/equipment/scan", {
  scenario: "low",
  image_url: "low-test",
  today_plan_id: plan.plan_id
});
assert(lowScan.need_more_photo, "low confidence scan should request retake");
assert(lowScan.scan_id && lowScan.image_asset_id && lowScan.created_at, "low confidence scan should keep media linkage and timestamp");

const scanForm = new FormData();
scanForm.append("image", new Blob(["fake-image"], { type: "image/jpeg" }), "equipment.jpg");
scanForm.append("user_id", "user_local_001");
scanForm.append("today_plan_id", plan.plan_id);
scanForm.append("scenario", "medium");
const multipartScan = await request("/api/equipment/scan", {
  method: "POST",
  headers: {},
  body: scanForm
});
assert(multipartScan.recognized && multipartScan.confidence < 0.8, "multipart scan should parse scenario field");
assert(multipartScan.scan_id && multipartScan.image_asset_id, "multipart scan should keep media linkage");

const latestScan = await request("/api/equipment/scans/latest");
assert(latestScan.scan_id === multipartScan.scan_id, "latest scan should preserve multipart scan id");
assert(latestScan.image_asset_id === multipartScan.image_asset_id, "latest scan should preserve multipart image asset id");

const scanFeedback = await post("/api/equipment/scan-feedback", {
  feedback: "这其实是坐姿划船",
  actual_equipment_name: "坐姿划船",
  scan_result: lowScan
});
assert(scanFeedback.feedback_id, "scan feedback should return id");
const latestScanAfterFeedback = await request("/api/equipment/scans/latest");
assert(latestScanAfterFeedback.scan_id === multipartScan.scan_id, "scan feedback should not replace latest scan result");
assert(latestScanAfterFeedback.equipment?.equipment_id === "eq_seated_row", "latest scan should still return the latest multipart scan result");

const assistant = await post("/api/assistant/messages", {
  message: "高位下拉器械被占了，请给我替代动作",
  context: { current_exercise_id: "ex_lat_pulldown" }
});
assert(assistant.suggested_actions.length > 0, "assistant should suggest an action");
assert(assistant.suggested_actions[0].to_exercise_id !== "ex_lat_pulldown", "assistant replacement should not be a no-op");

const seatedRowAssistant = await post("/api/assistant/messages", {
  message: "这个器械被占了，换一个",
  context: { current_exercise_id: "ex_seated_row" }
});
assert(seatedRowAssistant.suggested_actions[0].to_exercise_id !== "ex_seated_row", "assistant should avoid replacing an exercise with itself");

const tiredAssistant = await post("/api/assistant/messages", {
  message: "今天太重太累了，帮我降一点强度",
  input_type: "voice",
  session_id: session.session_id,
  daily_workout_plan_id: plan.plan_id,
  context: { current_exercise_id: "ex_lat_pulldown" }
});
const intensityAction = tiredAssistant.suggested_actions.find((action) => action.type === "adjust_intensity");
assert(intensityAction?.intensity === "low", "assistant should suggest lowering intensity when user is tired");

const adjustedIntensity = await patch("/api/workout/today/intensity", {
  plan_id: plan.plan_id,
  session_id: session.session_id,
  intensity: intensityAction.intensity
});
assert(adjustedIntensity.plan.intensity === "low", "intensity action should update today plan");
assert(adjustedIntensity.session.last_feedback.includes("强度"), "intensity action should update session feedback");

const assistantMessages = await request("/api/assistant/messages");
assert(assistantMessages.some((message) => message.role === "user" && message.message.includes("器械被占")), "assistant history should include user message");
assert(assistantMessages.some((message) => message.role === "assistant" && message.suggested_actions?.length), "assistant history should include suggested actions");
const voiceAssistantMessage = assistantMessages.find((message) => message.role === "user" && message.message.includes("太重太累"));
assert(voiceAssistantMessage?.input_type === "voice", "assistant history should preserve voice input type");
assert(voiceAssistantMessage?.session_id === session.session_id, "assistant history should preserve session context");
assert(voiceAssistantMessage?.daily_workout_plan_id === plan.plan_id, "assistant history should preserve today plan context");
assert(voiceAssistantMessage?.context?.current_exercise_id === "ex_lat_pulldown", "assistant history should preserve raw assistant context");

const replacementAction = assistant.suggested_actions[0];
const replacedPlan = await post("/api/workout/replace-exercise", {
  from_exercise_id: replacementAction.from_exercise_id,
  to_exercise_id: replacementAction.to_exercise_id
});
assert(replacedPlan.plan.exercises.some((item) => item.exercise_id === replacementAction.to_exercise_id), "replacement exercise should be in plan");
assert(!replacedPlan.plan.exercises.some((item) => item.exercise_id === replacementAction.from_exercise_id), "replaced exercise should be removed from plan");
assert(replacedPlan.session.current_exercise_id === replacementAction.to_exercise_id, "replacement should update current exercise");

const exerciseDetail = await request("/api/exercises/ex_lat_pulldown");
assert(Boolean(exerciseDetail.video_url), "exercise detail should include video media");

const parsedWithSession = await post("/api/workout/log/parse", {
  session_id: session.session_id,
  exercise_id: "ex_treadmill_warmup",
  text: "跑步机热身 5 分钟 0.4 km"
});
assert(parsedWithSession.sets[0]?.session_id === session.session_id, "parsed records should keep supplied session id");

const addedExercise = await post("/api/workout/add-exercise", {
  exercise_id: "ex_leg_press"
});
assert(addedExercise.plan?.exercises?.some((item) => item.exercise_id === "ex_leg_press"), "add exercise should return updated plan");

const media = await post("/api/media/upload", {
  purpose: "avatar",
  mime_type: "image/png",
  data_url: "data:image/png;base64,abc123"
});
assert(media.url.startsWith("data:image/png"), "media should keep data url");
const avatarProfile = await patch("/api/user/profile", { avatar_url: media.url });
assert(avatarProfile.avatar_url === media.url, "uploaded avatar should be saved to profile");

const bodyPhotoAsset = await post("/api/media/upload", {
  purpose: "body_photo",
  mime_type: "image/jpeg",
  data_url: "data:image/jpeg;base64,bodyphoto123"
});
assert(bodyPhotoAsset.purpose === "body_photo", "body photo media should keep purpose");
const bodyPhotoAnalysis = await post("/api/body-photo/analyze", {
  image_asset_id: bodyPhotoAsset.asset_id
});
assert(bodyPhotoAnalysis.analysis_id, "body photo analysis should return id");
assert(bodyPhotoAnalysis.image_asset_id === bodyPhotoAsset.asset_id, "body photo analysis should link uploaded media asset");
assert(bodyPhotoAnalysis.recommended_exercises.length > 0, "body photo analysis should recommend exercises");
const latestBodyPhotoAnalysis = await request("/api/body-photo/analyses/latest");
assert(latestBodyPhotoAnalysis.analysis_id === bodyPhotoAnalysis.analysis_id, "latest body photo analysis should return newest analysis");

const sampleRecordForExercise = (exerciseId) => {
  if (exerciseId === "ex_treadmill_warmup") {
    return { exercise_id: exerciseId, set_index: 1, weight: 0, weight_unit: "kg", reps: 0, duration_minutes: 5, distance_km: 0.4 };
  }
  if (exerciseId === "ex_plank") {
    return { exercise_id: exerciseId, set_index: 1, weight: 0, weight_unit: "kg", reps: 20 };
  }
  if (exerciseId === "ex_seated_row") {
    return { exercise_id: exerciseId, set_index: 1, weight: 18, weight_unit: "kg", reps: 10, rpe_text: "有点累", user_note: "最后几下有点吃力" };
  }
  return { exercise_id: exerciseId, set_index: 1, weight: 22, weight_unit: "kg", reps: 10 };
};

const finalWorkoutPlanBeforeRecords = await request("/api/workout/today");
for (const planExercise of finalWorkoutPlanBeforeRecords.exercises) {
  await patch("/api/workout-sessions/current/exercise", {
    exercise_id: planExercise.exercise_id
  });
  const record = sampleRecordForExercise(planExercise.exercise_id);
  await post("/api/workout/log", { records: [record] });
}

await post("/api/workout/log", {
  records: [{ exercise_id: "ex_seated_row", set_index: 1, weight: 22, weight_unit: "kg", reps: 9 }]
});

const savedRecords = await request("/api/workout/log");
assert(savedRecords.length >= 4, "workout records should be readable from backend");
assert(savedRecords.some((record) => record.exercise_id === "ex_treadmill_warmup" && record.duration_minutes === 5), "cardio record should keep duration");
const sessionDetailRecords = await request(`/api/workout/log?session_id=${session.session_id}`);
assert(sessionDetailRecords.length >= 4, "session detail records should be readable by session id");
assert(sessionDetailRecords.every((record) => record.session_id === session.session_id), "session detail records should only include requested session");
const seatedRowRecords = savedRecords.filter((record) => record.exercise_id === "ex_seated_row" && record.set_index === 1);
assert(seatedRowRecords.length === 1, "same session/exercise/set should update instead of duplicating");
assert(seatedRowRecords[0].weight === 22 && seatedRowRecords[0].reps === 9, "updated set record should keep latest values");
const trainingInsights = await request("/api/workout/insights");
assert(trainingInsights.some((insight) => insight.flags.includes("tired")), "workout records should create training insights from fatigue feedback");

const finalSession = await request("/api/workout-sessions/current");
assert(finalSession.status === "completed", "session should complete after all exercises");
const sessionHistoryAfterCompletion = await request("/api/workout-sessions");
const completedSessionSummary = sessionHistoryAfterCompletion.find((item) => item.session_id === session.session_id);
assert(completedSessionSummary?.status === "completed", "completed session should update session history");
assert(completedSessionSummary.set_count >= 4, "session summary should include saved set count");
assert(completedSessionSummary.total_volume > 0, "session summary should include total volume");
assert(completedSessionSummary.duration_minutes >= 5, "session summary should include recorded duration");
assert(completedSessionSummary.body_parts.length > 0, "session summary should include body parts");

const insightAdjustedPlan = await post("/api/workout/today/generate", {
  today_focus_part: "背部",
  duration_minutes: 60,
  intensity: "high"
});
assert(insightAdjustedPlan.generated_reason.includes("最近组记录"), "today plan should explain recent training insight usage");
assert(insightAdjustedPlan.intensity !== "high", "recent fatigue insight should prevent high intensity plan");

const restartedSession = await post("/api/workout-sessions", { daily_workout_plan_id: insightAdjustedPlan.plan_id });
assert(restartedSession.status === "in_progress", "new session should start after completed session");
const restartedPlan = await request("/api/workout/today");
assert(restartedPlan.exercises.filter((item) => item.status === "completed").length === 0, "starting a new session should reset completed exercise statuses");
assert(restartedPlan.exercises[0]?.status === "current", "new session should set first exercise current");
const restartedSessionRecords = await request(`/api/workout/log?session_id=${restartedSession.session_id}`);
assert(restartedSessionRecords.length === 0, "new session should not inherit previous session records");
const allRecordsAfterRestart = await request("/api/workout/log");
assert(allRecordsAfterRestart.length >= savedRecords.length, "starting a new session should keep historical records");

const shortPlan = await post("/api/workout/today/generate", {
  today_focus_part: "胸部",
  duration_minutes: 30,
  intensity: "low"
});
await post("/api/workout-sessions", { daily_workout_plan_id: shortPlan.plan_id });
const endedSession = await patch("/api/workout-sessions/current/end", {});
assert(endedSession.status === "abandoned", "ending workout should mark current session abandoned");
const abandonedPlan = await request("/api/workout/today");
assert(abandonedPlan.status === "abandoned", "ending workout should mark today plan abandoned");
const sessionHistoryAfterEnd = await request("/api/workout-sessions");
assert(sessionHistoryAfterEnd.find((item) => item.session_id === endedSession.session_id)?.status === "abandoned", "ended session should update history status");

await expectFailure("/api/exercises/ex_missing", { method: "GET" }, "exercise_not_found");
await expectFailure("/api/workout/add-exercise", { method: "POST", body: JSON.stringify({ exercise_id: "ex_missing" }) }, "exercise_not_found");
await expectFailure("/api/workout/add-exercise", {
  method: "POST",
  body: JSON.stringify({ plan_id: "dwp_wrong", exercise_id: "ex_lat_pulldown" })
}, "plan_mismatch");
await expectFailure("/api/equipment/scan", {
  method: "POST",
  body: JSON.stringify({ today_plan_id: "dwp_wrong", scenario: "high", image_url: "high-test" })
}, "plan_mismatch");
await expectFailure("/api/workout/log", {
  method: "POST",
  body: JSON.stringify({
    records: [{ exercise_id: "ex_missing", set_index: 1, weight: 10, weight_unit: "kg", reps: 10 }]
  })
}, "exercise_not_found");
await expectFailure("/api/workout/log", {
  method: "POST",
  body: JSON.stringify({ records: [] })
}, "missing_records");
await expectFailure("/api/workout/log", {
  method: "POST",
  body: JSON.stringify({
    session_id: "session_wrong",
    records: [{ exercise_id: "ex_chest_press", set_index: 1, weight: 10, weight_unit: "kg", reps: 10 }]
  })
}, "session_mismatch");
await expectFailure("/api/workout/log", {
  method: "POST",
  body: JSON.stringify({
    session_id: endedSession.session_id,
    records: [{ session_id: "session_other", exercise_id: "ex_chest_press", set_index: 1, weight: 10, weight_unit: "kg", reps: 10 }]
  })
}, "session_mismatch");
await expectFailure("/api/workout/today/exercises", {
  method: "PATCH",
  body: JSON.stringify({ exercise_ids: [] })
}, "missing_exercise_ids");
await expectFailure("/api/workout/today/intensity", {
  method: "PATCH",
  body: JSON.stringify({ plan_id: "dwp_wrong", intensity: "low" })
}, "plan_mismatch");
await expectFailure("/api/workout/today/intensity", {
  method: "PATCH",
  body: JSON.stringify({ session_id: "session_wrong", intensity: "low" })
}, "session_mismatch");
await expectFailure("/api/workout-sessions/current/exercise", {
  method: "PATCH",
  body: JSON.stringify({ exercise_id: "ex_lat_pulldown" })
}, "exercise_not_in_plan");
await expectFailure("/api/workout-sessions/current/exercise", {
  method: "PATCH",
  body: JSON.stringify({ session_id: "session_wrong", exercise_id: "ex_chest_press" })
}, "session_mismatch");
await expectFailure("/api/workout-sessions", {
  method: "POST",
  body: JSON.stringify({ daily_workout_plan_id: abandonedPlan.plan_id, initial_exercise_id: "ex_leg_press" })
}, "exercise_not_in_plan");
await expectFailure("/api/user/profile", {
  method: "PATCH",
  body: "{broken"
}, "invalid_json");

const calendar = await request("/api/analytics/calendar?range=month");
assert(calendar.entries.length > 0, "calendar should include entries");
for (const range of ["day", "week", "month", "year"]) {
  const rangeCalendar = await request(`/api/analytics/calendar?range=${range}`);
  assert(rangeCalendar.range === range, `calendar should preserve ${range} range`);
  const rangeOverview = await request(`/api/analytics/overview?range=${range}`);
  assert(rangeOverview.range === range, `overview should preserve ${range} range`);
}

const filteredCalendar = await request("/api/analytics/calendar?range=month&month=2026-06");
assert(filteredCalendar.date === "2026-06-01", "calendar should honor month parameter");

const overview = await request("/api/analytics/overview?range=month");
assert(overview.set_count >= 4, "overview should include saved records");
assert(overview.body_parts.length > 0, "overview should include recorded body parts");
assert(overview.longest_streak_days >= 1, "overview should include longest streak");
assert(overview.monthly_bars.length === 5, "overview should return five monthly bars");
assert(overview.monthly_bars.some((item) => item.session_days > 0), "monthly bars should reflect saved records");

await post("/api/user/reset", {});
const resetProfile = await request("/api/user/profile");
assert(resetProfile.onboarding_completed === false, "reset should clear onboarding completion");
assert(resetProfile.training_profile_completed === false, "reset should clear training profile completion");
await expectFailure("/api/workout/log", {
  method: "POST",
  body: JSON.stringify({
    session_id: session.session_id,
    records: [{ exercise_id: "ex_lat_pulldown", set_index: 1, weight: 10, weight_unit: "kg", reps: 10 }]
  })
}, "session_mismatch");
const resetRecords = await request("/api/workout/log");
assert(resetRecords.length === 0, "reset should clear workout records");
const resetSessions = await request("/api/workout-sessions");
assert(resetSessions.length === 0, "reset should clear workout session history");
const resetLatestScan = await request("/api/equipment/scans/latest");
assert(resetLatestScan === null, "reset should clear latest scan result");
const resetAssistantMessages = await request("/api/assistant/messages");
assert(resetAssistantMessages.length === 0, "reset should clear assistant history");
const resetBodyPhotoAnalysis = await request("/api/body-photo/analyses/latest");
assert(resetBodyPhotoAnalysis === null, "reset should clear body photo analysis");

console.log("Tiezi API verification passed");
