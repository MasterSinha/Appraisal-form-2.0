/* eslint-disable no-unused-vars */
import { HodInput } from "../../Inputs";
import {
  SCORE_LIMITS,
  clampScore,
  courseFileRowScore,
  projectGuidanceRowMax,
  researchGuidanceScore,
  rowHasReviewableData,
  societyRowLocked,
  societyRowScore,
  ViewDocsCell,
  SectionCard as SC,
  T,
  TH,
  TH_HOD,
  TH_DIR,
  TD,
  TDC,
  TDS,
  TDS_HOD,
  TDS_DIR,
  TDV,
} from "../../../features/faculty-appraisal";
import { n, RO } from "../../../features/faculty-appraisal/shared";
import { DirectorInput as DirInput } from "../common/ReviewerInput";
export default function Conferences({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, sectionEmpty, emptySectionRow, get, set, reviewerLabel, reviewerScoreLabel, innovativeRows, getInnovHod, setInnovHod } = ctx;
 return (
<>
{/* B6: Conferences */}
<SC title="B7. Conference / FDP / Training / Workshop Contributions as Resource Person (Max 20)" accent="#6366f1">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Event / Session Title</th><th style={TH}>Role</th>
<th style={TH}>Date</th><th style={TH}>Level (Intl./National)</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_HOD}>{reviewerScoreLabel}</th>
</tr></thead>
<tbody>
 {sectionEmpty("confs") ? emptySectionRow(8) : rows(confs).map((r, i) =>(
<tr key={i} style={i % 2 ? { background: "#f8fafc" } : {}}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.title} /></td>
<td style={TD}><RO val={r.role || r.type} /></td>
<td style={TDC}><RO val={r.date} center /></td>
<td style={TD}><RO val={r.level || r.org} /></td>
<td style={TDV}><ViewDocsCell docKey={`conf-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={r.score} center /></td>
<td style={TDS_HOD}><HodInput val={get("confs", i, "hod")} max={20} disabled={!rowHasReviewableData("confs", r, docs, `conf-${i}`)} onChange={v =>set("confs", i, "hod", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


