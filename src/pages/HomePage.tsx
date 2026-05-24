import { BookOpen, Camera, Dumbbell, Mic2, Play, Timer } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
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
      <section className="space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ocean">嗨，{profile.nickname}</p>
            <h1 className="mt-1 text-2xl font-black leading-tight">今天想练哪里？</h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-ink text-acid">
            <Dumbbell size={24} />
          </div>
        </header>

        <Card className="space-y-4 border-ink bg-ink text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-acid">今日训练</p>
              <h2 className="mt-2 text-xl font-black">{plan.title}</h2>
              <p className="mt-1 text-sm text-white/70">{plan.subtitle}</p>
            </div>
            <Tag tone="green" className="border-acid/40 bg-acid text-ink">
              中等强度
            </Tag>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[8px] bg-white/10 p-3">
              <Timer size={18} className="mb-2 text-acid" />
              <p className="text-lg font-black">{plan.duration_minutes}</p>
              <p className="text-xs text-white/62">分钟</p>
            </div>
            <div className="rounded-[8px] bg-white/10 p-3">
              <Dumbbell size={18} className="mb-2 text-acid" />
              <p className="text-lg font-black">{plan.exercises.length}</p>
              <p className="text-xs text-white/62">个动作</p>
            </div>
            <div className="rounded-[8px] bg-white/10 p-3">
              <Play size={18} className="mb-2 text-acid" />
              <p className="text-lg font-black">{records.length}</p>
              <p className="text-xs text-white/62">条记录</p>
            </div>
          </div>

          <Button className="w-full bg-acid text-ink" icon={<Play size={19} />} onClick={startWorkout}>
            开始训练
          </Button>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <button className="rounded-[8px] border border-line bg-white p-3 text-left" type="button" onClick={() => navigate("/scan")}>
            <Camera className="mb-3 text-ocean" size={24} />
            <p className="text-sm font-black">拍一下器械</p>
            <p className="mt-1 text-xs font-medium text-muted">不认识就拍</p>
          </button>
          <button className="rounded-[8px] border border-line bg-white p-3 text-left" type="button" onClick={() => navigate("/workout/log")}>
            <Mic2 className="mb-3 text-ocean" size={24} />
            <p className="text-sm font-black">一句话记录</p>
            <p className="mt-1 text-xs font-medium text-muted">快速记训练</p>
          </button>
          <button className="rounded-[8px] border border-line bg-white p-3 text-left" type="button" onClick={() => setGuideOpen(true)}>
            <BookOpen className="mb-3 text-ocean" size={24} />
            <p className="text-sm font-black">新手指南</p>
            <p className="mt-1 text-xs font-medium text-muted">快速上手</p>
          </button>
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black">动作清单</h2>
            <Tag>{plan.exercises.length} 个动作</Tag>
          </div>
          <div className="space-y-2">
            {plan.exercises.map((item, index) => {
              const exercise = findExercise(item.exercise_id);
              return (
                <div key={`${item.exercise_id}-${index}`} className="flex items-center justify-between rounded-[8px] bg-paper p-3">
                  <div>
                    <p className="text-sm font-black">{index + 1}. {exercise.name_cn}</p>
                    <p className="text-xs font-semibold text-muted">{item.sets} 组 · {item.reps}</p>
                  </div>
                  <Tag tone={item.status === "completed" ? "green" : item.status === "current" ? "orange" : "default"}>
                    {item.status === "completed" ? "已完成" : item.status === "current" ? "当前" : "待练"}
                  </Tag>
                </div>
              );
            })}
          </div>
        </Card>

        <XiaotieTip>今天先别追求重量，第一组用偏轻的重量试动作。动作稳，比重量漂亮重要。</XiaotieTip>
      </section>

      {guideOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/35 px-4 pb-4" role="dialog" aria-modal="true">
          <Card className="mx-auto w-full max-w-[448px] space-y-4">
            <h2 className="text-lg font-black">新手上手 3 件事</h2>
            <ol className="space-y-3 text-sm font-semibold leading-6 text-muted">
              <li>1. 不认识器械就拍，不要硬猜名称。</li>
              <li>2. 第一组先用偏轻重量，找到动作感觉。</li>
              <li>3. 疼痛、不适、旧伤时先停，小铁不能替代医生或教练判断。</li>
            </ol>
            <Button className="w-full" onClick={() => setGuideOpen(false)}>
              明白了
            </Button>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
