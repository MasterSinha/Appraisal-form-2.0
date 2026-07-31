/* eslint-disable no-unused-vars */
import {
  SCORE_LIMITS,
  clampScore,
  clampReviewScore,
  mergeFacultyInfo,
  reviewSectionScore,
} from "../../features/faculty-appraisal";
import FacultyInfoSection from "./common/FacultyInfoSection";
import PartA from "./PartA/PartA";
import DirectorPartA from "./PartA/DirectorPartA";
import PartB from "./PartB/PartB";
import DirectorPartB from "./PartB/DirectorPartB";
import PartC from "./PartC/PartC";
import PartD from "./PartD/PartD";

const REVIEW_SECTION_MAX = {
  lectures: 40,
  courseFile: 20,
  obeRows: 20,
  projects: 20,
  mentoringRows: 10,
  quals: 10,
  feedback: 10,
  deptActs: 30,
  uniActs: 50,
  eventRows: 20,
  society: 20,
  industry: 8,
  alumniRows: 10,
  placementRows: 20,
  acr: 50,
  journals: 120,
  books: 50,
  ict: 20,
  research: 30,
  projects2: SCORE_LIMITS.researchInternalProjects,
  externalProjects: SCORE_LIMITS.researchExternalProjects,
  patents: 40,
  awards: 10,
  confs: 30,
  proposals: 10,
  products: 10,
  fdps: 10,
  training: 10,
};
const DIRECTOR_REVIEW_SECTION_MAX = {
 ...REVIEW_SECTION_MAX,
 deptActs: 30,
 uniActs: 50,
 society: 20,
 industry: 8,
 journals: 100,
 books: 30,
 research: 20,
 projects2: 40,
 awards: 20,
 confs: 20,
 proposals: 20,
 products: 20,
 fdps: 20,
};
const DIRECTOR_ACR_DEFAULT_SCORE = 5;
const clampDirectorReviewScore = (section, row, value, maxScore) => {
 if (String(value ?? "").trim() === "") return "";
 const strictValue = clampReviewScore(section, row, value, maxScore);
 return strictValue === "" ? String(clampScore(value, maxScore)) : strictValue;
};

