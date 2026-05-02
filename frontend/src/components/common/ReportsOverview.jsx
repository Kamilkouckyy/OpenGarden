import { useCallback, useEffect, useState } from "react";
import { reportsApi, equipmentApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./ReportsOverview.css";

const STATUS_NEXT = { new: "in_progress", in_progress: "resolved" };

export default function ReportsOverview() {
  const { user } = useUser();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";

  const [reports, setReports] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", photoUrl: "", equipmentId: "", context: "" });
  const [formLoading, setFormLoading] = useState(false);

  const getStatusLabel = (status) => {
    if (status === "new") return t("reports.new");
    if (status === "in_progress") return t("reports.inProgress");
    if (status === "resolved") return t("reports.resolved");
    return status;
  };

  const getNextStatusLabel = (status) => {
    if (status === "new") return t("reports.startSolving");
    if (status === "in_progress") return t("reports.markResolved");
    return status;
  };

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const [r, eq] = await Promise.all([reportsApi.list(), equipmentApi.list()]);
      setReports(r);
      setEquipment(eq);
    } catch {
      notify(t("reports.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await reportsApi.create({
        title: form.title,
        description: form.description,
        photoUrl: form.photoUrl || undefined,
        equipmentId: form.equipmentId ? Number(form.equipmentId) : undefined,
        context: form.context || undefined,
      }, user);
      notify(t("reports.createSuccess"));
      setShowForm(false);
      setForm({ title: "", description: "", photoUrl: "", equipmentId: "", context: "" });
      load();
    } catch (err) {
      notify(err.message || t("reports.createFailed"), "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (report) => {
    const next = STATUS_NEXT[report.status];
    if (!next) return;
    try {
      await reportsApi.update(report.id, { status: next }, user);
      notify(next === "resolved" ? t("reports.resolvedSuccess") : t("reports.statusUpdated"));
      load();
    } catch (err) {
      notify(err.message || t("reports.statusChangeFailed"), "error");
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(t("reports.deleteConfirm", { title: report.title }))) return;
    try {
      await reportsApi.remove(report.id, user);
      notify(t("reports.deleteSuccess"), "error");
      load();
    } catch (err) {
      notify(err.message || t("reports.deleteFailed"), "error");
    }
  };

  const filtered = reports.filter((r) => filter === "all" || r.status === filter);

  return (
    <>
      <div className="rp-card">
        <div className="rp-header">
          <div className="rp-title-wrap">
            <span className="rp-icon">⚠️</span>
            <h1 className="rp-title">{t("reports.title")}</h1>
          </div>
          <button className="rp-btn-add" onClick={() => setShowForm(true)}>{t("reports.addNew")}</button>
        </div>

        <div className="rp-filters">
          {[["all", t("reports.all")], ["new", t("reports.new")], ["in_progress", t("reports.inProgress")], ["resolved", t("reports.resolved")]].map(([v,l]) => (
            <button key={v} className={`rp-filter-btn${filter === v ? " active" : ""}`} onClick={() => setFilter(v)}>
              {l} ({v === "all" ? reports.length : reports.filter(r => r.status === v).length})
            </button>
          ))}
        </div>

        <div className="rp-list">
          {loading && <div className="rp-empty">{t("reports.loading")}</div>}
          {!loading && filtered.length === 0 && <div className="rp-empty">{t("reports.empty")}</div>}

          {!loading && filtered.map((report) => {
            const canAct = isAdmin || report.authorId === user?.id;
            return (
              <div key={report.id} className={`rp-row rp-row--${report.status}`}>
                <div className="rp-row-main">
                  <div className="rp-row-top">
                    <span className="rp-row-title">{report.title}</span>
                    <span className={`rp-badge rp-badge--${report.status}`}>{getStatusLabel(report.status)}</span>
                  </div>
                  <div className="rp-row-desc">{report.description}</div>
                  <div className="rp-row-meta">
                    {report.context && <span className="rp-tag">{report.context}</span>}
                    <span className="rp-author">{t("reports.author")}: {report.authorName}</span>
                    {report.photoUrl && <a href={report.photoUrl} target="_blank" rel="noreferrer" className="rp-photo-link">📷 {t("reports.photo")}</a>}
                  </div>
                </div>
                <div className="rp-row-actions">
                  {canAct && STATUS_NEXT[report.status] && (
                    <button className="rp-action-btn rp-advance" onClick={() => handleStatusChange(report)}>
                      {getNextStatusLabel(report.status)}
                    </button>
                  )}
                  {canAct && (
                    <button className="rp-action-btn rp-delete" onClick={() => handleDelete(report)}>{t("reports.delete")}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="rp-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("reports.newReport")}</h2>
            <form onSubmit={handleCreate}>
              <label>{t("reports.name")} <span className="req">*</span></label>
              <input maxLength={200} required value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} placeholder={t("reports.titlePlaceholder")} />

              <label>{t("reports.description")} <span className="req">*</span></label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder={t("reports.descriptionPlaceholder")} />

              <label>{t("reports.photoUrl")}</label>
              <input type="url" value={form.photoUrl} onChange={(e) => setForm(p => ({...p, photoUrl: e.target.value}))} placeholder={t("reports.photoPlaceholder")} />

              <label>{t("reports.equipmentHint")}</label>
              <select value={form.equipmentId} onChange={(e) => setForm(p => ({...p, equipmentId: e.target.value}))}>
                <option value="">{t("reports.none")}</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>

              <label>{t("reports.contextHint")}</label>
              <input maxLength={100} value={form.context} onChange={(e) => setForm(p => ({...p, context: e.target.value}))} placeholder={t("reports.contextPlaceholder")} />

              <div className="rp-modal-actions">
                <button type="submit" disabled={formLoading} className="rp-modal-btn-primary">
                  {formLoading ? t("reports.submitting") : t("reports.submitReport")}
                </button>
                <button type="button" className="rp-modal-btn-secondary" onClick={() => setShowForm(false)}>{t("reports.cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}