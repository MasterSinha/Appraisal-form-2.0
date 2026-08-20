import { PRINT_REPORT_CSS, displayValue, safeHtml, fetchImageAsDataUrl } from "../../../utils/fullFormReport";
import { previousYearCellValue, previousYearRemarks, previousYearScore } from "../normalizers/commonPreviousYearNormalizer";

const score = (value) => (parseFloat(value) || 0).toFixed(1);

const roleLabels = {
  faculty: "Faculty Score",
  hod: "HOD / Center Head Score",
  center_head: "HOD / Center Head Score",
  director: "Director Score",
  dean: "Dean Score",
  vc: "VC Score",
};

const reviewerLabels = {
  hod: "HOD",
  center_head: "Center Head",
  director: "Director",
  dean: "Dean",
  vc: "VC",
};

const hasScore = (value) => String(value ?? "").trim() !== "" && (parseFloat(value) || 0) > 0;
const firstFilled = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || "";

const reportLevels = (report = {}) =>
  (report.reviewLevels || ["faculty", "hod", "director", "dean"])
    .filter((level) => level === "faculty" || hasScore(report.totals?.[level]?.partA) || hasScore(report.totals?.[level]?.partB) || hasScore(report.totals?.[level]?.grand));

const reviewRemarks = (review = {}) =>
  firstFilled(review.remarks, review.remark, review.comments, review.comment, review.review_remarks, review.reviewRemarks, review.reviewer_remarks, review.reviewerRemarks, review.reason, review.rejection_reason, review.rejectionReason);

const reviewRole = (review = {}) =>
  firstFilled(review.reviewer_role, review.reviewerRole, review.role, review.authority_role, review.authorityRole);

const reviewName = (review = {}) =>
  firstFilled(review.reviewer_name, review.reviewerName, review.name, review.authority_name, review.authorityName);

const reviewDate = (review = {}) =>
  firstFilled(review.reviewed_at, review.reviewedAt, review.updated_at, review.updatedAt, review.created_at, review.createdAt);

// Some previous-year records carry a review with no total_score/part_*_score fields at all -
// only a section_scores map of per-section score arrays (e.g. { lectures: [40, 35] }). Summing
// every number in that map recovers the reviewer's actual total when nothing else is present.
const sectionScoresTotal = (review = {}) => {
  const raw = review.section_scores ?? review.sectionScores;
  const sectionScores = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  if (!sectionScores || typeof sectionScores !== "object") return "";
  let sum = 0;
  let found = false;
  Object.values(sectionScores).forEach((value) => {
    const values = Array.isArray(value) ? value : [value];
    values.forEach((entry) => {
      const num = parseFloat(entry);
      if (Number.isFinite(num)) {
        sum += num;
        found = true;
      }
    });
  });
  return found ? sum : "";
};

const reviewScore = (review = {}) => {
  const nestedTotals = (() => {
    if (review.totals && typeof review.totals === "object") return review.totals;
    if (typeof review.totals === "string") {
      try { return JSON.parse(review.totals) || {}; } catch { return {}; }
    }
    return {};
  })();
  const direct = firstFilled(
    review.total_score, review.totalScore, review.total, review.grand_total, review.grandTotal,
    nestedTotals.total, nestedTotals.total_score, nestedTotals.grand_total, nestedTotals.grandTotal,
  );
  const partKeys = ["part_a_score", "partAScore", "part_b_score", "partBScore", "part_c_score", "partCScore", "part_d_score", "partDScore"];
  const partsPresent = partKeys.some((key) => review[key] !== undefined && review[key] !== null && String(review[key]).trim() !== "");
  const partsSum = partsPresent ? partKeys.reduce((sum, key) => sum + (parseFloat(review[key]) || 0), 0) : "";
  const sectionSum = sectionScoresTotal(review);
  // total_score is a NOT-NULL backend column defaulting to 0, so "present" alone doesn't mean
  // "actually recorded" - some historical reviews only ever had their per-section scores sent at
  // submission time, leaving total_score genuinely at its 0 default forever. Prefer whichever
  // candidate is actually positive; only fall back to a literal 0/blank when every source (direct
  // total, summed parts, summed section_scores) agrees there's really nothing recorded.
  const positive = [direct, partsSum, sectionSum].find((value) => value !== "" && (parseFloat(value) || 0) > 0);
  if (positive !== undefined) return positive;
  return direct !== "" ? direct : (partsSum !== "" ? partsSum : sectionSum);
};

