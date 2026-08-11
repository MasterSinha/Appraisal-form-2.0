import DesignArtsPreviousYearView from "../forms/DesignArtsPreviousYearView";
import EngineeringPreviousYearView from "../forms/EngineeringPreviousYearView";
import MediaCommunicationPreviousYearView from "../forms/MediaCommunicationPreviousYearView";

export default function PreviousYearReportViewer({ formType, ...props }) {
  if (formType === "mediaCommunication") return <MediaCommunicationPreviousYearView {...props} />;
  if (formType === "designArts") return <DesignArtsPreviousYearView {...props} />;
  return <EngineeringPreviousYearView {...props} />;
}
