import { CalendarDays, Check, Dumbbell, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/Button";
import { createPlanExercises, formatBodyPartList, getTodayExerciseIds, getTodayPlanTitle, todayParts } from "../data/todayPlan";
import { generateTodayWorkout, updateUserProfile } from "../services/tieziApi";
import { useUserStore } from "../stores/userStore";
import { useWorkoutStore } from "../stores/workoutStore";

export function TodaySetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateProfile = useUserStore((state) => state.updateProfile);
  const generateTodayPlan = useWorkoutStore((state) => state.generateTodayPlan);
  const setPlan = useWorkoutStore((state) => state.setPlan);
  const [todayPartsSelected, setTodayPartsSelected] = useState<string[]>(["背部"]);
  const [durationMode, setDurationMode] = useState<"30" | "60" | "custom">("30");
  const [customDuration, setCustomDuration] = useState(45);
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const duration = durationMode === "30" ? 30 : durationMode === "60" ? 60 : customDuration;

  const todayPartLabel = formatBodyPartList(todayPartsSelected);

  const togglePart = (part: string) => {
    setTodayPartsSelected((parts) => {
      if (part === "全身") return ["全身"];
      const withoutFullBody = parts.filter((item) => item !== "全身");
      if (withoutFullBody.includes(part)) {
        const next = withoutFullBody.filter((item) => item !== part);
        return next.length ? next : [part];
      }
      return [...withoutFullBody, part];
    });
  };

  const chooseDuration = (mode: "30" | "60" | "custom") => {
    setDurationMode(mode);
    if (mode !== "custom") {
      setCurrentStep(3);
    }
  };

  const chooseIntensity = (value: "low" | "medium" | "high") => {
    setIntensity(value);
    setCurrentStep(4);
  };

  const goCards = async () => {
    updateProfile({
      today_focus_part: todayPartLabel,
      training_profile_completed: true,
      onboarding_completed: true
    });
    setSaving(true);
    setError(undefined);
    try {
      const apiPlan = await generateTodayWorkout({
        today_focus_part: todayPartLabel,
        today_focus_parts: todayPartsSelected,
        duration_minutes: duration,
        intensity
      });
      const savedProfile = await updateUserProfile({
        today_focus_part: todayPartLabel,
        training_profile_completed: true,
        onboarding_completed: true
      });
      updateProfile(savedProfile);
      setPlan(apiPlan);
      queryClient.setQueryData(["today-workout"], apiPlan);
    } catch {
      generateTodayPlan({
        title: "今日计划",
        subtitle: getTodayPlanTitle(todayPartsSelected),
        duration_minutes: duration,
        intensity,
        exercises: createPlanExercises(getTodayExerciseIds(todayPartsSelected))
      });
      setError("后端暂时没连上，先用本地计划继续。");
    } finally {
      setSaving(false);
      navigate("/onboarding/today-plan");
    }
  };

  return (
    <AppShell className="welcome-screen today-setup-screen">
      <TopBar title="今天训练" backTo="/welcome" />

      <section className="setup-coach">
        <div>
          <p className="kicker">小铁帮你排今天</p>
          <h1>今天只问三件事</h1>
          <p>部位、时间、强度确认后，再去动作闪卡里挑具体动作。</p>
        </div>
        <img src="/assets/cutouts/xiaotie-female-head-cutout.png" alt="小铁" />
      </section>

      <section className="onboarding-panel">
        <div className="onboarding-head">
          <span className="circle-index current"><Sparkles size={15} /></span>
          <div>
            <p className="kicker">本次训练</p>
            <h2>今天练什么，由这一页决定</h2>
          </div>
        </div>

        <div className="onboarding-progress" aria-label="今日训练进度">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={currentStep >= step ? "active" : ""} />
          ))}
        </div>

        <div className="wizard-question-card reveal-question" key={currentStep}>
          {currentStep === 1 ? (
            <div className="onboarding-block">
              <p className="onboarding-label">今天想练什么部位</p>
              <p className="onboarding-helper">这里不会覆盖你的长期偏好，只影响今天这一练。</p>
              <div className="chip-row">
                {todayParts.map((part) => (
                  <button key={part} className={todayPartsSelected.includes(part) ? "active" : ""} type="button" onClick={() => togglePart(part)}>
                    {todayPartsSelected.includes(part) ? <Check size={13} /> : null}
                    {part}
                  </button>
                ))}
              </div>
              <button className="secondary-btn onboarding-confirm-btn" type="button" onClick={() => setCurrentStep(2)}>
                确认今日部位
              </button>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="onboarding-block">
              <p className="onboarding-label">今天预计练多久</p>
              <div className="chip-row">
                {[
                  ["30", "30 分钟"],
                  ["60", "1 小时"],
                  ["custom", "自定义"]
                ].map(([value, label]) => (
                  <button key={value} className={durationMode === value ? "active" : ""} type="button" onClick={() => chooseDuration(value as typeof durationMode)}>
                    {label}
                  </button>
                ))}
              </div>
              {durationMode === "custom" ? (
                <label className="onboarding-number-field">
                  <span>分钟</span>
                  <input type="number" min={10} max={180} value={customDuration} onChange={(event) => setCustomDuration(Number(event.target.value) || 30)} />
                  <button className="secondary-btn" type="button" onClick={() => setCurrentStep(3)}>确认时间</button>
                </label>
              ) : null}
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="onboarding-block">
              <p className="onboarding-label">今天训练强度</p>
              <div className="option-card-grid">
                {[
                  ["low", "轻松", "恢复日或状态一般，保守一点。"],
                  ["medium", "适中", "正常训练，稳稳推进。"],
                  ["high", "挑战", "状态好，可以安排更高刺激。"]
                ].map(([value, label, desc]) => (
                  <button key={value} className={intensity === value ? "option-card active" : "option-card"} type="button" onClick={() => chooseIntensity(value as typeof intensity)}>
                    <strong>{label}</strong>
                    <span>{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <section className="generated-plan-banner">
              <span className="circle-index done"><Check size={15} /></span>
              <div>
                <p className="row-title">今日训练计划已生成</p>
                <p className="row-sub">{duration} 分钟 · {todayPartLabel} · 进入下一步确认动作卡。</p>
                {error ? <p className="row-sub mt-2 text-[var(--danger)]">{error}</p> : null}
              </div>
            </section>
          ) : null}

          <div className="wizard-nav">
            <button className="secondary-btn" type="button" disabled={currentStep === 1} onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}>
              上一题
            </button>
            {currentStep === 4 ? (
              <Button icon={<Dumbbell size={18} />} onClick={() => void goCards()} disabled={saving}>
                {saving ? "生成中..." : "查看今日动作卡"}
              </Button>
            ) : (
              <span className="onboarding-waiting"><CalendarDays size={14} />{currentStep === 1 ? "可以多选，确认后继续。" : "选一个答案，小铁就继续问下一题。"}</span>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
