import { api } from "./api";
import { APP_INFO } from "../constants/formConfig";
import { getActiveAcademicYear, getSessionItem, setActiveAcademicYear } from "../auth/session";

export const normalizeAcademicYearCycles = (cyclesData) => {
  const normalizeAcademicYearLabel = (value) => {
    const label = String(value || "").trim();
    const shortMatch = label.match(/^(\d{2})-(\d{2})$/);
    if (shortMatch) return `20${shortMatch[1]}-20${shortMatch[2]}`;
    return label;
  };

  const normalizeCycle = (cycle) => {
    if (!cycle) return null;
    if (typeof cycle === "string") {
      return { academic_year: cycle, is_open: cycle === APP_INFO.DEFAULT_AY };
    }

    const academicYear = normalizeAcademicYearLabel(cycle.academic_year || cycle.academicYear || cycle.year || cycle.year_label || "");
    if (!academicYear) return null;

    return {
      academic_year: academicYear,
      is_open: cycle.is_open ?? cycle.isOpen ?? cycle.active ?? cycle.open ?? (String(academicYear) === APP_INFO.DEFAULT_AY),
    };
  };

  let list = [];
  if (Array.isArray(cyclesData)) {
    list = cyclesData.map(normalizeCycle).filter(Boolean);
  } else if (Array.isArray(cyclesData?.cycles)) {
    list = cyclesData.cycles.map(normalizeCycle).filter(Boolean);
  } else if (Array.isArray(cyclesData?.data)) {
    list = cyclesData.data.map(normalizeCycle).filter(Boolean);
  }

  // If backend provided no cycles (e.g. offline / fallback), keep only the active default year.
  if (list.length === 0) {
    const openYear = APP_INFO.DEFAULT_AY || "2026-2027";
    list.push({ academic_year: openYear, is_open: true });
  }

  return list
    .reduce((acc, cycle) => {
      if (!acc.some((existing) => existing.academic_year === cycle.academic_year)) {
        acc.push(cycle);
      }
      return acc;
    }, [])
    .sort((a, b) => b.academic_year.localeCompare(a.academic_year));
};

// Fetches every academic year cycle (current + previous) and caches it in session/local storage
// so every dashboard's academic-year dropdown can read it synchronously on first render, instead
// of only showing the current year until a later event/refresh happens to populate it. Called
// right after login (before the dashboard mounts) and again on full page loads via App.jsx, so a
// fresh client-side login never has to wait for a manual refresh to see previous years.
export const refreshAcademicYearCycles = async () => {
  const token = getSessionItem("accessToken") || getSessionItem("token");
  if (!token) return null;

  try {
    const cyclesData = await api.get("/appraisal/cycles");
    const cycles = normalizeAcademicYearCycles(cyclesData);
    if (!cycles.length) return null;

    const storedAcademicYear = getActiveAcademicYear();
    const matchingCycle = cycles.find((cycle) => cycle.academic_year === storedAcademicYear);
    const openCycle = cycles.find((cycle) => cycle.is_open);
    const defaultYearCycle = cycles.find((cycle) => cycle.academic_year === APP_INFO.DEFAULT_AY);
    const fallbackCycle = openCycle || defaultYearCycle || matchingCycle || cycles[0];
    const ay = fallbackCycle?.academic_year || APP_INFO.DEFAULT_AY;

    sessionStorage.setItem("availableCycles", JSON.stringify(cycles));
    localStorage.setItem("availableCycles", JSON.stringify(cycles));
    sessionStorage.setItem("availableCyclesSource", "backend");
    localStorage.setItem("availableCyclesSource", "backend");
    setActiveAcademicYear(ay);
    window.dispatchEvent(new CustomEvent("academicYearChanged", { detail: { academicYear: ay } }));

    return { ay, cycles };
  } catch (error) {
    console.error("Could not refresh academic year cycles:", error);
    return null;
  }
};
