import { useCallback, useEffect, useState } from "react";
import { eventsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import "./EventsOverview.css";

const RSVP_LABEL = { going: "Zúčastním se", maybe: "Možná", not_going: "Nezúčastním se" };
const RSVP_OPTIONS = ["going", "maybe", "not_going"];

function isPast(dateStr) {
  return new Date(dateStr) < new Date();
}

export default function EventsOverview() {
  const { user } = useUser();
  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState([]);
  const [participations, setParticipations] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [expandedRsvp, setExpandedRsvp] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await eventsApi.list();
      setEvents(data);
      const parts = {};
      await Promise.all(data.map(async (ev) => {
        try {
          parts[ev.id] = await eventsApi.getParticipations(ev.id);
        } catch { parts[ev.id] = []; }
      }));
      setParticipations(parts);
    } catch {
      notify("Nepodařilo se načíst události.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await eventsApi.create({ ...form, date: form.date }, user);
      notify("Událost byla vytvořena.");
      setShowForm(false);
      setForm({ title: "", description: "", date: "" });
      load();
    } catch (err) {
      notify(err.message || "Vytvoření se nezdařilo.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (event) => {
    if (!window.confirm(`Zrušit událost „${event.title}"?`)) return;
    try {
      await eventsApi.cancel(event.id, user);
      notify("Událost byla zrušena.");
      load();
    } catch (err) {
      notify(err.message || "Zrušení se nezdařilo.", "error");
    }
  };

  const handleRestore = async (event) => {
    try {
      await eventsApi.restore(event.id, user);
      notify("Událost byla obnovena.");
      load();
    } catch (err) {
      notify(err.message || "Obnovení se nezdařilo.", "error");
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Trvale smazat událost „${event.title}"?`)) return;
    try {
      await eventsApi.remove(event.id, user);
      notify("Událost byla smazána.", "error");
      load();
    } catch (err) {
      notify(err.message || "Smazání se nezdařilo.", "error");
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      await eventsApi.updateParticipation(eventId, status, user);
      notify(`RSVP nastaveno: ${RSVP_LABEL[status]}`);
      load();
    } catch (err) {
      notify(err.message || "RSVP se nezdařilo.", "error");
    }
  };

  const myRsvp = (eventId) => {
    const p = participations[eventId] || [];
    return p.find((x) => x.userId === user?.id)?.status;
  };

  const countRsvp = (eventId, status) =>
    (participations[eventId] || []).filter((x) => x.status === status).length;

  const filtered = events.filter((ev) => {
    if (filter === "active") return ev.status === "active";
    if (filter === "cancelled") return ev.status === "cancelled";
    if (filter === "past") return isPast(ev.date) && ev.status === "active";
    return true;
  });

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <>
      <div className="ev-card">
        <div className="ev-header">
          <div className="ev-title-wrap">
            <span className="ev-icon">📅</span>
            <h1 className="ev-title">Komunitní události</h1>
          </div>
          <button className="ev-btn-add" onClick={() => setShowForm(true)}>+ Nová událost</button>
        </div>

        <div className="ev-filters">
          {[["all","Všechny"],["active","Aktivní"],["past","Proběhlé"],["cancelled","Zrušené"]].map(([v,l]) => (
            <button key={v} className={`ev-filter-btn${filter === v ? " active" : ""}`} onClick={() => setFilter(v)}>
              {l} ({
                v === "all" ? events.length :
                v === "active" ? events.filter(ev => ev.status === "active").length :
                v === "past" ? events.filter(ev => isPast(ev.date) && ev.status === "active").length :
                events.filter(ev => ev.status === "cancelled").length
              })
            </button>
          ))}
        </div>

        <div className="ev-list">
          {loading && <div className="ev-empty">Načítám události…</div>}
          {!loading && filtered.length === 0 && <div className="ev-empty">Žádné události k zobrazení.</div>}

          {!loading && filtered.map((ev) => {
            const past = isPast(ev.date);
            const canAct = isAdmin || ev.authorId === user?.id;
            const mine = myRsvp(ev.id);
            const parts = participations[ev.id] || [];

            return (
              <div key={ev.id} className={`ev-row${ev.status === "cancelled" ? " cancelled" : past ? " past" : ""}`}>
                <div className="ev-row-main">
                  <div className="ev-row-top">
                    <span className="ev-row-title">{ev.title}</span>
                    <div className="ev-badges">
                      {ev.status === "cancelled" && <span className="ev-badge cancelled">Zrušeno</span>}
                      {ev.status === "active" && past && <span className="ev-badge past">Proběhlo</span>}
                      {ev.status === "active" && !past && <span className="ev-badge active">Aktivní</span>}
                    </div>
                  </div>
                  <div className="ev-row-date">
                    📅 {new Date(ev.date).toLocaleDateString("cs-CZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </div>
                  {ev.description && <div className="ev-row-desc">{ev.description}</div>}

                  <div className="ev-rsvp-summary">
                    <span className="ev-rsvp-count going">✓ {countRsvp(ev.id, "going")}</span>
                    <span className="ev-rsvp-count maybe">? {countRsvp(ev.id, "maybe")}</span>
                    <span className="ev-rsvp-count not_going">✗ {countRsvp(ev.id, "not_going")}</span>
                    {parts.length > 0 && (
                      <button className="ev-rsvp-toggle" onClick={() => setExpandedRsvp(expandedRsvp === ev.id ? null : ev.id)}>
                        {expandedRsvp === ev.id ? "Skrýt účastníky" : "Zobrazit účastníky"}
                      </button>
                    )}
                  </div>

                  {expandedRsvp === ev.id && (
                    <div className="ev-rsvp-list">
                      {parts.map((p) => (
                        <span key={p.id} className={`ev-rsvp-pill ${p.status}`}>
                          Uživatel #{p.userId} — {RSVP_LABEL[p.status]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ev-row-actions">
                  {ev.status === "active" && !past && (
                    <div className="ev-rsvp-btns">
                      {RSVP_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          className={`ev-rsvp-btn${mine === opt ? " selected" : ""}`}
                          onClick={() => handleRsvp(ev.id, opt)}
                        >
                          {RSVP_LABEL[opt]}
                        </button>
                      ))}
                    </div>
                  )}
                  {canAct && ev.status === "active" && (
                    <button className="ev-action-btn ev-cancel" onClick={() => handleCancel(ev)}>Zrušit</button>
                  )}
                  {canAct && ev.status === "cancelled" && (
                    <button className="ev-action-btn ev-restore" onClick={() => handleRestore(ev)}>Obnovit</button>
                  )}
                  {canAct && (
                    <button className="ev-action-btn ev-delete" onClick={() => handleDelete(ev)}>Smazat</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="ev-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nová událost</h2>
            <form onSubmit={handleCreate}>
              <label>Název <span className="req">*</span></label>
              <input maxLength={200} required value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} placeholder="Spring Bonfire, Brigáda…" />

              <label>Datum <span className="req">*</span></label>
              <input type="datetime-local" required min={minDate.toISOString().slice(0,16)} value={form.date} onChange={(e) => setForm(p => ({...p, date: e.target.value}))} />

              <label>Popis</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder="Volitelný popis události…" />

              <div className="ev-modal-actions">
                <button type="submit" disabled={formLoading} className="ev-modal-btn-primary">
                  {formLoading ? "Vytvářím…" : "Vytvořit událost"}
                </button>
                <button type="button" className="ev-modal-btn-secondary" onClick={() => setShowForm(false)}>Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
