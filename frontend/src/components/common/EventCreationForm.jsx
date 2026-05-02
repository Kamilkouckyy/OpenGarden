import { useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import "./EventCreationForm.css";

const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 2000;

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getMinDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function EventCreationForm({
  onSubmit,
  onCancel,
  isLoading = false,
  isSubmitting = false,
  defaultValues = {},
  submitLabel,
  title,
}) {
  const { t } = useLanguage();

  const minDate = useMemo(() => getMinDateTimeLocal(), []);
  const [values, setValues] = useState({
    title: defaultValues.title || "",
    description: defaultValues.description || defaultValues.desc || "",
    date: toDateTimeLocalValue(defaultValues.date),
    photo: defaultValues.photo || defaultValues.photoUrl || "",
  });
  const [errors, setErrors] = useState({});

  const updateValue = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = t("events.eventTitleRequired");
    } else if (values.title.trim().length > TITLE_LIMIT) {
      nextErrors.title = t("events.eventTitleLimit", { limit: TITLE_LIMIT });
    }

    if (values.description.length > DESCRIPTION_LIMIT) {
      nextErrors.description = t("events.descriptionLimit", { limit: DESCRIPTION_LIMIT });
    }

    if (!values.date) {
      nextErrors.date = t("events.dateRequired");
    } else if (new Date(values.date) < new Date()) {
      nextErrors.date = t("events.dateInPast");
    }

    if (values.photo && values.photo.length > 255) {
      nextErrors.photo = t("events.photoLimit");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit?.({
      title: values.title.trim(),
      description: values.description.trim(),
      desc: values.description.trim(),
      date: new Date(values.date).toISOString(),
      photo: values.photo.trim(),
    });
  };

  if (isLoading) {
    return <div className="ecf-loading">{t("events.formLoading")}</div>;
  }

  return (
    <form className="ecf-form" onSubmit={handleSubmit} noValidate>
      <div className="ecf-heading">
        <span className="ecf-icon">🌿</span>
        <h2>{title || t("events.newEvent")}</h2>
      </div>

      <label className="ecf-label" htmlFor="event-title">
        {t("events.eventTitle")} <span className="req">*</span>
      </label>
      <input
        id="event-title"
        className={`ecf-input${errors.title ? " has-error" : ""}`}
        value={values.title}
        maxLength={TITLE_LIMIT + 1}
        disabled={isSubmitting}
        onChange={(e) => updateValue("title", e.target.value)}
        placeholder={t("events.titlePlaceholder")}
      />
      <div className="ecf-field-row">
        {errors.title && <span className="ecf-error">{errors.title}</span>}
        <span className={values.title.length > TITLE_LIMIT ? "ecf-counter danger" : "ecf-counter"}>
          {values.title.length}/{TITLE_LIMIT}
        </span>
      </div>

      <label className="ecf-label" htmlFor="event-date">
        {t("events.dateTime")} <span className="req">*</span>
      </label>
      <input
        id="event-date"
        type="datetime-local"
        min={minDate}
        className={`ecf-input${errors.date ? " has-error" : ""}`}
        value={values.date}
        disabled={isSubmitting}
        onChange={(e) => updateValue("date", e.target.value)}
      />
      {errors.date && <span className="ecf-error block">{errors.date}</span>}

      <label className="ecf-label" htmlFor="event-description">{t("events.formDescription")}</label>
      <textarea
        id="event-description"
        className={`ecf-textarea${errors.description ? " has-error" : ""}`}
        rows={5}
        value={values.description}
        maxLength={DESCRIPTION_LIMIT + 1}
        disabled={isSubmitting}
        onChange={(e) => updateValue("description", e.target.value)}
        placeholder={t("events.descriptionPlaceholder")}
      />
      <div className="ecf-field-row">
        {errors.description && <span className="ecf-error">{errors.description}</span>}
        <span className={values.description.length > DESCRIPTION_LIMIT ? "ecf-counter danger" : "ecf-counter"}>
          {values.description.length}/{DESCRIPTION_LIMIT}
        </span>
      </div>

      <label className="ecf-label" htmlFor="event-photo">{t("events.photo")}</label>
      <input
        id="event-photo"
        className={`ecf-input${errors.photo ? " has-error" : ""}`}
        value={values.photo}
        maxLength={256}
        disabled={isSubmitting}
        onChange={(e) => updateValue("photo", e.target.value)}
        placeholder={t("events.photoPlaceholder")}
      />
      {errors.photo && <span className="ecf-error block">{errors.photo}</span>}

      <label className="ecf-label" htmlFor="event-context">{t("events.context")}</label>
      <input
        id="event-context"
        className="ecf-input"
        value={t("events.contextValue")}
        disabled
        title={t("events.contextTitle")}
      />

      <div className="ecf-actions">
        <button type="submit" className="ecf-primary" disabled={isSubmitting}>
          {isSubmitting ? t("events.saving") : submitLabel || t("events.createEvent")}
        </button>
        <button type="button" className="ecf-secondary" onClick={onCancel} disabled={isSubmitting}>
          {t("events.cancel")}
        </button>
      </div>
    </form>
  );
}