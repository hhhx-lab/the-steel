import { CircleUserRound, House, NotebookTabs, ScanLine } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/home", label: "首页", icon: House },
  { to: "/scan", label: "训练", icon: ScanLine },
  { to: "/workout/log", label: "记录", icon: NotebookTabs },
  { to: "/profile", label: "我的", icon: CircleUserRound }
];

export function BottomNav() {
  return (
    <nav className="bottom-nav-v1" aria-label="底部导航">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item-v1 ${isActive ? "active" : ""}`}>
            <span className="nav-icon-v1">
              <Icon size={17} strokeWidth={2.4} />
            </span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
