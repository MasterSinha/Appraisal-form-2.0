import { useState, useEffect, useCallback } from "react";
import { fetchActiveRoleAssignments, transferRole } from "../../services/roleAssignmentsService";

const initialsFor = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
};

function HolderRow({ holder, accent }) {
  const name = holder.fullName || holder.email || "";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px" }}>
      <div style={{ width: 30, height: 30, borderRadius: 999, background: accent, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {initialsFor(name)}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        {holder.email && holder.fullName && (
          <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{holder.email}</div>
        )}
      </div>
    </div>
  );
}

// Reusable transfer control for a single (roleType, scopeId) position - e.g. one school's
// Director, one department's HOD, or one Dean track. The outgoing holder is resolved
// server-side from the currently active RoleAssignment; the caller only supplies who's coming in.
// Shows every account currently holding the position, not just one - see fetchActiveRoleAssignments.
export default function RoleTransferForm({ roleType, scopeId, roleLabel = roleType, accent = "#2563eb" }) {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [incomingEmail, setIncomingEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!scopeId) return;
    setLoading(true);
    try {
      setHolders(await fetchActiveRoleAssignments({ roleType, scopeId }));
    } catch {
      setHolders([]);
    } finally {
      setLoading(false);
    }
  }, [roleType, scopeId]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const hasMultiple = holders.length > 1;

  const handleTransfer = async (e) => {
    e.preventDefault();
    const email = incomingEmail.trim();
    if (!email) return;
    const outgoingNote = holders.length === 0
      ? "This position is currently vacant, so this will be a first appointment."
      : hasMultiple
        ? `${holders.length} accounts currently hold this role (${holders.map((h) => h.fullName || h.email).join(", ")}) - your backend needs to resolve which one is actually outgoing before this is safe.`
        : `${holders[0].fullName || holders[0].email} reverts to Faculty.`;
    const confirmed = window.confirm(`Transfer ${roleLabel} to ${email}? ${outgoingNote} Nothing else changes.`);
    if (!confirmed) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await transferRole({ roleType, scopeId, incomingEmail: email });
      setIncomingEmail("");
      setMessage("Role transferred.");
      await refresh();
    } catch (err) {
      setError(err?.message || "Could not transfer role.");
    } finally {
      setSaving(false);
    }
  };

  if (!scopeId) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ borderRadius: 10, background: `${accent}0D`, border: `1px solid ${accent}22`, overflow: "hidden" }}>
        <div style={{ padding: "8px 12px 2px", fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Current {roleLabel}{hasMultiple ? "s" : ""}
        </div>
        {loading ? (
          <div style={{ padding: "8px 12px 12px", fontSize: 13, color: "#94a3b8" }}>Loading…</div>
        ) : holders.length === 0 ? (
          <div style={{ padding: "8px 12px 12px", fontSize: 13.5, fontWeight: 700, color: "#94a3b8" }}>Vacant</div>
        ) : (
          <div style={{ paddingBottom: 6 }}>
            {holders.map((holder) => (
              <HolderRow key={holder.assignmentId || holder.email} holder={holder} accent={accent} />
            ))}
          </div>
        )}
      </div>

      {hasMultiple && (
        <div style={{ fontSize: 11.5, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px" }}>
          {holders.length} accounts currently have this role - only one should. This needs backend
          cleanup (see the "Role Ownership Transfer" migration note in backend_changes_requied.md);
          transferring below won't resolve the duplicate on its own.
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px" }}>{error}</div>
      )}
      {message && (
        <div style={{ fontSize: 12, color: "#065f46", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: "8px 10px" }}>{message}</div>
      )}

      <form onSubmit={handleTransfer} style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={incomingEmail}
          onChange={(e) => setIncomingEmail(e.target.value)}
          placeholder={`Incoming ${roleLabel}'s email`}
          style={{ flex: 1, padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", outline: "none", color: "#0f172a" }}
        />
        <button
          type="submit"
          disabled={saving || !incomingEmail.trim()}
          style={{ padding: "9px 18px", background: accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: saving || !incomingEmail.trim() ? "not-allowed" : "pointer", opacity: saving || !incomingEmail.trim() ? 0.55 : 1, fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          {saving ? "Transferring…" : "Transfer"}
        </button>
      </form>
    </div>
  );
}
