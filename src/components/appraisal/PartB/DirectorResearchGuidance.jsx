/* eslint-disable no-unused-vars */
import { HodInput } from "../../Inputs";
import {
  SCORE_LIMITS,
  clampScore,
  courseFileRowScore,
  projectGuidanceRowMax,
  researchGuidanceRowMax,
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
export default function DirectorResearchGuidance({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, sectionEmpty, emptySectionRow, getDir, setDir, getInnovDir, setInnovDir, innovativeRows } = ctx;
 return (
<>
{/* B4: Research Guidance */}
 <SC title="B5. Research Guidance (Max 20)" accent="#059669">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Degree (PhD/PG)</th><th style={TH}>Name of Student / Scholar</th><th style={TH}>Status (Ongoing/Awarded)</th><th style={TH}>Date</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_DIR}>Director Score</th>
</tr></thead>
<tbody>
 {sectionEmpty("research") ? emptySectionRow(8) : rows(research).map((r, i) =>(
<tr key={i}>
<td style={TDC}>{i + 1}</td>
<td style={TDC}><RO val={r.degree} center /></td>
<td style={TD}><RO val={r.name} /></td>
<td style={TD}><RO val={r.status || r.thesis} /></td>
<td style={TDC}><RO val={(r.status || r.thesis) === "Ongoing" ? "NA" : r.date} center /></td>
<td style={TDV}><ViewDocsCell docKey={`res-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={r.score} center /></td>
<td style={TDS_DIR}><DirInput val={getDir("research", i, "dir")} max={researchGuidanceRowMax(r)} disabled={!rowHasReviewableData("research", r, docs, `res-${i}`)} onChange={v =>setDir("research", i, "dir", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


