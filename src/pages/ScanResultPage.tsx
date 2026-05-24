import { AlertTriangle, CheckCircle2, HelpCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { addExerciseToWorkout } from "../services/tieziApi";
import { useScanStore } from "../stores/scanStore";
import { useWorkoutStore } from "../stores/workoutStore";

function confidenceLabel(confidence: number) {
  if (confidence >= 0.8) return "识别较确定";
  if (confidence >= 0.65) return "可能是";
  return "需要补拍";
}

export function ScanResultPage() {
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const result = useScanStore((state) => state.lastResult);
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const startSession = useWorkoutStore((state) => state.startSession);

  if (!result) {
    return <Navigate to="/scan" replace />;
  }

  const exercise = result.recommended_exercises[0];
  const isLowConfidence = result.confidence < 0.65;
  const isMediumConfidence = result.confidence >= 0.65 && result.confidence < 0.8;

  const joinWorkout = async () => {
    if (!exercise || isLowConfidence) return;
    setAdding(true);
    await addExerciseToWorkout(exercise.exercise_id);
    addExercise(exercise.exercise_id);
    startSession();
    navigate("/workout/session");
  };

  return (
    <AppShell showNav={false}>
      <TopBar
        title="识别结果"
        backTo="/scan"
        right={
          <button className="flex items-center gap-1 text-xs font-bold text-ocean" type="button" onClick={() => navigate("/scan")}>
            <RotateCcw size={15} />
            重拍
          </button>
        }
      />

      <section className="space-y-4">
        <Card className={`${isLowConfidence ? "border-coral bg-coral/10" : "border-ink bg-ink text-white"}`}>
          <div className="mb-4 flex items-center justify-between">
            <Tag tone={isLowConfidence ? "danger" : isMediumConfidence ? "orange" : "green"}>{confidenceLabel(result.confidence)}</Tag>
            <p className={`text-sm font-black ${isLowConfidence ? "text-coral" : "text-acid"}`}>{Math.round(result.confidence * 100)}%</p>
          </div>
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] ${isLowConfidence ? "bg-coral text-white" : "bg-acid text-ink"}`}>
              {isLowConfidence ? <AlertTriangle size={25} /> : <CheckCircle2 size={25} />}
            </div>
            <div>
              <h1 className="text-2xl font-black">{isLowConfidence ? "小铁还不太确定" : result.equipment.name_cn}</h1>
              <p className={`mt-2 text-sm font-semibold leading-6 ${isLowConfidence ? "text-ink" : "text-white/72"}`}>{result.user_facing_summary}</p>
            </div>
          </div>
        </Card>

        {!isLowConfidence ? (
          <>
            <Card className="space-y-4">
              <div>
                <p className="text-sm font-black text-muted">小白解释</p>
                <h2 className="mt-1 text-xl font-black">{result.equipment.beginner_name}</h2>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black">主要练哪里</p>
                <div className="flex flex-wrap gap-2">
                  {result.target_body_parts_beginner.map((part) => (
                    <Tag key={part} tone="green">{part}</Tag>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black">专业肌群</p>
                <div className="flex flex-wrap gap-2">
                  {result.target_muscles.map((muscle) => (
                    <Tag key={muscle}>{muscle}</Tag>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[8px] bg-paper p-3">
                  <p className="text-xs font-bold text-muted">适合新手</p>
                  <p className="mt-1 text-lg font-black">{result.beginner_friendly ? "是" : "谨慎"}</p>
                </div>
                <div className="rounded-[8px] bg-paper p-3">
                  <p className="text-xs font-bold text-muted">风险等级</p>
                  <p className="mt-1 text-lg font-black">{result.risk_level}</p>
                </div>
              </div>
            </Card>

            <Card className="space-y-3 border-mint/35 bg-mint/10">
              <p className="text-sm font-black text-ocean">今日训练建议</p>
              <p className="text-sm font-semibold leading-6 text-ink">{result.today_recommendation.reason}</p>
              <div className="flex gap-2">
                <Tag tone="green">{result.today_recommendation.suggested_sets} 组</Tag>
                <Tag tone="green">每组 {result.today_recommendation.suggested_reps}</Tag>
              </div>
            </Card>
          </>
        ) : (
          <Card className="space-y-3">
            <h2 className="text-lg font-black">建议补拍</h2>
            <p className="text-sm font-semibold leading-6 text-muted">请再拍一张器械正面、说明牌或把手位置。低置信度时，小铁不会给出确定结论。</p>
          </Card>
        )}

        <XiaotieTip tone={isLowConfidence ? "warning" : "safe"}>
          {isLowConfidence
            ? "我还不太确定这是哪台器械，先别按猜测开始练。换个角度拍一下更稳。"
            : "第一组先用你觉得偏轻的重量试 10 次。如果最后 2 次还有余力，下组可以加一点。"}
        </XiaotieTip>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" icon={<HelpCircle size={18} />} onClick={() => setFeedbackOpen(true)}>
            识别不准？
          </Button>
          <Button variant={isLowConfidence ? "secondary" : "primary"} onClick={() => (isLowConfidence ? navigate("/scan") : navigate(`/exercise/${exercise.exercise_id}`))}>
            {isLowConfidence ? "重新拍" : "看怎么用"}
          </Button>
        </div>
        {!isLowConfidence ? (
          <Button className="w-full" disabled={adding} onClick={() => void joinWorkout()}>
            {adding ? "正在加入..." : "加入今日训练"}
          </Button>
        ) : null}
      </section>

      {feedbackOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/35 px-4 pb-4" role="dialog" aria-modal="true">
          <Card className="mx-auto w-full max-w-[448px] space-y-4">
            <h2 className="text-lg font-black">告诉小铁哪里不准</h2>
            <textarea className="min-h-28 w-full resize-none rounded-[8px] border border-line bg-paper p-3 text-sm outline-none focus:border-ocean" placeholder="比如：这其实是坐姿划船，不是高位下拉。" />
            <Button className="w-full" onClick={() => setFeedbackOpen(false)}>
              提交反馈
            </Button>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
