import React from "react";
import { SectionInfoButton } from "../../../components";
import { stripMaxMarksFromTitle } from "../../../utils";

function detectIconType(title = "") {
  const t = String(title).toLowerCase();
  if (t.includes("course file") || t.includes("document")) return "folder";
  if (t.includes("innovative")) return "lightbulb";
  if (t.includes("feedback")) return "chart";
  if (t.includes("obe") || t.includes("outcomes")) return "obe";
  if (t.includes("mentoring") || t.includes("guidance")) return "mentoring";
  if (t.includes("journal")) return "journal";
  if (t.includes("book")) return "book";
  if (t.includes("patent") || t.includes("copyright")) return "patent";
  if (t.includes("admin") || t.includes("department") || t.includes("university")) return "building";
  return "teaching";
}

function SubsectionIcon({ type }) {
  const size = 16;
  const strokeWidth = 2.2;
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (type) {
    case "folder":
      return (
        <svg {...props}>
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg {...props}>
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "obe":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "mentoring":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
    case "journal":
    case "book":
      return (
        <svg {...props}>
          <path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5Z" />
          <path d="M8 7h6" />
          <path d="M8 11h8" />
        </svg>
      );
    case "patent":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    case "building":
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      );
    case "teaching":
    default:
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
  }
}

export default function SectionShell({ title, children }) {
  const displayTitle = stripMaxMarksFromTitle(title);
  const iconType = detectIconType(title);

  // Flatten children to place tables inside card box and buttons outside
  const childArray = [];
  const flatten = (nodes) => {
    React.Children.forEach(nodes, (node) => {
      if (!node) return;
      if (node.type === React.Fragment && node.props && node.props.children) {
        flatten(node.props.children);
      } else {
        childArray.push(node);
      }
    });
  };
  flatten(children);

  const tableNodes = childArray.filter(
    (node) => node.type === "div" || node.type === "table" || (node.props && (node.props.className?.includes("table") || node.props.style?.overflowX))
  );
  const otherNodes = childArray.filter(
    (node) => !tableNodes.includes(node)
  );

  return (
    <div className="appraisal-subsection-block" style={{ marginBottom: 22, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Subsection Title */}
      <div className="appraisal-subsection-title" style={{ display: "flex", alignItems: "center", gap: 8, color: "#4f46e5", fontWeight: 800, fontSize: 15 }}>
        <span className="appraisal-subsection-icon" style={{ width: 28, height: 28, borderRadius: 8, background: "#eef2ff", color: "#4f46e5", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #e0e7ff" }}>
          <SubsectionIcon type={iconType} />
        </span>
        <span>{displayTitle}</span>
        <SectionInfoButton titleText={title} />
      </div>

      {/* Rounded Table Card Box Container */}
      <div className="appraisal-table-box" style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        {tableNodes.length > 0 ? tableNodes : childArray}
      </div>

      {/* Action Buttons below table box */}
      {tableNodes.length > 0 && otherNodes.length > 0 && (
        <div style={{ marginTop: 2 }}>
          {otherNodes}
        </div>
      )}
    </div>
  );
}
