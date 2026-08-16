import DirectorLecturesTable from "./DirectorLecturesTable";
import DirectorCourseFileTable from "./DirectorCourseFileTable";
import DirectorInnovativeTeaching from "./DirectorInnovativeTeaching";
import DirectorProjects from "./DirectorProjects";
import DirectorQualification from "./DirectorQualification";
import DirectorStudentFeedback from "./DirectorStudentFeedback";
import EvidenceScoreTable from "./EvidenceScoreTable";

export default function DirectorPartA({ ctx }) {
 return (
<div className="review-part-stack">
 {/* - PART A - */}
<div className="review-part-stack__title">PART A - Teaching & Academic Activities</div>
<DirectorLecturesTable ctx={ctx} />
<DirectorCourseFileTable ctx={ctx} />
<DirectorInnovativeTeaching ctx={ctx} />
<DirectorStudentFeedback ctx={ctx} />
<EvidenceScoreTable ctx={ctx} title="A5. Learning Outcomes Attainment & OBE Practice (Max 20)" accent="#2563eb" sectionKey="obeRows" docPrefix="obe" labelKey="component" labelHeader="Component" max={20} />
<DirectorProjects ctx={ctx} />
<EvidenceScoreTable ctx={ctx} title="A7. Student Mentoring & Counselling (Max 10)" accent="#8b5cf6" sectionKey="mentoringRows" docPrefix="mentor" labelKey="activity" labelHeader="Activity" max={10} />
<DirectorQualification ctx={ctx} />
</div>
 );
}

