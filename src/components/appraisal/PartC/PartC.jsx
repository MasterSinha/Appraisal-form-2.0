import { HodInput } from "../../Inputs";
import DepartmentActivities from "../PartA/DepartmentActivities";
import IndustryConnect from "../PartA/IndustryConnect";
import SocietyContribution from "../PartA/SocietyContribution";
import UniversityActivities from "../PartA/UniversityActivities";
import {
  SectionCard as SC,
  T,
  TH,
  TH_HOD,
  TD,
  TDC,
  TDS,
  TDS_HOD,
  TDV,
  ViewDocsCell,
} from "../../../features/faculty-appraisal";
import { RO } from "../../../features/faculty-appraisal/shared";

function SimplePartCTable({ title, rows, docPrefix, columns, get, set, reviewerScoreLabel, max }) {
  const safeRows = rows && rows.length > 0 ? rows : [{}];
  return (
    <SC title={title} accent="#0f766e">
      <table style={T}>
        <thead>
          <tr>
            <th style={TH}>SN</th>
            {columns.map((column) => <th key={column.key} style={TH}>{column.label}</th>)}
            <th style={TH}>View Docs</th>
            <th style={TH}>Faculty Score</th>
            <th style={TH_HOD}>{reviewerScoreLabel}</th>
          </tr>
        </thead>
        <tbody>
          {safeRows.map((row, index) => (
            <tr key={index} style={index % 2 ? { background: "#f8fafc" } : {}}>
              <td style={TDC}>{index + 1}</td>
              {columns.map((column) => <td key={column.key} style={TD}><RO val={row[column.key]} /></td>)}
              <td style={TDV}><ViewDocsCell docKey={`${docPrefix}-${index}`} docs={rows.docs || {}} /></td>
              <td style={TDS}><RO val={row.score} center /></td>
              <td style={TDS_HOD}><HodInput val={get(rows.key, index, "hod")} max={max} onChange={(value) => set(rows.key, index, "hod", value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </SC>
  );
}

export default function PartC({ ctx }) {
  const { docs, eventRows, alumniRows, placementRows, get, set, reviewerScoreLabel } = ctx;
  const withMeta = (key, rows) => Object.assign(rows || [], { key, docs });

  return (
    <div className="review-part-stack">
      <div className="review-part-stack__title">PART C - Administrative Role & University Development Contribution</div>
      <UniversityActivities ctx={ctx} />
      <DepartmentActivities ctx={ctx} />
      <SimplePartCTable
        title="C3. Event Organisation & Institutional Visibility (Max 20)"
        rows={withMeta("eventRows", eventRows)}
        docPrefix="event"
        columns={[{ key: "event", label: "Event / Contribution" }, { key: "role", label: "Role" }, { key: "date", label: "Date" }, { key: "level", label: "Level" }]}
        get={get}
        set={set}
        reviewerScoreLabel={reviewerScoreLabel}
        max={20}
      />
      <SocietyContribution ctx={ctx} />
      <IndustryConnect ctx={ctx} />
      <SimplePartCTable
        title="C6. Alumni Engagement & Networking (Max 10)"
        rows={withMeta("alumniRows", alumniRows)}
        docPrefix="alumni"
        columns={[{ key: "activity", label: "Activity" }, { key: "details", label: "Details" }, { key: "date", label: "Date" }]}
        get={get}
        set={set}
        reviewerScoreLabel={reviewerScoreLabel}
        max={10}
      />
      <SimplePartCTable
        title="C7. Student Placement Mentoring & Career Development (Max 20)"
        rows={withMeta("placementRows", placementRows)}
        docPrefix="placement"
        columns={[{ key: "activityType", label: "Activity Type" }, { key: "name", label: "Student / Company Name" }, { key: "date", label: "Date" }]}
        get={get}
        set={set}
        reviewerScoreLabel={reviewerScoreLabel}
        max={20}
      />
    </div>
  );
}
