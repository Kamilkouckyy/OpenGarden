import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tasksApi, gardenBedsApi, reportsApi, eventsApi, equipmentApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./TaskPanelOverview.css";

const STATUS_CLASS = { open: "open", in_progress: "in-progress", done: "done" };

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function TaskPanelOverview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUser();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [beds, setBeds] = useState([]);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "",
    resolverId: "", linkedType: "", linkedId: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [openedFromQuery, setOpenedFromQuery] = useState(false);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch {
      notify(t("tasks.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openForm = useCallback(async (prefill = {}) => {
    const linkedType = prefill.linkedType ?? searchParams.get("linkedType") ?? "";
    const linkedId = prefill.linkedId ?? searchParams.get("linkedId") ?? "";
    setForm({ title: "", description: "", dueDate: "", resolverId: "", linkedType, linkedId });
    setShowForm(true);
    try {
      const [b, r, e, eq] = await Promise.all([
        gardenBedsApi.list(),
        reportsApi.list(),
        eventsApi.list(),
        equipmentApi.list(),
      ]);
      setBeds(b);
      setReports(r);
      setEvents(e);
      setEquipment(eq);
    } catch {}
  }, [searchParams]);

  useEffect(() => {
    const linkedType = searchParams.get("linkedType");
    const linkedId = searchParams.get("linkedId");

    if (!linkedType || !linkedId || openedFromQuery) {
      return;
    }

    setOpenedFromQuery(true);
    openForm({ linkedType, linkedId });
    setSearchParams({}, { replace: true });
  }, [openForm, openedFromQuery, searchParams, setSearchParams]);

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
      notify(t("tasks.createdSuccess"));
      setShowForm(false);
      load();
    } catch (err) {
      notify(err.message || t("tasks.createFailed"), "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (task) => {
    try {
      await tasksApi.toggleStatus(task.id, user);
      load();
    } catch (err) {
      notify(err.message || t("tasks.statusChangeFailed"), "error");
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(t("tasks.deleteConfirm", { title: task.title }))) return;
    try {
      await tasksApi.remove(task.id, user);
      notify(t("tasks.deleteSuccess"), "error");
      load();
    } catch (err) {
      notify(err.message || t("tasks.deleteFailed"), "error");
    }
  };

const filtered = tasks
  .filter((task) => filter === "all" || task.status === filter)
  .sort((a, b) => {
    const aDone = a.status === "done";
    const bDone = b.status === "done";

    if (aDone && !bDone) return 1;
    if (!aDone && bDone) return -1;

    const aOverdue = isOverdue(a.dueDate) && !aDone;
    const bOverdue = isOverdue(b.dueDate) && !bDone;

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const getStatusLabel = (status) => {
    if (status === "open") return t("tasks.open");
    if (status === "in_progress") return t("tasks.inProgress");
    if (status === "done") return t("tasks.done");
    return status;
  };

  return (
    <>
      <div className="tp-card">
        <div className="tp-header">
          <div className="tp-title-wrap">
            <span className="tp-icon">✅</span>
            <h1 className="tp-title">{t("tasks.title")}</h1>
          </div>
          <button className="tp-btn-add" onClick={openForm}>{t("tasks.addNew")}</button>
        </div>

        <div className="tp-filters">
          {[
            ["all", t("tasks.all")],
            ["open", t("tasks.open")],
            ["in_progress", t("tasks.inProgress")],
            ["done", t("tasks.done")],
          ].map(([value, label]) => (
            <button key={value} className={`tp-filter-btn${filter === value ? " active" : ""}`} onClick={() => setFilter(value)}>
              {label}
              {` (${value === "all" ? tasks.length : tasks.filter(task => task.status === value).length})`}
            </button>
          ))}
        </div>

        <div className="tp-list">
          {loading && <div className="tp-empty">{t("tasks.loading")}</div>}
          {!loading && filtered.length === 0 && <div className="tp-empty">{t("tasks.empty")}</div>}

          {!loading && filtered.map((task) => {
            const canEdit = isAdmin || task.authorId === user?.id;
            const overdue = isOverdue(task.dueDate) && task.status !== "done";

            return (
              <div
                key={task.id}
                className={`tp-task-row ${STATUS_CLASS[task.status] || "open"}${overdue ? " overdue" : ""}`}
              >
                <div className="tp-task-main">
                  <span className={`tp-status-dot ${STATUS_CLASS[task.status]}`} title={getStatusLabel(task.status)} />
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
                  <button className="tp-action-btn tp-toggle" onClick={() => handleToggle(task)} title={t("tasks.toggleStatusTitle")}>
                    {task.status === "done" ? t("tasks.reopen") : t("tasks.complete")}
                  </button>
                  {canEdit && (
                    <button className="tp-action-btn tp-detail" onClick={() => navigate(`/tasks/${task.id}`)}>
                      {t("tasks.detail")}
                    </button>
                  )}
                  {canEdit && (
                    <button className="tp-action-btn tp-delete" onClick={() => handleDelete(task)}>
                      {t("tasks.delete")}
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
            <h2>{t("tasks.newTask")}</h2>
            <form onSubmit={handleCreate}>
              <label>{t("tasks.name")} <span className="req">*</span></label>
              <input maxLength={255} required value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} placeholder={t("tasks.taskPlaceholder")} />

              <label>{t("tasks.deadline")}</label>
              <input type="date" min={new Date().toISOString().split("T")[0]} value={form.dueDate} onChange={(e) => setForm(p => ({...p, dueDate: e.target.value}))} />

              <label>{t("tasks.linkTo")}</label>
              <select value={form.linkedType} onChange={(e) => setForm(p => ({...p, linkedType: e.target.value, linkedId: ""}))}>
                <option value="">{t("tasks.none")}</option>
                <option value="plot">{t("tasks.gardenBed")}</option>
                <option value="report">{t("tasks.report")}</option>
                <option value="event">{t("tasks.event")}</option>
                <option value="equipment">{t("tasks.equipment")}</option>
              </select>

              {form.linkedType === "plot" && (
                <select value={form.linkedId} onChange={(e) => setForm(p => ({...p, linkedId: e.target.value}))}>
                  <option value="">{t("tasks.selectGardenBed")}</option>
                  {beds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
              {form.linkedType === "report" && (
                <select value={form.linkedId} onChange={(e) => setForm(p => ({...p, linkedId: e.target.value}))}>
                  <option value="">{t("tasks.selectReport")}</option>
                  {reports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              )}
              {form.linkedType === "event" && (
                <select value={form.linkedId} onChange={(e) => setForm(p => ({...p, linkedId: e.target.value}))}>
                  <option value="">{t("tasks.selectEvent")}</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              )}
              {form.linkedType === "equipment" && (
                <select value={form.linkedId} onChange={(e) => setForm(p => ({...p, linkedId: e.target.value}))}>
                  <option value="">{t("tasks.selectEquipment")}</option>
                  {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                </select>
              )}

              <label>{t("tasks.description")}</label>
              <textarea maxLength={4000} rows={3} value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder={t("tasks.descriptionPlaceholder")} />

              <div className="tp-modal-actions">
                <button type="submit" disabled={formLoading} className="tp-modal-btn-primary">
                  {formLoading ? t("tasks.creating") : t("tasks.createTask")}
                </button>
                <button type="button" className="tp-modal-btn-secondary" onClick={() => setShowForm(false)}>{t("tasks.cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}