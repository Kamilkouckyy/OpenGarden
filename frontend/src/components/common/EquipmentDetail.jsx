import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { equipmentApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./ReportDetail.css";

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useLanguage();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await equipmentApi.get(id);
      setItem(data);
    } catch (err) {
      notify(err.message || t("equipment.loadDetailFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const canManage = useMemo(() => {
    return user?.role === "admin" || Number(item?.authorId) === Number(user?.id);
  }, [user, item]);

  const getStatusLabel = (status) => {
    if (status === "functional") return t("equipment.functional");
    if (status === "non_functional") return t("equipment.nonFunctional");
    return status;
  };

  const handleToggleStatus = async () => {
    if (!item) return;
    const next = item.status === "functional" ? "non_functional" : "functional";

    setIsSubmitting(true);
    try {
      await equipmentApi.update(item.id, { status: next }, user);
      notify(t("equipment.statusChanged", { status: getStatusLabel(next) }));
      await loadDetail();
    } catch (err) {
      notify(err.message || t("equipment.statusChangeFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !window.confirm(t("equipment.deleteConfirm", { name: item.name }))) return;

    setIsSubmitting(true);
    try {
      await equipmentApi.remove(item.id, user);
      notify(t("equipment.deleteSuccess", { name: item.name }), "error");
      navigate("/equipment");
    } catch (err) {
      notify(err.message || t("equipment.deleteFailed"), "error");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rd-card rd-loading">{t("equipment.loadingDetail")}</div>;
  }

  if (!item) {
    return (
      <section className="rd-card rd-loading">
        <p>{t("equipment.notFound")}</p>
        <Link className="rd-back" to="/equipment">{t("equipment.backToEquipment")}</Link>
      </section>
    );
  }

  return (
    <>
      <section className="rd-card">
        <div className="rd-topbar">
          <Link className="rd-back" to="/equipment">{t("equipment.backToEquipment")}</Link>
          <span className={`rd-status ${item.status}`}>{getStatusLabel(item.status)}</span>
        </div>

        <div className="rd-hero">
          <div className="rd-icon-box">🛠️</div>
          <div className="rd-heading">
            <h1>{item.name}</h1>
            <div className="rd-meta-grid">
              <div className="rd-meta-item">
                <span>{t("equipment.status")}</span>
                <strong>{getStatusLabel(item.status)}</strong>
              </div>
              <div className="rd-meta-item">
                <span>{t("equipment.author")}</span>
                <strong>{item.authorName || t("equipment.userFallback", { id: item.authorId })}</strong>
              </div>
              <div className="rd-meta-item">
                <span>ID</span>
                <strong>#{item.id}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="rd-body-grid">
          <article className="rd-info-panel">
            <h2>{t("equipment.description")}</h2>
            <p>{item.description || t("equipment.noDescription")}</p>
          </article>

          <aside className="rd-info-side">
            <h2>{t("equipment.metadata")}</h2>
            <div className="rd-status-box">{t("equipment.status")}: {getStatusLabel(item.status)}</div>
          </aside>
        </div>

        <div className="rd-action-bar">
          <button
            type="button"
            className="rd-action edit"
            onClick={() => navigate(`/tasks?linkedType=equipment&linkedId=${item.id}`)}
          >
            {t("equipment.createTask")}
          </button>

          {canManage && (
            <button className="rd-action edit" onClick={handleToggleStatus} disabled={isSubmitting}>
              {item.status === "functional" ? t("equipment.markNonFunctional") : t("equipment.markFunctional")}
            </button>
          )}

          {canManage && (
            <button className="rd-action delete" onClick={handleDelete} disabled={isSubmitting}>
              {t("equipment.delete")}
            </button>
          )}
        </div>
      </section>

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
