import { CheckCircle2, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { addExerciseToWorkout, createWorkoutSession, getExerciseDetail } from "../services/tieziApi";
import { useWorkoutStore } from "../stores/workoutStore";
import type { Exercise } from "../types/exercise";

function getBodyMapKind(exercise: Exercise): "back" | "chest" | "legs" | "core" | "cardio" {
  const text = `${exercise.name_cn}${exercise.target_body_parts_beginner.join("")}`;
  if (/跑步|心肺|有氧/.test(text)) return "cardio";
  if (/胸|手臂后侧|推胸/.test(text)) return "chest";
  if (/腿|臀|大腿|屁股/.test(text)) return "legs";
  if (/肚子|核心|稳定|平板/.test(text)) return "core";
  return "back";
}

const bodyMapLabel = {
  back: "背部发力",
  chest: "胸前侧发力",
  legs: "腿臀发力",
  core: "核心稳定",
  cardio: "心肺热身"
};

function BodyMap({ exercise }: { exercise: Exercise }) {
  const kind = getBodyMapKind(exercise);
  return (
    <div className={`body-map body-map-${kind}`} aria-label={`${bodyMapLabel[kind]}示意图`}>
      <svg viewBox="0 0 118 178" role="img" aria-labelledby="muscleTitle">
        <title id="muscleTitle">{bodyMapLabel[kind]}用紫色高亮</title>
        <defs>
          <linearGradient id="torso" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#ede7ff" />
          </linearGradient>
          <linearGradient id="lat" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#8b72ee" />
            <stop offset="1" stopColor="#6442d6" />
          </linearGradient>
        </defs>
        <circle cx="59" cy="24" r="15" fill="url(#torso)" stroke="#d9cff9" strokeWidth="2" />
        <path d="M43 43 Q59 35 75 43 L84 103 Q79 137 59 151 Q39 137 34 103 Z" fill="url(#torso)" stroke="#d9cff9" strokeWidth="2" />
        {kind === "back" || kind === "cardio" ? (
          <>
            <path d="M40 61 C28 74 22 96 24 123 C36 118 45 99 50 75 Z" fill="url(#lat)" opacity="0.96" />
            <path d="M78 61 C90 74 96 96 94 123 C82 118 73 99 68 75 Z" fill="url(#lat)" opacity="0.96" />
          </>
        ) : null}
        {kind === "chest" ? <path d="M43 58 C50 53 68 53 75 58 L72 88 C65 93 53 93 46 88 Z" fill="url(#lat)" opacity="0.96" /> : null}
        {kind === "legs" ? (
          <>
            <path d="M43 113 L38 166 L52 166 L58 119 Z" fill="url(#lat)" opacity="0.96" />
            <path d="M75 113 L80 166 L66 166 L60 119 Z" fill="url(#lat)" opacity="0.96" />
          </>
        ) : null}
        {kind === "core" ? <path d="M48 76 L70 76 L73 117 Q60 128 45 117 Z" fill="url(#lat)" opacity="0.96" /> : null}
        <path d="M39 48 C28 58 19 77 17 101" fill="none" stroke="#c8b3fd" strokeWidth="8" strokeLinecap="round" opacity="0.78" />
        <path d="M79 48 C90 58 99 77 101 101" fill="none" stroke="#c8b3fd" strokeWidth="8" strokeLinecap="round" opacity="0.78" />
        <path d="M50 151 L45 174 M68 151 L73 174" stroke="#d9cff9" strokeWidth="8" strokeLinecap="round" />
        <path d="M48 75 C54 83 64 83 70 75" fill="none" stroke="#fff" strokeWidth="2.4" opacity="0.82" />
        <path d="M31 76 C36 72 42 70 49 70 M87 76 C82 72 76 70 69 70" fill="none" stroke="#fff" strokeWidth="2" opacity="0.56" />
      </svg>
      <span className="body-label">{bodyMapLabel[kind]}</span>
    </div>
  );
}

export function ExercisePage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const startSession = useWorkoutStore((state) => state.startSession);
  const setSession = useWorkoutStore((state) => state.setSession);
  const setPlan = useWorkoutStore((state) => state.setPlan);
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

  const start = async () => {
    let nextPlan = plan;
    if (exercise) {
      try {
        const response = await addExerciseToWorkout(exercise.exercise_id, plan.plan_id);
        if (response.plan) {
          nextPlan = response.plan;
          setPlan(response.plan);
          queryClient.setQueryData(["today-workout"], response.plan);
        } else {
          addExercise(exercise.exercise_id);
        }
      } catch {
        addExercise(exercise.exercise_id);
        // 本地体验兜底：后端不可用时仍允许用户开始训练。
      }
    }
    try {
      const session = await createWorkoutSession(nextPlan.plan_id, exercise?.exercise_id);
      setSession(session);
      queryClient.setQueryData(["workout-session-current"], session);
    } catch {
      // 同上，保留可演示性。
    } finally {
      startSession(exercise?.exercise_id);
    }
    navigate("/workout/session");
  };

  return (
    <AppShell>
      <TopBar title={exercise?.name_cn ?? "动作教程"} />
      {isLoading || !exercise ? (
        <Card className="py-10 text-center text-sm font-semibold text-[var(--muted)]">小铁正在整理教程...</Card>
      ) : (
        <section className="pb-4">
          <section className="hero-machine">
            <p className="kicker">小白动作教程</p>
            <h1>先调稳，再慢慢做。</h1>
            {exercise.video_url?.endsWith(".gif") ? (
              <img className="exercise-hero-video" src={exercise.video_url} alt={`${exercise.name_cn} 动态演示`} />
            ) : exercise.video_url ? (
              <video className="exercise-hero-video" src={exercise.video_url} poster={exercise.thumbnail_url} autoPlay loop muted playsInline />
            ) : (
              <div className="machine-illo" aria-hidden="true" />
            )}
          </section>

          <div className="tag-row mt-3">
            <Tag>{exercise.difficulty === "beginner" ? "新手友好" : exercise.difficulty}</Tag>
            <Tag>{exercise.default_sets} 组</Tag>
            <Tag>每组 {exercise.default_reps}</Tag>
          </div>

          <section className="lesson-strip muscle-lesson">
            <BodyMap exercise={exercise} />
            <div>
              <h2 className="open-title">1 练哪里</h2>
              <p className="open-copy">{exercise.beginner_explanation}</p>
              <div className="muscle-callouts" aria-label="发力说明">
                <div className="muscle-callout"><span className="muscle-dot" /><span>主发力：{exercise.target_body_parts_beginner[0] ?? "目标肌群"}</span></div>
                <div className="muscle-callout"><span className="muscle-dot assist" /><span>辅助：先稳住动作，不抢重量</span></div>
              </div>
            </div>
          </section>

          <section className="lesson">
            <h2>2 怎么调</h2>
            <ul>
              {exercise.setup_tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </section>

          <section className="lesson">
            <h2>3 怎么做</h2>
            <ol>
              {exercise.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>

          <section className="lesson">
            <h2>4 常见错误</h2>
            <ul className="danger-list">
              {exercise.common_mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}
            </ul>
          </section>

          <XiaotieTip tone="warning">{exercise.safety_notes.join(" ")}</XiaotieTip>

          <div className="action-row sticky-action">
            <Button variant="secondary" icon={alreadyInPlan ? <CheckCircle2 size={18} /> : <Plus size={18} />} onClick={() => {
              void addExerciseToWorkout(exercise.exercise_id, plan.plan_id).then((response) => {
                if (response.plan) {
                  setPlan(response.plan);
                  queryClient.setQueryData(["today-workout"], response.plan);
                } else {
                  addExercise(exercise.exercise_id);
                }
              }).catch(() => {
                addExercise(exercise.exercise_id);
              });
            }}>
              {alreadyInPlan ? "已在计划" : "加入训练"}
            </Button>
            <Button onClick={() => void start()}>开始训练</Button>
          </div>
        </section>
      )}
    </AppShell>
  );
}
