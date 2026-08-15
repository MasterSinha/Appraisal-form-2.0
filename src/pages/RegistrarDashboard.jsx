import { useState } from "react";
import { NonTeachingReviewDashboard } from "./NonTeachingStaffDashboard";
import TeachingPartDReviewDashboard from "./TeachingPartDReviewDashboard";

const TABS = [
  { id: "nonTeaching", label: "Non-Teaching Staff" },
  { id: "partD", label: "Part D - Teaching Staff" },
];

export default function RegistrarDashboard() {
  const [tab, setTab] = useState("nonTeaching");

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Floating corner switcher, not a full-width bar: both dashboards below manage their own
          fixed-position sidebar at top-left, so this avoids colliding with either one. */}
      <div style={{ position: "fixed", top: 14, right: 20, zIndex: 50, display: "flex", gap: 4, padding: 4, borderRadius: 10, background: "#0f172a", boxShadow: "0 10px 24px rgba(2,6,23,0.35)" }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "none",
              background: tab === item.id ? "#155e75" : "transparent",
              color: tab === item.id ? "#fff" : "#94a3b8",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "nonTeaching" ? (
        <NonTeachingReviewDashboard
          reviewerRole="registrar"
          title="Registrar"
          subtitle="Reporting Officer and staff review"
          accent="#155e75"
        />
      ) : (
        <TeachingPartDReviewDashboard />
      )}
    </div>
  );
}

