import { Check, DoorOpen, FileText, Play } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { findExercise } from "../data/mockExercises";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { createWorkoutSession, endCurrentWorkoutSession, getCurrentWorkoutSession, getExercises, getTodayWorkout, getWorkoutRecords, updateCurrentExercise } from "../services/tieziApi";
import { useWorkoutStore } from "../stores/workoutStore";
import type { SetRecord } from "../types/workout";

const formatSetRecord = (record: SetRecord) => {
  if (record.duration_minutes || record.distance_km) {
    const duration = record.duration_minutes ? `${record.duration_minutes} 分钟` : "";
    const distance = record.distance_km ? `${record.distance_km} km` : "";
    return [duration, distance].filter(Boolean).join(" · ");
  }
  return `${record.reps} 次`;
};

export function WorkoutSessionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [endOpen, setEndOpen] = useState(false);
  const plan = useWorkoutStore((state) => state.plan);
  const sessionId = useWorkoutStore((state) => state.session_id);
  const status = useWorkoutStore((state) => state.status);
  const currentExerciseId = useWorkoutStore((state) => state.currentExerciseId);
  const records = useWorkoutStore((state) => state.records);
  const lastFeedback = useWorkoutStore((state) => state.lastFeedback);
  const startSession = useWorkoutStore((state) => state.startSession);
  const setCurrentExercise = useWorkoutStore((state) => state.setCurrentExercise);
  const endSession = useWorkoutStore((state) => state.endSession);
  const setPlan = useWorkoutStore((state) => state.setPlan);
  const setSession = useWorkoutStore((state) => state.setSession);
  const setRecords = useWorkoutStore((state) => state.setRecords);
  useQuery({
    queryKey: ["workout-session-current"],
    queryFn: async () => {
      const [apiPlan, apiSession] = await Promise.all([getTodayWorkout(), getCurrentWorkoutSession()]);
      const apiRecords = apiSession?.session_id ? await getWorkoutRecords(apiSession.session_id) : [];
      setPlan(apiPlan);
      setSession(apiSession);
      setRecords(apiRecords);
      return { apiPlan, apiSession, apiRecords };
    },
    staleTime: 5_000
  });
  const { data: exerciseLibrary } = useQuery({ queryKey: ["exercises", "session"], queryFn: getExercises });
  const getExercise = (exerciseId: string) => exerciseLibrary?.find((item) => item.exercise_id === exerciseId) ?? findExercise(exerciseId);
  const currentPlanItem = plan.exercises.find((item) => item.exercise_id === currentExerciseId) ?? plan.exercises[0];
  const currentExercise = getExercise(currentPlanItem.exercise_id);
  const completedCount = plan.exercises.filter((item) => item.status === "completed").length;
  const progress = Math.round((completedCount / Math.max(plan.exercises.length, 1)) * 100);
  const currentRecords = records.filter((record) => record.exercise_id === currentExercise.exercise_id);

  const endWorkout = async () => {
    try {
      const session = await endCurrentWorkoutSession();
      setSession(session);
      queryClient.setQueryData(["workout-session-current"], session);
    } catch {
      // 后端不可用时仍保留本地记录链路。
    } finally {
      endSession();
      setEndOpen(false);
      navigate("/workout/log");
    }
  };

  const chooseCurrentExercise = async (exerciseId: string) => {
    setCurrentExercise(exerciseId);
    try {
      const session = await updateCurrentExercise(exerciseId, sessionId);
      setSession(session);
      queryClient.setQueryData(["workout-session-current"], session);
    } catch {
      // 网络失败时保留本地切换，避免打断训练。
    }
  };

  const startWorkoutFromSession = async () => {
    try {
      const session = await createWorkoutSession(plan.plan_id);
      setSession(session);
      queryClient.setQueryData(["workout-session-current"], session);
    } catch {
      // 后端不可用时仍允许本地训练继续。
    } finally {
      startSession();
    }
  };

  return (
    <AppShell>
      <TopBar
        title="训练中"
        backTo="/home"
        right={
          <button className="secondary-btn !min-h-[38px] !rounded-[14px] !px-3 text-xs" type="button" onClick={() => setEndOpen(true)}>
            结束训练
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
          <Button className="full mt-4" icon={<Play size={18} />} onClick={() => void startWorkoutFromSession()}>
            开始今日训练
          </Button>
        ) : null}

        <div className="training-checklist">
          {plan.exercises.map((item, index) => {
            const exercise = getExercise(item.exercise_id);
            const isCurrent = item.exercise_id === currentExerciseId;
            return (
              <button className="light-row" key={`${item.exercise_id}-${index}`} type="button" onClick={() => void chooseCurrentExercise(item.exercise_id)}>
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
              <button className={`set-button ${record ? "done" : ""}`} key={index} type="button" onClick={() => navigate(`/workout/record?exerciseId=${currentExercise.exercise_id}`)}>
                第 {index + 1} 组<br />{record ? formatSetRecord(record) : "待完成"}
              </button>
            );
          })}
        </div>
      </section>

      <div className="record-bar">
        <Button variant="secondary" icon={<FileText size={18} />} onClick={() => navigate(`/exercise/${currentExercise.exercise_id}`)}>再看教程</Button>
        <Button onClick={() => navigate(`/workout/record?exerciseId=${currentExercise.exercise_id}`)}>记录本组</Button>
      </div>

      {lastFeedback ? <XiaotieTip tone={status === "completed" ? "safe" : "default"}>{lastFeedback}</XiaotieTip> : null}

      {endOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <div className="avatar-chip">
              <span className="circle-index is-danger"><DoorOpen size={17} /></span>
              <div>
                <h2>确认结束训练吗？</h2>
                <p>未完成的动作会保留在今日训练里。</p>
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setEndOpen(false)}>继续练</Button>
              <Button variant="danger" onClick={() => void endWorkout()}>结束并保存记录</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
