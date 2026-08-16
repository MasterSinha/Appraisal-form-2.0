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
export default function IndustryConnect({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, sectionEmpty, emptySectionRow, get, set, reviewerLabel, reviewerScoreLabel, innovativeRows, getInnovHod, setInnovHod } = ctx;
 return (
<>
{/* C5: Industry interaction */}
<SC title="C5. Industry Interaction & Linkages (Max 10)" accent="#0f766e">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Activity</th><th style={TH}>Industry Partner</th><th style={TH}>Date</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_HOD}>{reviewerScoreLabel}</th>
</tr></thead>
<tbody>
 {sectionEmpty("industry") ? emptySectionRow(7) : rows(industry).map((r, i) =>(
<tr key={i}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.activity || r.name} /></td>
<td style={TD}><RO val={r.partner || r.details} /></td>
<td style={TD}><RO val={r.date} /></td>
<td style={TDV}><ViewDocsCell docKey={`ind-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={r.score} center /></td>
<td style={TDS_HOD}><HodInput val={get("industry", i, "hod")} max={10} disabled={!rowHasReviewableData("industry", r, docs, `ind-${i}`)} onChange={v =>set("industry", i, "hod", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


