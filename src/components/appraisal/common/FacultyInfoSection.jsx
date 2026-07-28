export default function FacultyInfoSection({ info }) {
 const fields = [
  ["Name", info.name],
  ["Qualification", info.qual],
  ["Designation", info.desig],
  ["Academic Year", info.ay],
 ];

  return (
  <div className="review-faculty-info-card" style={{ background: "#ffffff", border: "1px solid #e7eaf3", borderRadius: 12, boxShadow: "0 10px 24px rgba(15,23,42,0.045)", marginBottom: 14, overflow: "hidden", display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", alignItems: "stretch" }}>
   <div className="review-faculty-info-card__title" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRight: "1px solid #eef2f7", background: "#f8faff" }}>
    <span style={{ width: 30, height: 30, borderRadius: 9, background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 3 7l9 4 9-4-9-4Z" />
      <path d="M5 10v5c2 2 12 2 14 0v-5" />
      <path d="M12 11v8" />
     </svg>
    </span>
    <div style={{ fontWeight: 900, fontSize: 15, color: "#4f46e5", lineHeight: 1.2 }}>Faculty Information</div>
   </div>
   <div style={{ padding: "10px 12px" }}>
    <div className="review-faculty-info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(130px, 1fr))", gap: 8 }}>
     {fields.map(([label, val]) =>(
      <div key={label} style={{ border: "1px solid #edf0f7", borderRadius: 8, background: "#ffffff", padding: "8px 10px", minHeight: 44, display: "flex", flexDirection: "column", justifyContent: "center" }}>
       <div style={{ color: "#64748b", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0, marginBottom: 4 }}>{label}</div>
       <div style={{ color: "#111827", fontSize: 12.5, fontWeight: 800, lineHeight: 1.25, overflowWrap: "anywhere" }}>{val || "-"}</div>
      </div>
     ))}
    </div>
   </div>
  </div>
 );
}
