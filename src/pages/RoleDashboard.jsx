import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { normalizeRole } from "../auth/session";
import { departmentHasHod, getDeanTrack } from "../utils/hierarchy";
import { DEAN_TRACKS, getSchoolKey, isCisrSchool } from "../constants/universityHierarchy";
import { FORM_TYPES, formTypeForSchool } from "../constants/formRouting";

// Each dashboard is its own async chunk - only the one matching the user's role
// is ever downloaded, cutting the initial JS payload by ~90% vs eager imports.
const Dashboard                 = lazy(() => import("./Dashboard"));
const DesignArtsDashboard       = lazy(() => import("./DesignArtsDashboard"));
const MediaCommDashboard        = lazy(() => import("./MediaCommDashboard"));
const HODDashboard              = lazy(() => import("./HODDashboard"));
const CISRFacultyDashboard      = lazy(() => import("./CISRFacultyDashboard"));
const CISRCenterHeadDashboard   = lazy(() => import("./CISRCenterHeadDashboard"));
const NonTeachingStaffDashboard = lazy(() => import("./NonTeachingStaffDashboard"));
const ReportingOfficerDashboard = lazy(() => import("./ReportingOfficerDashboard"));
const RegistrarDashboard        = lazy(() => import("./RegistrarDashboard"));
const DeanDashboard             = lazy(() => import("./DeanDashboard"));
const NonEngineeringDeanDashboard = lazy(() => import("./NonEngineeringDeanDashboard"));
const DirectorDashboard         = lazy(() => import("./DirectorDashboard"));
const VCDashboard               = lazy(() => import("./VCDashboard"));

function DashboardLoader() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", color: "#64748b", fontSize: 14 }} className="fa-fade-in">
      Loading dashboard...
    </div>
  );
}

// Inner component: pure routing switch, all branches are lazy dashboard chunks.
function DashboardSwitch({ role, school, department, formType }) {
  switch (role) {
    case "faculty":
      if (isCisrSchool(school)) return <CISRFacultyDashboard />;
      if (formType === FORM_TYPES.MEDIA_COMM) return <MediaCommDashboard />;
      if (formType === FORM_TYPES.DESIGN_ARTS) return <DesignArtsDashboard />;
      return <Dashboard />;

    case "center_head":
      return <CISRCenterHeadDashboard />;

    case "hod": {
      const hasHod = departmentHasHod(school, department);
      if (!hasHod) return <DirectorDashboard />;
      return <HODDashboard />;
    }

    case "director":
      return <DirectorDashboard />;

    case "dean": {
      if (formType === FORM_TYPES.MEDIA_COMM) return <MediaCommDashboard fixedRole="dean" />;
      if (formType === FORM_TYPES.DESIGN_ARTS) return <DesignArtsDashboard fixedRole="dean" />;
      const deanTrack = getDeanTrack({ school, department, designation: sessionStorage.getItem("designation") || "" });
      if (deanTrack === DEAN_TRACKS.NON_ENGINEERING) return <NonEngineeringDeanDashboard />;
      return <DeanDashboard />;
    }

    case "vc":
      return <VCDashboard />;

    case "registrar":
      return <RegistrarDashboard />;

    case "reporting_officer":
      return <ReportingOfficerDashboard />;

    case "non_teaching_staff":
      return <NonTeachingStaffDashboard />;

    default:
      return <Navigate to="/login" />;
  }
}

export default function RoleDashboard() {
  const role       = normalizeRole(sessionStorage.getItem("role"), "");
  const school     = sessionStorage.getItem("school") || "";
  const department = sessionStorage.getItem("department") || "";
  const formType   = formTypeForSchool(getSchoolKey(school));

  sessionStorage.setItem("role", role);

  return (
    <Suspense fallback={<DashboardLoader />}>
      <DashboardSwitch role={role} school={school} department={department} formType={formType} />
    </Suspense>
  );
}
