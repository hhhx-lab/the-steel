import { Camera, Dumbbell, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/home", label: "今日", icon: Dumbbell },
  { to: "/scan", label: "拍器械", icon: Camera, primary: true },
  { to: "/profile", label: "我的", icon: UserRound }
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-[480px] grid-cols-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-[8px] text-xs font-semibold transition ${
                  item.primary
                    ? "bg-ink text-acid shadow-button"
                    : isActive
                      ? "bg-white text-ink"
                      : "text-muted"
                }`
              }
            >
              <Icon size={20} strokeWidth={2.4} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
