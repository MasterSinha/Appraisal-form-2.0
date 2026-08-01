import { T, TH, TD, TDC, TDS, TH_HOD, TH_DIR, TH_DEAN, TDS_HOD, TDS_DIR, TDS_DEAN } from "../../../components";

export { T, TH, TD, TDC, TDS, TH_HOD, TH_DIR, TH_DEAN, TDS_HOD, TDS_DIR, TDS_DEAN };

export const tableStyle = {
  ...T,
  minWidth: 0,
  maxWidth: "100%",
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
  padding: "10px 6px",
};
export const tdStyle = TD;
export const tdCenter = TDC;
export const tdScore = TDS;
