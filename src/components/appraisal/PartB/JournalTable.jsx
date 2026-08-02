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
export default function JournalTable({ ctx }) {
 const { faculty, docs, lectures, courseFile, projects, quals, feedback, deptActs, uniActs, society, industry, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, get, set, reviewerLabel, reviewerScoreLabel, innovativeRows, getInnovHod, setInnovHod } = ctx;
 return (
<>
{/* B1: Journals */}
<SC title="B1. Journal Publications (Max 100)" accent="#7c3aed">
<div style={{ overflowX: "auto" }}>
<table style={T}>
<thead><tr>
<th style={TH}>SN</th><th style={TH}>Title</th><th style={TH}>Journal</th>
<th style={TH}>ISSN</th><th style={TH}>Impact Factor</th><th style={TH}>Author Position</th>
<th style={TH}>View Docs</th><th style={TH}>Faculty Score</th><th style={TH_HOD}>{reviewerScoreLabel}</th>
</tr></thead>
<tbody>
 {rows(journals).map((r, i) =>(
<tr key={i} style={i % 2 ? { background: "#f8fafc" } : {}}>
<td style={TDC}>{i + 1}</td>
<td style={TD}><RO val={r.title} /></td>
<td style={TD}><RO val={r.journal} /></td>
<td style={TDC}><RO val={r.issn} center /></td>
<td style={TDC}><RO val={r.impactFactor || r.impact} center /></td>
<td style={TDC}><RO val={r.authorPosition || r.position} center /></td>
<td style={TDV}><ViewDocsCell docKey={`jour-${i}`} docs={docs} /></td>
<td style={TDS}><RO val={r.score} center /></td>
<td style={TDS_HOD}><HodInput val={get("journals", i, "hod")} max={100} disabled={!rowHasReviewableData("journals", r, docs, `jour-${i}`)} onChange={v =>set("journals", i, "hod", v)} /></td>
</tr>
 ))}
</tbody>
</table>
</div>
</SC>
</>
 );
}


