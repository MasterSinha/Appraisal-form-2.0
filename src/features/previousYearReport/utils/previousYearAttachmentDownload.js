import { api } from "../../../services/api";

const textEncoder = new TextEncoder();

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date = new Date()) => ({
  time: ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1f),
  date: (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f),
});

const writeZipHeader = (size, writer) => {
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  writer(view);
  return bytes;
};

const createZipBlob = async (entries) => {
  const parts = [];
  const centralParts = [];
  let offset = 0;
  const stamp = dosDateTime();

  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.name);
    const dataBytes = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(dataBytes);
    const localHeader = writeZipHeader(30, (view) => {
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, stamp.time, true);
      view.setUint16(12, stamp.date, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, dataBytes.length, true);
      view.setUint32(22, dataBytes.length, true);
      view.setUint16(26, nameBytes.length, true);
      view.setUint16(28, 0, true);
    });
    parts.push(localHeader, nameBytes, dataBytes);

    const centralHeader = writeZipHeader(46, (view) => {
      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 20, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, stamp.time, true);
      view.setUint16(14, stamp.date, true);
      view.setUint32(16, crc, true);
      view.setUint32(20, dataBytes.length, true);
      view.setUint32(24, dataBytes.length, true);
      view.setUint16(28, nameBytes.length, true);
      view.setUint16(30, 0, true);
      view.setUint16(32, 0, true);
      view.setUint16(34, 0, true);
      view.setUint16(36, 0, true);
      view.setUint32(38, 0, true);
      view.setUint32(42, offset, true);
    });
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endHeader = writeZipHeader(22, (view) => {
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(4, 0, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, entries.length, true);
    view.setUint16(10, entries.length, true);
    view.setUint32(12, centralSize, true);
    view.setUint32(16, offset, true);
    view.setUint16(20, 0, true);
  });

  return new Blob([...parts, ...centralParts, endHeader], { type: "application/zip" });
};

const dataUrlToBlob = (dataUrl) => {
  const [meta, value = ""] = String(dataUrl).split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const cleanName = (value, fallback) =>
  String(value || fallback)
    .split("")
    .map((char) => (char.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(char) ? "_" : char))
    .join("")
    .trim() || fallback;

const uniqueName = (rawName, fallbackName, usedNames) => {
  const cleaned = cleanName(rawName, fallbackName);
  if (!usedNames.has(cleaned)) {
    usedNames.add(cleaned);
    return cleaned;
  }
  const dotIndex = cleaned.lastIndexOf(".");
  const base = dotIndex > 0 ? cleaned.slice(0, dotIndex) : cleaned;
  const ext = dotIndex > 0 ? cleaned.slice(dotIndex) : "";
  let count = 2;
  let next = `${base}-${count}${ext}`;
  while (usedNames.has(next)) {
    count += 1;
    next = `${base}-${count}${ext}`;
  }
  usedNames.add(next);
  return next;
};

const finalAttachmentUrl = (file) => {
  const rawUrl = file?.fileUrl || file?.url || file?.file_url || file?.document_url || file?.documentUrl || file?.path || file?.location || "";
  if (!rawUrl || /^https?:|^data:|^blob:/i.test(rawUrl)) return rawUrl;
  return api.getFileUrl(rawUrl);
};

const fetchAttachmentBlob = async (file) => {
  const finalUrl = finalAttachmentUrl(file);
  if (!finalUrl) throw new Error("Attachment URL is missing.");
  if (finalUrl.startsWith("data:")) return dataUrlToBlob(finalUrl);
  const token = sessionStorage.getItem("accessToken") || sessionStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("token");
  const response = await fetch(finalUrl, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`Attachment download failed: ${response.status}`);
  return response.blob();
};

const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const previousYearAttachmentFiles = (report = {}) => {
  const seen = new Set();
  return [
    ...(report.attachments?.partA || []),
    ...(report.attachments?.partB || []),
  ].filter((file) => {
    const url = finalAttachmentUrl(file);
    if (!url) return false;
    const key = String(url).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const downloadPreviousYearAttachmentsZip = async (report = {}) => {
  const files = previousYearAttachmentFiles(report);
  if (!files.length) throw new Error("No attachments found for this academic year.");
  const usedNames = new Set();
  const entries = [];
  for (const file of files) {
    const sectionPrefix = cleanName(file.sectionKey || file.part || "attachment", "attachment");
    const rowPrefix = file.rowNo ? `row-${file.rowNo}` : "file";
    const fallback = `${sectionPrefix}-${rowPrefix}`;
    entries.push({
      name: uniqueName(file.fileName, fallback, usedNames),
      blob: await fetchAttachmentBlob(file),
    });
  }
  const zipBlob = await createZipBlob(entries);
  downloadBlob(zipBlob, `previous-year-attachments-${String(report.academicYear || "academic-year").replace(/[^a-z0-9-]/gi, "_")}.zip`);
  return files.length;
};
