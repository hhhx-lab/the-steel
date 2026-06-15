import { Check, ChevronLeft, Dumbbell, Play, Plus, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { findExercise } from "../data/mockExercises";
import { createPlanExercises, getTodayExerciseIds, getTodayPlanTitle } from "../data/todayPlan";
import { createWorkoutSession, getExercises, updateTodayExercises } from "../services/tieziApi";
import { useUserStore } from "../stores/userStore";
import { useWorkoutStore } from "../stores/workoutStore";

export function TodayPlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useUserStore((state) => state.profile);
  const plan = useWorkoutStore((state) => state.plan);
  const generateTodayPlan = useWorkoutStore((state) => state.generateTodayPlan);
  const setPlan = useWorkoutStore((state) => state.setPlan);
  const setSession = useWorkoutStore((state) => state.setSession);
  const startSession = useWorkoutStore((state) => state.startSession);
  const planFocusPart = plan.today_focus_part ?? profile.today_focus_part ?? "全身";
  const suggestedIds = useMemo(() => getTodayExerciseIds(planFocusPart), [planFocusPart]);
  const planExerciseIds = useMemo(
    () => (plan.exercises.length ? plan.exercises.map((item) => item.exercise_id) : suggestedIds),
    [plan.exercises, suggestedIds]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(planExerciseIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const { data: apiExercises } = useQuery({ queryKey: ["exercises", "today-plan"], queryFn: getExercises });
  const exercises = planExerciseIds.map((exerciseId) => apiExercises?.find((item) => item.exercise_id === exerciseId) ?? findExercise(exerciseId));

  useEffect(() => {
    setSelectedIds(planExerciseIds);
  }, [plan.plan_id, planExerciseIds]);

  const toggleExercise = (exerciseId: string) => {
    setSelectedIds((current) => {
      if (current.includes(exerciseId)) return current.filter((item) => item !== exerciseId);
      return [...current, exerciseId];
    });
  };

  const confirmPlan = async () => {
    const exerciseIds = selectedIds.length ? selectedIds : planExerciseIds.slice(0, 1);
    setSaving(true);
    setError(undefined);
    try {
      const confirmedPlan = await updateTodayExercises(plan.plan_id, exerciseIds);
      setPlan(confirmedPlan);
      queryClient.setQueryData(["today-workout"], confirmedPlan);
      const session = await createWorkoutSession(confirmedPlan.plan_id);
      setSession(session);
      queryClient.setQueryData(["workout-session-current"], session);
      startSession();
      navigate("/workout/session");
    } catch {
      setError("后端暂时没连上，先按本地计划开始训练。");
      generateTodayPlan({
        title: `${profile.fitness_goal === "muscle_gain" ? "增肌优先" : profile.fitness_goal === "shape" ? "塑形体态" : "减脂优先"} · 今日计划`,
        subtitle: getTodayPlanTitle(planFocusPart),
        duration_minutes: plan.duration_minutes,
        intensity: plan.intensity,
        exercises: createPlanExercises(exerciseIds)
      });
      startSession();
      window.setTimeout(() => navigate("/workout/session"), 600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell className="today-plan-screen">
      <TopBar title="今日计划" backTo="/onboarding/today" />

      <section className="today-plan-hero">
        <p className="kicker">今日训练计划已生成</p>
        <h1>{planFocusPart} · {plan.duration_minutes} 分钟</h1>
        <p>长期计划参考你的目标、分化和频率；这里仅确认今天实际要练的动作。</p>
        {error ? <p className="text-[13px] font-semibold text-[var(--danger)]">{error}</p> : null}
        <div className="today-plan-meta">
          <span>{plan.intensity === "low" ? "轻松强度" : plan.intensity === "high" ? "挑战强度" : "适中强度"}</span>
          <span>{selectedIds.length} / {planExerciseIds.length} 个动作已加入</span>
        </div>
      </section>

      <section className="exercise-card-rail no-scrollbar" aria-label="左右滑动选择动作">
        {exercises.map((exercise) => {
          const selected = selectedIds.includes(exercise.exercise_id);
          return (
            <article className={selected ? "exercise-swipe-card selected" : "exercise-swipe-card"} key={exercise.exercise_id}>
              <div className="exercise-motion" aria-label={`${exercise.name_cn} 动态演示`}>
                <div className="motion-video-badge"><Video size={14} />动态演示</div>
                {exercise.video_url?.endsWith(".gif") ? (
                  <img
                    className="exercise-motion-video"
                    src={exercise.video_url}
                    alt={`${exercise.name_cn} 动态演示`}
                  />
                ) : exercise.video_url ? (
                  <video
                    className="exercise-motion-video"
                    src={exercise.video_url}
                    poster={exercise.thumbnail_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <>
                    <span className="motion-machine" />
                    <span className="motion-person">
                      <i />
                    </span>
                  </>
                )}
              </div>

              <div className="exercise-card-copy">
                <span className="exercise-target"><Dumbbell size={14} />{exercise.target_body_parts_beginner.join(" / ")}</span>
                <h2>{exercise.name_cn}</h2>
                <p>{exercise.beginner_explanation}</p>
                <div className="exercise-card-meta">
                  <span>{exercise.default_sets} 组</span>
                  <span>每组 {exercise.default_reps}</span>
                </div>
              </div>

              <button className={selected ? "include-action selected" : "include-action"} type="button" onClick={() => toggleExercise(exercise.exercise_id)}>
                {selected ? <Check size={16} /> : <Plus size={16} />}
                {selected ? "已加入今日计划" : "加入今日计划"}
              </button>
            </article>
          );
        })}
      </section>

      <section className="plan-confirm-panel">
        <button className="secondary-btn" type="button" onClick={() => navigate("/onboarding/today")}>
          <ChevronLeft size={17} />
          调整今日
        </button>
        <Button icon={<Play size={18} />} onClick={() => void confirmPlan()} disabled={!selectedIds.length || saving}>
          {saving ? "创建训练中..." : "确定并开始"}
        </Button>
      </section>
    </AppShell>
  );
}
