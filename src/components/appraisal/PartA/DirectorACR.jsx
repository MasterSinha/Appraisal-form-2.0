/* eslint-disable no-unused-vars */
import { HodInput } from "../../Inputs";
import {
  SCORE_LIMITS,
  clampScore,
  courseFileRowScore,
  createAcrRows,
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

export default function DirectorACR({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, getDir, setDir, getInnovDir, setInnovDir, innovativeRows } = ctx;
 const acrRows = createAcrRows(acr);
 return (
<>
{/* G: ACR */}
<SC title="D1. Annual Confidential Report (Max 50)" accent="#ef4444">
<div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>ACR is assessed by Director only. Enter the marks manually during review.</div>
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Parameter</th><th style={TH_DIR}>Director Score</th>
</tr></thead>
<tbody>
 {acrRows.map((r, i) =>(
<tr key={i} style={i % 2 ? { background: "#f8fafc" } : {}}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.label} /></td>
<td style={TDS_DIR}><DirInput val={String(getDir("acr", i, "dir") ?? "").trim() ? clampScore(getDir("acr", i, "dir"), SCORE_LIMITS.acrRow) : ""} max={SCORE_LIMITS.acrRow} onChange={v =>setDir("acr", i, "dir", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</SC>
</>
 );
}


