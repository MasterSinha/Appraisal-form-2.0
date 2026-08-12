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
export default function DirectorInnovativeTeaching({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, getDir, setDir, getInnovDir, setInnovDir, innovativeRows, innovativeRowMax = SCORE_LIMITS.innovativeRow } = ctx;
 return (
<>
{/* A3: Innovative Teaching */}
<SC title="A3. Innovative Teaching-Learning (Max 20)" accent="#8b5cf6">
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Method</th><th style={TH}>Proof Attached (Yes/No)</th><th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_DIR}>Director Score</th>
</tr></thead>
<tbody>
 {innovativeRows.map((row, index) =>{
 const rowReviewable = rowHasReviewableData("innovRows", row, docs, index === 0 ? ["innov", "innov-0"] : `innov-${index}`);
 return (
<tr key={index}>
<td style={TDC}>{index + 1}</td>
<td style={TD}><RO val={(row.method === "Any other innovative method" && row.methodOther) ? row.methodOther : (row.method || faculty.innovDetails)} /></td>
<td style={TD}><RO val={row.details} /></td>
<td style={TDV}><ViewDocsCell docKey={index === 0 ? ["innov", "innov-0"] : `innov-${index}`} docs={docs} /></td>
<td style={TDS}><RO val={String(row.score ?? "").trim() ? clampScore(row.score, row.max || innovativeRowMax) : ""} center /></td>
<td style={TDS_DIR}><DirInput val={String(getInnovDir(index) ?? "").trim() ? clampScore(getInnovDir(index), row.max || innovativeRowMax) : ""} max={row.max || innovativeRowMax} disabled={!rowReviewable} onChange={v =>setInnovDir(index, v)} /></td>
</tr>
 );
 })}
</tbody>
</table>
</SC>
</>
 );
}


