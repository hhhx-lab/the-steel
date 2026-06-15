import { ArrowRightLeft, Mic, Send, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { addExerciseToWorkout, adjustWorkoutIntensity, getAssistantMessages, replaceExerciseInWorkout, sendAssistantMessage } from "../../services/tieziApi";
import { useWorkoutStore } from "../../stores/workoutStore";
import type { AssistantResponse } from "../../types/api";
import { useSpeechInput } from "./useSpeechInput";

export function FloatingTiezi() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("高位下拉器械被占了，请给我其他可替代器械。");
  const [reply, setReply] = useState<string>();
  const [actions, setActions] = useState<AssistantResponse["suggested_actions"]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const voice = useSpeechInput((transcript) => setText(transcript));
  const currentExerciseId = useWorkoutStore((state) => state.currentExerciseId);
  const plan = useWorkoutStore((state) => state.plan);
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const replaceExercise = useWorkoutStore((state) => state.replaceExercise);
  const setPlan = useWorkoutStore((state) => state.setPlan);
  const setSession = useWorkoutStore((state) => state.setSession);
  const sessionId = useWorkoutStore((state) => state.session_id);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void getAssistantMessages()
      .then((messages) => {
        if (!active) return;
        const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");
        const latestUser = [...messages].reverse().find((message) => message.role === "user");
        if (latestAssistant) {
          setReply(latestAssistant.message);
          setActions(latestAssistant.suggested_actions ?? []);
        }
        if (latestUser?.message) setText(latestUser.message);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open]);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await sendAssistantMessage(text, {
        current_exercise_id: currentExerciseId,
        session_id: sessionId,
        plan_id: plan.plan_id,
        current_intensity: plan.intensity,
        today_focus_part: plan.today_focus_part,
        plan_status: plan.status
      }, voice.lastInputWasVoice ? "voice" : "text");
      setReply(result.reply);
      setActions(result.suggested_actions);
    } catch {
      setReply("收到。我会优先找同样练背、动作路径接近、当前强度更稳的替代动作，比如坐姿划船或辅助引体。");
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action: AssistantResponse["suggested_actions"][number]) => {
    if (!action.to_exercise_id && action.type !== "adjust_intensity") return;
    setActionLoading(true);
    try {
      if (action.type === "adjust_intensity" && action.intensity) {
        const result = await adjustWorkoutIntensity(plan.plan_id, action.intensity, sessionId);
        if (result.plan) {
          setPlan(result.plan);
          queryClient.setQueryData(["today-workout"], result.plan);
        }
        if (result.session !== undefined) {
          setSession(result.session ?? null);
          queryClient.setQueryData(["workout-session-current"], result.session ?? null);
        }
        setReply(result.session?.last_feedback ?? result.message);
      } else if (action.type === "replace_exercise" && action.from_exercise_id && action.to_exercise_id) {
        const result = await replaceExerciseInWorkout(action.from_exercise_id, action.to_exercise_id, plan.plan_id);
        setPlan(result.plan);
        queryClient.setQueryData(["today-workout"], result.plan);
        if (result.session !== undefined) {
          setSession(result.session ?? null);
          queryClient.setQueryData(["workout-session-current"], result.session ?? null);
        }
        setReply(`${action.label}已替换进今日训练，你可以继续从当前动作往下练。`);
      } else if (action.to_exercise_id) {
        const result = await addExerciseToWorkout(action.to_exercise_id, plan.plan_id);
        if (result.plan) {
          setPlan(result.plan);
          queryClient.setQueryData(["today-workout"], result.plan);
        } else {
          addExercise(action.to_exercise_id);
        }
        setReply(`${action.label}已加入今日训练，你可以继续从当前动作往下练。`);
      }
      setOpen(false);
      navigate("/workout/session");
    } catch {
      if (action.type === "replace_exercise" && action.from_exercise_id && action.to_exercise_id) {
        replaceExercise(action.from_exercise_id, action.to_exercise_id);
      }
      setReply("这个替换动作先记在小铁建议里，后端暂时没连上。");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <button className="floating-tiezi" type="button" onClick={() => setOpen(true)} aria-label="打开小铁助手">
        <img src="/assets/cutouts/xiaotie-female-head-cutout.png" alt="" />
        <span>问小铁</span>
      </button>

      {open ? (
        <div className="assistant-dock" role="dialog" aria-modal="true" aria-label="小铁助手">
          <div className="assistant-head">
            <div className="avatar-chip">
              <img className="avatar" src="/assets/cutouts/xiaotie-female-head-cutout.png" alt="小铁" />
              <div>
                <strong>小铁在线</strong>
                <p>可以说器械占用、太重、太累或想换动作。</p>
              </div>
            </div>
            <button className="icon-button" type="button" aria-label="关闭小铁助手" onClick={() => setOpen(false)}>
              <X size={17} />
            </button>
          </div>

          <textarea className="assistant-input" value={text} onChange={(event) => {
            voice.markTextEdited();
            setText(event.target.value);
          }} />
          {voice.voiceMessage ? <p className="voice-status">{voice.voiceMessage}</p> : null}
          {reply ? <p className="assistant-reply">{reply}</p> : null}
          {actions.length ? (
            <div className="assistant-suggested-actions">
              {actions.map((action) => (
                <button key={`${action.type}-${action.to_exercise_id ?? action.label}`} type="button" onClick={() => void runAction(action)} disabled={actionLoading}>
                  <ArrowRightLeft size={15} />
                  {actionLoading ? "处理中..." : action.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="assistant-actions">
            <button className={voice.recording ? "voice-mini recording" : "voice-mini"} type="button" aria-label="语音输入" onClick={voice.toggle}>
              <Mic size={17} />
            </button>
            <Button className="flex-1" icon={<Send size={17} />} onClick={() => void submit()} disabled={loading}>
              {loading ? "思考中..." : "发送给小铁"}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
