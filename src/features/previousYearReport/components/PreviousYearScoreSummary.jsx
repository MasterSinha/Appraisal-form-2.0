const score = (value) => (parseFloat(value) || 0).toFixed(1);

const REVIEW_LABELS = {
  faculty: "Faculty",
  hod: "HOD / Center Head",
  director: "Director",
  dean: "Dean",
};

const hasScore = (value) => String(value ?? "").trim() !== "" && (parseFloat(value) || 0) > 0;

function SummaryCard({ label, value, max }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "11px 13px", background: "#f8fafc" }}>
      <div style={{ color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ marginTop: 4, color: "#111827", fontSize: 15, fontWeight: 900 }}>{score(value)} / {max}</div>
    </div>
  );
}

export default function PreviousYearScoreSummary({ report, compact = false }) {
  const levels = report.reviewLevels || ["faculty", "hod", "director", "dean"];
  const visibleLevels = compact ? ["faculty"] : levels;
  const cards = visibleLevels.flatMap((level) => {
    const totals = report.totals?.[level] || {};
    if (level !== "faculty" && !hasScore(totals.partA) && !hasScore(totals.partB) && !hasScore(totals.grand)) return [];
    const grand = totals.grand ?? ((parseFloat(totals.partA) || 0) + (parseFloat(totals.partB) || 0));
    return [
      { label: `Part A ${REVIEW_LABELS[level]}`, value: totals.partA, max: report.partA.max },
      { label: `Part B ${REVIEW_LABELS[level]}`, value: totals.partB, max: report.partB.max },
      { label: `Grand ${REVIEW_LABELS[level]}`, value: grand, max: report.totals?.faculty?.max || report.partA.max + report.partB.max },
    ];
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
      {cards.map((card) => <SummaryCard key={card.label} {...card} />)}
    </div>
  );
}
