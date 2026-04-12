import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gardenBedApi } from "../../services/api/gardenBedApi";
import { subscribeToDbChanges } from "../../services/api/mockDb";
import "./GardenBedOverview.css";

export default function GardenBedOverview({ currentUser }) {
  const navigate = useNavigate();

  const currentUserName = currentUser?.name || "Anna";
  const isAdmin = currentUser?.role === "Správce";

  const [beds, setBeds] = useState([]);
  const [filter, setFilter] = useState("všechny");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBedName, setNewBedName] = useState("");
  const [notification, setNotification] = useState(null);

  const counts = useMemo(
    () => ({
      all: beds.length,
      occupied: beds.filter((b) => b.status === "obsazený").length,
      free: beds.filter((b) => b.status === "volný").length,
    }),
    [beds]
  );

  useEffect(() => {
    let isMounted = true;

    const loadBeds = async () => {
      const data = await gardenBedApi.list();
      if (isMounted) setBeds(data);
    };

    loadBeds();

    const unsubscribe = subscribeToDbChanges(loadBeds);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 2500);
  };

  const handleRelease = async (id) => {
    await gardenBedApi.release(id);
    notify("Záhon byl uvolněn.");
  };

  const handleLeave = async (id) => {
    await gardenBedApi.release(id);
    notify("Opustili jste záhon.");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Opravdu smazat tento záhon?")) return;
    await gardenBedApi.remove(id);
    notify("Záhon byl smazán.", "error");
  };

  const handleAddTask = (name) => notify(`Úkol přidán k záhonu „${name}”.`);
  const handleReport = (name) => notify(`Záhon „${name}” byl nahlášen.`);
  const handleEdit = (name) => notify(`Upravit záhon „${name}” (zatím nedostupné).`);

  const handleReserve = async (id, name) => {
    await gardenBedApi.reserve(id, currentUserName);
    notify(`Rezervovali jste záhon „${name}”.`);
  };

  const handleCreateBed = async () => {
    const trimmedName = newBedName.trim();
    if (!trimmedName) return;

    await gardenBedApi.create({
      code: trimmedName,
      name: trimmedName,
      description: "Nově vytvořený záhon.",
    });

    setNewBedName("");
    setShowAddModal(false);
    notify(`Záhon „${trimmedName}” byl přidán.`);
  };

  const goToDetail = (id) => {
    navigate(`/garden-beds/${id}`);
  };

  const filtered = beds.filter((b) => filter === "všechny" || b.status === filter);

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
              + Přidat nový záhon (Admin)
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
              {f === "všechny" && ` (${counts.all})`}
              {f === "obsazený" && ` (${counts.occupied})`}
              {f === "volný" && ` (${counts.free})`}
            </button>
          ))}
        </div>

        <div className="gbl-grid">
          {filtered.length === 0 && <div className="gbl-empty">Žádné záhony k zobrazení.</div>}

          {filtered.map((bed) => {
            const isOwner = bed.gardener === currentUserName;
            const isOccupied = bed.status === "obsazený";

            return (
              <div
                key={bed.id}
                className={`gbl-bed-card ${bed.status}`}
                onClick={() => goToDetail(bed.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="gbl-bed-name">{bed.name}</div>

                <div className="gbl-bed-info">
                  Stav: <strong>{bed.status}</strong>
                </div>
                {isOccupied && bed.gardener && (
                  <div className="gbl-bed-info">
                    Zahradník: <strong>{bed.gardener}</strong>
                  </div>
                )}

                <span className={`gbl-status ${bed.status}`}>{bed.status}</span>

                <div className="gbl-actions" onClick={(event) => event.stopPropagation()}>
                  {isOccupied && isOwner && (
                    <button className="gbl-action leave" onClick={() => handleLeave(bed.id)}>
                      Opustit
                    </button>
                  )}
                  {isOccupied && !isOwner && isAdmin && (
                    <button className="gbl-action release" onClick={() => handleRelease(bed.id)}>
                      Uvolnit
                    </button>
                  )}
                  {!isOccupied && (
                    <button
                      className="gbl-action reserve"
                      onClick={() => handleReserve(bed.id, bed.name)}
                    >
                      Rezervovat
                    </button>
                  )}
                  <button className="gbl-action task" onClick={() => handleAddTask(bed.name)}>
                    + Úkol
                  </button>
                  <button className="gbl-action report" onClick={() => handleReport(bed.name)}>
                    Nahlásit
                  </button>
                  {isAdmin && (
                    <button className="gbl-action edit" onClick={() => handleEdit(bed.name)}>
                      Upravit
                    </button>
                  )}
                  {isAdmin && (
                    <button className="gbl-action delete" onClick={() => handleDelete(bed.id)}>
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
        <div className="task-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="task-status-modal" onClick={(event) => event.stopPropagation()}>
            <div className="task-status-modal__header">
              <h2 className="task-status-modal__title">Přidat nový záhon</h2>
              <button
                type="button"
                className="task-status-modal__close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <div className="task-status-modal__body">
              <input
                className="task-detail__input"
                value={newBedName}
                onChange={(e) => setNewBedName(e.target.value)}
                placeholder="Např. Záhon C1"
              />
            </div>

            <div className="task-status-modal__footer">
              <button type="button" className="task-status-modal__save" onClick={handleCreateBed}>
                Uložit
              </button>
              <button
                type="button"
                className="task-status-modal__cancel"
                onClick={() => setShowAddModal(false)}
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
