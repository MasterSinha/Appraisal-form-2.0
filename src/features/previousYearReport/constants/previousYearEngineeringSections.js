export const ENGINEERING_PREVIOUS_YEAR_PART_A_MAX = 200;
export const ENGINEERING_PREVIOUS_YEAR_PART_B_MAX = 375;
export const ENGINEERING_PREVIOUS_YEAR_GRAND_MAX = 575;

export const ENGINEERING_PREVIOUS_YEAR_PART_A_SECTIONS = [
  { key: "lectures", label: "A1. Lectures / Tutorials / Practicals", max: 50, doc: "lec", fields: [["Semester", "sem"], ["Course Code / Name", "code"], ["Classes (as per course structure)", "planned"], ["Classes Actually Conducted", "conducted"]] },
  { key: "courseFile", label: "A2. Course File", max: 20, doc: "courseFile", fields: [["Course", "course"], ["Program & Semester", "title"], ["Availability as per IQAC format", "details"]] },
  { key: "innovRows", label: "A3. Innovative Teaching-Learning", max: 10, doc: "innov", fields: [["Method", "method"], ["Details", "details"]] },
  { key: "projects", label: "A4. Projects", max: 10, doc: "proj", fields: [["Project Type", "label"], ["Details", "details"]] },
  { key: "quals", label: "A5. Qualification Enhancement", max: 10, doc: "qual", fields: [["Description", "label"]] },
  { key: "feedback", label: "B. Student Feedback", max: 10, doc: "feedback", fields: [["Course", "code"], ["First Feedback(%)", "fb1"], ["Second Feedback(%)", "fb2"], ["Average", "average"]] },
  { key: "deptActs", label: "C. Departmental Activities", max: 20, doc: "dept", fields: [["Activity", "activity"], ["Nature", "nature"]] },
  { key: "uniActs", label: "D. University Activities", max: 30, doc: "uni", fields: [["Activity", "activity"], ["Nature", "nature"]] },
  { key: "society", label: "E. Contribution to Society", max: 10, doc: "soc", fields: [["Activity", "label"], ["Details", "details"]] },
  { key: "industry", label: "F. Industry Connect", max: 5, doc: "ind", fields: [["Industry Name", "name"], ["Details", "details"]] },
  { key: "acr", label: "G. Annual Confidential Report", max: 25, doc: "acr", fields: [["Parameter", "label"]] },
];

export const ENGINEERING_PREVIOUS_YEAR_PART_B_SECTIONS = [
  { key: "journals", label: "B1. Research Papers / Journal Publications", max: 120, doc: "jour", fields: [["Title", "title"], ["Journal", "journal"], ["ISSN", "issn"], ["Journal Indexing", "index"]] },
  { key: "books", label: "B2. Books / Book Chapters", max: 50, doc: "book", fields: [["Title with Page Nos.", "title"], ["Book Title, Editor & Publisher", "book"], ["ISSN / ISBN No.", "issn"], ["Type of Publisher", "pub"], ["Co-authors", "coauth"], ["First Author", "first"]] },
  { key: "ict", label: "B3. ICT / E-Content / Pedagogy", max: 20, doc: "ict", fields: [["Title", "title"], ["Type", "type"], ["Quadrants", "quad"]] },
  { key: "research", label: "B4(a). Research Guidance - PhD / PG", max: 30, doc: "res", fields: [["Degree", "degree"], ["Student Name", "name"], ["Status", "thesis"]] },
  { key: "internalProjects", sourceKeys: ["internalProjects", "projects2"], label: "B4(b). Research / Consultancy Internal Projects", max: 15, doc: "project2", fields: [["Title", "title"], ["Funding Agency", "agency"], ["Date of Sanction", "date"], ["Grant Amount", "amount"], ["Role", "role"], ["Status", "status"]] },
  { key: "externalProjects", label: "B4(c). Research / Consultancy External Projects", max: 30, doc: "externalProject", fields: [["Title", "title"], ["Funding Agency", "agency"], ["Date of Sanction", "date"], ["Grant Amount", "amount"], ["Role", "role"], ["Status", "status"]] },
  { key: "patents", sourceKeys: ["patents", "ipr"], label: "B5(a). Patents (IPR)", max: 40, doc: "pat", fields: [["Title", "title"], ["National / International", "type"], ["Filed", "date"], ["Status", "status"], ["File No.", "fileNo"]] },
  { key: "awards", label: "B5(b). Awards", max: 10, doc: "awd", fields: [["Award Title", "title"], ["Date", "date"], ["Agency", "agency"], ["Level", "level"]] },
  { key: "confs", label: "B6. Invited Lectures / Resource Person / Paper Presentations", max: 30, doc: "conf", fields: [["Title / Session", "title"], ["Type", "type"], ["Organizer", "org"], ["Level", "level"]] },
  { key: "proposals", label: "B7(a). Submitted Research Proposals", max: 10, doc: "prop", fields: [["Title of Proposal", "title"], ["Duration", "duration"], ["Funding Agency", "agency"], ["Grant Amount Requested", "amount"]] },
  { key: "products", label: "B7(b). Product Developed and Used by Students in Lab / Commercialized", max: 10, doc: "prod", fields: [["Details of Product", "details"], ["Used by Students in Lab / Commercialized", "usage"]] },
  { key: "fdps", label: "B8(a). FDP / Workshops Attended", max: 10, doc: "fdp", fields: [["Program", "program"], ["Duration", "duration"], ["Organizer", "org"]] },
  { key: "training", label: "B8(b). Industrial Training", max: 0, doc: "train", fields: [["Company", "company"], ["Duration", "duration"], ["Nature", "nature"]] },
];
