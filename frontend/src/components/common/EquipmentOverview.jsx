import { useCallback, useEffect, useState } from "react";
import { equipmentApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./EquipmentOverview.css";

export default function EquipmentOverview() {
  const { user } = useUser();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", status: "functional" });
  const [formLoading, setFormLoading] = useState(false);

  const getStatusLabel = (status) => {
    if (status === "functional") return t("equipment.functional");
    if (status === "non_functional") return t("equipment.nonFunctional");
    return status;
  };

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      setItems(await equipmentApi.list());
    } catch {
      notify(t("equipment.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await equipmentApi.create(form, user);
      notify(t("equipment.createSuccess", { name: form.name }));
      setShowForm(false);
      setForm({ name: "", description: "", status: "functional" });
      load();
    } catch (err) {
      notify(err.message || t("equipment.createFailed"), "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const next = item.status === "functional" ? "non_functional" : "functional";
    try {
      await equipmentApi.update(item.id, { status: next }, user);
      notify(t("equipment.statusChanged", { status: getStatusLabel(next) }));
      load();
    } catch (err) {
      notify(err.message || t("equipment.statusChangeFailed"), "error");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t("equipment.deleteConfirm", { name: item.name }))) return;
    try {
      await equipmentApi.remove(item.id, user);
      notify(t("equipment.deleteSuccess", { name: item.name }), "error");
      load();
    } catch (err) {
      notify(err.message || t("equipment.deleteFailed"), "error");
    }
  };

  const filtered = items.filter((i) => filter === "all" || i.status === filter);

  return (
    <>
      <div className="eq-card">
        <div className="eq-header">
          <div className="eq-title-wrap">
            <span className="eq-icon">🔧</span>
            <h1 className="eq-title">{t("equipment.title")}</h1>
          </div>
          <button className="eq-btn-add" onClick={() => setShowForm(true)}>{t("equipment.addNew")}</button>
        </div>

        <div className="eq-filters">
          {[["all", t("equipment.all")], ["functional", t("equipment.functional")], ["non_functional", t("equipment.nonFunctional")]].map(([v,l]) => (
            <button key={v} className={`eq-filter-btn${filter === v ? " active" : ""}`} onClick={() => setFilter(v)}>
              {l} ({v === "all" ? items.length : items.filter(i => i.status === v).length})
            </button>
          ))}
        </div>

        <div className="eq-grid">
          {loading && <div className="eq-empty">{t("equipment.loading")}</div>}
          {!loading && filtered.length === 0 && <div className="eq-empty">{t("equipment.empty")}</div>}

          {!loading && filtered.map((item) => {
            const canAct = isAdmin || item.authorId === user?.id;
            const isFunctional = item.status === "functional";
            return (
              <div key={item.id} className={`eq-item-card${isFunctional ? "" : " broken"}`}>
                <div className="eq-item-top">
                  <span className="eq-item-name">{item.name}</span>
                  <span className={`eq-badge${isFunctional ? " ok" : " broken"}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                {item.description && <p className="eq-item-desc">{item.description}</p>}
                <div className="eq-item-actions">
                  {canAct && (
                    <button className={`eq-action-btn${isFunctional ? " eq-break" : " eq-fix"}`} onClick={() => handleToggleStatus(item)}>
                      {isFunctional ? t("equipment.markNonFunctional") : t("equipment.markFunctional")}
                    </button>
                  )}
                  {canAct && (
                    <button className="eq-action-btn eq-delete" onClick={() => handleDelete(item)}>{t("equipment.delete")}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="eq-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="eq-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("equipment.addModalTitle")}</h2>
            <form onSubmit={handleCreate}>
              <label>{t("equipment.name")} <span className="req">*</span></label>
              <input maxLength={100} required value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} placeholder={t("equipment.namePlaceholder")} />

              <label>{t("equipment.description")}</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder={t("equipment.descriptionPlaceholder")} />

              <label>{t("equipment.status")}</label>
              <select value={form.status} onChange={(e) => setForm(p => ({...p, status: e.target.value}))}>
                <option value="functional">{t("equipment.functional")}</option>
                <option value="non_functional">{t("equipment.nonFunctional")}</option>
              </select>

              <div className="eq-modal-actions">
                <button type="submit" disabled={formLoading} className="eq-modal-btn-primary">
                  {formLoading ? t("equipment.adding") : t("equipment.add")}
                </button>
                <button type="button" className="eq-modal-btn-secondary" onClick={() => setShowForm(false)}>{t("equipment.cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}