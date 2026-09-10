import { useCallback, useState } from "react";
import SubmissionConfirmDialog from "../features/faculty-appraisal/components/SubmissionConfirmDialog";
import { ReviewFeedbackContext } from "./reviewFeedbackContext";

// Keep feedback above review panels so closing a completed form cannot hide it.
export default function ReviewFeedbackProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const showFeedback = useCallback((message, state = "error", title) => new Promise((resolve) => {
    setQueue((current) => [...current, { message, state, title, resolve }]);
  }), []);
  const active = queue[0];

  const dismiss = () => {
    setQueue((current) => current.slice(1));
    active.resolve();
  };

  return (
    <ReviewFeedbackContext.Provider value={showFeedback}>
      {children}
      {active && <SubmissionConfirmDialog
        state={active.state}
        eyebrow="Appraisal review"
        title={active.title || (active.state === "success" ? "Review submitted" : "Review requires attention")}
        successMessage={active.message}
        errorMessage={active.message}
        closeLabel="OK"
        onCancel={dismiss}
      />}
    </ReviewFeedbackContext.Provider>
  );
}
