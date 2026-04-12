import { useEffect, useMemo, useState } from "react";
import "./TaskCreationForm.css";

const EMPTY_FORM = {
  title: "",
  assignedTo: "",
  relatedContext: "",
  dueDate: "",
};

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() + 1 === month &&
    parsedDate.getDate() === day
  );
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function TaskCreationForm({
  shown = false,
  disabled = false,
  resolverOptions = [],
  contextOptions = [],
  prefilledContext = "",
  prefilledResolver = "",
  onSubmit = () => {},
  onCancel = () => {},
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!shown) {
      return;
    }

    setFormData({
      title: "",
      assignedTo: prefilledResolver,
      relatedContext: prefilledContext,
      dueDate: getTodayValue(),
    });
    setErrors({});
  }, [shown, prefilledContext, prefilledResolver]);

  const normalizedResolverOptions = useMemo(
    () =>
      resolverOptions
        .map((option) => (typeof option === "string" ? option.trim() : ""))
        .filter(Boolean),
    [resolverOptions]
  );

  const normalizedContextOptions = useMemo(
    () =>
      contextOptions
        .map((option) => (typeof option === "string" ? option.trim() : ""))
        .filter(Boolean),
    [contextOptions]
  );

  const overlayClassName = useMemo(
    () => `task-form__overlay${shown ? " task-form__overlay--visible" : ""}`,
    [shown]
  );

  const validate = (values) => {
    const nextErrors = {};
    const title = values.title.trim();
    const assignedTo = values.assignedTo.trim();
    const relatedContext = values.relatedContext.trim();
    const dueDate = values.dueDate.trim();

    if (!title) {
      nextErrors.title = "Enter a task title.";
    } else if (title.length > 255) {
      nextErrors.title = "The task title must be shorter than 255 characters.";
    }

    if (!assignedTo) {
      nextErrors.assignedTo = "Select an assignee.";
    } else if (
      normalizedResolverOptions.length > 0 &&
      !normalizedResolverOptions.includes(assignedTo)
    ) {
      nextErrors.assignedTo = "Select an assignee from the list.";
    }

    if (!relatedContext) {
      nextErrors.relatedContext = "Select a related bed.";
    } else if (relatedContext.length > 255) {
      nextErrors.relatedContext = "The related context must be shorter than 255 characters.";
    } else if (
      normalizedContextOptions.length > 0 &&
      !normalizedContextOptions.includes(relatedContext)
    ) {
      nextErrors.relatedContext = "Select a bed from the list.";
    }

    if (!dueDate) {
      nextErrors.dueDate = "Select a due date.";
    } else if (!isValidDateString(dueDate)) {
      nextErrors.dueDate = "Enter a valid date in YYYY-MM-DD format.";
    } else if (dueDate < getTodayValue()) {
      nextErrors.dueDate = "The due date cannot be in the past.";
    }

    return nextErrors;
  };

  const updateField = (fieldName) => (event) => {
    const { value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [fieldName]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validate(formData);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      title: formData.title.trim(),
      assignedTo: formData.assignedTo.trim(),
      relatedContext: formData.relatedContext.trim(),
      dueDate: formData.dueDate,
    });
  };

  if (!shown) {
    return null;
  }

  return (
    <div
      className={overlayClassName}
      onClick={(event) => {
        if (event.target === event.currentTarget && !disabled) {
          onCancel();
        }
      }}
    >
      <section className="task-form" aria-modal="true" role="dialog">
        <header className="task-form__header">
          <div>
            <p className="task-form__eyebrow">Create</p>
            <h2 className="task-form__title">New task</h2>
          </div>
          <button
            type="button"
            className="task-form__close"
            onClick={onCancel}
            disabled={disabled}
            aria-label="Close form"
          >
            ×
          </button>
        </header>

        <form className="task-form__body" onSubmit={handleSubmit} noValidate>
          <label className="task-form__field">
            <span className="task-form__label">Task title</span>
            <input
              type="text"
              value={formData.title}
              onChange={updateField("title")}
              maxLength={255}
              disabled={disabled}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "task-title-error" : undefined}
              placeholder="e.g. Water the herb bed"
            />
            {errors.title && (
              <span id="task-title-error" className="task-form__error">
                {errors.title}
              </span>
            )}
          </label>

          <label className="task-form__field">
            <span className="task-form__label">Assign to</span>
            <select
              value={formData.assignedTo}
              onChange={updateField("assignedTo")}
              disabled={disabled}
              aria-invalid={Boolean(errors.assignedTo)}
              aria-describedby={errors.assignedTo ? "task-resolver-error" : undefined}
            >
              <option value="">Select an assignee</option>
              {normalizedResolverOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.assignedTo && (
              <span id="task-resolver-error" className="task-form__error">
                {errors.assignedTo}
              </span>
            )}
          </label>

          <label className="task-form__field">
            <span className="task-form__label">Related bed</span>
            <select
              value={formData.relatedContext}
              onChange={updateField("relatedContext")}
              disabled={disabled}
              aria-invalid={Boolean(errors.relatedContext)}
              aria-describedby={errors.relatedContext ? "task-context-error" : undefined}
            >
              <option value="">Select a bed</option>
              {normalizedContextOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.relatedContext && (
              <span id="task-context-error" className="task-form__error">
                {errors.relatedContext}
              </span>
            )}
          </label>

          <label className="task-form__field">
            <span className="task-form__label">Due date</span>
            <input
              type="date"
              value={formData.dueDate}
              onChange={updateField("dueDate")}
              disabled={disabled}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? "task-date-error" : undefined}
            />
            {errors.dueDate && (
              <span id="task-date-error" className="task-form__error">
                {errors.dueDate}
              </span>
            )}
          </label>

          <div className="task-form__actions">
            <button
              type="button"
              className="task-form__button task-form__button--secondary"
              onClick={onCancel}
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="task-form__button task-form__button--primary"
              disabled={disabled}
            >
              Create task
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default TaskCreationForm;