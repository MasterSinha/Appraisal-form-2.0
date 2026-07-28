import ACR from "../PartA/ACR";

const partDParameters = [
  { parameter: "Leadership & Supervisory Skills", description: "Team management and delegation, mentoring/developing subordinates, decision-making under ambiguity", max: 10 },
  { parameter: "Professional Conduct & Integrity", description: "Ethical conduct, impartiality, confidentiality, adherence to university policies", max: 10 },
  { parameter: "Reliability & Accountability", description: "Ownership of assigned work, timely completion, accuracy of records and reporting", max: 10 },
  { parameter: "Communication & Coordination", description: "Coordination with faculty, students, administration and external stakeholders", max: 10 },
  { parameter: "Overall Contribution", description: "General contribution to institutional growth, culture, discipline and academic environment", max: 10 },
];

export default function PartD({ ctx }) {
  return (
    <div className="review-part-stack">
      <div className="review-part-stack__title">PART D - Annual Confidential Report</div>
      <div className="review-part-stack__note">
        Part D is evaluator-side. Use the ACR score fields below while verifying the formal ACR criteria.
      </div>
      <div className="review-part-stack__plain-table">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: 8, background: "#fff7ed", color: "#92400e", border: "1px solid #fed7aa" }}>SN</th>
              <th style={{ padding: 8, background: "#fff7ed", color: "#92400e", border: "1px solid #fed7aa" }}>Parameter</th>
              <th style={{ padding: 8, background: "#fff7ed", color: "#92400e", border: "1px solid #fed7aa" }}>Description</th>
              <th style={{ padding: 8, background: "#fff7ed", color: "#92400e", border: "1px solid #fed7aa" }}>Max Marks</th>
            </tr>
          </thead>
          <tbody>
            {partDParameters.map((row, index) => (
              <tr key={row.parameter}>
                <td style={{ padding: 8, border: "1px solid #fed7aa", textAlign: "center" }}>D{index + 1}</td>
                <td style={{ padding: 8, border: "1px solid #fed7aa", fontWeight: 700 }}>{row.parameter}</td>
                <td style={{ padding: 8, border: "1px solid #fed7aa" }}>{row.description}</td>
                <td style={{ padding: 8, border: "1px solid #fed7aa", textAlign: "center", fontWeight: 700 }}>{row.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ACR ctx={ctx} />
    </div>
  );
}
