import { Camera, Info, RotateCcw, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { analyzeBodyPhoto, getLatestBodyPhotoAnalysis, resetUserData, updateUserProfile, uploadMedia } from "../services/tieziApi";
import { useScanStore } from "../stores/scanStore";
import { useUserStore } from "../stores/userStore";
import { useWorkoutStore } from "../stores/workoutStore";

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const resetWorkout = useWorkoutStore((state) => state.resetWorkout);
  const resetScan = useScanStore((state) => state.resetScan);
  const [nickname, setNickname] = useState(profile.nickname);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [analyzingBody, setAnalyzingBody] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string>();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bodyPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const avatarSrc = profile.avatar_url ?? "/assets/cutouts/xiaotie-female-head-cutout.png";
  const { data: bodyPhotoAnalysis } = useQuery({ queryKey: ["body-photo-analysis"], queryFn: getLatestBodyPhotoAnalysis });

  const clearAll = async () => {
    setSavingProfile(true);
    try {
      await resetUserData();
      setProfileFeedback("云端和本地体验数据都已清除。");
    } catch {
      setProfileFeedback("后端暂时没连上，已先清除本地体验数据。");
    } finally {
      clearUserData();
      resetWorkout();
      resetScan();
      queryClient.clear();
      setConfirmOpen(false);
      setSavingProfile(false);
      navigate("/welcome");
    }
  };

  const uploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        updateProfile({ avatar_url: reader.result });
        setSavingProfile(true);
        try {
          const asset = await uploadMedia(file, "avatar");
          const savedProfile = await updateUserProfile({ avatar_url: asset.url });
          updateProfile(savedProfile);
          setProfileFeedback("头像已保存。");
        } catch {
          setProfileFeedback("头像已先保存在本地，后端暂时没连上。");
        } finally {
          setSavingProfile(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadBodyPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!profile.allow_body_photo_analysis) {
      setProfileFeedback("请先开启体态照片分析，小铁才会处理你主动上传的照片。");
      return;
    }
    setAnalyzingBody(true);
    setProfileFeedback(undefined);
    analyzeBodyPhoto(file)
      .then(() => {
        setProfileFeedback("体态照片分析完成，小铁已经给出训练关注点。");
        return queryClient.invalidateQueries({ queryKey: ["body-photo-analysis"] });
      })
      .catch((error) => {
        setProfileFeedback(error instanceof Error ? error.message : "体态照片分析失败，请稍后再试。");
      })
      .finally(() => setAnalyzingBody(false));
  };

  const saveNickname = async () => {
    setSavingProfile(true);
    updateProfile({ nickname });
    try {
      const savedProfile = await updateUserProfile({ nickname });
      updateProfile(savedProfile);
      setProfileFeedback("昵称已保存。");
    } catch {
      setProfileFeedback("昵称已先保存在本地，后端暂时没连上。");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleBodyPhotoAnalysis = async () => {
    const nextValue = !profile.allow_body_photo_analysis;
    updateProfile({ allow_body_photo_analysis: nextValue });
    setSavingProfile(true);
    try {
      const savedProfile = await updateUserProfile({ allow_body_photo_analysis: nextValue });
      updateProfile(savedProfile);
      setProfileFeedback(nextValue ? "体态照片分析已开启。拍照能力会在体态分析流程中使用。" : "体态照片分析已关闭。");
    } catch {
      setProfileFeedback("设置已先保存在本地，后端暂时没连上。");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <AppShell>
      <section className="profile-hero">
        <button className="profile-avatar-edit" type="button" onClick={() => avatarInputRef.current?.click()} aria-label="修改头像">
          <img className="avatar" src={avatarSrc} alt="用户头像" />
          <span><Camera size={14} />修改</span>
        </button>
        <div>
          <p>昵称</p>
          <h1>{profile.nickname}</h1>
          <p>{profile.experience_level} · 后端已同步</p>
        </div>
      </section>
      <input ref={avatarInputRef} className="hidden" type="file" accept="image/*" onChange={uploadAvatar} />

      <section className="open-section mt-4">
        <h2 className="open-title">基础设置</h2>
        <div className="settings-list">
          <div className="settings-row">
            <span className="circle-index"><UserRound size={15} /></span>
            <div>
              <p className="row-title">昵称</p>
              <input className="field-control mt-2" value={nickname} onChange={(event) => setNickname(event.target.value)} />
            </div>
            <Button className="!min-h-[38px] !rounded-[14px] !px-3 text-xs" variant="secondary" onClick={() => void saveNickname()} disabled={savingProfile}>
              {savingProfile ? "保存中" : "保存"}
            </Button>
          </div>

          <button className="settings-row settings-button-row" type="button" onClick={() => avatarInputRef.current?.click()}>
            <span className="circle-index"><Camera size={15} /></span>
            <div>
              <p className="row-title">头像</p>
              <p className="row-sub">从相册上传一张头像，并同步到当前后端体验数据。</p>
            </div>
            <span className="arrow">›</span>
          </button>

          <button className="settings-row settings-button-row" type="button" onClick={() => void toggleBodyPhotoAnalysis()} disabled={savingProfile}>
            <span className="circle-index"><ShieldCheck size={15} /></span>
            <div>
              <p className="row-title">体态照片分析</p>
              <p className="row-sub">开启后，小铁只会使用你主动上传的体态照片做分析。</p>
            </div>
            <span className={profile.allow_body_photo_analysis ? "switch-on" : "switch-off"}>
              {profile.allow_body_photo_analysis ? "开启" : "关闭"}
            </span>
          </button>

          <button className="settings-row settings-button-row" type="button" onClick={() => setAboutOpen(true)}>
            <span className="circle-index"><Info size={15} /></span>
            <div>
              <p className="row-title">关于铁子</p>
              <p className="row-sub">拍器械识别、小白教程、今日训练和基础记录。</p>
            </div>
            <span className="arrow">›</span>
          </button>
        </div>
      </section>

      <section className="open-section mt-4">
        <div className="body-analysis-head">
          <div>
            <h2 className="open-title">体态照片分析</h2>
            <p className="row-sub">上传一张你主动选择的体态照，小铁会把它转成训练关注点和动作建议。</p>
          </div>
          <Button className="!min-h-[40px] !rounded-[15px] !px-3 text-xs" variant="secondary" icon={<Camera size={15} />} onClick={() => bodyPhotoInputRef.current?.click()} disabled={analyzingBody || !profile.allow_body_photo_analysis}>
            {analyzingBody ? "分析中" : "上传"}
          </Button>
        </div>
        <input ref={bodyPhotoInputRef} className="hidden" type="file" accept="image/*" onChange={uploadBodyPhoto} />
        {!profile.allow_body_photo_analysis ? (
          <div className="body-analysis-empty">
            <ShieldCheck size={18} />
            <p>开启上方开关后，才可以上传照片生成体态训练建议。</p>
          </div>
        ) : bodyPhotoAnalysis ? (
          <div className="body-analysis-card">
            <img src={bodyPhotoAnalysis.image_url} alt="最近体态照片" />
            <div className="body-analysis-content">
              <p className="row-title">{bodyPhotoAnalysis.posture_summary}</p>
              <div className="body-focus-tags">
                {bodyPhotoAnalysis.recommended_body_parts.map((part) => <span key={part}>{part}</span>)}
              </div>
              <div className="body-focus-list">
                {bodyPhotoAnalysis.focus_areas.map((area) => (
                  <div key={`${area.body_part}-${area.finding}`}>
                    <strong>{area.body_part}</strong>
                    <span>{area.finding}</span>
                  </div>
                ))}
              </div>
              <div className="body-exercise-list">
                {bodyPhotoAnalysis.recommended_exercises.map((exercise) => (
                  <button key={exercise.exercise_id} type="button" onClick={() => navigate(`/exercise/${exercise.exercise_id}`)}>
                    <Sparkles size={14} />
                    {exercise.name_cn}
                  </button>
                ))}
              </div>
              <p className="body-privacy-note">{bodyPhotoAnalysis.privacy_note}</p>
            </div>
          </div>
        ) : (
          <div className="body-analysis-empty">
            <Sparkles size={18} />
            <p>还没有体态分析。上传后，这里会展示小铁的训练建议。</p>
          </div>
        )}
      </section>

      {profileFeedback ? <XiaotieTip tone="safe">{profileFeedback}</XiaotieTip> : null}
      <XiaotieTip>你可以随时清除当前体验数据。后端会同步重置用户、计划、训练记录和识别状态。</XiaotieTip>

      <Button className="full mt-3" variant="danger" icon={<RotateCcw size={18} />} onClick={() => setConfirmOpen(true)}>
        清除体验数据
      </Button>

      {confirmOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <h2>清除体验数据？</h2>
            <p>这会同步清空首次进入状态、训练记录和识别状态，方便重新演示新用户流程。</p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>取消</Button>
              <Button variant="danger" onClick={() => void clearAll()} disabled={savingProfile}>清除</Button>
            </div>
          </div>
        </div>
      ) : null}

      {aboutOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <h2>关于铁子</h2>
            <p>铁子当前支持器械识别、动作教程、今日训练计划、逐组记录、周期统计和小铁助手。当前体验数据会保存在本机后端，便于你连续调试产品流程。</p>
            <Button className="full mt-3" onClick={() => setAboutOpen(false)}>知道了</Button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
