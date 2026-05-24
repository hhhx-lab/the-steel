import { ArrowLeft } from "lucide-react";
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
    <header className="mb-4 flex min-h-12 items-center justify-between gap-3">
      <button
        aria-label="返回"
        className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white text-ink"
        type="button"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
      >
        <ArrowLeft size={20} />
      </button>
      <h1 className="min-w-0 flex-1 text-center text-base font-black">{title}</h1>
      <div className="flex h-10 min-w-10 items-center justify-end">{right}</div>
    </header>
  );
}
