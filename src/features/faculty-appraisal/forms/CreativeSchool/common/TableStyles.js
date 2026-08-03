import { T, TH, TD, TDC, TDS, TH_HOD, TH_DIR, TH_DEAN, TDS_HOD, TDS_DIR, TDS_DEAN } from "../../../components";

export { T, TH, TD, TDC, TDS, TH_HOD, TH_DIR, TH_DEAN, TDS_HOD, TDS_DIR, TDS_DEAN };

export const tableStyle = {
  ...T,
  minWidth: 0,
  maxWidth: "100%",
  lineHeight: 1.3,
};
export const thStyle = {
  ...TH,
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  hyphens: "auto",
  overflow: "hidden",
  lineHeight: 1.3,
  minWidth: 0,
  height: "auto",
  minHeight: 0,
  padding: "8px 6px",
  verticalAlign: "middle",
};
export const tdStyle = {
  ...TD,
  height: "auto",
  minHeight: 0,
  padding: "8px 10px",
  verticalAlign: "middle",
};
export const tdCenter = {
  ...TDC,
  height: "auto",
  minHeight: 0,
  padding: "8px 10px",
  verticalAlign: "middle",
};
export const tdScore = {
  ...TDS,
  height: "auto",
  minHeight: 0,
  padding: "8px 10px",
  verticalAlign: "middle",
};
