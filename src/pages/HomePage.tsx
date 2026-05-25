import { Bell, BookOpen, Camera, Dumbbell, Mic2, Play } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Tag } from "../components/ui/Tag";
import { findExercise } from "../data/mockExercises";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { getTodayWorkout } from "../services/tieziApi";
import { useUserStore } from "../stores/userStore";
import { useWorkoutStore } from "../stores/workoutStore";

export function HomePage() {
  const navigate = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const profile = useUserStore((state) => state.profile);
  const localPlan = useWorkoutStore((state) => state.plan);
  const startSession = useWorkoutStore((state) => state.startSession);
  const records = useWorkoutStore((state) => state.records);
  const { data: queriedPlan } = useQuery({ queryKey: ["today-workout"], queryFn: getTodayWorkout });
  const plan = localPlan ?? queriedPlan;

  const startWorkout = () => {
    startSession();
    navigate("/workout/session");
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="brand-mark">
          <span>铁子</span>
          <i className="spark" />
        </div>
        <button className="icon-button" aria-label="通知" type="button">
          <Bell size={17} />
        </button>
      </div>

      <section className="greeting">
        <div>
          <p className="kicker">嗨，{profile.nickname}</p>
          <h1 className="hero-title text-[25px]">今天练得不拖哦！</h1>
          <p className="support">不认识器械就拍，训练记录我帮你变简单。</p>
        </div>
        <div className="character-card mini-portrait">
          <span className="character-halo" />
          <img src="/assets/cutouts/xiaotie-male-head-cutout.png" alt="小铁头像" />
        </div>
      </section>

      <section className="plan-card">
        <div className="plan-head">
          <div>
            <p className="kicker">今日训练</p>
            <h2>{plan.duration_minutes} 分钟<br />{plan.subtitle}</h2>
            <p className="support">{plan.title}</p>
          </div>
          <div className="dumbbell" aria-hidden="true">
            <Dumbbell size={42} strokeWidth={2.5} />
          </div>
        </div>
        <div className="tag-row">
          <Tag>{plan.exercises.length} 个动作</Tag>
          <Tag>{plan.intensity === "medium" ? "中等强度" : plan.intensity}</Tag>
          <Tag>{records.length} 条记录</Tag>
        </div>
        <Button className="full mt-[18px] !border-0 !bg-white !text-[var(--primary)] !shadow-none" variant="secondary" icon={<Play size={18} />} onClick={startWorkout}>
          开始训练
        </Button>
      </section>

      <section className="open-section quick-list" aria-label="快捷入口">
        <button className="light-row" type="button" onClick={() => navigate("/scan")}>
          <span className="circle-index"><Camera size={15} /></span>
          <span><b className="row-title">拍一下器械</b><p className="row-sub">不认识器械时，小铁帮你识别怎么练。</p></span>
          <span className="arrow">›</span>
        </button>
        <button className="light-row" type="button" onClick={() => navigate("/workout/log")}>
          <span className="circle-index"><Mic2 size={15} /></span>
          <span><b className="row-title">一句话记录</b><p className="row-sub">打字或语音，说完后自动整理组数。</p></span>
          <span className="arrow">›</span>
        </button>
        <button className="light-row" type="button" onClick={() => setGuideOpen(true)}>
          <span className="circle-index"><BookOpen size={15} /></span>
          <span><b className="row-title">新手指南</b><p className="row-sub">先看发力位置，再跟着步骤开始。</p></span>
          <span className="arrow">›</span>
        </button>
      </section>

      <section className="open-section">
        <div className="section-heading">
          <h2>动作清单</h2>
          <span>{plan.exercises.length} 个动作</span>
        </div>
        {plan.exercises.slice(0, 5).map((item, index) => {
          const exercise = findExercise(item.exercise_id);
          return (
            <button className="light-row" key={`${item.exercise_id}-${index}`} type="button" onClick={() => navigate("/workout/session")}>
              <span className={`circle-index ${item.status === "completed" ? "done" : item.status === "current" ? "current" : ""}`}>
                {item.status === "completed" ? "✓" : index + 1}
              </span>
              <span><b className="row-title">{exercise.name_cn}</b><p className="row-sub">{item.sets} 组 · {item.reps} · {exercise.target_body_parts_beginner.join(" / ")}</p></span>
              <span className="current-pill">{item.status === "current" ? "当前" : ""}</span>
            </button>
          );
        })}
      </section>

      <XiaotieTip>今天先别追求重量，第一组用偏轻的重量试动作。动作稳，比重量漂亮重要。</XiaotieTip>

      {guideOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <h2>新手上手 3 件事</h2>
            <p>1. 不认识器械就拍，不要硬猜名称。</p>
            <p className="mt-2">2. 第一组先用偏轻重量，找到动作感觉。</p>
            <p className="mt-2">3. 疼痛、不适、旧伤时先停，小铁不能替代医生或教练判断。</p>
            <Button className="full mt-4" onClick={() => setGuideOpen(false)}>明白了</Button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
