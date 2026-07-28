export default function FacultyInfoSection({ info }) {
 const fields = [
  ["Academic Year", info.ay],
  ["Name", info.name],
  ["Qualification", info.qual],
  ["Designation", info.desig],
  ["School", info.school],
  ["Experience", info.experience],
 ];

  return (
  <div className="review-faculty-info-card" style={{ background: "#ffffff", border: "1px solid #e7eaf3", borderRadius: 12, boxShadow: "0 10px 24px rgba(15,23,42,0.045)", marginBottom: 14, overflow: "hidden" }}>
   <div className="review-faculty-info-card__title" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #eef2f7", background: "#fbfcff" }}>
    <span style={{ width: 30, height: 30, borderRadius: 9, background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 3 7l9 4 9-4-9-4Z" />
      <path d="M5 10v5c2 2 12 2 14 0v-5" />
      <path d="M12 11v8" />
     </svg>
    </span>
    <div style={{ fontWeight: 900, fontSize: 15, color: "#4f46e5", lineHeight: 1.2 }}>Faculty Information</div>
   </div>
   <div style={{ padding: "14px 18px 16px" }}>
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", border: "1px solid #e5eaf4", borderRadius: 10, overflow: "hidden", fontSize: 13 }}>
     <tbody>
      {fields.map(([label, val], index) =>(
       <tr key={label} style={{ background: index % 2 ? "#ffffff" : "#fbfcff" }}>
        <td style={{ width: "32%", padding: "10px 14px", background: "#f8fafc", borderBottom: index === fields.length - 1 ? "none" : "1px solid #e9edf5", color: "#334155", fontWeight: 900, textTransform: "uppercase", fontSize: 11, letterSpacing: 0 }}>
         {label}
        </td>
        <td style={{ padding: "10px 14px", borderBottom: index === fields.length - 1 ? "none" : "1px solid #e9edf5", color: "#1f2937", fontWeight: 600, lineHeight: 1.35, overflowWrap: "anywhere" }}>
         {val || "-"}
        </td>
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  </div>
 );
}
