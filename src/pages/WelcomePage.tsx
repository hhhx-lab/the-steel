import { CalendarDays, Check, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { bodyParts, formatBodyPartList } from "../data/todayPlan";
import { saveTrainingProfile } from "../services/tieziApi";
import { useUserStore } from "../stores/userStore";
import type { FitnessGoal, SplitPreference } from "../types/user";

const goalOptions: Array<{ value: FitnessGoal; label: string; desc: string }> = [
  { value: "fat_loss", label: "减脂优先", desc: "控制总量，保留肌肉和训练习惯。" },
  { value: "muscle_gain", label: "增肌优先", desc: "稳步增加容量，关注动作质量。" },
  { value: "shape", label: "塑形体态", desc: "线条、核心和薄弱部位一起顾。" }
];

const splitOptions: Array<{ value: SplitPreference; label: string; desc: string }> = [
  { value: "two", label: "二分化", desc: "上肢 / 下肢，适合每周 2-4 练。" },
  { value: "three", label: "三分化", desc: "推 / 拉 / 腿，动作安排更细。" },
  { value: "four", label: "四分化", desc: "胸背腿肩臂拆开，适合频率更高。" }
];

export function WelcomePage() {
  const navigate = useNavigate();
  const updateProfile = useUserStore((state) => state.updateProfile);
  const [goal, setGoal] = useState<FitnessGoal>("fat_loss");
  const [split, setSplit] = useState<SplitPreference>("three");
  const [frequency, setFrequency] = useState(3);
  const [frequencyMode, setFrequencyMode] = useState<"preset" | "custom">("preset");
  const [focusParts, setFocusParts] = useState<string[]>(["背部"]);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const saveLongTermPlan = () => {
    updateProfile({
      fitness_goal: goal,
      split_preference: split,
      weekly_frequency: frequency,
      focus_body_parts: focusParts,
      training_profile_completed: true,
      onboarding_completed: false
    });
  };

  const chooseGoal = (value: FitnessGoal) => {
    setGoal(value);
    setCurrentStep(2);
  };

  const chooseSplit = (value: SplitPreference) => {
    setSplit(value);
    setCurrentStep(3);
  };

  const chooseFrequency = (value: number) => {
    setFrequencyMode("preset");
    setFrequency(value);
    setCurrentStep(4);
  };

  const confirmCustomFrequency = () => {
    setFrequencyMode("custom");
    setFrequency((value) => Math.min(7, Math.max(1, Math.round(value) || 3)));
    setCurrentStep(4);
  };

  const toggleFocusPart = (part: string) => {
    setFocusParts((parts) => {
      if (parts.includes(part)) {
        const next = parts.filter((item) => item !== part);
        return next.length ? next : [part];
      }
      return [...parts, part];
    });
  };

  const goTodaySetup = async () => {
    setSaving(true);
    setError(undefined);
    saveLongTermPlan();
    try {
      await saveTrainingProfile({
        fitness_goal: goal,
        split_preference: split,
        weekly_frequency: frequency,
        focus_body_parts: focusParts,
        experience_level: "newbie"
      });
      navigate("/onboarding/today");
    } catch {
      setError("计划已先保存在本地，后端暂时没连上。你可以继续设置今天训练。");
      window.setTimeout(() => navigate("/onboarding/today"), 700);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell className="welcome-screen">
      <div className="welcome-shell">
        <section className="welcome-art" aria-label="铁子欢迎页">
          <div className="welcome-copy">
            <p className="kicker">小铁在这里</p>
            <h1 className="hero-title">不认识器械，也能开始练。</h1>
            <p className="support">帮你识器械、看懂动作、完成第一组训练。</p>
          </div>
          <div className="orbit" />
          <svg className="star" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="currentColor" d="M24 2l4.9 16.6L46 24l-17.1 5.4L24 46l-4.9-16.6L2 24l17.1-5.4L24 2z" />
          </svg>
          <div className="character-card welcome-figure">
            <span className="character-halo" />
            <img src="/assets/cutouts/xiaotie-female-bust-cutout.png" alt="小铁 AI 健身伙伴" />
          </div>
        </section>

        <section className="onboarding-panel" aria-label="基础训练配置">
          <div className="onboarding-head">
            <span className="circle-index current"><Sparkles size={15} /></span>
            <div>
              <p className="kicker">先定一个起点</p>
              <h2>先生成整体训练计划，再安排今天这一练</h2>
            </div>
          </div>

          <div className="onboarding-progress" aria-label="整体计划进度">
            {[1, 2, 3, 4].map((step) => (
              <span key={step} className={currentStep >= step ? "active" : ""} />
            ))}
          </div>

          <div className="wizard-question-card reveal-question" key={currentStep}>
            {currentStep === 1 ? (
              <div className="onboarding-block">
                <p className="onboarding-label">主要目标</p>
                <div className="option-card-grid">
                  {goalOptions.map((option) => (
                    <button key={option.value} className={goal === option.value ? "option-card active" : "option-card"} type="button" onClick={() => chooseGoal(option.value)}>
                      <strong>{option.label}</strong>
                      <span>{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="onboarding-block">
                <p className="onboarding-label">训练分化</p>
                <p className="onboarding-helper">分化就是把身体部位拆到不同训练日，避免每天都练一样的部位。</p>
                <div className="option-card-grid">
                  {splitOptions.map((option) => (
                    <button key={option.value} className={split === option.value ? "option-card active" : "option-card"} type="button" onClick={() => chooseSplit(option.value)}>
                      <strong>{option.label}</strong>
                      <span>{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="onboarding-block">
                <p className="onboarding-label">预期训练频率</p>
                <div className="chip-row">
                  {[2, 3, 4, 5].map((value) => (
                    <button key={value} className={frequency === value ? "active" : ""} type="button" onClick={() => chooseFrequency(value)}>
                      每周 {value} 次
                    </button>
                  ))}
                  <button className={frequencyMode === "custom" ? "active" : ""} type="button" onClick={() => setFrequencyMode("custom")}>
                    自定义
                  </button>
                </div>
                {frequencyMode === "custom" ? (
                  <label className="onboarding-number-field">
                    <span>每周</span>
                    <input type="number" min={1} max={7} value={frequency} onChange={(event) => setFrequency(Number(event.target.value) || 3)} />
                    <button className="secondary-btn" type="button" onClick={confirmCustomFrequency}>确认频率</button>
                  </label>
                ) : null}
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div className="onboarding-block">
                <p className="onboarding-label">最想重点训练的部位</p>
                <p className="onboarding-helper">可以多选，小铁会把它们放进长期计划里轮换照顾。</p>
                <div className="chip-row">
                  {bodyParts.map((part) => (
                    <button key={part} className={focusParts.includes(part) ? "active" : ""} type="button" onClick={() => toggleFocusPart(part)}>
                      {focusParts.includes(part) ? <Check size={13} /> : null}
                      {part}
                    </button>
                  ))}
                </div>
                <button className="secondary-btn onboarding-confirm-btn" type="button" onClick={() => setCurrentStep(5)}>
                  确认重点部位
                </button>
              </div>
            ) : null}

            {currentStep === 5 ? (
              <section className="generated-plan-banner">
                <span className="circle-index done"><Check size={15} /></span>
                <div>
                  <p className="row-title">整体训练计划已生成</p>
                  <p className="row-sub">{goalOptions.find((option) => option.value === goal)?.label} · {splitOptions.find((option) => option.value === split)?.label} · 每周 {frequency} 次 · 重点 {formatBodyPartList(focusParts)}。</p>
                  {error ? <p className="row-sub mt-2 text-[var(--danger)]">{error}</p> : null}
                </div>
              </section>
            ) : null}

            <div className="wizard-nav">
              <button className="secondary-btn" type="button" disabled={currentStep === 1} onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}>
                上一题
              </button>
              {currentStep === 5 ? (
                <Button icon={<CalendarDays size={18} />} onClick={() => void goTodaySetup()} disabled={saving}>
                  {saving ? "保存中..." : "继续设置今日训练"}
                </Button>
              ) : (
                <span className="onboarding-waiting">{currentStep === 4 ? "可以多选，确认后进入今日训练。" : "选一个答案，小铁就继续问下一题。"}</span>
              )}
            </div>
          </div>
        </section>

        <p className="welcome-note">
          <ShieldCheck size={14} className="mr-1 inline align-[-2px]" />
          整体计划只问长期偏好；下一步再问今天练什么，不重复打扰你。
        </p>
      </div>
    </AppShell>
  );
}
