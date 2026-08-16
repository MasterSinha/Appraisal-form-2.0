import LecturesTable from "./LecturesTable";
import CourseFileTable from "./CourseFileTable";
import EvidenceScoreTable from "./EvidenceScoreTable";
import InnovativeTeaching from "./InnovativeTeaching";
import Projects from "./Projects";
import Qualification from "./Qualification";
import StudentFeedback from "./StudentFeedback";

export default function PartA({ ctx }) {
 return (
<div className="review-part-stack">
 {/* - PART A - */}
<div className="review-part-stack__title">PART A - Teaching & Academic Activities</div>
<LecturesTable ctx={ctx} />
<CourseFileTable ctx={ctx} />
<InnovativeTeaching ctx={ctx} />
<StudentFeedback ctx={ctx} />
<EvidenceScoreTable ctx={ctx} title="A5. Learning Outcomes Attainment & OBE Practice (Max 20)" accent="#2563eb" sectionKey="obeRows" docPrefix="obe" labelKey="component" labelHeader="Component" max={20} />
<Projects ctx={ctx} />
<EvidenceScoreTable ctx={ctx} title="A7. Student Mentoring & Counselling (Max 10)" accent="#8b5cf6" sectionKey="mentoringRows" docPrefix="mentor" labelKey="activity" labelHeader="Activity" max={10} />
<Qualification ctx={ctx} />
</div>
 );
}

