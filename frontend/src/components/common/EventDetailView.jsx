import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { eventsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import EventCreationForm from "./EventCreationForm";
import "./EventDetailView.css";

const RSVP_OPTIONS = ["going", "maybe", "not_going"];
const RSVP_LABEL = {
  going: "Zúčastním se",
  maybe: "Možná",
  not_going: "Nezúčastním se",
  "not-going": "Nezúčastním se",
};
const STATUS_LABEL = {
  upcoming: "Nadcházející",
  ended: "Proběhlá",
  canceled: "Zrušená",
  cancelled: "Zrušená",
  active: "Aktivní",
};

function isPast(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function getVisualStatus(event) {
  if (!event) return "upcoming";
  if (event.status === "cancelled" || event.status === "canceled") return "canceled";
  if (event.status === "ended") return "ended";
  if (isPast(event.date)) return "ended";
  return "upcoming";
}

function formatEventDate(dateStr) {
  if (!dateStr) return "Datum není nastavené";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeRsvp(status) {
  return status === "not-going" ? "not_going" : status;
}

function getStats(participations = []) {
  return participations.reduce(
    (acc, item) => {
      const status = normalizeRsvp(item.status);
      if (acc[status] !== undefined) acc[status] += 1;
      return acc;
    },
    { going: 0, maybe: 0, not_going: 0 },
  );
}

export default function EventDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [event, setEvent] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 2800);
  }, []);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [eventData, participationData] = await Promise.all([
        eventsApi.get(id),
        eventsApi.getParticipations(id).catch(() => []),
      ]);
      setEvent(eventData);
      setParticipations(Array.isArray(participationData) ? participationData : []);
    } catch (err) {
      notify(err.message || "Nepodařilo se načíst detail události.", "error");
    } finally {
      setLoading(false);
    }
  }, [id, notify]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const visualStatus = getVisualStatus(event);
  const canManage = user?.role === "admin" || Number(event?.authorId) === Number(user?.id);
  const myRsvp = useMemo(() => {
    const found = participations.find((item) => Number(item.userId) === Number(user?.id));
    return found ? normalizeRsvp(found.status) : null;
  }, [participations, user?.id]);
  const stats = useMemo(() => getStats(participations), [participations]);
  const rsvpDisabled = !event || visualStatus === "canceled" || visualStatus === "ended";

  const handleRsvp = async (status) => {
    setIsSubmitting(true);
    try {
      await eventsApi.updateParticipation(id, status, user);
      notify(`RSVP bylo nastaveno: ${RSVP_LABEL[status]}`);
      await loadDetail();
    } catch (err) {
      notify(err.message || "RSVP se nepodařilo uložit.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (eventData) => {
    setIsSubmitting(true);
    try {
      await eventsApi.update(
        id,
        {
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
        },
        user,
      );
      notify("Událost byla upravena.");
      setIsEditing(false);
      await loadDetail();
    } catch (err) {
      notify(err.message || "Úprava události se nezdařila.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Zrušit událost „${event.title}“?`)) return;
    setIsSubmitting(true);
    try {
      await eventsApi.cancel(id, user);
      notify("Událost byla zrušena.");
      await loadDetail();
    } catch (err) {
      notify(err.message || "Zrušení události se nezdařilo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      await eventsApi.restore(id, user);
      notify("Událost byla obnovena.");
      await loadDetail();
    } catch (err) {
      notify(err.message || "Obnovení události se nezdařilo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Trvale smazat událost „${event.title}“?`)) return;
    setIsSubmitting(true);
    try {
      await eventsApi.remove(id, user);
      notify("Událost byla smazána.");
      navigate("/events");
    } catch (err) {
      notify(err.message || "Smazání události se nezdařilo.", "error");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="edv-card edv-loading">Načítám detail události…</div>;
  }

  if (!event) {
    return (
      <section className="edv-card edv-loading">
        <p>Událost se nepodařilo najít.</p>
        <Link className="edv-back" to="/events">← Zpět na události</Link>
      </section>
    );
  }

  return (
    <>
      <section className="edv-card">
        <div className="edv-topbar">
          <Link className="edv-back" to="/events">← Zpět na události</Link>
          <span className={`edv-status ${visualStatus}`}>{STATUS_LABEL[visualStatus]}</span>
        </div>

        <div className="edv-hero">
          <div className="edv-icon-box">📅</div>
          <div className="edv-heading">
            <h1>{event.title}</h1>
            <div className="edv-meta-grid">
              <div className="edv-meta-item">
                <span>Datum</span>
                <strong>{formatEventDate(event.date)}</strong>
              </div>
              <div className="edv-meta-item">
                <span>Autor</span>
                <strong>{event.authorName || `Uživatel #${event.authorId}`}</strong>
              </div>
              <div className="edv-meta-item">
                <span>Moje RSVP</span>
                <strong>{myRsvp ? RSVP_LABEL[myRsvp] : "Zatím nevybráno"}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="edv-body-grid">
          <article className="edv-info-panel">
            <h2>Popis události</h2>
            <p>{event.description || event.desc || "Popis zatím není vyplněný."}</p>
          </article>

          <aside className="edv-rsvp-panel">
            <h2>RSVP</h2>
            <div className="edv-rsvp-counts">
              <span className="going">✓ {stats.going} jdou</span>
              <span className="maybe">? {stats.maybe} možná</span>
              <span className="not_going">✕ {stats.not_going} nejdou</span>
            </div>
            <div className="edv-rsvp-actions">
              {RSVP_OPTIONS.map((status) => (
                <button
                  key={status}
                  className={`edv-rsvp-btn ${status}${myRsvp === status ? " selected" : ""}`}
                  disabled={isSubmitting || rsvpDisabled}
                  onClick={() => handleRsvp(status)}
                >
                  {RSVP_LABEL[status]}
                </button>
              ))}
            </div>
            {rsvpDisabled && (
              <p className="edv-rsvp-note">RSVP lze měnit pouze u aktivní nadcházející události.</p>
            )}
          </aside>
        </div>

        {canManage && (
          <div className="edv-action-bar">
            <button className="edv-action edit" onClick={() => setIsEditing(true)} disabled={isSubmitting}>
              Upravit
            </button>
            {visualStatus === "canceled" ? (
              <button className="edv-action restore" onClick={handleRestore} disabled={isSubmitting}>
                Obnovit
              </button>
            ) : (
              <button className="edv-action cancel" onClick={handleCancel} disabled={isSubmitting}>
                Zrušit
              </button>
            )}
            <button className="edv-action delete" onClick={handleDelete} disabled={isSubmitting}>
              Smazat
            </button>
          </div>
        )}
      </section>

      {isEditing && (
        <div className="edv-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="edv-modal" onClick={(e) => e.stopPropagation()}>
            <EventCreationForm
              title="Upravit událost"
              submitLabel="Uložit změny"
              defaultValues={event}
              isSubmitting={isSubmitting}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
