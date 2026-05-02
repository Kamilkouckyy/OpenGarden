import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import "./TaskStatusModal.css";

export default function TaskStatusModal({
  isOpen,
  selectedStatus,
  onChange,
  onSave,
  onCancel,
}) {
  const { t } = useLanguage();

  const statusOptions = [
    { value: "open", label: t("tasks.open") },
    { value: "in_progress", label: t("tasks.inProgress") },
    { value: "done", label: t("tasks.done") },
  ];

  if (!isOpen) return null;

  return (
    <div className="task-modal-overlay" onClick={onCancel}>
      <div className="task-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-status-modal__header">
          <h2 className="task-status-modal__title">{t("tasks.statusModalTitle")}</h2>
          <button
            type="button"
            className="task-status-modal__close"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <div className="task-status-modal__body">
          <p className="task-status-modal__subtitle">
            {t("tasks.statusModalSubtitle")}
          </p>

          <div className="task-status-modal__options">
            {statusOptions.map((option) => (
              <label key={option.value} className="task-status-modal__option">
                <input
                  type="radio"
                  name="task-status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={() => onChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="task-status-modal__footer">
          <button type="button" className="task-status-modal__save" onClick={onSave}>
            {t("tasks.save")}
          </button>
          <button
            type="button"
            className="task-status-modal__cancel"
            onClick={onCancel}
          >
            {t("tasks.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}