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
export default function UniversityActivities({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, sectionEmpty, emptySectionRow, get, set, reviewerLabel, reviewerScoreLabel, innovativeRows, getInnovHod, setInnovHod } = ctx;
 return (
<>
{/* C1: University administration */}
<SC title="C1. Administration at University Level (Max 50)" accent="#0f766e">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Activity</th><th style={TH}>Nature</th><th style={TH}>Period</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_HOD}>{reviewerScoreLabel}</th>
</tr></thead>
<tbody>
 {sectionEmpty("uniActs") ? emptySectionRow(7) : rows(uniActs).map((r, i) =>(
<tr key={i} style={i % 2 ? { background: "#f8fafc" } : {}}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.activity} /></td>
<td style={TD}><RO val={r.nature} /></td>
<td style={TD}><RO val={r.period} /></td>
<td style={TDV}><ViewDocsCell docKey={`uni-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={r.score} center /></td>
<td style={TDS_HOD}><HodInput val={get("uniActs", i, "hod")} max={50} disabled={!rowHasReviewableData("uniActs", r, docs, `uni-${i}`)} onChange={v =>set("uniActs", i, "hod", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


