import { AlertTriangle, CheckCircle2, Mic, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { findExercise } from "../data/mockExercises";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { parseWorkoutLog, saveWorkoutLog } from "../services/tieziApi";
import { useWorkoutStore } from "../stores/workoutStore";
import type { SetRecord } from "../types/workout";

type LogMode = "natural" | "manual";

type ManualForm = {
  sets: number;
  weight: number;
  reps: number;
  rpe_text: string;
  user_note: string;
};

export function WorkoutLogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentExerciseId = useWorkoutStore((state) => state.currentExerciseId);
  const sessionId = useWorkoutStore((state) => state.session_id);
  const saveRecordsToStore = useWorkoutStore((state) => state.saveRecords);
  const exerciseId = searchParams.get("exerciseId") ?? currentExerciseId;
  const exercise = findExercise(exerciseId);
  const [mode, setMode] = useState<LogMode>("natural");
  const [naturalText, setNaturalText] = useState("高位下拉做了三组，20 公斤，10、10、8，最后一组有点累。");
  const [parsedRecords, setParsedRecords] = useState<SetRecord[]>([]);
  const [feedback, setFeedback] = useState<string>();
  const [safetyWarning, setSafetyWarning] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const { register, handleSubmit, watch } = useForm<ManualForm>({
    defaultValues: {
      sets: exercise.default_sets,
      weight: 20,
      reps: Number.parseInt(exercise.default_reps, 10) || 10,
      rpe_text: "刚好",
      user_note: ""
    }
  });

  const manualPreview = useMemo(() => {
    const sets = Number(watch("sets")) || 1;
    const weight = Number(watch("weight")) || 0;
    const reps = Number(watch("reps")) || 0;
    return Array.from({ length: sets }, (_, index) => ({
      record_id: `manual_${Date.now()}_${index + 1}`,
      session_id: sessionId,
      exercise_id: exercise.exercise_id,
      set_index: index + 1,
      weight,
      weight_unit: "kg" as const,
      reps,
      rpe_text: watch("rpe_text"),
      user_note: watch("user_note")
    }));
  }, [exercise.exercise_id, sessionId, watch]);

  const parseNatural = async () => {
    setLoading(true);
    const result = await parseWorkoutLog(naturalText, exercise.exercise_id);
    setParsedRecords(result.sets);
    setFeedback(result.xiaotie_feedback);
    setSafetyWarning(result.safety_warning);
    setLoading(false);
  };

  const saveRecords = async (records: SetRecord[]) => {
    setLoading(true);
    const result = await saveWorkoutLog(records);
    saveRecordsToStore(records, result.message);
    setLoading(false);
    navigate("/workout/session");
  };

  const saveManual = handleSubmit((values) => {
    const records = Array.from({ length: Number(values.sets) || 1 }, (_, index) => ({
      record_id: `manual_${Date.now()}_${index + 1}`,
      session_id: sessionId,
      exercise_id: exercise.exercise_id,
      set_index: index + 1,
      weight: Number(values.weight) || 0,
      weight_unit: "kg" as const,
      reps: Number(values.reps) || 0,
      rpe_text: values.rpe_text,
      user_note: values.user_note
    }));
    void saveRecords(records);
  });

  const updateParsed = (index: number, key: keyof SetRecord, value: string) => {
    setParsedRecords((records) =>
      records.map((record, recordIndex) => {
        if (recordIndex !== index) return record;
        if (key === "weight" || key === "reps") {
          return { ...record, [key]: Number(value) || 0 };
        }
        return { ...record, [key]: value };
      })
    );
  };

  const toggleVoice = () => {
    setRecording((active) => !active);
    if (recording) {
      setNaturalText("高位下拉做了三组，20 公斤，10、10、8，感觉背部发力更明显。");
    }
  };

  return (
    <AppShell showNav={false}>
      <TopBar title={mode === "natural" ? "一句话记录" : "手动记录"} backTo="/workout/session" />

      <section className="prompt-card">
        <p className="kicker">今天的训练感觉如何？</p>
        <h1 className="hero-title text-[25px]">用一句话记下来</h1>
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
              {["很棒，感觉背部发力明显！", "有点累，但坚持完成了。", "状态一般，下次继续加油。"].map((text) => (
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
              <span className="input-mode">{recording ? "正在听你说，松开后会转成文字" : "可打字，也可按住说"}</span>
              <button className={`voice-btn ${recording ? "recording" : ""}`} type="button" onClick={toggleVoice} aria-label="语音输入">
                <Mic size={18} />
              </button>
            </div>

            <Button className="full mt-3" onClick={() => void parseNatural()} disabled={loading}>
              {loading ? "整理中..." : "让小铁帮我整理"}
            </Button>

            {feedback ? <XiaotieTip tone={safetyWarning ? "warning" : "safe"}>{feedback}</XiaotieTip> : null}
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
                    <p className="row-title">小铁已整理，确认后保存</p>
                    <p className="row-sub">这次最后一组有点吃力，下次先保持重量，把动作做稳。</p>
                  </div>
                </div>
                <div className="summary-table">
                  <div className="head">组</div><div className="head">重量</div><div className="head">次数</div>
                  {parsedRecords.map((record, index) => (
                    <div className="contents" key={record.record_id}>
                      <div>{record.set_index}</div>
                      <div><input type="number" value={record.weight} onChange={(event) => updateParsed(index, "weight", event.target.value)} aria-label={`第 ${record.set_index} 组重量`} /></div>
                      <div><input type="number" value={record.reps} onChange={(event) => updateParsed(index, "reps", event.target.value)} aria-label={`第 ${record.set_index} 组次数`} /></div>
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
          <form className="mt-4 grid gap-4" onSubmit={saveManual}>
            <div className="manual-grid">
              <label className="field">
                <span>组数</span>
                <input className="field-control" type="number" min={1} {...register("sets", { valueAsNumber: true })} />
              </label>
              <label className="field">
                <span>重量 kg</span>
                <input className="field-control" type="number" min={0} {...register("weight", { valueAsNumber: true })} />
              </label>
              <label className="field">
                <span>次数</span>
                <input className="field-control" type="number" min={0} {...register("reps", { valueAsNumber: true })} />
              </label>
            </div>
            <label className="field">
              <span>感受</span>
              <select className="field-control" {...register("rpe_text")}>
                <option value="轻松">轻松</option>
                <option value="刚好">刚好</option>
                <option value="有点累">有点累</option>
                <option value="太重">太重</option>
              </select>
            </label>
            <label className="field">
              <span>备注</span>
              <textarea className="field-control" placeholder="比如最后两下有点吃力" {...register("user_note")} />
            </label>

            <section className="parsed mt-0">
              <p className="row-title">保存前预览</p>
              <div className="summary-table">
                <div className="head">组</div><div className="head">重量</div><div className="head">次数</div>
                {manualPreview.map((record) => (
                  <div className="contents" key={record.set_index}>
                    <div>{record.set_index}</div><div>{record.weight} kg</div><div>{record.reps}</div>
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
