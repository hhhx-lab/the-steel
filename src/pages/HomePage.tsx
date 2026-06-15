import { AlertTriangle, Check, Dumbbell, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { createWorkoutSession, generateTodayWorkout, getTodayWorkout, getTrainingInsights, updateUserProfile } from "../services/tieziApi";
import { useScanStore } from "../stores/scanStore";
import { useUserStore } from "../stores/userStore";
import { useWorkoutStore } from "../stores/workoutStore";

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const localPlan = useWorkoutStore((state) => state.plan);
  const lastScanResult = useScanStore((state) => state.lastResult);
  const startSession = useWorkoutStore((state) => state.startSession);
  const configurePlan = useWorkoutStore((state) => state.configurePlan);
  const setPlan = useWorkoutStore((state) => state.setPlan);
  const setSession = useWorkoutStore((state) => state.setSession);
  const { data: queriedPlan } = useQuery({ queryKey: ["today-workout"], queryFn: getTodayWorkout });
  const { data: trainingInsights } = useQuery({ queryKey: ["training-insights"], queryFn: getTrainingInsights });
  const plan = queriedPlan ?? localPlan;
  const latestInsight = trainingInsights?.[0];
  const [durationMode, setDurationMode] = useState<"30" | "60" | "custom">("30");
  const [customDuration, setCustomDuration] = useState(45);
  const [intensity, setIntensity] = useState(plan.intensity);
  const [planStep, setPlanStep] = useState(1);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string>();
  const [guideOpen, setGuideOpen] = useState(() => !profile.home_guide_seen);
  const duration = durationMode === "30" ? 30 : durationMode === "60" ? 60 : customDuration;
  const planReason = latestInsight
    ? `小铁参考了最近体感：${latestInsight.flags.includes("pain") ? "有不适反馈" : latestInsight.flags.includes("heavy") ? "重量偏重" : latestInsight.flags.includes("tired") ? "有点累" : "反馈稳定"}。`
    : plan.generated_reason ?? "小铁会结合历史记录和本次体感继续调整。";

  useEffect(() => {
    if (queriedPlan) {
      setPlan(queriedPlan);
      setIntensity(queriedPlan.intensity);
      if (queriedPlan.duration_minutes === 30) {
        setDurationMode("30");
      } else if (queriedPlan.duration_minutes === 60) {
        setDurationMode("60");
      } else {
        setDurationMode("custom");
        setCustomDuration(queriedPlan.duration_minutes);
      }
    }
  }, [queriedPlan, setPlan]);

  useEffect(() => {
    setGuideOpen(!profile.home_guide_seen);
  }, [profile.home_guide_seen]);

  const chooseDuration = (mode: typeof durationMode) => {
    setDurationMode(mode);
    if (mode !== "custom") setPlanStep(2);
  };

  const chooseIntensity = (value: typeof intensity) => {
    setIntensity(value);
    setPlanStep(3);
  };

  const startWorkout = async () => {
    setStarting(true);
    setStartError(undefined);
    configurePlan({ duration_minutes: duration, intensity });
    try {
      const apiPlan = await generateTodayWorkout({
        today_focus_part: profile.today_focus_part ?? localPlan.today_focus_part ?? "全身",
        duration_minutes: duration,
        intensity
      });
      setPlan(apiPlan);
      queryClient.setQueryData(["today-workout"], apiPlan);
      const session = await createWorkoutSession(apiPlan.plan_id);
      setSession(session);
      queryClient.setQueryData(["workout-session-current"], session);
      startSession();
      navigate("/workout/session");
    } catch {
      setStartError("后端暂时没连上，先用本地训练继续。");
      startSession();
      window.setTimeout(() => navigate("/workout/session"), 500);
    } finally {
      setStarting(false);
    }
  };

  const closeGuide = async () => {
    updateProfile({ home_guide_seen: true });
    setGuideOpen(false);
    try {
      const savedProfile = await updateUserProfile({ home_guide_seen: true });
      updateProfile(savedProfile);
    } catch {
      // 网络失败时保留本地已读状态，避免引导反复打断首页使用。
    }
  };

  return (
    <AppShell>
      <section className="greeting">
        <div className="coach-message">
          <p className="kicker">嗨，{profile.nickname}</p>
          <h1 className="hero-title text-[25px]">今天练得不拖哦！</h1>
          <p className="support">不认识器械就拍，训练记录我帮你变简单。</p>
        </div>
        <div className="coach-frame">
          <img src="/assets/cutouts/xiaotie-male-bust-cutout.png" alt="小铁教练" />
        </div>
      </section>

      {lastScanResult?.need_more_photo ? (
        <section className="scan-feedback">
          <AlertTriangle size={19} />
          <div>
            <p className="row-title">刚才那张还不够清楚</p>
            <p className="row-sub">把器械正面、说明牌和把手一起拍进去，小铁会更容易识别。</p>
          </div>
          <button className="secondary-btn !min-h-[40px] !rounded-[14px] !px-3 text-xs" type="button" onClick={() => navigate("/scan")}>
            <RotateCcw size={14} />
            重拍
          </button>
        </section>
      ) : null}

      <section className="plan-card">
        <div className="plan-head">
          <div>
            <p className="kicker">今日训练</p>
            <h2>{duration} 分钟<br />{plan.subtitle}</h2>
            <p className="support">{plan.title}</p>
          </div>
          <div className="dumbbell" aria-hidden="true">
            <Dumbbell size={42} strokeWidth={2.5} />
          </div>
        </div>
        <p className="plan-reason">{planReason}</p>
        <div className="plan-config">
          <div className="home-plan-progress" aria-label="今日训练设置进度">
            {[1, 2, 3].map((step) => <span key={step} className={planStep >= step ? "active" : ""} />)}
          </div>

          <div className="home-plan-question reveal-question" key={planStep}>
            {planStep === 1 ? (
              <div>
                <span>今天预计练多久</span>
                <div className="choice-row">
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
                  <label className="custom-duration">
                    <span>输入训练时间</span>
                    <input type="number" min={10} max={180} value={customDuration} onChange={(event) => setCustomDuration(Number(event.target.value) || 30)} />
                    <button type="button" onClick={() => setPlanStep(2)}>确认</button>
                  </label>
                ) : null}
              </div>
            ) : null}

            {planStep === 2 ? (
              <div>
                <span>今天训练强度</span>
                <div className="choice-row">
                  {[
                    ["low", "轻松"],
                    ["medium", "适中"],
                    ["high", "挑战"]
                  ].map(([value, label]) => (
                    <button key={value} className={intensity === value ? "active" : ""} type="button" onClick={() => chooseIntensity(value as typeof intensity)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {planStep === 3 ? (
              <section className="home-plan-ready">
                <span className="circle-index done"><Check size={15} /></span>
                <div>
                  <p className="row-title">今日训练设置完成</p>
                  <p className="row-sub">{duration} 分钟 · {intensity === "low" ? "轻松" : intensity === "high" ? "挑战" : "适中"}强度。动作会在训练中继续动态调整。</p>
                  {startError ? <p className="row-sub mt-2 text-[var(--danger)]">{startError}</p> : null}
                </div>
              </section>
            ) : null}

            <div className="home-plan-nav">
              <button type="button" disabled={planStep === 1} onClick={() => setPlanStep((step) => Math.max(1, step - 1))}>上一题</button>
              {planStep < 3 ? <span>选一个答案继续</span> : null}
            </div>
          </div>
        </div>
        {planStep === 3 ? (
          <Button className="full mt-[18px] !border-0 !bg-white !text-[var(--primary)] !shadow-none" variant="secondary" icon={<Play size={18} />} onClick={() => void startWorkout()} disabled={starting}>
            {starting ? "创建训练中..." : "开始训练"}
          </Button>
        ) : null}
      </section>

      {guideOpen ? (
        <div className="home-guide-backdrop" role="dialog" aria-modal="true" aria-label="小铁训练引导">
          <section className="home-guide-sheet">
            <button className="icon-button" type="button" aria-label="关闭引导" onClick={() => void closeGuide()}>
              <X size={17} />
            </button>
            <span className="circle-index current"><Sparkles size={15} /></span>
            <div>
              <p className="row-title">小铁会边练边调计划</p>
              <p className="row-sub">结合历史记录、每组体感、今天强度和现场器械可用情况，训练中再展开具体动作。</p>
              <p className="row-sub mt-2">今天先别追求重量，第一组用偏轻的重量试动作。动作稳，比重量漂亮重要。</p>
            </div>
            <Button className="full mt-3" onClick={() => void closeGuide()}>知道了</Button>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
