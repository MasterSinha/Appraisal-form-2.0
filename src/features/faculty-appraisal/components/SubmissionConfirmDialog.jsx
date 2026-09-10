import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ArrowRight, CheckCircle2, FileCheck2, LoaderCircle, LockKeyhole, Send, ShieldCheck, X } from "lucide-react";
import "./submissionConfirmDialog.css";

export default function SubmissionConfirmDialog({
  state = "confirm",
  successMessage = "Your appraisal has been submitted successfully.",
  errorMessage = "Your appraisal could not be submitted. Please try again.",
  title,
  confirmMessage = "Please confirm that your appraisal is complete and ready to be submitted for review.",
  academicYear,
  eyebrow = "Faculty appraisal",
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const submitting = state === "submitting";
  const success = state === "success";
  const error = state === "error";
  const StatusIcon = submitting ? LoaderCircle : success ? CheckCircle2 : error ? AlertCircle : Send;
  const heading = title || (submitting ? "Submitting appraisal" : success ? "Appraisal submitted" : error ? "Submission unsuccessful" : "Submit appraisal?");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    if (!dialog?.open) dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector(submitting ? "[data-status]" : success || error ? "[data-close]" : "[data-cancel]")?.focus();
  }, [success, error, submitting]);

  const close = () => {
    if (!submitting) onCancel?.();
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`submission-confirm submission-confirm--${state}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); close(); }}
    >
      <header className="submission-confirm__header">
        <span className="submission-confirm__eyebrow"><FileCheck2 size={15} aria-hidden="true" />{eyebrow}</span>
        {academicYear && <span className="submission-confirm__year">AY {academicYear}</span>}
        {!submitting && <button type="button" className="submission-confirm__close" aria-label="Close confirmation" title="Close" onClick={close}><X size={18} /></button>}
      </header>
      <div className="submission-confirm__body">
        <div className="submission-confirm__intro">
          <div className="submission-confirm__icon" aria-hidden="true"><StatusIcon size={30} strokeWidth={1.8} className={submitting ? "submission-confirm__spinner" : undefined} /></div>
          <div className="submission-confirm__copy">
            <h2 id={titleId} data-status tabIndex={-1}>{heading}</h2>
            <p id={descriptionId} aria-live="polite">{success ? successMessage : error ? errorMessage : submitting ? "Please keep this window open while we save your appraisal and send it for review." : confirmMessage}</p>
          </div>
        </div>
        {submitting && <div className="submission-confirm__progress" role="progressbar" aria-label="Submitting appraisal"><span /></div>}
        {!success && !error && !submitting && <div className="submission-confirm__note"><LockKeyhole size={18} aria-hidden="true" /><div><strong>Submitted forms are locked for review</strong><span>Choose Cancel if you'd like to make any final changes.</span></div></div>}
        {success && <div className="submission-confirm__receipt"><ShieldCheck size={16} aria-hidden="true" />Submission complete</div>}
      </div>
      <footer className="submission-confirm__actions">
        {success || error ? <button type="button" data-close className="submission-confirm__submit" onClick={onCancel}>{success ? "Done" : "Back to appraisal"}<ArrowRight size={16} aria-hidden="true" /></button> : <>
          <button type="button" data-cancel onClick={close} disabled={submitting}>Cancel</button>
          <button type="button" className="submission-confirm__submit" onClick={onConfirm} disabled={submitting}>{submitting ? <LoaderCircle className="submission-confirm__spinner" size={15} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}{submitting ? "Submitting..." : "Yes, submit"}</button>
        </>}
      </footer>
    </dialog>,
    document.body,
  );
}
