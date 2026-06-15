import type { ReactNode } from "react";
import { FloatingTiezi } from "../../features/xiaotie/FloatingTiezi";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
};

export function AppShell({ children, showNav = true, className = "" }: AppShellProps) {
  return (
    <main className="min-h-screen text-[var(--text)]">
      <div className={`phone-screen mx-auto w-full max-w-[480px] ${className}`}>
        <div className="statusbar">
          <span>9:41</span>
          <span className="status-icons">
            <i className="bar-signal" />
            <i className="bar-wifi" />
            <i className="bar-battery" />
          </span>
        </div>
        <div className="screen-content">{children}</div>
        {showNav ? <FloatingTiezi /> : null}
        {showNav ? <BottomNav /> : null}
      </div>
    </main>
  );
}
