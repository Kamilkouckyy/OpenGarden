import { useLanguage } from "../../i18n/LanguageContext";
import "./TaskStatusModal.css";

const RSVP_OPTIONS = ["going", "maybe", "not_going"];

export default function EventParticipationModal({
  isOpen,
  selectedStatus,
  isSubmitting = false,
  onChange,
  onSave,
  onCancel,
}) {
  const { t } = useLanguage();

  const getLabel = (status) => {
    if (status === "going") return t("events.goingDetail");
    if (status === "maybe") return t("events.maybeDetail");
    if (status === "not_going") return t("events.notGoingDetail");
    return status;
  };

  if (!isOpen) return null;

  return (
    <div className="task-modal-overlay" onClick={onCancel}>
      <div className="task-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-status-modal__header">
          <h2 className="task-status-modal__title">{t("events.participationModalTitle")}</h2>
          <button
            type="button"
            className="task-status-modal__close"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <div className="task-status-modal__body">
          <p className="task-status-modal__subtitle">
            {t("events.participationModalSubtitle")}
          </p>

          <div className="task-status-modal__options">
            {RSVP_OPTIONS.map((status) => (
              <label key={status} className="task-status-modal__option">
                <input
                  type="radio"
                  name="event-participation"
                  value={status}
                  checked={selectedStatus === status}
                  onChange={() => onChange(status)}
                  disabled={isSubmitting}
                />
                <span>{getLabel(status)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="task-status-modal__footer">
          <button
            type="button"
            className="task-status-modal__save"
            onClick={onSave}
            disabled={isSubmitting || !selectedStatus}
          >
            {isSubmitting ? t("events.saving") : t("events.save")}
          </button>
          <button
            type="button"
            className="task-status-modal__cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("events.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
