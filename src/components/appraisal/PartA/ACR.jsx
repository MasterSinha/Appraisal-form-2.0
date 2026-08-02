/* eslint-disable no-unused-vars */
import { HodInput } from "../../Inputs";
import {
  ACR_DETAIL_POINTS,
  SCORE_LIMITS,
  createAcrRows,
  SectionCard as SC,
  T,
  TH,
  TH_HOD,
  TD,
  TDC,
  TDS_HOD,
} from "../../../features/faculty-appraisal";
import { RO } from "../../../features/faculty-appraisal/shared";
import { DirectorInput as DirInput } from "../common/ReviewerInput";

export default function ACR({ ctx }) {
  const { acr, get, set, reviewerLabel, reviewerScoreLabel } = ctx;
  const isDirectorReview = reviewerLabel === "Director";
  const acrRows = createAcrRows(acr);

  return (
    <>
      {/* D1: ACR */}
      <SC title="D1. Annual Confidential Report (Max 50)" accent="#ef4444">
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
          ACR is assessed by evaluator — faculty does not fill scores. Enter marks for each parameter (Max 10 per row).
        </div>
        <table style={T}>
          <thead>
            <tr>
              <th style={TH}>SN</th>
              <th style={TH}>Parameter</th>
              <th style={TH_HOD}>{reviewerScoreLabel}</th>
            </tr>
          </thead>
          <tbody>
            {acrRows.map((r, i) => {
              const scoreKey = isDirectorReview ? "dir" : "hod";
              const rawScore = get("acr", i, scoreKey);
              const scoreValue =
                rawScore !== undefined && rawScore !== null && String(rawScore).trim() !== ""
                  ? String(rawScore)
                  : "";
              const points = ACR_DETAIL_POINTS[r.label] || [];

              return (
                <tr key={i} style={i % 2 ? { background: "#f8fafc" } : {}}>
                  <td style={TDC}>{i + 1}</td>
                  <td style={TD}>
                    <RO val={r.label} />
                    {points.length > 0 && (
                      <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 11, color: "#64748b" }}>
                        {points.map((pt) => (
                          <li key={pt}>{pt}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td style={TDS_HOD}>
                    {isDirectorReview ? (
                      <DirInput
                        val={scoreValue}
                        max={SCORE_LIMITS.acrRow}
                        disabled={false}
                        onChange={(v) => set("acr", i, scoreKey, v)}
                      />
                    ) : (
                      <HodInput
                        val={scoreValue}
                        max={SCORE_LIMITS.acrRow}
                        disabled={false}
                        onChange={(v) => set("acr", i, scoreKey, v)}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SC>
    </>
  );
}
