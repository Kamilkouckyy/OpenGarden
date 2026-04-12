import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gardenBedsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import "./GardenBedOverview.css";

const STATUS_LABEL = { free: "volný", occupied: "obsazený" };

export default function GardenBedOverview() {
  const navigate = useNavigate();
  const { user } = useUser();
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
      notify("Nepodařilo se načíst záhony.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReserve = async (id, name) => {
    try {
      await gardenBedsApi.claim(id, user);
      notify(`Záhon „${name}" byl úspěšně rezervován.`);
      load();
    } catch (err) {
      notify(err.message || "Rezervace se nezdařila.", "error");
    }
  };

  const handleRelease = async (id, name) => {
    try {
      await gardenBedsApi.release(id, user);
      notify(`Záhon „${name}" byl uvolněn.`);
      load();
    } catch (err) {
      notify(err.message || "Uvolnění se nezdařilo.", "error");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Opravdu smazat záhon „${name}"? Tato akce je nevratná.`)) return;
    try {
      await gardenBedsApi.remove(id, user);
      notify(`Záhon „${name}" byl smazán.`, "error");
      load();
    } catch (err) {
      notify(err.message || "Smazání se nezdařilo.", "error");
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await gardenBedsApi.create(addForm, user);
      notify(`Záhon „${addForm.name}" byl vytvořen.`);
      setShowAddModal(false);
      setAddForm({ name: "", description: "" });
      load();
    } catch (err) {
      notify(err.message || "Vytvoření se nezdařilo.", "error");
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

  return (
    <>
      <div className="gbl-card">
        <div className="gbl-header">
          <div className="gbl-title-wrap">
            <div className="gbl-globe">🌐</div>
            <h1 className="gbl-title">Správa záhonů</h1>
          </div>
          {isAdmin && (
            <button className="gbl-btn-add" onClick={() => setShowAddModal(true)}>
              + Přidat nový záhon
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
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "všechny" && ` (${beds.length})`}
              {f === "obsazený" && ` (${countOf("obsazený")})`}
              {f === "volný" && ` (${countOf("volný")})`}
            </button>
          ))}
        </div>

        <div className="gbl-grid">
          {loading && <div className="gbl-empty">Načítám záhony…</div>}

          {!loading && filtered.length === 0 && (
            <div className="gbl-empty">Žádné záhony k zobrazení.</div>
          )}

          {!loading && filtered.map((bed) => {
            const statusLabel = STATUS_LABEL[bed.status] || bed.status;
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
                <div className="gbl-bed-info">Stav: <strong>{statusLabel}</strong></div>
                {!isFree && bed.ownerName && (
                  <div className="gbl-bed-info">Zahradník: <strong>{bed.ownerName}</strong></div>
                )}
                <span className={`gbl-status ${statusLabel}`}>{statusLabel}</span>

                <div className="gbl-actions" onClick={(e) => e.stopPropagation()}>
                  {isFree && !userHasBed && (
                    <button className="gbl-action reserve" onClick={() => handleReserve(bed.id, bed.name)}>
                      Rezervovat
                    </button>
                  )}
                  {!isFree && isOwner && (
                    <button className="gbl-action leave" onClick={() => handleRelease(bed.id, bed.name)}>
                      Opustit
                    </button>
                  )}
                  {!isFree && !isOwner && isAdmin && (
                    <button className="gbl-action release" onClick={() => handleRelease(bed.id, bed.name)}>
                      Uvolnit
                    </button>
                  )}
                  <button className="gbl-action task" onClick={() => navigate(`/tasks?linkedType=plot&linkedId=${bed.id}&bedName=${encodeURIComponent(bed.name)}`)}>
                    + Úkol
                  </button>
                  <button className="gbl-action report" onClick={() => navigate(`/reports?bedName=${encodeURIComponent(bed.name)}`)}>
                    Nahlásit
                  </button>
                  {isAdmin && (
                    <button className="gbl-action delete" onClick={() => handleDelete(bed.id, bed.name)}>
                      Smazat
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
            <h2>Přidat záhon</h2>
            <form onSubmit={handleAddBed}>
              <label>Název <span className="req">*</span></label>
              <input
                maxLength={50}
                required
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Záhon A1"
              />
              <label>Popis</label>
              <textarea
                rows={3}
                value={addForm.description}
                onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Volitelný popis záhonu…"
              />
              <div className="gbl-modal-actions">
                <button type="submit" disabled={addLoading} className="gbl-modal-btn-primary">
                  {addLoading ? "Vytvářím…" : "Vytvořit"}
                </button>
                <button type="button" className="gbl-modal-btn-secondary" onClick={() => setShowAddModal(false)}>
                  Zrušit
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
