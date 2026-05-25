type XiaotieTipProps = {
  children: string;
  tone?: "default" | "safe" | "warning";
};

export function XiaotieTip({ children, tone = "default" }: XiaotieTipProps) {
  return (
    <div className={`xiaotie-note ${tone === "warning" ? "border-t border-red-100" : ""}`}>
      <img className="avatar" src="/assets/cutouts/xiaotie-female-head-cutout.png" alt="小铁" />
      <div>
        <strong>{tone === "warning" ? "安全提醒" : "小铁小贴士"}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}
