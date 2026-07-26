import { SUMMARY_OTHER_INFO_LABEL } from "./SummaryOtherInfoFieldUtils";

export default function SummaryOtherInfoField({
  value = "",
  onChange,
  readOnly = false,
  rows = 4,
}) {
  return (
    <label style={{ display: "grid", gap: 8, marginBottom: 0 }}>
      <span style={{ color: "#334155", fontSize: 12, fontWeight: 900 }}>
        {SUMMARY_OTHER_INFO_LABEL}
      </span>
      <textarea
        className="appraisal-summary-textarea"
        value={value || ""}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        rows={rows}
        placeholder="Enter any additional information you want to include with this appraisal..."
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #d5dce8",
          borderRadius: 12,
          padding: "12px 14px",
          minHeight: rows >= 5 ? 128 : undefined,
          color: "#0f172a",
          background: readOnly ? "#f8fafc" : "#fff",
          fontFamily: "inherit",
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
          outline: "none",
          boxShadow: "inset 0 1px 2px rgba(15,23,42,0.03)",
        }}
      />
    </label>
  );
}



