import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gardenBedsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import "./GardenBedDetailview.css";

export default function GardenBedDetailview() {
  const { id } = useParams();
  const { user } = useUser();

  const [bed, setBed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin";
  const isOwner = bed?.ownerId === user?.id;

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const data = await gardenBedsApi.get(id);
      setBed(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleReserve = async () => {
    try {
      await gardenBedsApi.claim(bed.id, user);
      notify("Záhon byl úspěšně rezervován.");
      load();
    } catch (err) {
      notify(err.message || "Rezervace se nezdařila.", "error");
    }
  };

  const handleRelease = async () => {
    try {
      await gardenBedsApi.release(bed.id, user);
      notify("Záhon byl uvolněn.");
      load();
    } catch (err) {
      notify(err.message || "Uvolnění se nezdařilo.", "error");
    }
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await gardenBedsApi.update(bed.id, { name: editName, description: editDesc }, user);
      notify("Záhon byl upraven.");
      setIsEditing(false);
      load();
    } catch (err) {
      notify(err.message || "Uložení se nezdařilo.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="garden-bed-detail__loading">Načítám…</div>;

  if (notFound) return (
    <section className="garden-bed-detail">
      <div className="garden-bed-detail__card">
        <p className="garden-bed-detail__empty">Záhon nebyl nalezen.</p>
        <div className="garden-bed-detail__actions">
          <Link to="/garden-beds" className="garden-bed-detail__button garden-bed-detail__button--secondary">
            Zpět na přehled záhonů
          </Link>
        </div>
      </div>
    </section>
  );

  const statusLabel = bed.status === "free" ? "volný" : "obsazený";
  const canReserve = bed.status === "free";
  const canRelease = bed.status === "occupied" && (isOwner || isAdmin);

  return (
    <>
      <section className="garden-bed-detail">
        <div className="garden-bed-detail__card">
          <div className="garden-bed-detail__header">
            <h1 className="garden-bed-detail__title">
              {isEditing
                ? <input className="garden-bed-detail__edit-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                : bed.name
              }
            </h1>
          </div>

          <div className="garden-bed-detail__content">
            <div className="garden-bed-detail__row">
              <span className="garden-bed-detail__label">Stav</span>
              <span className={`garden-bed-detail__value garden-bed-detail__status garden-bed-detail__status--${statusLabel}`}>
                {statusLabel}
              </span>
            </div>

            <div className="garden-bed-detail__row">
              <span className="garden-bed-detail__label">Zahradník</span>
              <span className="garden-bed-detail__value">
                {bed.ownerName ?? "Nikdo"}
              </span>
            </div>

            <div className="garden-bed-detail__description">
              <span className="garden-bed-detail__label">Popis</span>
              {isEditing
                ? <textarea
                    className="garden-bed-detail__edit-textarea"
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                : <p className="garden-bed-detail__text">
                    {bed.description || "Popis není k dispozici."}
                  </p>
              }
            </div>
          </div>

          <div className="garden-bed-detail__actions">
            {!isEditing && canReserve && (
              <button type="button" className="garden-bed-detail__button" onClick={handleReserve}>
                Rezervovat
              </button>
            )}
            {!isEditing && canRelease && (
              <button type="button" className="garden-bed-detail__button garden-bed-detail__button--warning" onClick={handleRelease}>
                Uvolnit
              </button>
            )}
            {!isEditing && isAdmin && (
              <button
                type="button"
                className="garden-bed-detail__button garden-bed-detail__button--secondary"
                onClick={() => { setEditName(bed.name); setEditDesc(bed.description || ""); setIsEditing(true); }}
              >
                Upravit
              </button>
            )}
            {isEditing && (
              <>
                <button type="button" className="garden-bed-detail__button" onClick={handleEditSave} disabled={saving}>
                  {saving ? "Ukládám…" : "Uložit"}
                </button>
                <button type="button" className="garden-bed-detail__button garden-bed-detail__button--secondary" onClick={() => setIsEditing(false)}>
                  Zrušit
                </button>
              </>
            )}
            <Link to="/garden-beds" className="garden-bed-detail__button garden-bed-detail__button--secondary">
              Zpět na přehled
            </Link>
          </div>
        </div>
      </section>

      {notification && (
        <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>
      )}
    </>
  );
}
