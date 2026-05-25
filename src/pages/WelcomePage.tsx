import { Camera, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../stores/userStore";

export function WelcomePage() {
  const navigate = useNavigate();
  const setHasVisited = useUserStore((state) => state.setHasVisited);

  const enter = (path: string) => {
    setHasVisited(true);
    navigate(path);
  };

  return (
    <AppShell showNav={false} className="welcome-screen">
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

        <div className="actions">
          <Button className="full" icon={<Camera size={19} />} onClick={() => enter("/scan")}>
            拍一下器械
          </Button>
          <Button className="full" variant="secondary" onClick={() => enter("/home")}>
            先看看训练计划
          </Button>
        </div>
        <p className="welcome-note">
          <ShieldCheck size={14} className="mr-1 inline align-[-2px]" />
          可跳过身体照片，不做医学诊断，先把眼前这台器械练明白。
        </p>
      </div>
    </AppShell>
  );
}
