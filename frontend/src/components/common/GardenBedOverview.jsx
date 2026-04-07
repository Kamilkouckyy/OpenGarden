import { useState } from "react";
import "./GardenBedOverview.css";

const INITIAL_BEDS = [
  { id: 1, name: "Záhon A1", status: "obsazený", gardener: "Anna" },
  { id: 2, name: "Záhon A2", status: "obsazený", gardener: "David" },
  { id: 3, name: "Záhon horní", status: "obsazený", gardener: "Karel" },
  { id: 4, name: "Záhon dolní", status: "volný", gardener: null },
  { id: 5, name: "Záhon B3", status: "volný", gardener: null },
];

// Simulated current user 
const CURRENT_USER = "Anna";
const IS_ADMIN = true;

export default function GardenBedOverview() {
  
  const [beds, setBeds] = useState(INITIAL_BEDS);
  const [filter, setFilter] = useState("všechny"); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBedName, setNewBedName] = useState("");
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleRelease = (id) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "volný", gardener: null } : b
      )
    );
    notify("Záhon byl uvolněn.");
  };

  const handleLeave = (id) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "volný", gardener: null } : b
      )
    );
    notify("Opustili jste záhon.");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Opravdu smazat tento záhon?")) return;
    setBeds((prev) => prev.filter((b) => b.id !== id));
    notify("Záhon byl smazán.", "error");
  };

  const handleAddTask = (name) => notify(`Úkol přidán k záhonu „${name}".`);
  const handleReport = (name) => notify(`Záhon „${name}" byl nahlášen.`);
  const handleEdit = (name) => notify(`Upravit záhon „${name}" (zatím nedostupné).`);
  
  const handleReserve = (id, name) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "obsazený", gardener: CURRENT_USER } : b
      )
    );
    notify(`Rezervovali jste záhon „${name}".`);
  };


  const filtered = beds.filter(
    (b) => filter === "všechny" || b.status === filter
  );

  return (
    <>


      <div className="gbl-card">

          {/* Header */}
          <div className="gbl-header">
            <div className="gbl-title-wrap">
              <div className="gbl-globe">🌐</div>
              <h1 className="gbl-title">Správa záhonů</h1>
            </div>
            {IS_ADMIN && (
              <button className="gbl-btn-add" onClick={() => setShowAddModal(true)}>
                + Přidat nový záhon (Admin)
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="gbl-filters">
            {["všechny", "obsazený", "volný"].map((f) => (
              <button
                key={f}
                className={`gbl-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "všechny" && ` (${beds.length})`}
                {f === "obsazený" && ` (${beds.filter((b) => b.status === "obsazený").length})`}
                {f === "volný" && ` (${beds.filter((b) => b.status === "volný").length})`}
              </button>
            ))}
          </div>

          {/* Bed Grid */}
          <div className="gbl-grid">
            {filtered.length === 0 && (
              <div className="gbl-empty">Žádné záhony k zobrazení.</div>
            )}

            {filtered.map((bed) => {
              const isOwner = bed.gardener === CURRENT_USER;
              const isOccupied = bed.status === "obsazený";

              return (
                <div key={bed.id} className={`gbl-bed-card ${bed.status}`}>
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

                  <div className="gbl-actions">
                    {isOccupied && isOwner && (
                      <button className="gbl-action leave" onClick={() => handleLeave(bed.id)}>
                        Opustit
                      </button>
                    )}
                    {isOccupied && !isOwner && IS_ADMIN && (
                      <button className="gbl-action release" onClick={() => handleRelease(bed.id)}>
                        Uvolnit
                      </button>
                    )}
                    {!isOccupied && (
                      <button className="gbl-action reserve" onClick={() => handleReserve(bed.id, bed.name)}>
                        Rezervovat
                      </button>
                    )}
                    <button className="gbl-action task" onClick={() => handleAddTask(bed.name)}>
                      + Úkol
                    </button>
                    <button className="gbl-action report" onClick={() => handleReport(bed.name)}>
                      Nahlásit
                    </button>
                    {IS_ADMIN && (
                      <button className="gbl-action edit" onClick={() => handleEdit(bed.name)}>
                        Upravit
                      </button>
                    )}
                    {IS_ADMIN && (
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



      {/* Notification Toast */}
      {notification && (
        <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>
      )}
    </>
  );
}
