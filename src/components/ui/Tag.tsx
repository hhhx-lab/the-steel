import type { HTMLAttributes } from "react";

type TagTone = "default" | "green" | "blue" | "orange" | "danger";

const toneClass: Record<TagTone, string> = {
  default: "",
  green: "",
  blue: "",
  orange: "",
  danger: "is-danger"
};

export function Tag({ className = "", tone = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return <span className={`tag ${toneClass[tone]} ${className}`} {...props} />;
}
