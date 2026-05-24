import { Bot } from "lucide-react";

type XiaotieTipProps = {
  children: string;
  tone?: "default" | "safe" | "warning";
};

const toneClass = {
  default: "border-ocean/20 bg-ocean/10 text-ink",
  safe: "border-mint/30 bg-mint/10 text-ink",
  warning: "border-coral/30 bg-coral/10 text-ink"
};

export function XiaotieTip({ children, tone = "default" }: XiaotieTipProps) {
  return (
    <div className={`flex gap-3 rounded-[8px] border p-3 ${toneClass[tone]}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-acid">
        <Bot size={19} />
      </div>
      <p className="text-sm font-medium leading-6">{children}</p>
    </div>
  );
}
