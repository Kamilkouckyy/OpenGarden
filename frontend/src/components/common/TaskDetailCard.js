import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { tasksApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import TaskStatusModal from "./TaskStatusModal";
import "./TaskDetailCard.css";

const STATUS_LABEL = { open: "Otevřený", in_progress: "Probíhá", done: "Dokončený" };

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("cs-CZ", { year: "numeric", month: "long", day: "numeric" });
}

export default function TaskDetailCard() {
  const { id } = useParams();
  const { user } = useUser();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("open");
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await tasksApi.get(id);
      setTask(data);
      setFormData(data);
      setSelectedStatus(data.status);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="task-detail__loading">Načítám…</div>;
  if (notFound) return (
    <section className="task-detail">
      <div className="task-detail__card">
        <p className="task-detail__empty">Úkol nebyl nalezen.</p>
        <div className="task-detail__footer-actions">
          <Link to="/tasks" className="task-detail__btn task-detail__btn--secondary">Zpět na přehled</Link>
        </div>
      </div>
    </section>
  );

  const isAdmin = user?.role === "admin";
  const isAuthor = user?.id === task.authorId;
  const canEdit = isAdmin || isAuthor;

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const updated = await tasksApi.update(id, {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate || undefined,
      }, user);
      setTask(updated);
      setIsEditMode(false);
      notify("Úkol byl upraven.");
    } catch (err) {
      notify(err.message || "Uložení se nezdařilo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatus = async () => {
    try {
      const updated = await tasksApi.toggleStatus(id, user);
      setTask(updated);
      setSelectedStatus(updated.status);
      setShowStatusModal(false);
      notify("Stav úkolu byl změněn.");
    } catch (err) {
      notify(err.message || "Změna stavu se nezdařila.", "error");
    }
  };

  return (
    <>
      <section className="task-detail">
        <div className="task-detail__card">
          <div className="task-detail__form">
            <div className="task-detail__field">
              <label className="task-detail__label">Název</label>
              {isEditMode
                ? <input className="task-detail__input" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} />
                : <div className="task-detail__value-box">{task.title}</div>
              }
            </div>

            <div className="task-detail__field">
              <label className="task-detail__label">Kontext</label>
              <div className="task-detail__value-box">{task.context}</div>
            </div>

            <div className="task-detail__field task-detail__field--small">
              <label className="task-detail__label">Termín</label>
              {isEditMode
                ? <input type="date" className="task-detail__input task-detail__input--small" value={formData.dueDate || ""} onChange={(e) => setFormData(p => ({...p, dueDate: e.target.value}))} />
                : <div className="task-detail__value-box task-detail__value-box--small">{formatDate(task.dueDate)}</div>
              }
            </div>

            <div className="task-detail__field">
              <label className="task-detail__label">Popis</label>
              {isEditMode
                ? <textarea className="task-detail__textarea" rows={4} value={formData.description || ""} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} />
                : <div className="task-detail__value-box task-detail__value-box--textarea">
                    {task.description || <em>Bez popisu</em>}
                  </div>
              }
            </div>

            <div className="task-detail__status-row">
              <span className="task-detail__label">Stav</span>
              <div className="task-detail__status-right">
                <div className="task-detail__value-box task-detail__value-box--status">
                  {STATUS_LABEL[task.status] || task.status}
                </div>
                <button type="button" className="task-detail__btn" onClick={() => setShowStatusModal(true)}>
                  Změnit stav
                </button>
              </div>
            </div>

            <div className="task-detail__edit-row">
              {canEdit && !isEditMode && (
                <>
                  <button type="button" className="task-detail__btn" onClick={() => { setFormData(task); setIsEditMode(true); }}>
                    Upravit
                  </button>
                  <button type="button" className="task-detail__btn task-detail__btn--danger"
                    onClick={async () => {
                      if (!window.confirm(`Smazat úkol „${task.title}"?`)) return;
                      try { await tasksApi.remove(id, user); window.location.href = "/tasks"; }
                      catch (err) { notify(err.message || "Smazání se nezdařilo.", "error"); }
                    }}>
                    Smazat
                  </button>
                </>
              )}
              {isEditMode && (
                <>
                  <button type="button" className="task-detail__btn" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? "Ukládám…" : "Uložit"}
                  </button>
                  <button type="button" className="task-detail__btn task-detail__btn--secondary" onClick={() => setIsEditMode(false)}>
                    Zrušit
                  </button>
                </>
              )}
            </div>

            <div className="task-detail__divider" />
            <div className="task-detail__footer-actions">
              <Link to="/tasks" className="task-detail__btn task-detail__btn--secondary">
                Zpět na přehled úkolů
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TaskStatusModal
        isOpen={showStatusModal}
        selectedStatus={selectedStatus}
        onChange={setSelectedStatus}
        onSave={handleSaveStatus}
        onCancel={() => setShowStatusModal(false)}
      />

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
