import { Check, DoorOpen, FileText, Play } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { findExercise } from "../data/mockExercises";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { useWorkoutStore } from "../stores/workoutStore";

export function WorkoutSessionPage() {
  const navigate = useNavigate();
  const [endOpen, setEndOpen] = useState(false);
  const plan = useWorkoutStore((state) => state.plan);
  const status = useWorkoutStore((state) => state.status);
  const currentExerciseId = useWorkoutStore((state) => state.currentExerciseId);
  const records = useWorkoutStore((state) => state.records);
  const lastFeedback = useWorkoutStore((state) => state.lastFeedback);
  const startSession = useWorkoutStore((state) => state.startSession);
  const setCurrentExercise = useWorkoutStore((state) => state.setCurrentExercise);
  const completeCurrentExercise = useWorkoutStore((state) => state.completeCurrentExercise);
  const currentPlanItem = plan.exercises.find((item) => item.exercise_id === currentExerciseId) ?? plan.exercises[0];
  const currentExercise = findExercise(currentPlanItem.exercise_id);
  const completedCount = plan.exercises.filter((item) => item.status === "completed").length;
  const progress = Math.round((completedCount / Math.max(plan.exercises.length, 1)) * 100);
  const currentRecords = records.filter((record) => record.exercise_id === currentExercise.exercise_id);

  return (
    <AppShell showNav={false}>
      <TopBar
        title="训练中"
        backTo="/home"
        right={
          <button className="secondary-btn !min-h-[38px] !rounded-[14px] !px-3 text-xs" type="button" onClick={() => setEndOpen(true)}>
            结束
          </button>
        }
      />

      <section className="training-hero">
        <div className="training-count">
          <div>
            <p className="kicker">今日进度</p>
            <h2>{completedCount} / {plan.exercises.length}</h2>
          </div>
          <span>{plan.duration_minutes} 分钟计划</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

        {status === "not_started" ? (
          <Button className="full mt-4" icon={<Play size={18} />} onClick={startSession}>
            开始今日训练
          </Button>
        ) : null}

        <div className="training-checklist">
          {plan.exercises.map((item, index) => {
            const exercise = findExercise(item.exercise_id);
            const isCurrent = item.exercise_id === currentExerciseId;
            return (
              <button className="light-row" key={`${item.exercise_id}-${index}`} type="button" onClick={() => setCurrentExercise(item.exercise_id)}>
                <span className={`circle-index ${item.status === "completed" ? "done" : isCurrent ? "current" : ""}`}>
                  {item.status === "completed" ? <Check size={15} /> : index + 1}
                </span>
                <span>
                  <b className="row-title">{exercise.name_cn} · {item.sets} 组</b>
                  <p className="row-sub">{isCurrent ? "当前动作 · 先轻重量试动作" : `每组 ${item.reps}`}</p>
                </span>
                <span className="current-pill">{isCurrent ? "当前" : ""}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="current-exercise">
        <p className="kicker">当前动作</p>
        <h2>{currentExercise.name_cn}</h2>
        <p className="support">建议 {currentPlanItem.sets} 组，每组 {currentPlanItem.reps}。先用能稳定完成的轻重量。</p>
        <div className="sets" style={{ gridTemplateColumns: `repeat(${Math.min(currentPlanItem.sets, 4)}, minmax(0, 1fr))` }}>
          {Array.from({ length: currentPlanItem.sets }, (_, index) => {
            const record = currentRecords[index];
            return (
              <button className={`set-button ${record ? "done" : ""}`} key={index} type="button" onClick={() => navigate(`/workout/log?exerciseId=${currentExercise.exercise_id}`)}>
                第 {index + 1} 组<br />{record ? `${record.reps} 次` : "待完成"}
              </button>
            );
          })}
        </div>
      </section>

      <div className="record-bar">
        <Button variant="secondary" icon={<FileText size={18} />} onClick={() => navigate(`/exercise/${currentExercise.exercise_id}`)}>再看教程</Button>
        <Button onClick={() => navigate(`/workout/log?exerciseId=${currentExercise.exercise_id}`)}>记录本组</Button>
      </div>
      <Button className="full mt-3" variant="secondary" onClick={completeCurrentExercise}>完成当前动作</Button>

      <XiaotieTip tone={status === "completed" ? "safe" : "default"}>
        {lastFeedback ?? "如果某个动作让你疼痛或明显不舒服，先停止。小铁只能提供入门建议，不能替代专业教练或医生判断。"}
      </XiaotieTip>

      {endOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <div className="avatar-chip">
              <span className="circle-index is-danger"><DoorOpen size={17} /></span>
              <div>
                <h2>结束训练？</h2>
                <p>未完成的动作会保留在今日训练里。</p>
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setEndOpen(false)}>继续练</Button>
              <Button variant="danger" onClick={() => navigate("/home")}>结束</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
