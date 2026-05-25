import { HelpCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { addExerciseToWorkout } from "../services/tieziApi";
import { useScanStore } from "../stores/scanStore";
import { useWorkoutStore } from "../stores/workoutStore";

function confidenceLabel(confidence: number) {
  if (confidence >= 0.8) return `${Math.round(confidence * 100)}% 准确`;
  if (confidence >= 0.65) return `${Math.round(confidence * 100)}% 可能是`;
  return `${Math.round(confidence * 100)}% 需要补拍`;
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
          <button className="secondary-btn !min-h-[38px] !rounded-[14px] !px-3 text-xs" type="button" onClick={() => navigate("/scan")}>
            <RotateCcw size={14} />
            重拍
          </button>
        }
      />

      {!isLowConfidence ? (
        <>
          <section className="machine-card">
            <div className="machine-visual machine-illo" aria-hidden="true" />
            <div>
              <p className="kicker">{result.equipment.beginner_name}</p>
              <h1>{result.equipment.name_cn}</h1>
              <p className="support text-[13px]">适合新手：{result.beginner_friendly ? "是" : "谨慎"} · 风险 {result.risk_level}</p>
              <span className="confidence">{confidenceLabel(result.confidence)}</span>
            </div>
          </section>

          <div className="result-actions">
            <Button variant="secondary" onClick={() => navigate(`/exercise/${exercise.exercise_id}`)}>看怎么用</Button>
            <Button onClick={() => void joinWorkout()} disabled={adding}>{adding ? "已加入中" : "加入训练"}</Button>
          </div>

          <section className="explain">
            <p>{result.user_facing_summary}</p>
            <div className="metric-strip muscle-grid">
              <div><b>{result.target_body_parts_beginner[0] ?? "目标部位"}</b><span>小白说法</span></div>
              <div><b>{result.target_muscles[0] ?? "肌群"}</b><span>专业肌群</span></div>
              <div><b>{result.target_body_parts_beginner[1] ?? "辅助"}</b><span>辅助发力</span></div>
            </div>
          </section>

          <button className="suggestion w-full text-left" type="button" onClick={() => void joinWorkout()}>
            <span className="circle-index current">今</span>
            <div>
              <p className="row-title">今天建议练</p>
              <p className="row-sub">{result.today_recommendation.reason}</p>
            </div>
            <span className="arrow">›</span>
          </button>
        </>
      ) : (
        <>
          <section className="machine-card">
            <div className="machine-visual machine-illo" aria-hidden="true" />
            <div>
              <p className="kicker">小铁还不太确定</p>
              <h1>建议补拍</h1>
              <p className="support text-[13px]">{result.user_facing_summary}</p>
              <span className="confidence low">{confidenceLabel(result.confidence)}</span>
            </div>
          </section>
          <section className="low-result">
            <p className="open-copy">请再拍一张器械正面、说明牌或把手位置。低置信度时，小铁不会给出确定结论，也不会建议你按猜测开始练。</p>
          </section>
          <Button className="full mt-4" onClick={() => navigate("/scan")}>重新拍</Button>
        </>
      )}

      <XiaotieTip tone={isLowConfidence ? "warning" : "safe"}>
        {isLowConfidence
          ? "我还不太确定这是哪台器械，先别按猜测开始练。换个角度拍一下更稳。"
          : "注意肩膀别耸起来，把重量拉稳，感觉在用手肘往下夹。"}
      </XiaotieTip>

      <Button className="full mt-3" variant="secondary" icon={<HelpCircle size={18} />} onClick={() => setFeedbackOpen(true)}>
        识别不准？
      </Button>

      {feedbackOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <h2>告诉小铁哪里不准</h2>
            <p>比如：这其实是坐姿划船，不是高位下拉。</p>
            <textarea className="field-control mt-3" placeholder="写下你的反馈" />
            <Button className="full mt-3" onClick={() => setFeedbackOpen(false)}>提交反馈</Button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
