import DirectorJournalTable from "./DirectorJournalTable";
import DirectorBooksTable from "./DirectorBooksTable";
import DirectorICTTable from "./DirectorICTTable";
import DirectorResearchGuidance from "./DirectorResearchGuidance";
import DirectorInternalProjects from "./DirectorInternalProjects";
import DirectorExternalProjects from "./DirectorExternalProjects";
import DirectorPatents from "./DirectorPatents";
import DirectorAwards from "./DirectorAwards";
import DirectorConferences from "./DirectorConferences";
import DirectorResearchProposals from "./DirectorResearchProposals";
import DirectorProductDevelopment from "./DirectorProductDevelopment";
import DirectorFDP from "./DirectorFDP";
import DirectorIndustrialTraining from "./DirectorIndustrialTraining";

export default function DirectorPartB({ ctx }) {
 return (
<div className="review-part-stack">
 {/* - PART B - */}
<div className="review-part-stack__title">PART B - Research & Innovation</div>
<DirectorJournalTable ctx={ctx} />
<DirectorBooksTable ctx={ctx} />
<DirectorPatents ctx={ctx} />
<DirectorInternalProjects ctx={ctx} />
<DirectorExternalProjects ctx={ctx} />
<DirectorResearchGuidance ctx={ctx} />
<DirectorResearchProposals ctx={ctx} />
<DirectorConferences ctx={ctx} />
<DirectorFDP ctx={ctx} />
<DirectorIndustrialTraining ctx={ctx} />
<DirectorAwards ctx={ctx} />
<DirectorProductDevelopment ctx={ctx} />
<DirectorICTTable ctx={ctx} />
</div>
 );
}

