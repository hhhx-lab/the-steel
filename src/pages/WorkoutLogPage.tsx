import { AlertTriangle, CheckCircle2, Edit3, MessageSquareText, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { Tag } from "../components/ui/Tag";
import { findExercise } from "../data/mockExercises";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { parseWorkoutLog, saveWorkoutLog } from "../services/tieziApi";
import { useWorkoutStore } from "../stores/workoutStore";
import type { SetRecord } from "../types/workout";

type LogMode = "manual" | "natural";

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
  const [mode, setMode] = useState<LogMode>("manual");
  const [naturalText, setNaturalText] = useState("高位下拉做了三组，20 公斤，10、10、8，最后一组有点累。");
  const [parsedRecords, setParsedRecords] = useState<SetRecord[]>([]);
  const [feedback, setFeedback] = useState<string>();
  const [safetyWarning, setSafetyWarning] = useState<string>();
  const [loading, setLoading] = useState(false);
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

  return (
    <AppShell showNav={false}>
      <TopBar title="记录训练" backTo="/workout/session" />

      <section className="space-y-4 pb-24">
        <Card className="border-ink bg-ink text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-acid text-ink">
              <Edit3 size={23} />
            </div>
            <div>
              <p className="text-xs font-bold text-white/62">当前动作</p>
              <h1 className="text-xl font-black">{exercise.name_cn}</h1>
              <p className="mt-1 text-sm font-semibold text-white/70">{exercise.default_sets} 组 · 每组 {exercise.default_reps}</p>
            </div>
          </div>
        </Card>

        <SegmentedControl
          value={mode}
          options={[
            { label: "手动记录", value: "manual" },
            { label: "一句话", value: "natural" }
          ]}
          onChange={setMode}
        />

        {mode === "manual" ? (
          <form className="space-y-4" onSubmit={saveManual}>
            <Card className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="text-xs font-bold text-muted">组数</span>
                  <input className="h-12 w-full rounded-[8px] border border-line bg-paper px-3 font-black outline-none focus:border-ocean" type="number" min={1} {...register("sets", { valueAsNumber: true })} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-muted">重量 kg</span>
                  <input className="h-12 w-full rounded-[8px] border border-line bg-paper px-3 font-black outline-none focus:border-ocean" type="number" min={0} {...register("weight", { valueAsNumber: true })} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-muted">次数</span>
                  <input className="h-12 w-full rounded-[8px] border border-line bg-paper px-3 font-black outline-none focus:border-ocean" type="number" min={0} {...register("reps", { valueAsNumber: true })} />
                </label>
              </div>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted">感受</span>
                <select className="h-12 w-full rounded-[8px] border border-line bg-paper px-3 font-black outline-none focus:border-ocean" {...register("rpe_text")}>
                  <option value="轻松">轻松</option>
                  <option value="刚好">刚好</option>
                  <option value="有点累">有点累</option>
                  <option value="太重">太重</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted">备注</span>
                <textarea className="min-h-24 w-full resize-none rounded-[8px] border border-line bg-paper p-3 text-sm font-semibold outline-none focus:border-ocean" placeholder="比如最后两下有点吃力" {...register("user_note")} />
              </label>
            </Card>

            <Card>
              <h2 className="mb-3 text-base font-black">保存前预览</h2>
              <div className="space-y-2">
                {manualPreview.map((record) => (
                  <div key={record.set_index} className="flex items-center justify-between rounded-[8px] bg-paper p-3">
                    <p className="text-sm font-black">第 {record.set_index} 组</p>
                    <p className="text-sm font-semibold text-muted">{record.weight} kg · {record.reps} 次 · {record.rpe_text}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Button className="w-full" icon={<Save size={18} />} type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存记录"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Card className="space-y-3">
              <label className="space-y-2">
                <span className="text-sm font-black">一句话告诉小铁</span>
                <textarea
                  className="min-h-32 w-full resize-none rounded-[8px] border border-line bg-paper p-3 text-sm font-semibold leading-6 outline-none focus:border-ocean"
                  value={naturalText}
                  onChange={(event) => setNaturalText(event.target.value)}
                />
              </label>
              <Button className="w-full" variant="secondary" icon={<MessageSquareText size={18} />} onClick={() => void parseNatural()} disabled={loading}>
                {loading ? "解析中..." : "解析这句话"}
              </Button>
            </Card>

            {feedback ? <XiaotieTip tone={safetyWarning ? "warning" : "safe"}>{feedback}</XiaotieTip> : null}
            {safetyWarning ? (
              <Card className="border-coral/30 bg-coral/10">
                <div className="flex gap-3">
                  <AlertTriangle className="shrink-0 text-coral" size={22} />
                  <p className="text-sm font-semibold leading-6 text-muted">{safetyWarning}</p>
                </div>
              </Card>
            ) : null}

            {parsedRecords.length ? (
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black">确认解析结果</h2>
                  <Tag tone="green">需要确认</Tag>
                </div>
                {parsedRecords.map((record, index) => (
                  <div key={record.record_id} className="grid grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)] gap-2 rounded-[8px] bg-paper p-3">
                    <div className="flex items-center text-sm font-black">第 {record.set_index} 组</div>
                    <input className="h-10 min-w-0 rounded-[8px] border border-line bg-white px-2 text-sm font-black outline-none focus:border-ocean" type="number" value={record.weight} onChange={(event) => updateParsed(index, "weight", event.target.value)} aria-label={`第 ${record.set_index} 组重量`} />
                    <input className="h-10 min-w-0 rounded-[8px] border border-line bg-white px-2 text-sm font-black outline-none focus:border-ocean" type="number" value={record.reps} onChange={(event) => updateParsed(index, "reps", event.target.value)} aria-label={`第 ${record.set_index} 组次数`} />
                    <div />
                    <p className="text-xs font-semibold text-muted">kg</p>
                    <p className="text-xs font-semibold text-muted">次</p>
                  </div>
                ))}
                <Button className="w-full" icon={<CheckCircle2 size={18} />} onClick={() => void saveRecords(parsedRecords)} disabled={loading}>
                  确认并保存
                </Button>
              </Card>
            ) : null}
          </div>
        )}
      </section>
    </AppShell>
  );
}
