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
export default function DirectorQualification({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, getDir, setDir, getInnovDir, setInnovDir, innovativeRows } = ctx;
 const qTitle = (row = {}) => row.title || row.label || row.qualification || row.qualificationTitle || row.certification || row.certificationTitle || row.name || "";
 const qBody = (row = {}) => row.body || row.awardingBody || row.awarding_body || row.agency || row.institution || row.institute || row.university || row.details || "";
 const qDate = (row = {}) => row.date || row.completionDate || row.awardDate || "";
 return (
<>
{/* A8: Qualification */}
<SC title="A8. Professional Development & Qualification Enhancement (Max 10)" accent="#8b5cf6">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th>
<th style={TH}>Qualification / Certification Title</th>
<th style={TH}>Awarding Body</th>
<th style={TH}>Date</th>
<th style={TH}>View Docs</th>
<th style={TH}>Faculty Score</th>
<th style={TH_DIR}>Director Score</th>
</tr></thead>
<tbody>
 {rows(quals).map((r, i) =>(
<tr key={i} style={i % 2 ? { background: "#f8fafc" } : {}}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={qTitle(r)} /></td>
<td style={TD}><RO val={qBody(r)} /></td>
<td style={TDC}><RO val={qDate(r)} center /></td>
<td style={TDV}><ViewDocsCell docKey={`qual-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={String(r.score ?? "").trim() ? clampScore(r.score, SCORE_LIMITS.qualificationRow) : ""} center /></td>
<td style={TDS_DIR}><DirInput val={getDir("quals", i, "dir")} onChange={v =>setDir("quals", i, "dir", v)} max={SCORE_LIMITS.qualificationRow} disabled={!rowHasReviewableData("quals", r, docs, `qual-${i}`)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


