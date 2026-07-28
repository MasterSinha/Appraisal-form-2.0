# Faculty Appraisal 2.0: API Integration Reference Guide

This guide describes how to integrate the React frontend (`Appraisal-form-2.0`) with the updated FastAPI backend (`Faculty_appraisal`), specifically focusing on new 2.0 endpoints, dynamic score reports, and the extended Part C & Part D fields.

---

## 1. Dynamic Academic Cycles
Rather than hardcoding academic cycle options in dashboards (e.g. `DesignArtsDashboard.jsx`, `MediaCommDashboard.jsx`), fetch available cycles dynamically from the backend.

### 🌐 API Endpoint
* **Method:** `GET`
* **Path:** `/api/v1/academic-years/available`
* **Response Type:** `List[str]` (sorted in descending order)
* **Sample Output:** `["2026-2027", "2025-2026"]`

### 💻 Frontend Implementation Snippet
```javascript
import { api } from "../services/api";

const loadAvailableCycles = async () => {
  try {
    const cycles = await api.get("/academic-years/available");
    setAvailableCycles(cycles); // e.g. ["2026-2027", "2025-2026"]
  } catch (err) {
    console.error("Failed to load cycles, using default fallback:", err);
    setAvailableCycles(["2026-2027"]);
  }
};
```

---

## 2. Dynamic Total Score Report Max Marks
The backend now computes the **effective maximum marks** dynamically based on section applicability rules (e.g., subtracting max marks if a section is marked as `notApplicable`, and handle self-appraisal excluding ACR vs reviewer levels including it).

### 📊 Updated Payload in `/dashboard/subordinates`
For every subordinate record, the backend now includes:
* **Self-Appraisal Maxes:** `faculty_part_a_max`, `faculty_part_b_max`, `faculty_total_max`
* **Reviewer-specific Maxes:** `{role}_part_a_max`, `{role}_part_b_max`, `{role}_total_max` (where `{role}` can be `hod`, `center_head`, `director`, `dean`, or `vc`).

### 💻 Implementation in `ExportReportPage.jsx`
Instead of using client-side hardcoded denominators for percentage calculations, read the max marks directly:

```javascript
// Calculate percentage dynamically for HOD score
const hodTotal = parseFloat(subordinate.hod_total) || 0;
const hodMax = parseFloat(subordinate.hod_total_max) || 0;
const hodPercentage = hodMax > 0 ? ((hodTotal / hodMax) * 100).toFixed(1) + "%" : "N/A";

// Calculate percentage dynamically for Faculty Self score
const selfTotal = parseFloat(subordinate.grand_total) || 0;
const selfMax = parseFloat(subordinate.faculty_total_max) || 0;
const selfPercentage = selfMax > 0 ? ((selfTotal / selfMax) * 100).toFixed(1) + "%" : "N/A";
```

Ensure all average and best score calculators in the reporting view use these dynamic denominators so calculations are mathematically correct across different schools and applicability configurations.

---

## 3. Storing and Mapping Part C & Part D Scores
We have created database columns, ORM models, and API validation schemas to store Part C and Part D totals.

### 🗄️ Database Fields Now Available
* **Declarations (Self):** `part_c_total`, `part_d_total`
* **Appraisal Reviews (Reviewers):** `part_c_score`, `part_d_score`
* **Dashboard Response:** `part_c_total`, `part_d_total`, `{role}_part_c`, `{role}_part_d`

### 💻 Frontend Changes Needed
When a reviewer submits a review, update the submit handler in `reviewWorkflow.js` (or dashboard modules) to include the Part C and Part D scores in the `basePayload` payload:

#### 1. In `src/services/reviewWorkflow.js` (Update `submitReview`):
```diff
  const basePayload = {
    academic_year: academicYear,
    remarks,
    part_a_score: n(partAScore),
    part_b_score: n(partBScore),
+   part_c_score: n(partCScore),
+   part_d_score: n(partDScore),
    total_score: n(totalScore),
    section_scores: sectionScores || {},
  };
```

#### 2. In Dashboards (e.g. `DirectorDashboard.jsx`, `HODDashboard.jsx`):
Pass the Part C and Part D scores to `submitWorkflowReview` alongside other parts:
```javascript
await submitWorkflowReview({
  subjectEmail: item.email,
  academicYear: item.academic_year || "2026-2027",
  reviewerRole: "director",
  partAScore: scores.partA,
  partBScore: scores.partB,
  partCScore: scores.partC, // <--- Add this parameter
  partDScore: scores.partD, // <--- Add this parameter
  totalScore: scores.total,
  remarks,
  sectionScores,
  subjectProfile: item,
  decision,
});
```

---

## 4. Direct-to-Registrar Workflow (Non-Teaching Staff)
For non-teaching staff who report directly to the registrar (`reports_to_registrar = true`), the backend automatically bypasses HOD and Reporting Officer reviews:
* Submission status defaults to `"Pending Registrar Review"`.
* Review routing is handled automatically in the backend database workflows; the frontend simply needs to submit the form normally.
