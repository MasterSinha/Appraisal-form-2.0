import { HodInput } from "../../Inputs";
import {
  clampScore,
  SectionCard as SC,
  T,
  TH,
  TH_HOD,
  TD,
  TDC,
  TDS,
  TDS_HOD,
  TDV,
  ViewDocsCell,
} from "../../../features/faculty-appraisal";
import { RO } from "../../../features/faculty-appraisal/shared";

export default function EvidenceScoreTable({ ctx, title, accent, sectionKey, docPrefix, labelKey, labelHeader, max }) {
 const { docs, rows, get, set, reviewerScoreLabel } = ctx;
 const sectionRows = rows(ctx[sectionKey]);

 return (
<SC title={title} accent={accent}>
<table style={T}>
<thead>
<tr>
<th style={TH}>SN</th>
<th style={TH}>{labelHeader}</th>
<th style={TH}>Evidence Attached (Yes/No)</th>
<th style={TH}>View Docs</th>
<th style={TH}>Faculty Score</th>
<th style={TH_HOD}>{reviewerScoreLabel}</th>
</tr>
</thead>
<tbody>
 {sectionRows.map((row, index) =>{
 const rowMax = row.max || max;
 return (
<tr key={index} style={index % 2 ? { background: "#f8fafc" } : {}}>
<td style={TDC}>{index + 1}</td>
<td style={TD}><RO val={row[labelKey]} /></td>
<td style={TDC}><RO val={row.evidence} center /></td>
<td style={TDV}><ViewDocsCell docKey={`${docPrefix}-${index}`} docs={docs} /></td>
<td style={TDS}><RO val={String(row.score ?? "").trim() ? clampScore(row.score, rowMax) : ""} center /></td>
<td style={TDS_HOD}><HodInput val={get(sectionKey, index, "hod")} max={rowMax} onChange={(value) =>set(sectionKey, index, "hod", value)} /></td>
</tr>
 );})}
</tbody>
</table>
</SC>
 );
}
