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
export default function DirectorSocietyContribution({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, sectionEmpty, emptySectionRow, getDir, setDir, getInnovDir, setInnovDir, innovativeRows } = ctx;
 return (
<>
{/* C4: Outreach */}
<SC title="C4. Outreach, Extension & Social Responsibility (Max 10)" accent="#0f766e">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Activity</th><th style={TH}>Details</th><th style={TH}>Date</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_DIR}>Director Score</th>
</tr></thead>
<tbody>
 {sectionEmpty("society") ? emptySectionRow(7) : rows(society).map((r, i) =>(
<tr key={i} style={societyRowLocked(r) ? { background: "#f1f5f9", opacity: 0.65 } : i % 2 ? { background: "#f8fafc" } : {}}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.label} /></td>
<td style={TD}><RO val={r.details} /></td>
<td style={TD}><RO val={r.date} /></td>
<td style={TDV}><ViewDocsCell docKey={`soc-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={String(r.score ?? "").trim() ? clampScore(r.score, 10) : ""} center /></td>
<td style={TDS_DIR}><DirInput val={societyRowLocked(r) ? "0" : getDir("society", i, "dir")} max={10} disabled={societyRowLocked(r) || !rowHasReviewableData("society", r, docs, `soc-${i}`)} onChange={v =>setDir("society", i, "dir", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


