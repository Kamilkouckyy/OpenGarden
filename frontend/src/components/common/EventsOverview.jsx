import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { eventsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import EventCreationForm from "./EventCreationForm";
import "./EventsOverview.css";

const STATUS_LABEL = {
  upcoming: "Nadcházející",
  ended: "Proběhlá",
  canceled: "Zrušená",
  cancelled: "Zrušená",
  active: "Aktivní",
};

const RSVP_LABEL = {
  going: "Jdu",
  maybe: "Možná",
  not_going: "Nejdu",
  "not-going": "Nejdu",
};

function isPast(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function getVisualStatus(event) {
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

function getParticipationStats(participants = []) {
  return participants.reduce(
    (acc, item) => {
      const status = item.status === "not-going" ? "not_going" : item.status;
      if (acc[status] !== undefined) acc[status] += 1;
      return acc;
    },
    { going: 0, maybe: 0, not_going: 0 },
  );
}

export default function EventsOverview() {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [participations, setParticipations] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 2800);
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const eventList = await eventsApi.list();
      setEvents(Array.isArray(eventList) ? eventList : eventList?.eventList || []);

      const nextParticipations = {};
      await Promise.all(
        (Array.isArray(eventList) ? eventList : eventList?.eventList || []).map(async (event) => {
          try {
            nextParticipations[event.id] = await eventsApi.getParticipations(event.id);
          } catch {
            nextParticipations[event.id] = [];
          }
        }),
      );
      setParticipations(nextParticipations);
    } catch (err) {
      notify(err.message || "Nepodařilo se načíst události.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const counts = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        acc.all += 1;
        acc[getVisualStatus(event)] += 1;
        return acc;
      },
      { all: 0, upcoming: 0, ended: 0, canceled: 0 },
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => filter === "all" || getVisualStatus(event) === filter)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, filter]);

  const handleCreate = async (eventData) => {
    setIsSubmitting(true);
    try {
      await eventsApi.create(
        {
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
        },
        user,
      );
      notify("Událost byla vytvořena.");
      setShowForm(false);
      await loadEvents();
    } catch (err) {
      notify(err.message || "Vytvoření události se nezdařilo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="ev-card">
        <div className="ev-header">
          <div className="ev-title-wrap">
            <span className="ev-icon">📅</span>
            <div>
              <h1 className="ev-title">Komunitní události</h1>
              <p className="ev-subtitle">Přehled akcí, workshopů a společných aktivit v zahradě.</p>
            </div>
          </div>
          <button className="ev-btn-add" onClick={() => setShowForm(true)}>
            + Nová událost
          </button>
        </div>

        <div className="ev-filters" aria-label="Filtr událostí">
          {[
            ["all", "Všechny", counts.all],
            ["upcoming", "Nadcházející", counts.upcoming],
            ["ended", "Proběhlé", counts.ended],
            ["canceled", "Zrušené", counts.canceled],
          ].map(([value, label, count]) => (
            <button
              key={value}
              className={`ev-filter-btn${filter === value ? " active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        <div className="ev-list">
          {loading && <div className="ev-empty">Načítám události…</div>}
          {!loading && filteredEvents.length === 0 && (
            <div className="ev-empty">No tasks available</div>
          )}

          {!loading &&
            filteredEvents.map((event) => {
              const visualStatus = getVisualStatus(event);
              const stats = getParticipationStats(participations[event.id] || []);

              return (
                <article key={event.id} className={`ev-row ${visualStatus}`}>
                  <div className="ev-status-line" />
                  <div className="ev-row-main">
                    <div className="ev-row-top">
                      <h2 className="ev-row-title">{event.title}</h2>
                      <span className={`ev-badge ${visualStatus}`}>
                        {STATUS_LABEL[visualStatus]}
                      </span>
                    </div>
                    <div className="ev-row-date">📅 {formatEventDate(event.date)}</div>
                    {event.description && <p className="ev-row-desc">{event.description}</p>}

                    <div className="ev-rsvp-summary">
                      <span className="ev-rsvp-count going">✓ {RSVP_LABEL.going}: {stats.going}</span>
                      <span className="ev-rsvp-count maybe">? {RSVP_LABEL.maybe}: {stats.maybe}</span>
                      <span className="ev-rsvp-count not_going">✕ {RSVP_LABEL.not_going}: {stats.not_going}</span>
                    </div>
                  </div>

                  <div className="ev-row-actions">
                    <Link className="ev-detail-btn" to={`/events/${event.id}`}>
                      Detail události
                    </Link>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      {showForm && (
        <div className="ev-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
            <EventCreationForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
