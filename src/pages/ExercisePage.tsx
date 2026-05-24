import { CheckCircle2, Dumbbell, Plus, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { getExerciseDetail } from "../services/tieziApi";
import { useWorkoutStore } from "../stores/workoutStore";

function ListSection({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "safe" | "warning" }) {
  const iconClass = tone === "warning" ? "text-coral" : tone === "safe" ? "text-mint" : "text-ocean";
  return (
    <Card>
      <h2 className="mb-3 text-base font-black">{title}</h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex gap-3">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-black ${iconClass}`}>{index + 1}</span>
            <p className="text-sm font-semibold leading-6 text-muted">{item}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ExercisePage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const startSession = useWorkoutStore((state) => state.startSession);
  const plan = useWorkoutStore((state) => state.plan);
  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => getExerciseDetail(exerciseId ?? "ex_lat_pulldown"),
    enabled: Boolean(exerciseId)
  });

  if (!exerciseId) {
    return <Navigate to="/home" replace />;
  }

  const alreadyInPlan = plan.exercises.some((item) => item.exercise_id === exerciseId);

  const start = () => {
    if (exercise) {
      addExercise(exercise.exercise_id);
    }
    startSession();
    navigate("/workout/session");
  };

  return (
    <AppShell showNav={false}>
      <TopBar title="动作教程" />
      {isLoading || !exercise ? (
        <Card className="py-10 text-center text-sm font-semibold text-muted">小铁正在整理教程...</Card>
      ) : (
        <section className="space-y-4 pb-24">
          <Card className="overflow-hidden border-ink bg-ink p-0 text-white">
            <div className="bg-[linear-gradient(135deg,#d7ff3f_0%,#4bd8a1_52%,#146b7a_100%)] p-4">
              <div className="flex h-36 items-center justify-center rounded-[8px] bg-ink/85">
                <div className="flex items-center gap-4 text-acid">
                  <Dumbbell size={52} />
                  <div>
                    <p className="text-xs font-bold text-white/65">示意画面</p>
                    <p className="mt-1 text-sm font-black text-white">{exercise.media_hint}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <Tag tone="green">{exercise.difficulty === "beginner" ? "新手友好" : exercise.difficulty}</Tag>
                <Tag tone="blue">{exercise.default_sets} 组</Tag>
                <Tag tone="blue">每组 {exercise.default_reps}</Tag>
              </div>
              <h1 className="text-2xl font-black">{exercise.name_cn}</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/72">{exercise.beginner_explanation}</p>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-black">练哪里</h2>
            <div className="flex flex-wrap gap-2">
              {exercise.target_body_parts_beginner.map((part) => (
                <Tag key={part} tone="green">{part}</Tag>
              ))}
            </div>
          </Card>

          <ListSection title="怎么调" items={exercise.setup_tips} />
          <ListSection title="怎么做" items={exercise.steps} tone="safe" />
          <ListSection title="常见错误" items={exercise.common_mistakes} tone="warning" />

          <Card className="border-coral/30 bg-coral/10">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="text-coral" size={20} />
              <h2 className="text-base font-black">安全提醒</h2>
            </div>
            <div className="space-y-2">
              {exercise.safety_notes.map((note) => (
                <p key={note} className="text-sm font-semibold leading-6 text-muted">{note}</p>
              ))}
            </div>
          </Card>

          <XiaotieTip>你不需要一下子做得很重。先把动作做稳，小铁会帮你慢慢记录和调整。</XiaotieTip>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <div className="mx-auto grid max-w-[480px] grid-cols-2 gap-2">
              <Button variant="secondary" icon={alreadyInPlan ? <CheckCircle2 size={18} /> : <Plus size={18} />} onClick={() => exercise && addExercise(exercise.exercise_id)}>
                {alreadyInPlan ? "已在计划" : "加入今日训练"}
              </Button>
              <Button onClick={start}>开始训练</Button>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
