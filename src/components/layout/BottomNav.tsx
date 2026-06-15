import { Camera, CircleUserRound, Dumbbell, House, NotebookTabs } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/home", label: "首页", icon: House, match: ["/home"] },
  { to: "/workout/session", label: "训练", icon: Dumbbell, match: ["/workout/session", "/workout/record", "/exercise"] },
  { to: "/scan", label: "拍照", icon: Camera, match: ["/scan"], isCamera: true },
  { to: "/workout/log", label: "记录", icon: NotebookTabs, match: ["/workout/log"] },
  { to: "/profile", label: "我的", icon: CircleUserRound, match: ["/profile"] }
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav-v1" aria-label="底部导航">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.match.some((path) => location.pathname.startsWith(path));
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`nav-item-v1 ${isActive ? "active" : ""} ${item.isCamera ? "camera-entry" : ""}`}
            aria-label={item.isCamera ? "拍照识别器械" : undefined}
          >
            <span className="nav-icon-v1">
              <Icon size={item.isCamera ? 27 : 18} strokeWidth={item.isCamera ? 2.6 : 2.4} />
            </span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
