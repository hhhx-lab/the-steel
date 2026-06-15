import { AlertTriangle, CheckCircle2, Mic, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { findExercise } from "../data/mockExercises";
import { useSpeechInput } from "../features/xiaotie/useSpeechInput";
import { getExerciseDetail, getWorkoutRecords, parseWorkoutLog, saveWorkoutLog } from "../services/tieziApi";
import { useWorkoutStore } from "../stores/workoutStore";
import type { SetRecord } from "../types/workout";

type LogMode = "natural" | "manual";

type ManualSet = Pick<SetRecord, "set_index" | "weight" | "reps" | "duration_minutes" | "distance_km">;

export function WorkoutLogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const currentExerciseId = useWorkoutStore((state) => state.currentExerciseId);
  const sessionId = useWorkoutStore((state) => state.session_id);
  const plan = useWorkoutStore((state) => state.plan);
  const saveRecordsToStore = useWorkoutStore((state) => state.saveRecords);
  const appendRecordsToStore = useWorkoutStore((state) => state.appendRecords);
  const setRecords = useWorkoutStore((state) => state.setRecords);
  const setPlan = useWorkoutStore((state) => state.setPlan);
  const setSession = useWorkoutStore((state) => state.setSession);
  const exerciseId = searchParams.get("exerciseId") ?? currentExerciseId;
  const { data: apiExercise } = useQuery({
    queryKey: ["exercise", exerciseId, "record"],
    queryFn: () => getExerciseDetail(exerciseId),
    enabled: Boolean(exerciseId)
  });
  const exercise = apiExercise ?? findExercise(exerciseId);
  const isCardioExercise = /跑步|热身|椭圆|有氧/.test(exercise.name_cn) || /分钟|秒/.test(exercise.default_reps);
  const defaultDuration = Number.parseInt(exercise.default_reps, 10) || 5;
  const defaultNaturalText = isCardioExercise
    ? `${exercise.name_cn}做了 ${defaultDuration} 分钟，0.5 km，感觉刚好。`
    : `${exercise.name_cn}做了三组，20 公斤，10、10、8，最后一组有点累。`;
  const quickOptions = isCardioExercise
    ? [
      `完成 ${defaultDuration} 分钟热身，身体已经热起来了。`,
      "走得很稳，呼吸还比较轻松。",
      "有点喘，但没有不舒服。"
    ]
    : [
      "很棒，目标部位发力明显！",
      "有点累，但坚持完成了。",
      "状态一般，下次继续加油。"
    ];
  const [mode, setMode] = useState<LogMode>("natural");
  const [naturalText, setNaturalText] = useState(defaultNaturalText);
  const [parsedRecords, setParsedRecords] = useState<SetRecord[]>([]);
  const [feedback, setFeedback] = useState<string>();
  const [safetyWarning, setSafetyWarning] = useState<string>();
  const [loading, setLoading] = useState(false);
  const voice = useSpeechInput((transcript) => setNaturalText(transcript));
  const [manualSets, setManualSets] = useState<ManualSet[]>(
    Array.from({ length: exercise.default_sets }, (_, index) => ({
      set_index: index + 1,
      weight: 20,
      reps: Number.parseInt(exercise.default_reps, 10) || 10,
      duration_minutes: Number.parseInt(exercise.default_reps, 10) || 5,
      distance_km: 0.5
    }))
  );
  const [manualFeeling, setManualFeeling] = useState("刚好");
  const [manualNote, setManualNote] = useState("");

  useEffect(() => {
    setManualSets(
      Array.from({ length: exercise.default_sets }, (_, index) => ({
        set_index: index + 1,
        weight: 20,
        reps: defaultDuration || 10,
        duration_minutes: defaultDuration,
        distance_km: 0.5
      }))
    );
    setNaturalText(defaultNaturalText);
    setParsedRecords([]);
    setFeedback(undefined);
    setSafetyWarning(undefined);
  }, [defaultDuration, defaultNaturalText, exercise.default_sets, exercise.exercise_id]);

  const createFallbackParsedRecords = (): SetRecord[] => {
    if (isCardioExercise) {
      return [{
        record_id: `fallback_${Date.now()}_1`,
        session_id: sessionId,
        exercise_id: exercise.exercise_id,
        set_index: 1,
        weight: 0,
        weight_unit: "kg",
        reps: 0,
        duration_minutes: defaultDuration,
        distance_km: 0.5,
        rpe_text: "刚好",
        user_note: naturalText
      }];
    }

    return Array.from({ length: Math.min(exercise.default_sets, 3) }, (_, index) => ({
      record_id: `fallback_${Date.now()}_${index + 1}`,
      session_id: sessionId,
      exercise_id: exercise.exercise_id,
      set_index: index + 1,
      weight: 20,
      weight_unit: "kg" as const,
      reps: index === 2 && naturalText.includes("累") ? 8 : 10,
      rpe_text: naturalText.includes("累") && index === 2 ? "有点累" : "刚好",
      user_note: index === 2 ? naturalText : undefined
    }));
  };

  const parseNatural = async () => {
    setLoading(true);
    try {
      const result = await parseWorkoutLog(naturalText, exercise.exercise_id, sessionId);
      setParsedRecords(result.sets);
      setFeedback(result.xiaotie_feedback);
      setSafetyWarning(result.safety_warning);
    } catch {
      setParsedRecords(createFallbackParsedRecords());
      setFeedback("后端暂时没连上，我先按默认训练草稿帮你整理。你可以直接改每一行再保存。");
      setSafetyWarning(/疼|痛|不舒服|旧伤|拉伤/.test(naturalText) ? "如果有疼痛、不适或旧伤，先停止训练，并咨询专业教练或医生。" : undefined);
    } finally {
      setLoading(false);
    }
  };

  const saveRecords = async (records: SetRecord[]) => {
    setLoading(true);
    let shouldShowAchievement = false;
    const recordExerciseId = records[0]?.exercise_id ?? exercise.exercise_id;
    const currentIndex = plan.exercises.findIndex((item) => item.exercise_id === recordExerciseId);
    const hasLaterPending = plan.exercises.some((item, index) => index > currentIndex && item.status !== "completed");
    shouldShowAchievement = currentIndex >= 0 && !hasLaterPending;
    try {
      const result = await saveWorkoutLog(records);
      const usedBackendState = Boolean(result.plan) || result.session !== undefined;
      shouldShowAchievement = result.plan?.status === "completed" || result.session?.status === "completed" || shouldShowAchievement;
      if (result.plan) {
        setPlan(result.plan);
        queryClient.setQueryData(["today-workout"], result.plan);
      }
      if (result.session !== undefined) {
        setSession(result.session);
        queryClient.setQueryData(["workout-session-current"], result.session);
      }
      if (usedBackendState) {
        const nextSessionId = result.session?.session_id ?? records[0]?.session_id ?? sessionId;
        const latestRecords = await getWorkoutRecords(nextSessionId);
        setRecords(latestRecords);
        appendRecordsToStore([], result.session?.last_feedback ?? result.message);
      } else {
        saveRecordsToStore(records, result.message);
      }
    } catch {
      saveRecordsToStore(records, "后端暂时没连上，已先保存在本地训练里。");
    } finally {
      setLoading(false);
      navigate(shouldShowAchievement ? "/workout/complete" : "/workout/session");
    }
  };

  const saveManual = () => {
    const records = manualSets.map((set, index) => ({
      record_id: `manual_${Date.now()}_${index + 1}`,
      session_id: sessionId,
      exercise_id: exercise.exercise_id,
      set_index: index + 1,
      weight: isCardioExercise ? 0 : Number(set.weight) || 0,
      weight_unit: "kg" as const,
      reps: isCardioExercise ? 0 : Number(set.reps) || 0,
      duration_minutes: isCardioExercise ? Number(set.duration_minutes) || 0 : undefined,
      distance_km: isCardioExercise ? Number(set.distance_km) || 0 : undefined,
      rpe_text: manualFeeling,
      user_note: manualNote
    }));
    void saveRecords(records);
  };

  const updateManualSet = (index: number, key: keyof Pick<ManualSet, "weight" | "reps" | "duration_minutes" | "distance_km">, value: string) => {
    setManualSets((sets) => sets.map((set, setIndex) => (setIndex === index ? { ...set, [key]: Number(value) || 0 } : set)));
  };

  const addManualSet = () => {
    setManualSets((sets) => {
      const previous = sets.at(-1);
      return [
        ...sets,
        {
          set_index: sets.length + 1,
          weight: previous?.weight ?? 20,
          reps: previous?.reps ?? (Number.parseInt(exercise.default_reps, 10) || 10),
          duration_minutes: previous?.duration_minutes ?? (Number.parseInt(exercise.default_reps, 10) || 5),
          distance_km: previous?.distance_km ?? 0.5
        }
      ];
    });
  };

  const removeManualSet = (index: number) => {
    setManualSets((sets) => sets.filter((_, setIndex) => setIndex !== index).map((set, setIndex) => ({ ...set, set_index: setIndex + 1 })));
  };

  const updateParsed = (index: number, key: keyof SetRecord, value: string) => {
    setParsedRecords((records) =>
      records.map((record, recordIndex) => {
        if (recordIndex !== index) return record;
        if (key === "weight" || key === "reps" || key === "duration_minutes" || key === "distance_km") {
          return { ...record, [key]: Number(value) || 0 };
        }
        return { ...record, [key]: value };
      })
    );
  };

  return (
    <AppShell>
      <TopBar title={mode === "natural" ? "一句话记录" : "手动记录"} backTo="/workout/session" />

      <section className="prompt-card">
        <p className="kicker">今天的训练感觉如何？</p>
        <h1 className="hero-title text-[25px]">{mode === "natural" ? "用一句话记下来" : "逐组精确记录"}</h1>
        <p className="support text-[13px]">当前动作：{exercise.name_cn} · 建议 {exercise.default_sets} 组</p>

        <SegmentedControl
          value={mode}
          options={[
            { label: "一句话", value: "natural" },
            { label: "手动记录", value: "manual" }
          ]}
          onChange={setMode}
        />

        {mode === "natural" ? (
          <>
            <div className="quick-options">
              {quickOptions.map((text) => (
                <button className="option" key={text} type="button" onClick={() => setNaturalText(text)}>{text}</button>
              ))}
            </div>

            <div className="input-shell">
              <textarea
                className="record-input"
                aria-label="训练记录输入"
                value={naturalText}
                onChange={(event) => setNaturalText(event.target.value)}
              />
              <span className="input-mode">{voice.recording ? "正在听你说" : voice.supported ? "可打字，也可语音输入" : "当前浏览器可打字输入"}</span>
              <button className={`voice-btn ${voice.recording ? "recording" : ""}`} type="button" onClick={voice.toggle} aria-label="语音输入">
                <Mic size={18} />
              </button>
            </div>
            {voice.voiceMessage ? <p className="voice-status">{voice.voiceMessage}</p> : null}

            <Button className="full mt-3" onClick={() => void parseNatural()} disabled={loading}>
              {loading ? "整理中..." : "让小铁帮我整理"}
            </Button>

            {safetyWarning ? (
              <Card className="mt-3 border-red-100 bg-red-50">
                <div className="flex gap-3">
                  <AlertTriangle className="shrink-0 text-[var(--danger)]" size={22} />
                  <p className="m-0 text-sm font-semibold leading-6 text-[var(--muted)]">{safetyWarning}</p>
                </div>
              </Card>
            ) : null}

            {parsedRecords.length ? (
              <section className="parsed">
                <div className="avatar-chip">
                  <img className="avatar" src="/assets/cutouts/xiaotie-male-head-cutout.png" alt="小铁" />
                  <div>
                    <p className="row-title">{safetyWarning ? "安全提醒" : "小铁已整理，确认后保存"}</p>
                    <p className="row-sub">{feedback ?? "这次记录已经整理好。确认每一行没问题后保存，小铁会把它放进今日训练记录。"}</p>
                  </div>
                </div>
                <div className="summary-table">
                  <div className="head">组</div><div className="head">{isCardioExercise ? "时间" : "重量"}</div><div className="head">{isCardioExercise ? "距离" : "次数"}</div>
                  {parsedRecords.map((record, index) => (
                    <div className="contents" key={record.record_id}>
                      <div>{record.set_index}</div>
                      <div>
                        <input
                          type="number"
                          step={isCardioExercise ? 1 : 1}
                          value={isCardioExercise ? (record.duration_minutes ?? 0) : record.weight}
                          onChange={(event) => updateParsed(index, isCardioExercise ? "duration_minutes" : "weight", event.target.value)}
                          aria-label={`第 ${record.set_index} 组${isCardioExercise ? "时间" : "重量"}`}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step={isCardioExercise ? 0.1 : 1}
                          value={isCardioExercise ? (record.distance_km ?? 0) : record.reps}
                          onChange={(event) => updateParsed(index, isCardioExercise ? "distance_km" : "reps", event.target.value)}
                          aria-label={`第 ${record.set_index} 组${isCardioExercise ? "距离" : "次数"}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="full mt-3" icon={<CheckCircle2 size={18} />} onClick={() => void saveRecords(parsedRecords)} disabled={loading}>
                  保存记录
                </Button>
              </section>
            ) : null}
          </>
        ) : (
          <form className="mt-4 grid gap-4" onSubmit={(event) => { event.preventDefault(); saveManual(); }}>
            <section className="manual-set-editor">
              <div className="manual-set-head">
                <span>组</span>
                <span>{isCardioExercise ? "时间 分钟" : "重量 kg"}</span>
                <span>{isCardioExercise ? "距离 km" : "次数"}</span>
                <span>删除</span>
              </div>
              {manualSets.map((set, index) => (
                <div className="manual-set-row" key={set.set_index}>
                  <strong>第 {index + 1} 组</strong>
                  <input
                    type="number"
                    min={0}
                    step={isCardioExercise ? 1 : 1}
                    value={isCardioExercise ? set.duration_minutes : set.weight}
                    onChange={(event) => updateManualSet(index, isCardioExercise ? "duration_minutes" : "weight", event.target.value)}
                    aria-label={`第 ${index + 1} 组${isCardioExercise ? "时间" : "重量"}`}
                  />
                  <input
                    type="number"
                    min={0}
                    step={isCardioExercise ? 0.1 : 1}
                    value={isCardioExercise ? set.distance_km : set.reps}
                    onChange={(event) => updateManualSet(index, isCardioExercise ? "distance_km" : "reps", event.target.value)}
                    aria-label={`第 ${index + 1} 组${isCardioExercise ? "距离" : "次数"}`}
                  />
                  <div className="manual-row-actions">
                    {manualSets.length > 1 ? (
                      <button type="button" aria-label={`删除第 ${index + 1} 组`} onClick={() => removeManualSet(index)}>
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              <button className="add-set-button" type="button" onClick={addManualSet}>
                <Plus size={16} />
                加一组
              </button>
            </section>
            <label className="field">
              <span>感受</span>
              <select className="field-control" value={manualFeeling} onChange={(event) => setManualFeeling(event.target.value)}>
                <option value="轻松">轻松</option>
                <option value="刚好">刚好</option>
                <option value="有点累">有点累</option>
                <option value="太重">太重</option>
              </select>
            </label>
            <label className="field">
              <span>备注</span>
              <textarea className="field-control" placeholder="比如最后两下有点吃力" value={manualNote} onChange={(event) => setManualNote(event.target.value)} />
            </label>

            <section className="parsed mt-0">
              <p className="row-title">保存前预览</p>
              <div className="summary-table">
                <div className="head">组</div><div className="head">{isCardioExercise ? "时间" : "重量"}</div><div className="head">{isCardioExercise ? "距离" : "次数"}</div>
                {manualSets.map((record) => (
                  <div className="contents" key={record.set_index}>
                    <div>{record.set_index}</div>
                    <div>{isCardioExercise ? `${record.duration_minutes ?? 0} 分钟` : `${record.weight} kg`}</div>
                    <div>{isCardioExercise ? `${record.distance_km ?? 0} km` : record.reps}</div>
                  </div>
                ))}
              </div>
            </section>

            <Button className="full" icon={<Save size={18} />} type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存记录"}
            </Button>
          </form>
        )}
      </section>
    </AppShell>
  );
}
