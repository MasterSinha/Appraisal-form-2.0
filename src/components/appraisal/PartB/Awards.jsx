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
export default function Awards({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, sectionEmpty, emptySectionRow, get, set, reviewerLabel, reviewerScoreLabel, innovativeRows, getInnovHod, setInnovHod } = ctx;
 return (
<>
{/* B5b: Awards */}
<SC title="B9. Research Awards, Fellowships, Reviewer of Journal & Citations (Max 20)" accent="#f97316">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Title of Award / Fellowship / Metric</th><th style={TH}>Awarding Agency</th>
<th style={TH}>Level</th><th style={TH}>Date</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_HOD}>{reviewerScoreLabel}</th>
</tr></thead>
<tbody>
 {sectionEmpty("awards") ? emptySectionRow(8) : rows(awards).map((r, i) =>(
<tr key={i}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.title} /></td>
<td style={TD}><RO val={r.agency} /></td>
<td style={TD}><RO val={r.level} /></td>
<td style={TDC}><RO val={r.date} center /></td>
<td style={TDV}><ViewDocsCell docKey={`awd-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={r.score} center /></td>
<td style={TDS_HOD}><HodInput val={get("awards", i, "hod")} max={20} disabled={!rowHasReviewableData("awards", r, docs, `awd-${i}`)} onChange={v =>set("awards", i, "hod", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


