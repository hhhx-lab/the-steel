import { Info, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
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

  const saveNickname = () => {
    updateProfile({ nickname });
  };

  const clearAll = () => {
    clearUserData();
    resetWorkout();
    resetScan();
    setConfirmOpen(false);
    navigate("/welcome");
  };

  return (
    <AppShell>
      <section className="space-y-4">
        <header>
          <p className="text-sm font-bold text-ocean">我的</p>
          <h1 className="mt-1 text-2xl font-black">基础设置</h1>
        </header>

        <Card className="border-ink bg-ink text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-acid text-ink">
              <UserRound size={27} />
            </div>
            <div>
              <p className="text-xs font-bold text-white/62">昵称</p>
              <h2 className="text-xl font-black">{profile.nickname}</h2>
              <div className="mt-2 flex gap-2">
                <Tag tone="green" className="border-acid/40 bg-acid text-ink">newbie</Tag>
                <Tag className="border-white/20 bg-white/10 text-white">本地体验版</Tag>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-black">昵称</h2>
          <div className="flex gap-2">
            <input className="h-12 min-w-0 flex-1 rounded-[8px] border border-line bg-paper px-3 text-sm font-black outline-none focus:border-ocean" value={nickname} onChange={(event) => setNickname(event.target.value)} />
            <Button variant="secondary" onClick={saveNickname}>
              保存
            </Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-ocean" size={21} />
            <h2 className="text-base font-black">隐私与安全</h2>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[8px] bg-paper p-3">
            <div>
              <p className="text-sm font-black">体态照片分析</p>
              <p className="mt-1 text-xs font-semibold text-muted">第一阶段不进入主流程，默认关闭。</p>
            </div>
            <span className="rounded-[6px] bg-white px-3 py-1 text-xs font-black text-muted">关闭</span>
          </div>
          <p className="text-sm font-semibold leading-6 text-muted">小铁不会做医学诊断，也不会根据照片评价身材缺陷。后续如果开放，会保持用户自愿上传。</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="text-ocean" size={21} />
            <h2 className="text-base font-black">关于铁子</h2>
          </div>
          <p className="text-sm font-semibold leading-6 text-muted">铁子 MVP 第一阶段聚焦拍器械识别、小白教程、今日训练和基础记录。</p>
        </Card>

        <XiaotieTip>你可以随时清除本地体验数据。真实账号、云同步和隐私设置会在后续版本继续补齐。</XiaotieTip>

        <Button className="w-full" variant="danger" icon={<RotateCcw size={18} />} onClick={() => setConfirmOpen(true)}>
          清除本地数据
        </Button>
      </section>

      {confirmOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/35 px-4 pb-4" role="dialog" aria-modal="true">
          <Card className="mx-auto w-full max-w-[448px] space-y-4">
            <h2 className="text-lg font-black">清除本地数据？</h2>
            <p className="text-sm font-semibold leading-6 text-muted">这会清空首次进入状态、训练记录和识别状态，方便重新演示新用户流程。</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                取消
              </Button>
              <Button variant="danger" onClick={clearAll}>
                清除
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
