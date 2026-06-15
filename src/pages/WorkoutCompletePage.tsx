import { CalendarDays, Dumbbell, Medal, Sparkles, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { findExercise } from "../data/mockExercises";
import { useWorkoutStore } from "../stores/workoutStore";

export function WorkoutCompletePage() {
  const navigate = useNavigate();
  const plan = useWorkoutStore((state) => state.plan);
  const records = useWorkoutStore((state) => state.records);
  const completedExercises = plan.exercises.filter((item) => item.status === "completed");
  const completedCount = completedExercises.length || plan.exercises.length;
  const totalSets = records.filter((record) => plan.exercises.some((item) => item.exercise_id === record.exercise_id)).length;
  const bodyParts = Array.from(
    new Set(
      plan.exercises.flatMap((item) => findExercise(item.exercise_id).target_body_parts_beginner.slice(0, 1))
    )
  ).slice(0, 4);

  return (
    <AppShell className="achievement-screen">
      <section className="achievement-hero">
        <div className="achievement-rays" aria-hidden="true" />
        <span className="achievement-medal"><Trophy size={46} /></span>
        <p className="kicker">今日训练完成</p>
        <h1>你把今天的计划拿下了</h1>
        <p>小铁已经把本次训练保存进记录。下一次计划会参考今天的完成情况和体感继续调整。</p>
      </section>

      <section className="achievement-stats" aria-label="训练成果">
        <div>
          <Dumbbell size={20} />
          <strong>{completedCount}</strong>
          <span>完成动作</span>
        </div>
        <div>
          <Medal size={20} />
          <strong>{Math.max(totalSets, completedCount)}</strong>
          <span>记录组数</span>
        </div>
        <div>
          <CalendarDays size={20} />
          <strong>+1</strong>
          <span>训练日</span>
        </div>
      </section>

      <section className="milestone-card">
        <div className="avatar-chip">
          <img className="avatar" src="/assets/cutouts/xiaotie-male-head-cutout.png" alt="小铁" />
          <div>
            <p className="row-title">新里程碑：完成一次完整计划</p>
            <p className="row-sub">今天覆盖了{bodyParts.length ? bodyParts.join("、") : "全身基础"}。保持这个节奏，计划会越来越贴合你。</p>
          </div>
        </div>
        <div className="badge-row" aria-label="获得徽章">
          <span><Sparkles size={15} />完整训练</span>
          <span><Medal size={15} />稳定记录</span>
        </div>
      </section>

      <section className="achievement-actions">
        <Button variant="secondary" onClick={() => navigate("/workout/log")}>查看记录</Button>
        <Button onClick={() => navigate("/home")}>回到首页</Button>
      </section>
    </AppShell>
  );
}
