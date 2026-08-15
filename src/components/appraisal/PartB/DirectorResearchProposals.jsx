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
export default function DirectorResearchProposals({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, sectionEmpty, emptySectionRow, getDir, setDir, getInnovDir, setInnovDir, innovativeRows } = ctx;
 return (
<>
{/* B7: Proposals */}
<SC title="B6. Consultancy, Testing & Training (Max 20)" accent="#0ea5e9">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Client / Organisation</th><th style={TH}>Nature of Engagement</th>
<th style={TH}>Revenue Generated (₹)</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_DIR}>Director Score</th>
</tr></thead>
<tbody>
 {sectionEmpty("proposals") ? emptySectionRow(7) : rows(proposals).map((r, i) =>(
<tr key={i}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.agency || r.title} /></td>
<td style={TD}><RO val={r.duration || r.nature} /></td>
<td style={TDC}><RO val={r.amount || r.revenue} center /></td>
<td style={TDV}><ViewDocsCell docKey={`prop-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={r.score} center /></td>
<td style={TDS_DIR}><DirInput val={getDir("proposals", i, "dir")} max={20} disabled={!rowHasReviewableData("proposals", r, docs, `prop-${i}`)} onChange={v =>setDir("proposals", i, "dir", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


