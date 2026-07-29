// - HOD-editable score input -
import { clampScore } from "../utils/appraisalFormUtils";

export function HodInput({ val, onChange, max, disabled = false }) {
  return (
    <input
      type="number"
      min="0"
      step="0.5"
      value={val ?? ""}
      max={max}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" || max === undefined ? e.target.value : String(clampScore(e.target.value, max)))}
      style={{
        width: 74,
        height: 34,
        boxSizing: "border-box",
        textAlign: "center",
        border: disabled ? "1px solid #cbd5e1" : "1.5px solid #6366f1",
        borderRadius: 9,
        padding: "6px 8px",
        fontSize: 13,
        fontFamily: "inherit",
        fontWeight: 800,
        color: disabled ? "#94a3b8" : "#111827",
        outline: "none",
        background: disabled ? "#f8fafc" : "#ffffff",
        cursor: disabled ? "not-allowed" : "text",
        boxShadow: disabled ? "none" : "0 0 0 3px rgba(99,102,241,0.08), 0 8px 18px rgba(99,102,241,0.08)",
        transition: "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",
      }}
    />
  );
}

