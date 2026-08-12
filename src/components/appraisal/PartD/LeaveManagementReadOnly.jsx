import { SectionCard as SC, T, TH, TD, TDC, TDS } from "../../../features/faculty-appraisal";

const PART_D_MAX = 25;

export default function LeaveManagementReadOnly({ ctx }) {
  const rows = Array.isArray(ctx.leaveManagement) && ctx.leaveManagement.length ? ctx.leaveManagement : [{}];

  return (
    <div className="review-part-stack">
      <div className="review-part-stack__title">PART D - Leave &amp; Attendance Management</div>
      <SC title={`Part D - Leave & Attendance Management (Max ${PART_D_MAX})`} accent="#0891b2">
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
          Faculty-submitted data - view only. This section is not editable by reviewers.
        </div>
        {rows.map((r = {}, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <table style={{ ...T, minWidth: 0, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "32%" }} /><col style={{ width: "17%" }} /><col style={{ width: "17%" }} /><col style={{ width: "17%" }} /><col style={{ width: "17%" }} />
              </colgroup>
              <thead><tr>
                <th style={{ ...TH, textAlign: "left" }}>1. No. of leaves taken in the Year</th>
                <th style={TH}>CL</th>
                <th style={TH}>ML</th>
                <th style={TH}>OD</th>
                <th style={TH}>C/Off</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td style={TD} />
                  <td style={TDC}>{r.clTaken || "-"}</td>
                  <td style={TDC}>{r.mlTaken || "-"}</td>
                  <td style={TDC}>{r.odTaken || "-"}</td>
                  <td style={TDC}>{r.coffTaken || "-"}</td>
                </tr>
                <tr style={{ background: "#f8fafc" }}>
                  <td style={{ ...TD, fontWeight: 700 }}>Out of</td>
                  <td style={TDC}>{r.clOutOf || "-"}</td>
                  <td style={TDC}>{r.mlOutOf || "-"}</td>
                  <td style={TDC}>{r.odOutOf || "-"}</td>
                  <td style={TDC}>{r.coffOutOf || "-"}</td>
                </tr>
              </tbody>
            </table>
            <table style={{ ...T, minWidth: 0, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "58%" }} /><col style={{ width: "42%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td style={{ ...TD, fontWeight: 700 }}>2. No. of Late Remarks in the Year</td>
                  <td style={TD}>{r.lateRemarks || "-"}</td>
                </tr>
                <tr style={{ background: "#f8fafc" }}>
                  <td style={{ ...TD, fontWeight: 700 }}>3. Total Actual Working Days</td>
                  <td style={TD}>{r.workingDays || "-"}</td>
                </tr>
                <tr>
                  <td style={{ ...TD, fontWeight: 700 }}>4. Management of leaves</td>
                  <td style={TD}>{r.managementRating || "-"}</td>
                </tr>
                <tr style={{ background: "#ecfeff" }}>
                  <td style={{ ...TD, fontWeight: "bold", textAlign: "right" }}>Total Score out of ({PART_D_MAX}) =</td>
                  <td style={{ ...TDS, fontWeight: "bold" }}>{r.score || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </SC>
    </div>
  );
}
