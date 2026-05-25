import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

type TopBarProps = {
  title: string;
  right?: ReactNode;
  backTo?: string;
};

export function TopBar({ title, right, backTo }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button
        aria-label="返回"
        className="icon-button"
        type="button"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
      >
        ‹
      </button>
      <h1>{title}</h1>
      <div className="flex min-w-10 items-center justify-end">{right}</div>
    </header>
  );
}
