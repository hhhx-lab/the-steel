import { Camera, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { XiaotieTip } from "../features/xiaotie/XiaotieTip";
import { useUserStore } from "../stores/userStore";

export function WelcomePage() {
  const navigate = useNavigate();
  const setHasVisited = useUserStore((state) => state.setHasVisited);

  const enter = (path: string) => {
    setHasVisited(true);
    navigate(path);
  };

  return (
    <AppShell showNav={false} className="overflow-hidden">
      <section className="flex min-h-screen flex-col justify-between gap-6 pb-4">
        <div className="space-y-5">
          <header className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-black text-ocean">铁子</p>
              <p className="text-xs font-semibold text-muted">AI 陪练 · 小铁</p>
            </div>
            <Tag tone="green">可跳过体态照片</Tag>
          </header>

          <div className="relative rounded-[8px] border border-ink bg-ink p-5 text-white shadow-lift">
            <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-[8px] bg-acid text-ink">
              <Sparkles size={26} />
            </div>
            <div className="mb-8 flex h-44 items-end rounded-[8px] bg-[linear-gradient(135deg,#d7ff3f_0%,#4bd8a1_48%,#146b7a_100%)] p-4">
              <div className="w-full rounded-[8px] bg-ink/90 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-2 w-16 rounded-full bg-acid" />
                  <div className="h-2 w-8 rounded-full bg-mint" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded-full bg-white/80" />
                    <div className="h-4 w-20 rounded-full bg-white/45" />
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-acid text-ink">
                    <Camera size={28} />
                  </div>
                </div>
              </div>
            </div>
            <h1 className="max-w-full text-4xl font-black leading-tight tracking-normal">
              不认识器械，
              <br />
              也能开始练
            </h1>
            <p className="mt-4 max-w-[18rem] text-sm font-medium leading-6 text-white/78">
              小铁在这里，帮你识器械、看懂动作、完成第一组训练。
            </p>
          </div>

          <XiaotieTip>拍一下器械，小铁会先告诉你这是什么，再用小白能听懂的话带你练。</XiaotieTip>
        </div>

        <div className="space-y-3">
          <Button className="w-full text-base" icon={<Camera size={20} />} onClick={() => enter("/scan")}>
            拍一下器械
          </Button>
          <Button className="w-full" variant="secondary" icon={<ChevronRight size={19} />} onClick={() => enter("/home")}>
            先看看训练计划
          </Button>
          <Card className="flex items-center gap-3 bg-white/75">
            <ShieldCheck className="shrink-0 text-ocean" size={21} />
            <p className="text-xs font-semibold leading-5 text-muted">不强制上传身体照片，不做医学诊断，先把眼前这台器械练明白。</p>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