// - Faculty Form in HOD Review Mode -
export default function MyAppraisalForm({ faculty, hodData, setHodData, reviewerLabel = "HOD", sectionView = "partA" }) {
 const set = (section, idx, field, val) =>{
 setHodData(prev =>{
 const updated = { ...prev };
 if (!updated[section]) updated[section] = JSON.parse(JSON.stringify(faculty[section] || []));
 const nextVal = field === "hod" && idx !== null
 ? clampReviewScore(section, faculty[section]?.[idx] || {}, val, REVIEW_SECTION_MAX[section] || 0)
 : val;
 if (idx === null) {
 updated[section] = Array.isArray(updated[section])
 ? (updated[section].length ? updated[section].map((r, i) =>i === 0 ? { ...r, [field]: nextVal } : r) : [{ [field]: nextVal }])
 : { ...updated[section], [field]: nextVal };
 }
 else { updated[section] = updated[section].map((r, i) =>i === idx ? { ...r, [field]: nextVal } : r); }
 return updated;
 });
 };

 const get = (section, idx, field) =>{
 if (hodData[section]) {
 const s = hodData[section];
 return idx === null
 ? (Array.isArray(s) ? (s[0]?.[field] ?? "") : (s[field] ?? ""))
 : (s[idx]?.[field] ?? faculty[section]?.[idx]?.[field] ?? "");
 }
 if (idx === null) {
 const source = faculty[section];
 return Array.isArray(source) ? (source[0]?.[field] ?? "") : (source?.[field] ?? "");
 }
 return faculty[section]?.[idx]?.[field] ?? "";
 };

 const info = mergeFacultyInfo(faculty.info, faculty);
 const { lectures, courseFile, obeRows, projects, mentoringRows, quals, feedback, deptActs, uniActs, eventRows, society, industry, alumniRows, placementRows, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, docs } = faculty;
 const rows = (arr) =>arr && arr.length >0 ? arr : [{}];
 const reviewerScoreLabel = `${reviewerLabel} Score`;
 const innovativeRows = Array.isArray(faculty.innovRows) && faculty.innovRows.length
 ? faculty.innovRows
 : [{ method: faculty.innovDetails || "Innovative / participatory teaching methods used", details: faculty.innovDetails || "", score: faculty.innovScore || "" }];
 const getInnovHod = (index) =>hodData.innovRows?.[index]?.hod ?? innovativeRows[index]?.hod ?? "";
 const setInnovHod = (index, value) =>{
 const sourceRow = innovativeRows[index] || {};
 const nextValue = clampReviewScore("innovRows", sourceRow, value, 10);
 setHodData(prev =>{
 const sourceRows = Array.isArray(prev.innovRows) && prev.innovRows.length ? prev.innovRows : JSON.parse(JSON.stringify(innovativeRows));
 const nextRows = sourceRows.map((row, rowIndex) =>rowIndex === index ? { ...row, hod: nextValue } : row);
 const total = reviewSectionScore("innovRows", nextRows.map((row, rowIndex) =>({ ...innovativeRows[rowIndex], ...row })), 10, "hod");
 return { ...prev, innovRows: nextRows, innovHod: total ? String(total) : "" };
 });
 };
 const ctx = { faculty, docs, lectures, courseFile, obeRows, projects, mentoringRows, quals, feedback, deptActs, uniActs, eventRows, society, industry, alumniRows, placementRows, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, get, set, reviewerLabel, reviewerScoreLabel, innovativeRows, getInnovHod, setInnovHod };

 return (
<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
<div style={{ background: "linear-gradient(180deg,#f8f7ff 0%,#eef2ff 100%)", color: "#334155", borderRadius: 12, padding: "11px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 12, boxShadow: "0 10px 24px rgba(79,70,229,0.08)", border: "1px solid #c7d2fe" }}>
<span style={{ width: 28, height: 28, borderRadius: 999, background: "#ffffff", color: "#4f46e5", border: "1px solid #c7d2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>i</span>
<div style={{ lineHeight: 1.55 }}>
<strong style={{ color: "#312e81" }}>{reviewerLabel} Review Mode</strong> - Faculty self-scores are read-only. Only <span style={{ color: "#4f46e5", fontWeight: 900 }}>{reviewerScoreLabel}</span> columns are editable. Click <span style={{ color: "#4f46e5", fontWeight: 900 }}>View Docs</span> to open uploaded files.
</div>
</div>
<FacultyInfoSection info={info} />
{sectionView === "partA" && <PartA ctx={ctx} />}
{sectionView === "partB" && <PartB ctx={ctx} />}
{sectionView === "partC" && <PartC ctx={ctx} />}
{sectionView === "partD" && <PartD ctx={ctx} />}
</div>
 );
}

// - Faculty Form in Director Review Mode -
export function DirectorFacultyReviewForm({ faculty, hodData, setHodData, dirData, setDirData, sectionView = "partA" }) {
 const set = (section, idx, field, val) =>{
 setHodData(prev =>{
 const updated = { ...prev };
 if (!updated[section]) updated[section] = JSON.parse(JSON.stringify(faculty[section] || []));
 if (idx === null) {
 updated[section] = Array.isArray(updated[section])
 ? (updated[section].length ? updated[section].map((r, i) =>i === 0 ? { ...r, [field]: val } : r) : [{ [field]: val }])
 : { ...updated[section], [field]: val };
 }
 else { updated[section] = updated[section].map((r, i) =>i === idx ? { ...r, [field]: val } : r); }
 return updated;
 });
 };

 const setDir = (section, idx, field, val) =>{
 setDirData(prev =>{
 const updated = { ...prev };
 if (!updated[section]) updated[section] = JSON.parse(JSON.stringify(faculty[section] || []));
 const nextVal = field === "dir" && idx !== null
 ? clampDirectorReviewScore(section, faculty[section]?.[idx] || {}, val, DIRECTOR_REVIEW_SECTION_MAX[section] || 0)
 : val;
 if (idx === null) {
 updated[section] = Array.isArray(updated[section])
 ? (updated[section].length ? updated[section].map((r, i) =>i === 0 ? { ...r, [field]: nextVal } : r) : [{ [field]: nextVal }])
 : { ...updated[section], [field]: nextVal };
 }
 else { updated[section] = updated[section].map((r, i) =>i === idx ? { ...r, [field]: nextVal } : r); }
 return updated;
 });
 };

 const getDir = (section, idx, field) =>{
 let value;
 if (dirData[section]) {
 const s = dirData[section];
 value = idx === null ? (Array.isArray(s) ? (s[0]?.[field] ?? "") : (s[field] ?? "")) : (s[idx]?.[field] ?? "");
 } else if (idx === null) {
 const source = faculty[section];
 value = Array.isArray(source) ? (source[0]?.director ?? "") : (source?.director ?? "");
 } else {
 value = faculty[section]?.[idx]?.director ?? "";
 }
 if (section === "acr" && String(value ?? "").trim() === "") return DIRECTOR_ACR_DEFAULT_SCORE;
 return value;
 };

 const info = mergeFacultyInfo(faculty.info, faculty);
 const { lectures, courseFile, obeRows, projects, mentoringRows, quals, feedback, deptActs, uniActs, eventRows, society, industry, alumniRows, placementRows, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, docs } = faculty;
 const rows = (arr) =>arr && arr.length >0 ? arr : [{}];
 const innovativeRows = Array.isArray(faculty.innovRows) && faculty.innovRows.length
 ? faculty.innovRows
 : [{ method: faculty.innovDetails || "Innovative / participatory teaching methods used", details: faculty.innovDetails || "", score: faculty.innovScore || "" }];
 const getInnovDir = (index) =>dirData.innovRows?.[index]?.director ?? dirData.innovRows?.[index]?.dir ?? innovativeRows[index]?.director ?? "";
 const setInnovDir = (index, value) =>{
 const sourceRow = innovativeRows[index] || {};
 const nextValue = clampDirectorReviewScore("innovRows", sourceRow, value, 10);
 setDirData(prev =>{
 const sourceRows = Array.isArray(prev.innovRows) && prev.innovRows.length ? prev.innovRows : JSON.parse(JSON.stringify(innovativeRows));
 const nextRows = sourceRows.map((row, rowIndex) =>rowIndex === index ? { ...row, director: nextValue } : row);
 const total = reviewSectionScore("innovRows", nextRows.map((row, rowIndex) =>({ ...innovativeRows[rowIndex], ...row })), 10, "director");
 return { ...prev, innovRows: nextRows, innovDir: total ? String(total) : "" };
 });
 };
 const setDirector = (section, idx, _field, val) => setDir(section, idx, "dir", val);
 const getDirector = (section, idx, field) => getDir(section, idx, field === "hod" ? "dir" : field);
 const ctx = { faculty, docs, lectures, courseFile, obeRows, projects, mentoringRows, quals, feedback, deptActs, uniActs, eventRows, society, industry, alumniRows, placementRows, acr, journals, books, ict, research, projects2, externalProjects, patents, awards, confs, proposals, products, fdps, training, rows, get: getDirector, set: setDirector, getDir, setDir, getInnovDir, setInnovDir, innovativeRows, reviewerScoreLabel: "Director Score", reviewerLabel: "Director", acrDefaultScore: DIRECTOR_ACR_DEFAULT_SCORE };

 return (
<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
<div style={{ background: "linear-gradient(180deg,#f0fdfa 0%,#ecfdf5 100%)", color: "#334155", borderRadius: 12, padding: "11px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 12, boxShadow: "0 10px 24px rgba(5,150,105,0.08)", border: "1px solid #a7f3d0" }}>
<span style={{ width: 28, height: 28, borderRadius: 999, background: "#ffffff", color: "#059669", border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>i</span>
<div style={{ lineHeight: 1.55 }}>
<strong style={{ color: "#065f46" }}>Director Review Mode</strong> - Faculty self-scores are read-only. Only <span style={{ color: "#047857", fontWeight: 900 }}>Director Score</span> columns are editable. Click <span style={{ color: "#047857", fontWeight: 900 }}>View Docs</span> to open uploaded files.
</div>
</div>
<FacultyInfoSection info={info} />
{sectionView === "partA" && <DirectorPartA ctx={ctx} />}
{sectionView === "partB" && <DirectorPartB ctx={ctx} />}
{sectionView === "partC" && <PartC ctx={ctx} />}
{sectionView === "partD" && <PartD ctx={ctx} />}
</div>
 );
}


