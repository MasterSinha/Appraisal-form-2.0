import { T, TH, TD, TDC, TDS, TH_HOD, TH_DIR, TH_DEAN, TDS_HOD, TDS_DIR, TDS_DEAN } from "../../../components";

export { T, TH, TD, TDC, TDS, TH_HOD, TH_DIR, TH_DEAN, TDS_HOD, TDS_DIR, TDS_DEAN };

export const tableStyle = {
  ...T,
  minWidth: 1180,
};
export const thStyle = {
  ...TH,
  whiteSpace: "normal",
  wordBreak: "break-word",
  lineHeight: 1.3,
  padding: "10px 8px",
};
export const tdStyle = TD;
export const tdCenter = TDC;
export const tdScore = TDS;
