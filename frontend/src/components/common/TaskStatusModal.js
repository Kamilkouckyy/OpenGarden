import React from "react";
import "./TaskStatusModal.css";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function TaskStatusModal({
  isOpen,
  selectedStatus,
  onChange,
  onSave,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="task-modal-overlay" onClick={onCancel}>
      <div className="task-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-status-modal__header">
          <h2 className="task-status-modal__title">Update Task Status</h2>
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
            Select a new status for this task.
          </p>

          <div className="task-status-modal__options">
            {STATUS_OPTIONS.map((option) => (
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
            Save
          </button>
          <button
            type="button"
            className="task-status-modal__cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}