import { useMemo, useState } from "react";
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
  submitLabel = "Vytvořit událost",
  title = "Nová událost",
}) {
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
      nextErrors.title = "Název události je povinný.";
    } else if (values.title.trim().length > TITLE_LIMIT) {
      nextErrors.title = `Název musí mít maximálně ${TITLE_LIMIT} znaků.`;
    }

    if (values.description.length > DESCRIPTION_LIMIT) {
      nextErrors.description = `Popis musí mít maximálně ${DESCRIPTION_LIMIT} znaků.`;
    }

    if (!values.date) {
      nextErrors.date = "Datum a čas události jsou povinné.";
    } else if (new Date(values.date) < new Date()) {
      nextErrors.date = "Datum události nemůže být v minulosti.";
    }

    if (values.photo && values.photo.length > 255) {
      nextErrors.photo = "URL obrázku může mít maximálně 255 znaků.";
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
    return <div className="ecf-loading">Načítám formulář…</div>;
  }

  return (
    <form className="ecf-form" onSubmit={handleSubmit} noValidate>
      <div className="ecf-heading">
        <span className="ecf-icon">🌿</span>
        <h2>{title}</h2>
      </div>

      <label className="ecf-label" htmlFor="event-title">
        Název události <span className="req">*</span>
      </label>
      <input
        id="event-title"
        className={`ecf-input${errors.title ? " has-error" : ""}`}
        value={values.title}
        maxLength={TITLE_LIMIT + 1}
        disabled={isSubmitting}
        onChange={(e) => updateValue("title", e.target.value)}
        placeholder="Např. Jarní sázení nebo společná brigáda"
      />
      <div className="ecf-field-row">
        {errors.title && <span className="ecf-error">{errors.title}</span>}
        <span className={values.title.length > TITLE_LIMIT ? "ecf-counter danger" : "ecf-counter"}>
          {values.title.length}/{TITLE_LIMIT}
        </span>
      </div>

      <label className="ecf-label" htmlFor="event-date">
        Datum a čas <span className="req">*</span>
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

      <label className="ecf-label" htmlFor="event-description">Popis</label>
      <textarea
        id="event-description"
        className={`ecf-textarea${errors.description ? " has-error" : ""}`}
        rows={5}
        value={values.description}
        maxLength={DESCRIPTION_LIMIT + 1}
        disabled={isSubmitting}
        onChange={(e) => updateValue("description", e.target.value)}
        placeholder="Krátce popiš, co se bude dít a co si mají účastníci případně vzít s sebou."
      />
      <div className="ecf-field-row">
        {errors.description && <span className="ecf-error">{errors.description}</span>}
        <span className={values.description.length > DESCRIPTION_LIMIT ? "ecf-counter danger" : "ecf-counter"}>
          {values.description.length}/{DESCRIPTION_LIMIT}
        </span>
      </div>

      <label className="ecf-label" htmlFor="event-photo">Fotka / URL obrázku</label>
      <input
        id="event-photo"
        className={`ecf-input${errors.photo ? " has-error" : ""}`}
        value={values.photo}
        maxLength={256}
        disabled={isSubmitting}
        onChange={(e) => updateValue("photo", e.target.value)}
        placeholder="Volitelné – URL obrázku pro budoucí backend podporu"
      />
      {errors.photo && <span className="ecf-error block">{errors.photo}</span>}

      <label className="ecf-label" htmlFor="event-context">Kontext události</label>
      <input
        id="event-context"
        className="ecf-input"
        value="Komunitní zahrada"
        disabled
        title="Pro tento úkol stačí obecná komunitní událost."
      />

      <div className="ecf-actions">
        <button type="submit" className="ecf-primary" disabled={isSubmitting}>
          {isSubmitting ? "Ukládám…" : submitLabel}
        </button>
        <button type="button" className="ecf-secondary" onClick={onCancel} disabled={isSubmitting}>
          Zrušit
        </button>
      </div>
    </form>
  );
}
