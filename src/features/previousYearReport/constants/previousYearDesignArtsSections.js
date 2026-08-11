export const DESIGN_ARTS_PREVIOUS_YEAR_PART_A_MAX = 200;
export const DESIGN_ARTS_PREVIOUS_YEAR_PART_B_MAX = 375;
export const DESIGN_ARTS_PREVIOUS_YEAR_GRAND_MAX = 575;

export const DESIGN_ARTS_PREVIOUS_YEAR_PART_A_SECTIONS = [
  { key: "lectures", label: "A(i). Lectures / Tutorials / Practicals", max: 40, doc: "lec", fields: [["Semester", "sem"], ["Course Code / Name", "code", "course_code"], ["Planned", "planned", "planned_classes"], ["Conducted", "conducted", "conducted_classes"]] },
  { key: "courseFile", label: "A(ii). Course File", max: 20, doc: "cf", fields: [["Course / Paper", "course"], ["Program & Semester", "title"], ["Availability as per IQAC format", "details"]] },
  { key: "innovRows", label: "A(iii). Innovative Teaching-Learning Methodologies", max: 10, doc: "innov", fields: [["Method", "method"], ["Details", "details"]] },
  { key: "projects", label: "A(iv). Project Guidance", max: 20, doc: "proj", fields: [["Project Category", "label"]] },
  { key: "quals", label: "A(v). Qualification Enhancement", max: 10, doc: "qual", fields: [["Category", "label", "title"]] },
  { key: "feedback", label: "A(vi). Student Feedback", max: 10, doc: "fb", fields: [["Course Code / Name", "code", "course_code"], ["First Feedback %", "fb1", "feedback_1"], ["Second Feedback %", "fb2", "feedback_2"]] },
  { key: "deptActs", label: "A(vii). Departmental / School Activities", max: 20, doc: "dept", fields: [["Activity", "activity"], ["Nature", "nature", "durationCat"]] },
  { key: "uniActs", label: "A(viii). University Level Activities", max: 30, doc: "uni", fields: [["Activity", "activity"], ["Nature", "nature", "durationCat"]] },
  { key: "society", label: "A(ix). Contribution to Society", max: 10, doc: "soc", fields: [["Activity", "label", "activity"], ["Details", "details"]] },
  { key: "industry", label: "A(x). Industry Connect", max: 5, doc: "ind", fields: [["Name", "name", "activity", "partner"], ["Details", "details"]] },
  { key: "acr", label: "A(xi). Annual Confidential Report", max: 25, doc: "acr", fields: [["Attribute", "label"]] },
];

export const DESIGN_ARTS_PREVIOUS_YEAR_PART_B_SECTIONS = [
  { key: "journals", label: "B1(i). Published Papers in Journals", max: 80, doc: "jour", fields: [["Title with Page Nos.", "title"], ["Journal Details", "journal"], ["ISSN No.", "issn"], ["Journal Indexing", "index", "indexing"]] },
  { key: "books", label: "B2. Articles / Chapters in Books", max: 60, doc: "book", fields: [["Title", "title"], ["Book & Publisher", "book", "publisher"], ["ISBN", "isbn", "issn"], ["Type", "pub", "type"], ["Co-authors", "coauth", "coauthor", "coAuthors"], ["First Author?", "first", "first_author", "firstAuthor"]] },
  { key: "ict", label: "B3. ICT Mediated Teaching-Learning Pedagogy / New Curricula", max: 50, doc: "ict", fields: [["Title", "title"], ["Short Description", "desc", "description"], ["Type / Link", "type", "platform"], ["Quadrants", "quad", "quadrant"]] },
  { key: "research", label: "B4(a). Research Guidance - PhD / PG", max: 30, doc: "res", fields: [["Degree", "degree"], ["Student Name", "name", "student_name"], ["Thesis / Status", "thesis", "status"]] },
  { key: "internalProjects", sourceKeys: ["internalProjects", "projects2"], label: "B4(b). Internal Research Projects", max: 15, doc: "int", fields: [["Title", "title"], ["Funding Agency", "agency"], ["Sanction Date", "date", "sanction_date"], ["Amount", "amount"], ["Role", "role"], ["Status", "status", "project_status"]] },
  { key: "externalProjects", label: "B4(c). External Research / Consultancy Projects", max: 30, doc: "ext", fields: [["Title", "title"], ["Funding Agency", "agency"], ["Sanction Date", "date", "sanction_date"], ["Amount", "amount"], ["Role", "role"], ["Status", "status", "project_status"]] },
  { key: "ipr", sourceKeys: ["ipr", "patents"], label: "B5(a). IPR / Copyright / Patent", max: 40, doc: "ipr", fields: [["Title", "title"], ["Scope", "scope", "type"], ["Date", "date", "ipr_date", "patent_date"], ["Status", "status", "ipr_status", "patent_status"], ["File No.", "fileNo", "file_no"]] },
  { key: "awards", label: "B5(b). Research Awards", max: 10, doc: "awd", fields: [["Title", "title"], ["Date", "date", "award_date"], ["Agency", "agency"], ["Level", "level"]] },
  { key: "confs", label: "B6. Conferences / Seminars / Workshops", max: 30, doc: "conf", fields: [["Title", "title"], ["Type", "type"], ["Organization", "org", "organization"], ["Level", "level"]] },
  { key: "proposals", label: "B7. Research Proposals", max: 10, doc: "prop", fields: [["Title", "title"], ["Duration", "duration"], ["Agency", "agency"], ["Amount", "amount"]] },
  { key: "fdps", label: "B8(a). FDP / Self Development", max: 20, summaryGroup: "b8", doc: "fdp", fields: [["Program", "program"], ["Duration", "duration"], ["Organization", "org", "organization"]] },
  { key: "training", label: "B8(b). Industrial Training", max: 20, summaryGroup: "b8", doc: "train", fields: [["Company", "company"], ["Duration", "duration"], ["Nature", "nature"]] },
];
