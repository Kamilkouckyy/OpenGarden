import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gardenBedsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./GardenBedOverview.css";

const STATUS_LABEL = { free: "volný", occupied: "obsazený" };

export default function GardenBedOverview() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";

  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("všechny");
  const [notification, setNotification] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", description: "" });
  const [addLoading, setAddLoading] = useState(false);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await gardenBedsApi.list();
      setBeds(data);
    } catch {
      notify(t("gardenBeds.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleReserve = async (id, name) => {
    try {
      await gardenBedsApi.claim(id, user);
      notify(t("gardenBeds.reserveSuccess", { name }));
      load();
    } catch (err) {
      notify(err.message || t("gardenBeds.reserveFailed"), "error");
    }
  };

  const handleRelease = async (id, name) => {
    try {
      await gardenBedsApi.release(id, user);
      notify(t("gardenBeds.releaseSuccess", { name }));
      load();
    } catch (err) {
      notify(err.message || t("gardenBeds.releaseFailed"), "error");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t("gardenBeds.deleteConfirm", { name }))) return;
    try {
      await gardenBedsApi.remove(id, user);
      notify(t("gardenBeds.deleteSuccess", { name }), "error");
      load();
    } catch (err) {
      notify(err.message || t("gardenBeds.deleteFailed"), "error");
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await gardenBedsApi.create(addForm, user);
      notify(t("gardenBeds.createSuccess", { name: addForm.name }));
      setShowAddModal(false);
      setAddForm({ name: "", description: "" });
      load();
    } catch (err) {
      notify(err.message || t("gardenBeds.createFailed"), "error");
    } finally {
      setAddLoading(false);
    }
  };

  const userHasBed = beds.some((b) => b.ownerId === user?.id);

  const filtered = beds.filter((b) => {
    if (filter === "všechny") return true;
    return STATUS_LABEL[b.status] === filter;
  });

  const countOf = (status) => beds.filter((b) => STATUS_LABEL[b.status] === status).length;

  const getFilterText = (f) => {
    if (f === "všechny") return t("gardenBeds.all");
    if (f === "obsazený") return t("gardenBeds.occupied");
    if (f === "volný") return t("gardenBeds.free");
    return f;
  };

  const getStatusText = (statusLabel) => {
    if (statusLabel === "obsazený") return t("gardenBeds.occupied");
    if (statusLabel === "volný") return t("gardenBeds.free");
    return statusLabel;
  };

  return (
    <>
      <div className="gbl-card">
        <div className="gbl-header">
          <div className="gbl-title-wrap">
            <div className="gbl-globe">🌐</div>
            <h1 className="gbl-title">{t("gardenBeds.title")}</h1>
          </div>
          {isAdmin && (
            <button className="gbl-btn-add" onClick={() => setShowAddModal(true)}>
              {t("gardenBeds.addNew")}
            </button>
          )}
        </div>

        <div className="gbl-filters">
          {["všechny", "obsazený", "volný"].map((f) => (
            <button
              key={f}
              className={`gbl-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {getFilterText(f).charAt(0).toUpperCase() + getFilterText(f).slice(1)}
              {f === "všechny" && ` (${beds.length})`}
              {f === "obsazený" && ` (${countOf("obsazený")})`}
              {f === "volný" && ` (${countOf("volný")})`}
            </button>
          ))}
        </div>

        <div className="gbl-grid">
          {loading && <div className="gbl-empty">{t("gardenBeds.loading")}</div>}

          {!loading && filtered.length === 0 && (
            <div className="gbl-empty">{t("gardenBeds.empty")}</div>
          )}

          {!loading && filtered.map((bed) => {
            const statusLabel = STATUS_LABEL[bed.status] || bed.status;
            const statusText = getStatusText(statusLabel);
            const isOwner = bed.ownerId === user?.id;
            const isFree = bed.status === "free";

            return (
              <div
                key={bed.id}
                className={`gbl-bed-card ${statusLabel}`}
                onClick={() => navigate(`/garden-beds/${bed.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="gbl-bed-name">{bed.name}</div>
                <div className="gbl-bed-info">{t("gardenBeds.status")}: <strong>{statusText}</strong></div>
                {!isFree && bed.ownerName && (
                  <div className="gbl-bed-info">{t("gardenBeds.gardener")}: <strong>{bed.ownerName}</strong></div>
                )}
                <span className={`gbl-status ${statusLabel}`}>{statusText}</span>

                <div className="gbl-actions" onClick={(e) => e.stopPropagation()}>
                  {isFree && !userHasBed && (
                    <button className="gbl-action reserve" onClick={() => handleReserve(bed.id, bed.name)}>
                      {t("gardenBeds.reserve")}
                    </button>
                  )}
                  {!isFree && isOwner && (
                    <button className="gbl-action leave" onClick={() => handleRelease(bed.id, bed.name)}>
                      {t("gardenBeds.leave")}
                    </button>
                  )}
                  {!isFree && !isOwner && isAdmin && (
                    <button className="gbl-action release" onClick={() => handleRelease(bed.id, bed.name)}>
                      {t("gardenBeds.release")}
                    </button>
                  )}
                  <button className="gbl-action task" onClick={() => navigate(`/tasks?linkedType=plot&linkedId=${bed.id}&bedName=${encodeURIComponent(bed.name)}`)}>
                    {t("gardenBeds.addTask")}
                  </button>
                  <button className="gbl-action report" onClick={() => navigate(`/reports?bedName=${encodeURIComponent(bed.name)}`)}>
                    {t("gardenBeds.report")}
                  </button>
                  {isAdmin && (
                    <button className="gbl-action delete" onClick={() => handleDelete(bed.id, bed.name)}>
                      {t("gardenBeds.delete")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <div className="gbl-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="gbl-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("gardenBeds.addModalTitle")}</h2>
            <form onSubmit={handleAddBed}>
              <label>{t("gardenBeds.name")} <span className="req">*</span></label>
              <input
                maxLength={50}
                required
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("gardenBeds.namePlaceholder")}
              />
              <label>{t("gardenBeds.description")}</label>
              <textarea
                rows={3}
                value={addForm.description}
                onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={t("gardenBeds.descriptionPlaceholder")}
              />
              <div className="gbl-modal-actions">
                <button type="submit" disabled={addLoading} className="gbl-modal-btn-primary">
                  {addLoading ? t("gardenBeds.creating") : t("gardenBeds.create")}
                </button>
                <button type="button" className="gbl-modal-btn-secondary" onClick={() => setShowAddModal(false)}>
                  {t("gardenBeds.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>
      )}
    </>
  );
}