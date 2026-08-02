import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "./dashboardPrimitives";

const sidebarShellStyle = {
  width: 260,
  height: "100vh",
  minHeight: "100vh",
  boxSizing: "border-box",
  overflow: "hidden",
  background: "linear-gradient(180deg,#111827 0%,#111827 54%,#0f172a 100%)",
  display: "flex",
  flexDirection: "column",
  padding: "18px 11px",
  gap: 11,
  position: "sticky",
  top: 0,
  alignSelf: "flex-start",
  flexShrink: 0,
  borderRight: "1px solid rgba(148,163,184,0.14)",
  boxShadow: "10px 0 28px rgba(15,23,42,0.20)",
};

const iconStroke = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

function Icon({ name, active = false, size = 18 }) {
  const common = {
    ...iconStroke,
    width: size,
    height: size,
    style: { color: active ? "#f8fafc" : "#cbd5e1" },
  };

  if (name === "self") {
    return (
      <svg {...common}>
        <path d="M8 4h6l4 4v12H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M14 4v4h4" />
        <path d="M9.5 13.5h5" />
        <path d="M9.5 17h3.5" />
      </svg>
    );
  }

  if (name === "faculty") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M19 8v5" />
        <path d="M21.5 10.5h-5" />
      </svg>
    );
  }

  if (name === "hod") {
    return (
      <svg {...common}>
        <path d="M4 21V9l8-5 8 5v12" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg {...common}>
        <path d="M9 11 11 13 15 9" />
        <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v4h4" />
      </svg>
    );
  }

  if (name === "guidelines") {
    return (
      <svg {...common}>
        <path d="M4 19.5V5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-1.5Z" />
        <path d="M13 3h5a2 2 0 0 1 2 2v14.5A2 2 0 0 0 18 18h-5V3Z" />
      </svg>
    );
  }

  if (name === "layers") {
    return (
      <svg {...common}>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </svg>
    );
  }

  if (name === "profile") {
    return (
      <svg {...common}>
        <path d="M19 21a7 7 0 0 0-14 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    );
  }

  if (name === "mail") {
    return (
      <svg {...common}>
        <path d="M4 4h16v16H4z" />
        <path d="m22 6-10 7L2 6" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...common} style={{ color: "#f87171" }}>
        <path d="M10 17 15 12 10 7" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M7 3h7l3 3v15H7V3Z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function getNavIconName(tab) {
  const id = String(tab?.id || "").toLowerCase();
  const label = String(tab?.label || "").toLowerCase();

  if (id.includes("guideline")) return "guidelines";
  if (id.includes("my") || label.includes("my appraisal")) return "self";
  if (id.includes("hod") || label.includes("hod")) return "hod";
  if (id.includes("faculty") || label.includes("faculty")) return "faculty";
  if (id.includes("approval") || id.includes("review") || label.includes("appraisal")) return "review";
  return "self";
}

function SidebarIcon({ id, active, label }) {
  return <Icon name={getNavIconName({ id, label })} active={active} />;
}

function SectionIcon({ section }) {
  const labels = {
    partA: "A",
    partB: "B",
    partC: "C",
    partD: "D",
    summary: "S",
  };

  return (
    <span style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(99,102,241,0.13)", border: "1px solid rgba(129,140,248,0.16)", color: "#c7d2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 900 }}>
      {labels[section] || "A"}
    </span>
  );
}

const isLegacyTwoPartAcademicYear = (academicYear = "") =>
  String(academicYear).replace(/\s+/g, "") === "2025-2026" ||
  String(academicYear).replace(/\s+/g, "") === "2025-26";

export default function DashboardSidebar({
  appInfo,
  navItems,
  activeTab,
  onTabSelect,
  showSectionSelector = false,
  sectionTab = "partA",
  onSectionChange,
  isSectionOpen = () => true,
  afterNavItem,
  afterNav,
  profileSubtitle,
  onLogout,
  showLogoutSpacer = false,
}) {
  const navigate = useNavigate();
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState(() => sessionStorage.getItem("academicYear") || "");
  const isLegacyTwoPartYear = isLegacyTwoPartAcademicYear(currentAcademicYear);
  const sectionOptions = isLegacyTwoPartYear
    ? [
        ["partA", "Part A"],
        ["partB", "Part B"],
      ]
    : [
        ["partA", "Part A"],
        ["partB", "Part B"],
        ["partC", "Part C"],
        ["partD", "Part D"],
        ["summary", "Summary"],
      ];
  const selectedSectionLabel = sectionOptions.find(([value]) => value === sectionTab)?.[1] || "Part A";

  useEffect(() => {
    const syncAcademicYear = (event) => {
      setCurrentAcademicYear(event?.detail?.academicYear || sessionStorage.getItem("academicYear") || "");
    };
    window.addEventListener("academicYearChanged", syncAcademicYear);
    window.addEventListener("storage", syncAcademicYear);
    return () => {
      window.removeEventListener("academicYearChanged", syncAcademicYear);
      window.removeEventListener("storage", syncAcademicYear);
    };
  }, []);

  return (
    <aside className="appraisal-sidebar" style={sidebarShellStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 1px 3px" }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg,#475569 0%,#334155 100%)", border: "1px solid rgba(226,232,240,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f8fafc", fontWeight: 950, fontSize: 13, boxShadow: "0 10px 20px rgba(15,23,42,0.22)", letterSpacing: 0 }}>FA</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 13, lineHeight: 1.15, letterSpacing: 0 }}>{appInfo.PORTAL_NAME}</div>
          <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.3, marginTop: 3 }}>{appInfo.UNIVERSITY_NAME}</div>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(148,163,184,0.16)" }} />

      <nav style={{ display: "grid", gap: 7 }} aria-label="Dashboard sections">
        {navItems.filter((tab) => tab.id !== "guidelines").map((tab) => {
        const isActive = activeTab === tab.id;
        const button = (
          <button
            key={tab.id}
            onClick={() => {
              onTabSelect?.(tab.id);
            }}
            className={isActive ? "is-active" : ""}
            style={{
              position: "relative",
              background: isActive ? "rgba(99,102,241,0.18)" : "rgba(15,23,42,0.10)",
              border: isActive ? "1px solid rgba(165,180,252,0.24)" : "1px solid transparent",
              borderRadius: 15,
              padding: "10px 11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              fontFamily: "inherit",
              transition: "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
              boxShadow: isActive ? "inset 3px 0 0 #818cf8" : "none",
              overflow: "hidden",
            }}
          >
            {isActive && <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(99,102,241,0.12),transparent 55%)", pointerEvents: "none" }} />}
            <span style={{ position: "relative", width: 31, height: 31, borderRadius: 10, background: isActive ? "rgba(99,102,241,0.16)" : "rgba(148,163,184,0.10)", border: isActive ? "1px solid rgba(165,180,252,0.24)" : "1px solid rgba(148,163,184,0.10)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <SidebarIcon id={tab.id} label={tab.label} active={isActive} />
            </span>
            <div style={{ position: "relative", flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 12.5, lineHeight: 1.1, whiteSpace: "normal" }}>{tab.label}</div>
              <div style={{ color: isActive ? "#c7d2fe" : "#94a3b8", fontSize: 10.5, marginTop: 3, lineHeight: 1.3 }}>{tab.sub}</div>
            </div>
            {tab.badge > 0 && (
              <div style={{ position: "relative", background: isActive ? "rgba(226,232,240,0.16)" : "rgba(148,163,184,0.10)", color: isActive ? "#e2e8f0" : "#cbd5e1", border: "1px solid rgba(148,163,184,0.20)", fontWeight: 900, fontSize: 10, minWidth: 20, height: 20, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>{tab.badge}</div>
            )}
          </button>
        );

        if (afterNavItem?.id === tab.id) {
          return (
            <div key={tab.id} style={afterNavItem.wrapperStyle || { display: "grid", gap: 10 }}>
              {button}
              {afterNavItem.content}
            </div>
          );
        }

        return button;
        })}
      </nav>

      {afterNav}

      {showSectionSelector && (
        <div style={{ marginTop: 3, background: "rgba(15,23,42,0.18)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 14, padding: "11px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 9.5, color: "#94a3b8", fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
            <Icon name="layers" size={13} />
            My Appraisal Section
          </div>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setSectionMenuOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={sectionMenuOpen}
              style={{ width: "100%", height: 40, border: sectionMenuOpen ? "1px solid rgba(129,140,248,0.62)" : "1px solid rgba(148,163,184,0.16)", borderRadius: 12, padding: "0 11px 0 9px", color: "#f8fafc", background: "rgba(30,41,59,0.72)", fontFamily: "inherit", fontWeight: 850, cursor: "pointer", display: "flex", alignItems: "center", gap: 9, boxShadow: sectionMenuOpen ? "0 0 0 3px rgba(99,102,241,0.12)" : "none" }}
            >
              <SectionIcon section={sectionTab} />
              <span style={{ flex: 1, textAlign: "left", fontSize: 12.5 }}>{selectedSectionLabel}</span>
              <Icon name="chevron" size={15} />
            </button>
            {sectionMenuOpen && (
              <div
                role="listbox"
                style={{ position: "absolute", zIndex: 30, top: "calc(100% + 7px)", left: 0, right: 0, padding: 6, background: "#1f2937", border: "1px solid rgba(148,163,184,0.22)", borderRadius: 12, boxShadow: "0 18px 34px rgba(2,6,23,0.32)", display: "grid", gap: 3 }}
              >
                {sectionOptions.map(([value, label]) => {
                  const disabled = !isSectionOpen(value);
                  const selected = value === sectionTab;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        onSectionChange?.(value);
                        setSectionMenuOpen(false);
                      }}
                      style={{ minHeight: 34, border: "1px solid transparent", borderRadius: 9, background: selected ? "rgba(99,102,241,0.18)" : "transparent", color: disabled ? "#64748b" : selected ? "#e0e7ff" : "#e2e8f0", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: selected ? 900 : 750, display: "flex", alignItems: "center", gap: 8, padding: "0 9px", textAlign: "left" }}
                    >
                      <SectionIcon section={value} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />
      <div style={{ height: 1, background: "rgba(148,163,184,0.16)" }} />
      <button
        type="button"
        onClick={() => navigate("/edit-profile")}
        title="Edit profile"
        style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.055)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 16, padding: 10, width: "100%", cursor: "pointer", fontFamily: "inherit", textAlign: "left", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <Avatar
          initials={(sessionStorage.getItem("name") || "U").split(" ").map((name) => name[0]).join("").toUpperCase()}
          src={sessionStorage.getItem("profilePictureUrl") || sessionStorage.getItem("profile_picture_url") || sessionStorage.getItem("avatarUrl") || ""}
          color="#475569"
          size={42}
        />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f9fafb", fontSize: 12, fontWeight: 800 }}>{(sessionStorage.getItem("name") || "User").split(" ").slice(0, 2).join(" ")}</div>
          <div style={{ color: "#9ca3af", fontSize: 10.5, marginTop: 2 }}>{profileSubtitle}</div>
        </div>
        <span style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(148,163,184,0.10)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="profile" size={15} />
        </span>
      </button>
      <div style={{ margin: "4px 0", padding: "11px 12px", background: "rgba(30,41,59,0.62)", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(148,163,184,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="mail" size={16} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#f9fafb", fontWeight: 900, fontSize: 12, marginBottom: 4 }}>Need Help?</div>
          <a href="mailto:appraisal@dypiu.ac.in" style={{ color: "#c7d2fe", fontWeight: 800, fontSize: 11, wordBreak: "break-all", textDecoration: "none" }}>appraisal@dypiu.ac.in</a>
        </div>
      </div>
      <button
        onClick={onLogout}
        style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: showLogoutSpacer ? "flex-start" : "center", gap: 8, background: "rgba(127,29,29,0.02)", border: "1px solid rgba(248,113,113,0.42)", borderRadius: 14, padding: "10px 13px", cursor: "pointer", fontFamily: "inherit" }}
        onMouseEnter={(event) => { event.currentTarget.style.background = "rgba(127,29,29,0.18)"; }}
        onMouseLeave={(event) => { event.currentTarget.style.background = "rgba(127,29,29,0.02)"; }}
      >
        <Icon name="logout" size={17} />
        <span style={{ color: "#f87171", fontWeight: 900, fontSize: 12 }}>Logout</span>
      </button>
    </aside>
  );
}
