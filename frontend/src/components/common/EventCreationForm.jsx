import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import "./EventCreationForm.css";

const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 2000;

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDisplayDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDisplayDateTime(value) {
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const [, day, month, year, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
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

  const [values, setValues] = useState({
    title: defaultValues.title || "",
    description: defaultValues.description || defaultValues.desc || "",
    date: toDisplayDateTime(defaultValues.date),
    photo: defaultValues.photo || defaultValues.photoUrl || "",
    location: defaultValues.location || defaultValues.context || "",
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

    const parsedDate = parseDisplayDateTime(values.date);

    if (!values.date.trim()) {
      nextErrors.date = t("events.dateRequired");
    } else if (!parsedDate) {
      nextErrors.date = t("events.dateInvalid");
    } else if (parsedDate < new Date()) {
      nextErrors.date = t("events.dateInPast");
    }

    if (values.photo && values.photo.length > 500) {
      nextErrors.photo = t("events.photoLimit");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedDate = parseDisplayDateTime(values.date);

    onSubmit?.({
      title: values.title.trim(),
      description: values.description.trim(),
      date: parsedDate.toISOString(),
      photoUrl: values.photo.trim() || undefined,
      location: values.location.trim() || undefined,
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
        type="text"
        className={`ecf-input${errors.date ? " has-error" : ""}`}
        value={values.date}
        disabled={isSubmitting}
        onChange={(e) => updateValue("date", e.target.value)}
        placeholder={t("events.dateTimePlaceholder")}
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
        maxLength={501}
        disabled={isSubmitting}
        onChange={(e) => updateValue("photo", e.target.value)}
        placeholder={t("events.photoPlaceholder")}
      />
      {errors.photo && <span className="ecf-error block">{errors.photo}</span>}

      <label className="ecf-label" htmlFor="event-location">{t("events.location")}</label>
      <input
        id="event-location"
        className="ecf-input"
        value={values.location}
        maxLength={100}
        disabled={isSubmitting}
        onChange={(e) => updateValue("location", e.target.value)}
        placeholder={t("events.locationPlaceholder")}
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