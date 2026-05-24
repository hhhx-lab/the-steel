import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  const hasBg = /\bbg-/.test(className);
  const hasBorder = /\bborder/.test(className);
  const hasPadding = /\bp-/.test(className);

  return (
    <div
      className={`rounded-[8px] shadow-sm ${hasBorder ? "" : "border border-line"} ${hasBg ? "" : "bg-white"} ${hasPadding ? "" : "p-4"} ${className}`}
      {...props}
    />
  );
}
