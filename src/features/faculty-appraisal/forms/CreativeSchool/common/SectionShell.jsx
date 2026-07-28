import { SectionCard as SC } from "../../../components";

export default function SectionShell({ title, children, accent = "#4f46e5", max, earned }) {
  const scoreBadge = max !== undefined ? `${earned !== undefined ? Number(earned).toFixed(1) : "0.0"} / ${max}` : undefined;
  return (
    <SC title={title} accent={accent} scoreBadge={scoreBadge}>
      {children}
    </SC>
  );
}
