import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { eventsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import EventCreationForm from "./EventCreationForm";
import "./EventDetailView.css";

const RSVP_OPTIONS = ["going", "maybe", "not_going"];

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

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatEventDate(dateStr, noDateText) {
  if (!dateStr) return noDateText;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  const { t } = useLanguage();

  const [event, setEvent] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);

  const getRsvpLabel = (status) => {
    if (status === "going") return t("events.goingDetail");
    if (status === "maybe") return t("events.maybeDetail");
    if (status === "not_going" || status === "not-going") return t("events.notGoingDetail");
    return status;
  };

  const getStatusLabel = (status) => {
    if (status === "upcoming") return t("events.upcoming");
    if (status === "ended") return t("events.ended");
    if (status === "canceled") return t("events.canceled");
    if (status === "cancelled") return t("events.cancelled");
    if (status === "active") return t("events.active");
    return status;
  };

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
      notify(err.message || t("events.loadDetailFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [id, notify, t]);

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
      notify(t("events.participationSaved", { status: getRsvpLabel(status) }));
      await loadDetail();
    } catch (err) {
      notify(err.message || t("events.rsvpFailed"), "error");
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
          photoUrl: eventData.photoUrl,
          date: eventData.date,
          context: eventData.context,
        },
        user,
      );
      notify(t("events.updateSuccess"));
      setIsEditing(false);
      await loadDetail();
    } catch (err) {
      notify(err.message || t("events.updateFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(t("events.cancelConfirm", { title: event.title }))) return;
    setIsSubmitting(true);
    try {
      await eventsApi.cancel(id, user);
      notify(t("events.cancelSuccess"));
      await loadDetail();
    } catch (err) {
      notify(err.message || t("events.cancelFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      await eventsApi.restore(id, user);
      notify(t("events.restoreSuccess"));
      await loadDetail();
    } catch (err) {
      notify(err.message || t("events.restoreFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("events.deleteConfirm", { title: event.title }))) return;
    setIsSubmitting(true);
    try {
      await eventsApi.remove(id, user);
      notify(t("events.deleteSuccess"));
      navigate("/events");
    } catch (err) {
      notify(err.message || t("events.deleteFailed"), "error");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="edv-card edv-loading">{t("events.loadingDetail")}</div>;
  }

  if (!event) {
    return (
      <section className="edv-card edv-loading">
        <p>{t("events.notFound")}</p>
        <Link className="edv-back" to="/events">{t("events.backToEvents")}</Link>
      </section>
    );
  }

  return (
    <>
      <section className="edv-card">
        <div className="edv-topbar">
          <Link className="edv-back" to="/events">{t("events.backToEvents")}</Link>
          <span className={`edv-status ${visualStatus}`}>{getStatusLabel(visualStatus)}</span>
        </div>

        <div className="edv-hero">
          <div className="edv-icon-box">📅</div>
          <div className="edv-heading">
            <h1>{event.title}</h1>
            <div className="edv-meta-grid">
              <div className="edv-meta-item">
                <span>{t("events.date")}</span>
                <strong>{formatEventDate(event.date, t("events.noDate"))}</strong>
              </div>
              <div className="edv-meta-item">
                <span>{t("events.author")}</span>
                <strong>{event.authorName || t("events.userFallback", { id: event.authorId })}</strong>
              </div>
              <div className="edv-meta-item">
                <span>{t("events.location")}</span>
                <strong>{event.context || t("events.noLocation")}</strong>
              </div>
              <div className="edv-meta-item">
                <span>{t("events.myParticipation")}</span>
                <strong>{myRsvp ? getRsvpLabel(myRsvp) : t("events.noRsvp")}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="edv-body-grid">
          <article className="edv-info-panel">
            {event.photoUrl && (
              <img className="edv-photo" src={event.photoUrl} alt="" />
            )}
            <h2>{t("events.description")}</h2>
            <p>{event.description || event.desc || t("events.noDescription")}</p>
          </article>

          <aside className="edv-rsvp-panel">
            <h2>{t("events.participation")}</h2>
            <div className="edv-rsvp-counts">
              <span className="going">✓ {stats.going} {t("events.goingCount")}</span>
              <span className="maybe">? {stats.maybe} {t("events.maybeCount")}</span>
              <span className="not_going">✕ {stats.not_going} {t("events.notGoingCount")}</span>
            </div>
            <div className="edv-rsvp-actions">
              {RSVP_OPTIONS.map((status) => (
                <button
                  key={status}
                  className={`edv-rsvp-btn ${status}${myRsvp === status ? " selected" : ""}`}
                  disabled={isSubmitting || rsvpDisabled}
                  onClick={() => handleRsvp(status)}
                >
                  {getRsvpLabel(status)}
                </button>
              ))}
            </div>
            {rsvpDisabled && (
              <p className="edv-rsvp-note">{t("events.rsvpDisabledNote")}</p>
            )}
          </aside>
        </div>

        {canManage && (
          <div className="edv-action-bar">
            <button className="edv-action edit" onClick={() => setIsEditing(true)} disabled={isSubmitting}>
              {t("events.edit")}
            </button>
            {visualStatus === "canceled" ? (
              <button className="edv-action restore" onClick={handleRestore} disabled={isSubmitting}>
                {t("events.restore")}
              </button>
            ) : (
              <button className="edv-action cancel" onClick={handleCancel} disabled={isSubmitting}>
                {t("events.cancel")}
              </button>
            )}
            <button className="edv-action delete" onClick={handleDelete} disabled={isSubmitting}>
              {t("events.delete")}
            </button>
          </div>
        )}
      </section>

      {isEditing && (
        <div className="edv-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="edv-modal" onClick={(e) => e.stopPropagation()}>
            <EventCreationForm
              title={t("events.editTitle")}
              submitLabel={t("events.saveChanges")}
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