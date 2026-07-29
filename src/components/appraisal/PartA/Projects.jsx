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
export default function Projects({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, get, set, reviewerLabel, reviewerScoreLabel, innovativeRows, getInnovHod, setInnovHod } = ctx;
 return (
<>
{/* A6: Student Project Guidance */}
 <SC title="A6. Student Project Guidance (Max 20)" accent="#8b5cf6">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Project Title / Batch</th><th style={TH}>No. of Students</th><th style={TH}>Industry Collab (Y/N)</th><th style={TH}>Award (Y/N)</th><th style={TH}>Student Pub (Y/N)</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_HOD}>{reviewerScoreLabel}</th>
</tr></thead>
<tbody>
 {rows(projects).map((r, i) =>(
<tr key={i} style={i % 2 ? { background: "#f8fafc" } : {}}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.label} /></td>
<td style={TDC}><RO val={r.studentsCount} center /></td>
<td style={TDC}><RO val={r.industryCollab} center /></td>
<td style={TDC}><RO val={r.awardReceived} center /></td>
<td style={TDC}><RO val={r.studentPub} center /></td>
<td style={TDV}><ViewDocsCell docKey={`proj-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={String(r.score ?? "").trim() ? clampScore(r.score, projectGuidanceRowMax(r)) : ""} center /></td>
<td style={TDS_HOD}><HodInput val={get("projects", i, "hod")} max={projectGuidanceRowMax(r)} onChange={v =>set("projects", i, "hod", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


