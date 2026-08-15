export const ENGINEERING_PREVIOUS_YEAR_PART_A_MAX = 200;
export const ENGINEERING_PREVIOUS_YEAR_PART_B_MAX = 375;
export const ENGINEERING_PREVIOUS_YEAR_GRAND_MAX = 575;

// Field aliases below include both the originally-guessed short names and the actual
// snake_case field names confirmed against real submitted 2025-2026 data (readFromAliases
// tries every alias in order, so listing both is a safe, additive fix - nothing is removed).
export const ENGINEERING_PREVIOUS_YEAR_PART_A_SECTIONS = [
  { key: "lectures", label: "A1. Lectures / Tutorials / Practicals", max: 50, doc: "lec", fields: [["Semester", "sem", "semester"], ["Course Code / Name", "code", "course_code"], ["Classes (as per course structure)", "planned", "planned_classes"], ["Classes Actually Conducted", "conducted", "conducted_classes"]] },
  { key: "courseFile", label: "A2. Course File", max: 20, doc: "courseFile", fields: [["Course", "course"], ["Program & Semester", "title"], ["Availability as per IQAC format", "details"]] },
  { key: "innovRows", label: "A3. Innovative Teaching-Learning", max: 10, doc: "innov", fields: [["Method", "method"], ["Details", "details"]] },
  { key: "projects", label: "A4. Projects", max: 10, doc: "proj", fields: [["Project Type", "label"], ["Details", "details"]] },
  { key: "quals", label: "A5. Qualification Enhancement", max: 10, doc: "qual", fields: [["Description", "label"]] },
  { key: "feedback", label: "B. Student Feedback", max: 10, doc: "feedback", fields: [["Course", "code", "course_code"], ["First Feedback(%)", "fb1", "feedback_1"], ["Second Feedback(%)", "fb2", "feedback_2"], ["Average", "average"]] },
  { key: "deptActs", label: "C. Departmental Activities", max: 20, doc: "dept", fields: [["Activity", "activity"], ["Nature", "nature"]] },
  { key: "uniActs", label: "D. University Activities", max: 30, doc: "uni", fields: [["Activity", "activity"], ["Nature", "nature"]] },
  { key: "society", label: "E. Contribution to Society", max: 10, doc: "soc", fields: [["Activity", "label", "activity"], ["Details", "details"]] },
  { key: "industry", label: "F. Industry Connect", max: 5, doc: "ind", fields: [["Industry Name", "name"], ["Details", "details"]] },
  { key: "acr", label: "G. Annual Confidential Report", max: 25, doc: "acr", fields: [["Parameter", "label"]] },
];

export const ENGINEERING_PREVIOUS_YEAR_PART_B_SECTIONS = [
  { key: "journals", label: "B1. Research Papers / Journal Publications", max: 120, doc: "jour", fields: [["Title", "title"], ["Journal", "journal"], ["ISSN", "issn"], ["Journal Indexing", "index", "indexing"]] },
  { key: "books", label: "B2. Books / Book Chapters", max: 50, doc: "book", fields: [["Title with Page Nos.", "title"], ["Book Title, Editor & Publisher", "book"], ["ISSN / ISBN No.", "issn"], ["Type of Publisher", "pub", "publisher"], ["Co-authors", "coauth", "coauthor"], ["First Author", "first", "first_author"]] },
  { key: "ict", label: "B3. ICT / E-Content / Pedagogy", max: 20, doc: "ict", fields: [["Title", "title"], ["Type", "type"], ["Quadrants", "quad", "quadrant"]] },
  { key: "research", label: "B4(a). Research Guidance - PhD / PG", max: 30, doc: "res", fields: [["Degree", "degree"], ["Student Name", "name", "student_name"], ["Status", "thesis"]] },
  { key: "internalProjects", sourceKeys: ["internalProjects", "projects2"], label: "B4(b). Research / Consultancy Internal Projects", max: 15, doc: "project2", fields: [["Title", "title"], ["Funding Agency", "agency"], ["Date of Sanction", "date", "sanction_date"], ["Grant Amount", "amount"], ["Role", "role"], ["Status", "status", "project_status"]] },
  { key: "externalProjects", label: "B4(c). Research / Consultancy External Projects", max: 30, doc: "externalProject", fields: [["Title", "title"], ["Funding Agency", "agency"], ["Date of Sanction", "date", "sanction_date"], ["Grant Amount", "amount"], ["Role", "role"], ["Status", "status", "project_status"]] },
  { key: "patents", sourceKeys: ["patents", "ipr"], label: "B5(a). Patents (IPR)", max: 40, doc: "pat", fields: [["Title", "title"], ["National / International", "type"], ["Filed", "date", "patent_date"], ["Status", "status", "patent_status"], ["File No.", "fileNo", "file_no"]] },
  { key: "awards", label: "B5(b). Awards", max: 10, doc: "awd", fields: [["Award Title", "title"], ["Date", "date", "award_date"], ["Agency", "agency"], ["Level", "level"]] },
  { key: "confs", label: "B6. Invited Lectures / Resource Person / Paper Presentations", max: 30, doc: "conf", fields: [["Title / Session", "title"], ["Type", "type"], ["Organizer", "org", "organization"], ["Level", "level"]] },
  { key: "proposals", label: "B7(a). Submitted Research Proposals", max: 10, doc: "prop", fields: [["Title of Proposal", "title"], ["Duration", "duration"], ["Funding Agency", "agency"], ["Grant Amount Requested", "amount"]] },
  { key: "products", label: "B7(b). Product Developed and Used by Students in Lab / Commercialized", max: 10, doc: "prod", fields: [["Details of Product", "details"], ["Used by Students in Lab / Commercialized", "usage"]] },
  { key: "fdps", label: "B8(a). FDP / Workshops Attended", max: 10, doc: "fdp", fields: [["Program", "program"], ["Duration", "duration"], ["Organizer", "org", "organization"]] },
  { key: "training", label: "B8(b). Industrial Training", max: 0, doc: "train", fields: [["Company", "company"], ["Duration", "duration"], ["Nature", "nature"]] },
];
