import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tasksApi, gardenBedsApi, reportsApi, eventsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import "./TaskPanelOverview.css";

const STATUS_LABEL = { open: "Otevřený", in_progress: "Probíhá", done: "Dokončený" };
const STATUS_CLASS = { open: "open", in_progress: "in-progress", done: "done" };

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function TaskPanelOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const isAdmin = user?.role === "admin";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [beds, setBeds] = useState([]);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "",
    resolverId: "", linkedType: "", linkedId: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch {
      notify("Nepodařilo se načíst úkoly.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openForm = async () => {
    const linkedType = searchParams.get("linkedType") || "";
    const linkedId = searchParams.get("linkedId") || "";
    setForm({ title: "", description: "", dueDate: "", resolverId: "", linkedType, linkedId });
    setShowForm(true);
    try {
      const [b, r, e] = await Promise.all([gardenBedsApi.list(), reportsApi.list(), eventsApi.list()]);
      setBeds(b); setReports(r); setEvents(e);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
        resolverId: form.resolverId ? Number(form.resolverId) : undefined,
        linkedType: form.linkedType || undefined,
        linkedId: form.linkedId ? Number(form.linkedId) : undefined,
      };
      await tasksApi.create(payload, user);
      notify("Úkol byl vytvořen.");
      setShowForm(false);
      load();
    } catch (err) {
      notify(err.message || "Vytvoření se nezdařilo.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (task) => {
    try {
      await tasksApi.toggleStatus(task.id, user);
      load();
    } catch (err) {
      notify(err.message || "Změna stavu se nezdařila.", "error");
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Smazat úkol „${task.title}"?`)) return;
    try {
      await tasksApi.remove(task.id, user);
      notify("Úkol byl smazán.", "error");
      load();
    } catch (err) {
      notify(err.message || "Smazání se nezdařilo.", "error");
    }
  };

  const filtered = tasks.filter((t) => filter === "all" || t.status === filter);

  return (
    <>
      <div className="tp-card">
        <div className="tp-header">
          <div className="tp-title-wrap">
            <span className="tp-icon">✅</span>
            <h1 className="tp-title">Správa úkolů</h1>
          </div>
          <button className="tp-btn-add" onClick={openForm}>+ Nový úkol</button>
        </div>

        <div className="tp-filters">
          {[["all","Všechny"],["open","Otevřené"],["in_progress","Probíhají"],["done","Dokončené"]].map(([v,l]) => (
            <button key={v} className={`tp-filter-btn${filter === v ? " active" : ""}`} onClick={() => setFilter(v)}>
              {l}
              {` (${v === "all" ? tasks.length : tasks.filter(t => t.status === v).length})`}
            </button>
          ))}
        </div>

        <div className="tp-list">
          {loading && <div className="tp-empty">Načítám úkoly…</div>}
          {!loading && filtered.length === 0 && <div className="tp-empty">Žádné úkoly k zobrazení.</div>}

          {!loading && filtered.map((task) => {
            const canEdit = isAdmin || task.authorId === user?.id;
            const overdue = isOverdue(task.dueDate) && task.status !== "done";

            return (
              <div key={task.id} className={`tp-task-row${task.status === "done" ? " done" : ""}${overdue ? " overdue" : ""}`}>
                <div className="tp-task-main">
                  <span className={`tp-status-dot ${STATUS_CLASS[task.status]}`} title={STATUS_LABEL[task.status]} />
                  <div className="tp-task-info">
                    <span className="tp-task-title">{task.title}</span>
                    <span className="tp-task-meta">
                      {task.context && <span className="tp-tag">{task.context}</span>}
                      {task.dueDate && (
                        <span className={`tp-due${overdue ? " tp-due--overdue" : ""}`}>
                          {overdue ? "⚠ " : ""}
                          {new Date(task.dueDate).toLocaleDateString("cs-CZ")}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="tp-task-actions">
                  <button className="tp-action-btn tp-toggle" onClick={() => handleToggle(task)} title="Přepnout stav">
                    {task.status === "done" ? "↩ Znovu otevřít" : "✓ Dokončit"}
                  </button>
                  {canEdit && (
                    <button className="tp-action-btn tp-detail" onClick={() => navigate(`/tasks/${task.id}`)}>
                      Detail
                    </button>
                  )}
                  {canEdit && (
                    <button className="tp-action-btn tp-delete" onClick={() => handleDelete(task)}>
                      Smazat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="tp-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="tp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nový úkol</h2>
            <form onSubmit={handleCreate}>
              <label>Název <span className="req">*</span></label>
              <input maxLength={255} required value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} placeholder="Popis úkolu…" />

              <label>Termín</label>
              <input type="date" min={new Date().toISOString().split("T")[0]} value={form.dueDate} onChange={(e) => setForm(p => ({...p, dueDate: e.target.value}))} />

              <label>Navázat na</label>
              <select value={form.linkedType} onChange={(e) => setForm(p => ({...p, linkedType: e.target.value, linkedId: ""}))}>
                <option value="">— žádné —</option>
                <option value="plot">Záhon</option>
                <option value="report">Hlášení</option>
                <option value="event">Událost</option>
              </select>

              {form.linkedType === "plot" && (
                <select value={form.linkedId} onChange={(e) => setForm(p => ({...p, linkedId: e.target.value}))}>
                  <option value="">Vyber záhon…</option>
                  {beds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
              {form.linkedType === "report" && (
                <select value={form.linkedId} onChange={(e) => setForm(p => ({...p, linkedId: e.target.value}))}>
                  <option value="">Vyber hlášení…</option>
                  {reports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              )}
              {form.linkedType === "event" && (
                <select value={form.linkedId} onChange={(e) => setForm(p => ({...p, linkedId: e.target.value}))}>
                  <option value="">Vyber událost…</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              )}

              <label>Popis</label>
              <textarea maxLength={4000} rows={3} value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder="Volitelný popis…" />

              <div className="tp-modal-actions">
                <button type="submit" disabled={formLoading} className="tp-modal-btn-primary">
                  {formLoading ? "Vytvářím…" : "Vytvořit úkol"}
                </button>
                <button type="button" className="tp-modal-btn-secondary" onClick={() => setShowForm(false)}>Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
