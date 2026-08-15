import JournalTable from "./JournalTable";
import BooksTable from "./BooksTable";
import ICTTable from "./ICTTable";
import ResearchGuidance from "./ResearchGuidance";
import InternalProjects from "./InternalProjects";
import Patents from "./Patents";
import Awards from "./Awards";
import Conferences from "./Conferences";
import ResearchProposals from "./ResearchProposals";
import ProductDevelopment from "./ProductDevelopment";
import FDP from "./FDP";

export default function PartB({ ctx }) {
 return (
<div className="review-part-stack">
 {/* - PART B - */}
<div className="review-part-stack__title">PART B - Research & Innovation</div>
<JournalTable ctx={ctx} />
<BooksTable ctx={ctx} />
<Patents ctx={ctx} />
<InternalProjects ctx={ctx} />
<ResearchGuidance ctx={ctx} />
<ResearchProposals ctx={ctx} />
<Conferences ctx={ctx} />
<FDP ctx={ctx} />
<Awards ctx={ctx} />
<ProductDevelopment ctx={ctx} />
<ICTTable ctx={ctx} />
</div>
 );
}

