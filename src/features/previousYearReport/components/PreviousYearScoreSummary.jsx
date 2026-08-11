const score = (value) => (parseFloat(value) || 0).toFixed(1);

const REVIEW_LABELS = {
  faculty: "Faculty",
  hod: "HOD / Center Head",
  director: "Director",
  dean: "Dean",
  vc: "VC",
};

const hasScore = (value) => String(value ?? "").trim() !== "" && (parseFloat(value) || 0) > 0;

function SummaryCard({ label, value, max }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "13px 14px", background: "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)", boxShadow: "0 10px 22px rgba(15,23,42,0.04)", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ color: "#64748b", fontSize: 10, fontWeight: 950, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      </div>
      <div style={{ marginTop: 6, color: "#111827", fontSize: 18, fontWeight: 950, lineHeight: 1 }}>{score(value)} / {max}</div>
    </div>
  );
}

export default function PreviousYearScoreSummary({ report, compact = false, visibleLevels: providedVisibleLevels, variant = "cards" }) {
  const levels = report.reviewLevels || ["faculty", "hod", "director", "dean"];
  const visibleLevels = providedVisibleLevels?.length ? providedVisibleLevels : (compact ? ["faculty"] : levels);
  const rows = visibleLevels.flatMap((level) => {
    const totals = report.totals?.[level] || {};
    if (level !== "faculty" && !hasScore(totals.partA) && !hasScore(totals.partB) && !hasScore(totals.grand)) return [];
    const grand = totals.grand ?? ((parseFloat(totals.partA) || 0) + (parseFloat(totals.partB) || 0));
    return [{ level, label: REVIEW_LABELS[level] || level, partA: totals.partA, partB: totals.partB, grand }];
  });

  if (variant === "table") {
    return (
      <div style={{ border: "1px solid #dbe3ef", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={summaryTh}>Score Level</th>
              <th style={summaryTh}>Part A</th>
              <th style={summaryTh}>Part B</th>
              <th style={summaryTh}>Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.level}>
                <td style={summaryTdLabel}>{row.label}</td>
                <td style={summaryTd}>{score(row.partA)} / {report.partA.max}</td>
                <td style={summaryTd}>{score(row.partB)} / {report.partB.max}</td>
                <td style={summaryTd}>{score(row.grand)} / {report.totals?.faculty?.max || report.partA.max + report.partB.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const cards = rows.flatMap((row) => [
    { label: `Part A ${row.label}`, value: row.partA, max: report.partA.max },
    { label: `Part B ${row.label}`, value: row.partB, max: report.partB.max },
    { label: `Grand ${row.label}`, value: row.grand, max: report.totals?.faculty?.max || report.partA.max + report.partB.max },
  ]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
      {cards.map((card) => <SummaryCard key={card.label} {...card} />)}
    </div>
  );
}

const summaryTh = {
  border: "1px solid #dbe3ef",
  padding: "10px 12px",
  color: "#172033",
  fontSize: 12,
  fontWeight: 950,
  textAlign: "center",
};

const summaryTd = {
  border: "1px solid #e5e7eb",
  padding: "10px 12px",
  color: "#111827",
  fontSize: 14,
  fontWeight: 900,
  textAlign: "center",
};

const summaryTdLabel = {
  ...summaryTd,
  color: "#475569",
  fontSize: 12,
  textAlign: "left",
  textTransform: "uppercase",
};
