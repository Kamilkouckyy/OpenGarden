import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { reportsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./ReportDetail.css";

const STATUS_NEXT = { new: "in_progress", in_progress: "resolved", resolved: "new" };

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useLanguage();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", photoUrl: "" });
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportsApi.get(id);
      setReport(data);
      setForm({ title: data.title || "", description: data.description || "", photoUrl: data.photoUrl || "" });
    } catch (err) {
      notify(err.message || t("reports.loadDetailFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const canManage = useMemo(() => {
    return user?.role === "admin" || Number(report?.authorId) === Number(user?.id);
  }, [user, report]);

  const getStatusLabel = (status) => {
    if (status === "new") return t("reports.new");
    if (status === "in_progress") return t("reports.inProgress");
    if (status === "resolved") return t("reports.resolved");
    return status;
  };

  const handleAdvance = async () => {
    if (!report) return;
    const next = STATUS_NEXT[report.status];
    if (!next) return;
    setIsSubmitting(true);
    try {
      await reportsApi.update(report.id, { status: next }, user);
      notify(t("reports.statusUpdated"));
      await loadDetail();
    } catch (err) {
      notify(err.message || t("reports.statusChangeFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    setIsSubmitting(true);
    try {
      await reportsApi.remove(report.id, user);
      notify(t("reports.deleteSuccess"), "error");
      navigate("/reports");
    } catch (err) {
      notify(err.message || t("reports.deleteFailed"), "error");
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await reportsApi.update(report.id, { title: form.title, description: form.description, photoUrl: form.photoUrl }, user);
      notify(t("reports.updateSuccess"));
      setIsEditing(false);
      await loadDetail();
    } catch (err) {
      notify(err.message || t("reports.updateFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rd-card rd-loading">{t("reports.loadingDetail")}</div>;
  }

  if (!report) {
    return (
      <section className="rd-card rd-loading">
        <p>{t("reports.notFound")}</p>
        <Link className="rd-back" to="/reports">{t("reports.backToReports")}</Link>
      </section>
    );
  }

  return (
    <>
      <section className="rd-card">
        <div className="rd-topbar">
          <Link className="rd-back" to="/reports">{t("reports.backToReports")}</Link>
          <span className={`rd-status ${report.status}`}>{getStatusLabel(report.status)}</span>
        </div>

        <div className="rd-hero">
          <div className="rd-icon-box">📢</div>
          <div className="rd-heading">
            <h1>{report.title}</h1>
            <div className="rd-meta-grid">
              <div className="rd-meta-item">
                <span>{t("reports.date")}</span>
                <strong>{report.createdAt || report.date || `#${report.id}`}</strong>
              </div>
              <div className="rd-meta-item">
                <span>{t("reports.author")}</span>
                <strong>{report.authorName || t("reports.userFallback", { id: report.authorId })}</strong>
              </div>
              <div className="rd-meta-item">
                <span>{t("reports.context")}</span>
                <strong>{report.context || t("reports.none")}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="rd-body-grid">
          <article className="rd-info-panel">
            {report.photoUrl && <img className="rd-photo" src={report.photoUrl} alt="" />}
            <h2>{t("reports.description")}</h2>
            <p>{report.description || t("reports.noDescription")}</p>
          </article>

          <aside className="rd-info-side">
            <h2>{t("reports.metadata")}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="rd-status-box">{t("reports.status")}:{' '}{getStatusLabel(report.status)}</div>
            </div>
          </aside>
        </div>

        {canManage && (
          <div className="rd-action-bar">
            {STATUS_NEXT[report.status] && (
              <button className="rd-action edit" onClick={handleAdvance} disabled={isSubmitting}>{t("reports.advance")}</button>
            )}
            <button className="rd-action edit" onClick={() => setIsEditing(true)} disabled={isSubmitting}>{t("reports.edit")}</button>
            <button className="rd-action delete" onClick={() => setDeleteConfirmOpen(true)} disabled={isSubmitting}>{t("reports.delete")}</button>
          </div>
        )}
      </section>

      {deleteConfirmOpen && (
        <div className="rd-modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="rd-modal" onClick={(event) => event.stopPropagation()}>
            <h2>{t("reports.deleteConfirm", { title: report.title })}</h2>
            <p>{t("reports.deleteHint")}</p>

            <div className="rd-modal-actions">
              <button className="rd-modal-btn-primary" onClick={handleDelete} disabled={isSubmitting}>
                {t("reports.delete")}
              </button>
              <button className="rd-modal-btn-secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={isSubmitting}>
                {t("reports.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="rd-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("reports.editTitle")}</h2>
            <form onSubmit={handleUpdate}>
              <label>{t("reports.name")} <span className="req">*</span></label>
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />

              <label>{t("reports.description")} <span className="req">*</span></label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

              <label>{t("reports.photoUrl")}</label>
              <input type="url" value={form.photoUrl} onChange={(e) => setForm((p) => ({ ...p, photoUrl: e.target.value }))} />

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="submit" className="rd-action edit" disabled={isSubmitting}>{t("reports.save")}</button>
                <button type="button" className="rd-action" onClick={() => setIsEditing(false)} disabled={isSubmitting}>{t("reports.cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
