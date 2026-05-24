import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
};

export function AppShell({ children, showNav = true, className = "" }: AppShellProps) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className={`mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-paper ${className}`}>
        <div className={`flex-1 px-4 pt-[max(20px,env(safe-area-inset-top))] ${showNav ? "pb-28" : "pb-6"}`}>{children}</div>
        {showNav ? <BottomNav /> : null}
      </div>
    </main>
  );
}
