import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-ink text-acid shadow-button active:translate-y-0.5",
  secondary: "bg-white text-ink border border-line active:translate-y-0.5",
  ghost: "bg-transparent text-ink active:bg-black/5",
  danger: "bg-coral text-white shadow-button active:translate-y-0.5"
};

export function Button({ className = "", variant = "primary", icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
