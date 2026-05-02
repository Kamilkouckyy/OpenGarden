import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { tasksApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import TaskStatusModal from "./TaskStatusModal";
import "./TaskDetailCard.css";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("cs-CZ", { year: "numeric", month: "long", day: "numeric" });
}

export default function TaskDetailCard() {
  const { id } = useParams();
  const { user } = useUser();
  const { t } = useLanguage();

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

  const getStatusLabel = (status) => {
    if (status === "open") return t("tasks.open");
    if (status === "in_progress") return t("tasks.inProgress");
    if (status === "done") return t("tasks.done");
    return status;
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

  if (loading) return <div className="task-detail__loading">{t("tasks.loadingDetail")}</div>;
  if (notFound) return (
    <section className="task-detail">
      <div className="task-detail__card">
        <p className="task-detail__empty">{t("tasks.notFound")}</p>
        <div className="task-detail__footer-actions">
          <Link to="/tasks" className="task-detail__btn task-detail__btn--secondary">{t("tasks.backToOverview")}</Link>
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
      notify(t("tasks.updateSuccess"));
    } catch (err) {
      notify(err.message || t("tasks.updateFailed"), "error");
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
      notify(t("tasks.statusUpdateSuccess"));
    } catch (err) {
      notify(err.message || t("tasks.statusChangeFailed"), "error");
    }
  };

  return (
    <>
      <section className="task-detail">
        <div className="task-detail__card">
          <div className="task-detail__form">
            <div className="task-detail__field">
              <label className="task-detail__label">{t("tasks.name")}</label>
              {isEditMode
                ? <input className="task-detail__input" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} />
                : <div className="task-detail__value-box">{task.title}</div>
              }
            </div>

            <div className="task-detail__field">
              <label className="task-detail__label">{t("tasks.context")}</label>
              <div className="task-detail__value-box">{task.context}</div>
            </div>

            <div className="task-detail__field task-detail__field--small">
              <label className="task-detail__label">{t("tasks.deadline")}</label>
              {isEditMode
                ? <input type="date" className="task-detail__input task-detail__input--small" value={formData.dueDate || ""} onChange={(e) => setFormData(p => ({...p, dueDate: e.target.value}))} />
                : <div className="task-detail__value-box task-detail__value-box--small">{formatDate(task.dueDate)}</div>
              }
            </div>

            <div className="task-detail__field">
              <label className="task-detail__label">{t("tasks.description")}</label>
              {isEditMode
                ? <textarea className="task-detail__textarea" rows={4} value={formData.description || ""} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} />
                : <div className="task-detail__value-box task-detail__value-box--textarea">
                    {task.description || <em>{t("tasks.noDescription")}</em>}
                  </div>
              }
            </div>

            <div className="task-detail__status-row">
              <span className="task-detail__label">{t("tasks.status")}</span>
              <div className="task-detail__status-right">
                <div className="task-detail__value-box task-detail__value-box--status">
                  {getStatusLabel(task.status)}
                </div>
                <button type="button" className="task-detail__btn" onClick={() => setShowStatusModal(true)}>
                  {t("tasks.changeStatus")}
                </button>
              </div>
            </div>

            <div className="task-detail__edit-row">
              {canEdit && !isEditMode && (
                <>
                  <button type="button" className="task-detail__btn" onClick={() => { setFormData(task); setIsEditMode(true); }}>
                    {t("tasks.edit")}
                  </button>
                  <button type="button" className="task-detail__btn task-detail__btn--danger"
                    onClick={async () => {
                      if (!window.confirm(t("tasks.deleteConfirm", { title: task.title }))) return;
                      try { await tasksApi.remove(id, user); window.location.href = "/tasks"; }
                      catch (err) { notify(err.message || t("tasks.deleteFailed"), "error"); }
                    }}>
                    {t("tasks.delete")}
                  </button>
                </>
              )}
              {isEditMode && (
                <>
                  <button type="button" className="task-detail__btn" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? t("tasks.saving") : t("tasks.save")}
                  </button>
                  <button type="button" className="task-detail__btn task-detail__btn--secondary" onClick={() => setIsEditMode(false)}>
                    {t("tasks.cancel")}
                  </button>
                </>
              )}
            </div>

            <div className="task-detail__divider" />
            <div className="task-detail__footer-actions">
              <Link to="/tasks" className="task-detail__btn task-detail__btn--secondary">
                {t("tasks.backToTasks")}
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