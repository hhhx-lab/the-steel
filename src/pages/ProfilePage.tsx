import { Info, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { useScanStore } from "../stores/scanStore";
import { useUserStore } from "../stores/userStore";
import { useWorkoutStore } from "../stores/workoutStore";

export function ProfilePage() {
  const navigate = useNavigate();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const resetWorkout = useWorkoutStore((state) => state.resetWorkout);
  const resetScan = useScanStore((state) => state.resetScan);
  const [nickname, setNickname] = useState(profile.nickname);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const clearAll = () => {
    clearUserData();
    resetWorkout();
    resetScan();
    setConfirmOpen(false);
    navigate("/welcome");
  };

  return (
    <AppShell>
      <div className="topbar">
        <div className="brand-mark">
          <span>我的</span>
          <i className="spark" />
        </div>
        <button className="icon-button" aria-label="个人" type="button">
          <UserRound size={17} />
        </button>
      </div>

      <section className="profile-hero">
        <img className="avatar" src="/assets/cutouts/xiaotie-female-head-cutout.png" alt="小铁头像" />
        <div>
          <p>昵称</p>
          <h1>{profile.nickname}</h1>
          <p>newbie · 本地体验版</p>
        </div>
      </section>

      <section className="open-section mt-4">
        <h2 className="open-title">基础设置</h2>
        <div className="settings-list">
          <div className="settings-row">
            <span className="circle-index"><UserRound size={15} /></span>
            <div>
              <p className="row-title">昵称</p>
              <input className="field-control mt-2" value={nickname} onChange={(event) => setNickname(event.target.value)} />
            </div>
            <Button className="!min-h-[38px] !rounded-[14px] !px-3 text-xs" variant="secondary" onClick={() => updateProfile({ nickname })}>保存</Button>
          </div>

          <div className="settings-row">
            <span className="circle-index"><ShieldCheck size={15} /></span>
            <div>
              <p className="row-title">体态照片分析</p>
              <p className="row-sub">第一阶段不进入主流程，默认关闭。</p>
            </div>
            <span className="switch-off">关闭</span>
          </div>

          <div className="settings-row">
            <span className="circle-index"><Info size={15} /></span>
            <div>
              <p className="row-title">关于铁子</p>
              <p className="row-sub">拍器械识别、小白教程、今日训练和基础记录。</p>
            </div>
            <span className="arrow">›</span>
          </div>
        </div>
      </section>

      <XiaotieTip>你可以随时清除本地体验数据。真实账号、云同步和隐私设置会在后续版本继续补齐。</XiaotieTip>

      <Button className="full mt-3" variant="danger" icon={<RotateCcw size={18} />} onClick={() => setConfirmOpen(true)}>
        清除本地数据
      </Button>

      {confirmOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <h2>清除本地数据？</h2>
            <p>这会清空首次进入状态、训练记录和识别状态，方便重新演示新用户流程。</p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>取消</Button>
              <Button variant="danger" onClick={clearAll}>清除</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
