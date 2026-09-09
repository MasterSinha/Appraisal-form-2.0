import { UNIVERSITY_SCHOOLS } from "../constants/universityHierarchy";

const MOCK_DEPARTMENTS = ["Mechanical Engineering", "Civil Engineering"];

const schoolLabelBy = (predicate) => UNIVERSITY_SCHOOLS.find(predicate)?.label || "";
const engineeringDirectorSchool = () =>
  schoolLabelBy((school) => school.deanTrack === "engineering" && school.hasDirector) ||
  schoolLabelBy((school) => school.deanTrack === "engineering");
const engineeringHodSchool = () =>
  schoolLabelBy((school) => school.deanTrack === "engineering" && school.hasHod) ||
  engineeringDirectorSchool();
const nonEngineeringSchool = () =>
  schoolLabelBy((school) => school.deanTrack === "non_engineering");
const cisrSchool = () => schoolLabelBy((school) => school.code === "CISR");

export const HOD_USER = {
  name: "Prof. Rajesh Kulkarni",
  employeeId: "EMP-2025-010",
  designation: "Professor & Head",
  department: MOCK_DEPARTMENTS[0],
  school: engineeringHodSchool(),
  ay: "2026-2027",
  avatar: "RK",
};

export const DIRECTOR_USER = {
  name: "Dr. Mehta",
  employeeId: "EMP-2025-030",
  designation: "Director",
  department: "",
  school: engineeringDirectorSchool(),
  ay: "2026-2027",
  avatar: "DM",
};

export const DEAN_USER = {
  name: "Prof. Suresh Patil",
  employeeId: "EMP-2025-020",
  designation: "Dean",
  department: "Engineering",
  school: engineeringDirectorSchool(),
  ay: "2026-2027",
  avatar: "SP",
};

export const VC_USER = {
  name: "Prof. Anil Deshmukh",
  employeeId: "EMP-2025-000",
  designation: "Vice Chancellor",
  school: "University",
  ay: "2026-2027",
  avatar: "AD",
};

export const CREDENTIALS = {
  faculty: { name: "Dr. Priya Sharma", password: "f1", role: "faculty",  school: engineeringHodSchool(), department: MOCK_DEPARTMENTS[0] },
  cisrfaculty: { name: "Dr. CISR Faculty", password: "cf1", role: "faculty", school: cisrSchool(), department: "" },
  hod:     { name: "Prof. Rajesh Kulkarni", password: "hod1", role: "hod",      school: engineeringHodSchool(), department: MOCK_DEPARTMENTS[0] },
  centerhead: { name: "Dr. CISR Center Head", password: "ch1", role: "center_head", school: cisrSchool(), department: "" },
  dean:    { name: "Prof. Suresh Patil", password: "dean1", role: "dean",      school: engineeringDirectorSchool(), department: "Engineering" },
  director:{ name: "Dr. Mehta", password: "dir1", role: "director",  school: engineeringDirectorSchool(), department: "" },
  vc:      { name: "Prof. Anil Deshmukh", password: "vc1", role: "vc",        school: "University", department: "Management" },
  registrar: { name: "Dr. Test Registrar", password: "reg1", role: "registrar", school: "", department: "Office of the Registrar" },
  reportingofficer: { name: "Mr. Test Reporting Officer", password: "ro1", role: "reporting_officer", school: "", department: "Administration" },
  staff: { name: "Ms. Test Staff", password: "staff1", role: "non_teaching_staff", school: "", department: "Administration" },
};

