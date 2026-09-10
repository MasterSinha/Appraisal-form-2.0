import "./overallProgress.css";

export default function OverallProgress({ total, max, percentage, parts = [] }) {
  const colors = ["#6366f1", "#0891b2", "#059669", "#e05263", "#7c3aed"];
  const safePercentage = Math.max(0, Math.min(100, Number(percentage) || 0));
  return (
    <section className="overall-score" aria-label="Overall Progress">
      <header className="overall-score__heading">
        <h3>Overall Progress</h3>
        <span>{safePercentage}%</span>
      </header>
      <div className="overall-score__total"><strong>{Number(total || 0).toFixed(1)}</strong><span>/ {max} marks</span></div>
      <div className="overall-score__bar" role="progressbar" aria-label="Overall score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safePercentage}>
        <div style={{ width: `${safePercentage}%` }} />
      </div>
      <div className="overall-score__parts">
        {parts.filter(Boolean).map(([label, score, limit], index) => {
          const progress = Number(limit) > 0 ? Math.max(0, Math.min(100, (Number(score) || 0) / Number(limit) * 100)) : 0;
          return (
          <div className="overall-score__part" key={label} tabIndex={0} aria-label={`${label}: ${Number(score || 0).toFixed(1)} out of ${limit} marks, ${Math.round(progress)} percent`} title={`${label}: ${Math.round(progress)}% of available marks`} style={{ "--part-color": colors[index % colors.length] }}>
            <span className="overall-score__label"><i style={{ background: colors[index % colors.length] }} aria-hidden="true" />{label}</span>
            <span className="overall-score__value"><strong>{Number(score || 0).toFixed(1)}</strong><span> / {limit}</span></span>
          </div>
          );
        })}
      </div>
    </section>
  );
}
