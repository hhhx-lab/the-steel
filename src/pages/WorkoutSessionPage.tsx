import { Check, ChevronRight, ClipboardList, DoorOpen, Dumbbell, FileText, Play } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
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

  const begin = () => {
    startSession();
  };

  return (
    <AppShell showNav={false}>
      <TopBar
        title="训练中"
        backTo="/home"
        right={
          <button className="text-xs font-bold text-coral" type="button" onClick={() => setEndOpen(true)}>
            结束
          </button>
        }
      />

      <section className="space-y-4">
        <Card className="border-ink bg-ink text-white">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-acid">进度</p>
              <h1 className="mt-1 text-2xl font-black">{completedCount} / {plan.exercises.length} 个动作</h1>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-acid text-ink">
              <ClipboardList size={28} />
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-acid transition-all" style={{ width: `${progress}%` }} />
          </div>
        </Card>

        {status === "not_started" ? (
          <Button className="w-full" icon={<Play size={18} />} onClick={begin}>
            开始今日训练
          </Button>
        ) : null}

        <Card>
          <h2 className="mb-3 text-base font-black">动作 checklist</h2>
          <div className="space-y-2">
            {plan.exercises.map((item, index) => {
              const exercise = findExercise(item.exercise_id);
              const isCurrent = item.exercise_id === currentExerciseId;
              return (
                <button
                  key={`${item.exercise_id}-${index}`}
                  className={`flex w-full items-center justify-between rounded-[8px] p-3 text-left transition ${
                    isCurrent ? "bg-acid text-ink" : "bg-paper"
                  }`}
                  type="button"
                  onClick={() => setCurrentExercise(item.exercise_id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.status === "completed" ? "bg-mint text-ink" : "bg-white text-muted"}`}>
                      {item.status === "completed" ? <Check size={16} /> : index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black">{exercise.name_cn}</p>
                      <p className="text-xs font-semibold opacity-70">{item.sets} 组 · {item.reps}</p>
                    </div>
                  </div>
                  <Tag tone={item.status === "completed" ? "green" : isCurrent ? "orange" : "default"}>
                    {item.status === "completed" ? "已完成" : isCurrent ? "当前" : "未开始"}
                  </Tag>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-ink text-acid">
              <Dumbbell size={23} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-muted">当前动作</p>
              <h2 className="mt-1 text-xl font-black">{currentExercise.name_cn}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{currentExercise.beginner_explanation}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[8px] bg-paper p-3">
              <p className="text-xs font-bold text-muted">建议组数</p>
              <p className="mt-1 text-lg font-black">{currentPlanItem.sets}</p>
            </div>
            <div className="rounded-[8px] bg-paper p-3">
              <p className="text-xs font-bold text-muted">建议次数</p>
              <p className="mt-1 text-lg font-black">{currentPlanItem.reps}</p>
            </div>
            <div className="rounded-[8px] bg-paper p-3">
              <p className="text-xs font-bold text-muted">记录</p>
              <p className="mt-1 text-lg font-black">{records.filter((record) => record.exercise_id === currentExercise.exercise_id).length}</p>
            </div>
          </div>
          <p className="rounded-[8px] bg-mint/10 p-3 text-sm font-semibold leading-6 text-muted">重量策略：第一组先用你觉得偏轻的重量试动作。动作变形就减轻重量。</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={<FileText size={18} />} onClick={() => navigate(`/exercise/${currentExercise.exercise_id}`)}>
              查看教程
            </Button>
            <Button icon={<ChevronRight size={18} />} onClick={() => navigate(`/workout/log?exerciseId=${currentExercise.exercise_id}`)}>
              记录这一组
            </Button>
          </div>
          <Button className="w-full" variant="secondary" onClick={completeCurrentExercise}>
            完成当前动作
          </Button>
        </Card>

        <XiaotieTip tone={status === "completed" ? "safe" : "default"}>
          {lastFeedback ?? "如果某个动作让你疼痛或明显不舒服，先停止。小铁只能提供入门建议，不能替代专业教练或医生判断。"}
        </XiaotieTip>
      </section>

      {endOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/35 px-4 pb-4" role="dialog" aria-modal="true">
          <Card className="mx-auto w-full max-w-[448px] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-coral text-white">
                <DoorOpen size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black">结束训练？</h2>
                <p className="text-sm font-semibold text-muted">未完成的动作会保留在今日训练里。</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setEndOpen(false)}>
                继续练
              </Button>
              <Button variant="danger" onClick={() => navigate("/home")}>
                结束
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