const renderAuthorityRemarks = (reviews = []) => {
  const rows = (Array.isArray(reviews) ? reviews : [])
    .map((review) => ({
      role: reviewRole(review),
      name: reviewName(review),
      date: reviewDate(review),
      score: reviewScore(review),
      remarks: reviewRemarks(review),
    }))
    .filter((review) => String(review.remarks || "").trim() || hasScore(review.score));

  if (!rows.length) return "";

  return `
  <h3 style="background:#d9d9d9;padding:4px;text-align:center;font-size:13px">HIGHER AUTHORITY REMARKS</h3>
  <table>
    <thead>
      <tr>
        <th style="width:14%">Authority</th>
        <th style="width:16%">Reviewer</th>
        <th style="width:12%">Date</th>
        <th style="width:10%">Score</th>
        <th style="width:48%">Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((review) => {
        const role = String(review.role || "").trim();
        const date = review.date ? new Date(review.date) : null;
        const displayDate = date && Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-IN") : review.date;
        return `
        <tr>
          <td>${safeHtml(reviewerLabels[role] || role || "Authority")}</td>
          <td>${displayValue(review.name)}</td>
          <td class="c">${displayValue(displayDate)}</td>
          <td class="c">${hasScore(review.score) ? score(review.score) : "-"}</td>
          <td><div class="remarks">${safeHtml(review.remarks)}</div></td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>`;
};

const renderSection = (section = {}, levels = ["faculty"]) => {
  const rows = section.rows?.length ? section.rows : [];
  const columns = section.fields || [];
  const showRemarks = rows.some((row) => String(previousYearRemarks(row)).trim() !== "");
  const scoreColumns = levels.filter((level) => level === "faculty" || rows.some((row) => String(previousYearScore(row, level)).trim() !== ""));
  const colSpan = columns.length + scoreColumns.length + (showRemarks ? 2 : 1);
  const descriptionWeight = Math.max(1, columns.length);

  return `
  <h3>${safeHtml(section.label)} <span>(Max ${safeHtml(section.max)})</span></h3>
  <table>
    <colgroup>
      <col class="sn-col" />
      ${columns.map(() => `<col style="width:${Math.max(14, Math.floor(100 / (descriptionWeight + scoreColumns.length + (showRemarks ? 1 : 0))))}%" />`).join("")}
      ${scoreColumns.map(() => `<col class="score-col" />`).join("")}
      ${showRemarks ? `<col class="remarks-col" />` : ""}
    </colgroup>
    <thead>
      <tr>
        <th class="sn-cell">SN</th>
        ${columns.map(([label]) => `<th>${safeHtml(label)}</th>`).join("")}
        ${scoreColumns.map((level) => `<th class="score-cell">${safeHtml(roleLabels[level] || `${level} Score`)}</th>`).join("")}
        ${showRemarks ? "<th>Remarks</th>" : ""}
      </tr>
    </thead>
    <tbody>
      ${rows.length ? rows.map((row, index) => `
        <tr>
          <td class="c sn-cell">${index + 1}</td>
          ${columns.map(([, ...aliases]) => `<td>${displayValue(previousYearCellValue(row, aliases))}</td>`).join("")}
          ${scoreColumns.map((level) => `<td class="c score-cell">${displayValue(previousYearScore(row, level))}</td>`).join("")}
          ${showRemarks ? `<td>${displayValue(previousYearRemarks(row))}</td>` : ""}
        </tr>
      `).join("") : `<tr><td colspan="${colSpan}" class="c b">No records found for this section.</td></tr>`}
      <tr class="tr">
        <td colspan="${columns.length + 1}" class="c b">Total Score (Max ${safeHtml(section.max)})</td>
        ${scoreColumns.map((level) => `<td class="c b score-cell">${score(section.totals?.[level])}</td>`).join("")}
        ${showRemarks ? "<td>&nbsp;</td>" : ""}
      </tr>
    </tbody>
  </table>`;
};

const renderSummary = (report = {}, levels = ["faculty"]) => `
  <h3 style="text-align:center;font-size:13px">SUMMARY OF SCORES - AY ${displayValue(report.academicYear)}</h3>
  <table class="st">
    <thead>
      <tr>
        <th>Reviewer</th>
        <th>Part A</th>
        <th>Part B</th>
        <th>Grand Total</th>
      </tr>
    </thead>
    <tbody>
      ${levels.map((level) => {
        const totals = report.totals?.[level] || {};
        const partAMax = totals.partAMax || report.partA?.max || 0;
        const partBMax = totals.partBMax || report.partB?.max || 0;
        // Grand max is always the sum of the two part maxes above - a separately-stored
        // grand/max field has been observed stale/inconsistent with the record's actual part
        // maxes, so it's never trusted here even as a fallback.
        const grandMax = partAMax + partBMax;
        return `
        <tr>
          <td>${safeHtml(roleLabels[level]?.replace(" Score", "") || level)}</td>
          <td class="c">${score(totals.partA)} / ${safeHtml(partAMax)}</td>
          <td class="c">${score(totals.partB)} / ${safeHtml(partBMax)}</td>
          <td class="c">${score(totals.grand)} / ${safeHtml(grandMax)}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
`;

const PREVIOUS_YEAR_REPORT_CSS = `
  html,body{overflow-x:hidden}
  .pyr-page{width:calc(100% - 16px);max-width:190mm;margin:0 auto}
  .pyr-page table{width:100%!important;max-width:100%!important;border:1.15px solid #6b7280!important;border-right:1.15px solid #6b7280!important}
  .pyr-page th:last-child,.pyr-page td:last-child{border-right:1px solid #aeb6c2!important}
  .pyr-page .ht{width:100%!important;border-right:none!important}
  .pyr-page h1{font-size:13px}
  .pyr-page .sn-col{width:8mm}
  .pyr-page .score-col{width:13mm}
  .pyr-page .remarks-col{width:34mm}
  .pyr-page .sn-cell{width:8mm;white-space:nowrap}
  .pyr-page .score-cell{width:13mm;white-space:normal;font-size:9.4px;line-height:1.15;padding-left:3px;padding-right:3px}
  @media print{
    .pyr-page{width:100%;max-width:none;margin:0}
    .pyr-page table{width:100%!important}
  }
`;

export const openPreviousYearReport = async ({ report, title = "Previous Year Appraisal Report", reviews = [] } = {}) => {
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) {
    alert("Please allow popups to generate the report.");
    return;
  }

  const logoSrc = await fetchImageAsDataUrl("/image.png");
  const iqacLogoSrc = await fetchImageAsDataUrl("/IQAS.png");

  const info = report?.profile || {};
  const facultyName = firstFilled(info.name, info.faculty_name, info.facultyName, info.full_name, info.fullName, info.username, info.email);
  const designation = firstFilled(info.desig, info.designation, info.appraisalRole, info.appraisal_role);
  const school = firstFilled(info.school, info.department, info.schoolName, info.school_name);
  const levels = reportLevels(report);
  const html = `<!doctype html>
<html>
<head>
  <title>${safeHtml(title)}</title>
  <style>${PRINT_REPORT_CSS}${PREVIOUS_YEAR_REPORT_CSS}</style>
</head>
<body>
<main class="pyr-page">
  <table class="ht"><tr>
    <td style="width:20%;text-align:left"><img class="logo" src="${logoSrc}" alt="DYPIU"/></td>
    <td style="text-align:center">
      <h1>D Y PATIL INTERNATIONAL UNIVERSITY, AKURDI, PUNE</h1>
      <h2>${safeHtml(title)}</h2>
      <h2>Academic Year: ${displayValue(report?.academicYear)}</h2>
    </td>
    <td style="width:20%;text-align:right"><img class="logo" src="${iqacLogoSrc}" alt="IQAC"/></td>
  </tr></table>
  <table>
    <tr><td class="b" style="width:35%">Name of Faculty</td><td>${displayValue(facultyName)}</td></tr>
    <tr><td class="b">Present Designation</td><td>${displayValue(designation)}</td></tr>
    <tr><td class="b">School / Department</td><td>${displayValue(school)}</td></tr>
    <tr><td class="b">Academic Year</td><td>${displayValue(report?.academicYear)}</td></tr>
    <tr><td class="b">Generated On</td><td>${safeHtml(new Date().toLocaleString())}</td></tr>
  </table>

  <h3 style="background:#d9d9d9;padding:4px;text-align:center;font-size:13px">PART A - Teaching &amp; Academic Activities</h3>
  ${(report?.partA?.sections || []).map((section) => renderSection(section, levels)).join("")}

  <div class="page-break"></div>
  <h3 style="background:#d9d9d9;padding:4px;text-align:center;font-size:13px">PART B - Research &amp; Academic Contributions</h3>
  ${(report?.partB?.sections || []).map((section) => renderSection(section, levels)).join("")}

  <div class="page-break"></div>
  ${renderSummary(report, levels)}
  ${renderAuthorityRemarks(reviews)}
</main>
  <script>
    window.addEventListener('load', function(){
      setTimeout(function(){ window.focus(); window.print(); }, 120);
    });
  </script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
};