export const FACULTY_LIST = [
  {
    id: 1, name: "Dr. Priya Sharma", employeeId: "EMP-2025-001",
    designation: "Assistant Professor", department: MOCK_DEPARTMENTS[0], school: engineeringHodSchool(),
    submittedOn: "2025-04-18", status: "Pending Review", avatar: "PS", avatarColor: "#6366f1",
    info: { name: "Dr. Priya Sharma", qual: "Ph.D", desig: "Assistant Professor", ay: "2026-2027" },
    lectures: [{ sem: "Sem I", code: "CS101", planned: "40", conducted: "40", score: "20", hod: "" }],
    courseFile: { score: "15" }, docs: {}
  },
  {
    id: 2, name: "Prof. Amit Verma", employeeId: "EMP-2025-002",
    designation: "Assistant Professor", department: "", school: nonEngineeringSchool(),
    submittedOn: "2025-04-19", status: "Pending Review", avatar: "AV", avatarColor: "#10b981",
    info: { name: "Prof. Amit Verma", qual: "MBA", desig: "Assistant Professor", ay: "2026-2027" },
    lectures: [{ sem: "Sem I", code: "MGMT101", planned: "36", conducted: "35", score: "18", hod: "" }],
    courseFile: { score: "14" }, docs: {}
  },
  {
    id: 3, name: "Dr. Sunil Gupta", employeeId: "EMP-2025-003",
    designation: "Associate Professor", department: MOCK_DEPARTMENTS[1], school: engineeringHodSchool(),
    submittedOn: "2025-04-20", status: "Pending Review", avatar: "SG", avatarColor: "#f59e0b",
    info: { name: "Dr. Sunil Gupta", qual: "Ph.D", desig: "Associate Professor", ay: "2026-2027" },
    lectures: [], courseFile: {}, docs: {}
  }
];

export const HOD_LIST = [
  {
    id: 10, name: "Prof. Rajesh Kulkarni", employeeId: "EMP-2025-010",
    designation: "Professor & Head", department: MOCK_DEPARTMENTS[0], school: engineeringHodSchool(),
    submittedOn: "2025-04-20", status: "Pending Review", avatar: "RK", avatarColor: "#f59e0b",
    info: { name: "Prof. Rajesh Kulkarni", qual: "Ph.D", desig: "Professor", ay: "2026-2027" },
    lectures: [], courseFile: {}, docs: {}
  }
];

export const DIRECTOR_LIST = [
  {
    id: 30, name: "Dr. Mehta", employeeId: "EMP-2025-030",
    designation: "Director", department: "", school: engineeringDirectorSchool(),
    submittedOn: "2025-04-21", status: "Pending Review", avatar: "DM", avatarColor: "#3b82f6",
    info: { name: "Dr. Mehta", qual: "Ph.D", desig: "Director", ay: "2026-2027" },
    lectures: [], courseFile: {}, docs: {}
  }
];

export const DEAN_LIST = [
  {
    id: 20, name: "Prof. Suresh Patil", employeeId: "EMP-2025-020",
    designation: "Dean", department: "Engineering", school: engineeringDirectorSchool(),
    submittedOn: "2025-04-22", status: "Pending Review", avatar: "SP", avatarColor: "#8b5cf6",
    info: { name: "Prof. Suresh Patil", qual: "Ph.D", desig: "Dean", ay: "2026-2027" },
    lectures: [], courseFile: {}, docs: {}
  }
];

export const HOD_LIST_DEAN = HOD_LIST;
export const FACULTY_LIST_DEAN = FACULTY_LIST;
export const DIRECTOR_LIST_VC = DIRECTOR_LIST;
export const HOD_LIST_VC = HOD_LIST;
export const FACULTY_LIST_VC = FACULTY_LIST;


export const DIRECTOR_SELF_DATA = {
  info: { name: "Dr. Mehta", qual: "Ph.D", desig: "Director", ay: "2026-2027" },
  lectures: [],
  courseFile: {},
  innovScore: "",
  projects: [],
  quals: [],
  feedback: [],
  deptActs: [],
  uniActs: [],
  society: [],
  industry: [],
  acr: [],
  journals: [],
  books: [],
  ict: [],
  research: [],
  patents: [],
  awards: [],
  confs: [],
  proposals: [],
  fdps: [],
  training: [],
  docs: {},
};

export const DEAN_SELF_DATA = {
  info: { name: "Prof. Suresh Patil", qual: "Ph.D", desig: "Dean", ay: "2026-2027" },
  lectures: [],
  courseFile: {},
  innovScore: "",
  projects: [],
  quals: [],
  feedback: [],
  deptActs: [],
  uniActs: [],
  society: [],
  industry: [],
  acr: [],
  journals: [],
  books: [],
  ict: [],
  research: [],
  patents: [],
  awards: [],
  confs: [],
  proposals: [],
  fdps: [],
  training: [],
  docs: {},
};

