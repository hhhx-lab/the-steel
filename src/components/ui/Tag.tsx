import type { HTMLAttributes } from "react";

type TagTone = "default" | "green" | "blue" | "orange" | "danger";

const toneClass: Record<TagTone, string> = {
  default: "border-line bg-white text-muted",
  green: "border-mint/35 bg-mint/12 text-ocean",
  blue: "border-ocean/20 bg-ocean/10 text-ocean",
  orange: "border-yellow-300 bg-yellow-100 text-yellow-900",
  danger: "border-coral/30 bg-coral/10 text-coral"
};

export function Tag({ className = "", tone = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-[6px] border px-2.5 py-1 text-xs font-semibold ${toneClass[tone]} ${className}`}
      {...props}
    />
  );
}
