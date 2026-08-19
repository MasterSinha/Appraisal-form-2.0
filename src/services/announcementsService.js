import { api } from "./api";

// Important Notices, backed by the Announcement model (see announcements.py). Creation/
// management is admin-only on the backend; GET /announcements (active-only) is public and is
// what every dashboard's NoticesBanner reads from.
const normalizeAnnouncement = (raw = {}) => ({
  id: raw.id,
  title: raw.title || "",
  body: raw.body || "",
  audience: raw.audience || "all",
  isActive: raw.is_active ?? true,
  createdBy: raw.created_by || "",
  createdAt: raw.created_at || "",
  updatedAt: raw.updated_at || "",
});

export const listAnnouncements = async () => {
  const items = await api.get("/announcements");
  return (Array.isArray(items) ? items : []).map(normalizeAnnouncement);
};

export const listAllAnnouncements = async () => {
  const items = await api.get("/admin/announcements");
  return (Array.isArray(items) ? items : []).map(normalizeAnnouncement);
};

export const createAnnouncement = async ({ title, body, audience = "all", isActive = true, sendEmail = true }) => {
  if (!String(title || "").trim() || !String(body || "").trim()) {
    throw new Error("Title and body are required.");
  }
  return await api.post("/admin/announcements", {
    title: String(title).trim(),
    body: String(body).trim(),
    audience,
    is_active: isActive,
    send_email: sendEmail,
  });
};

export const updateAnnouncement = async (id, { title, body, audience, isActive } = {}) => {
  if (!id) throw new Error("Announcement id is required.");
  const payload = {};
  if (title !== undefined) payload.title = title;
  if (body !== undefined) payload.body = body;
  if (audience !== undefined) payload.audience = audience;
  if (isActive !== undefined) payload.is_active = isActive;
  return await api.put(`/admin/announcements/${encodeURIComponent(id)}`, payload);
};

export const deleteAnnouncement = async (id) => {
  if (!id) throw new Error("Announcement id is required.");
  return await api.delete(`/admin/announcements/${encodeURIComponent(id)}`);
};
