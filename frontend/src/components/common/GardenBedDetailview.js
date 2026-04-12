import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { gardenBedApi } from "../../services/api/gardenBedApi";
import { subscribeToDbChanges } from "../../services/api/mockDb";
import "./GardenBedDetailview.css";

export default function GardenBedDetailview({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bed, setBed] = useState(undefined);

  useEffect(() => {
    let isMounted = true;

    const loadBed = async () => {
      const data = await gardenBedApi.getById(id);
      if (isMounted) setBed(data);
    };

    loadBed();
    const unsubscribe = subscribeToDbChanges(loadBed);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [id]);

  const isAdmin = currentUser?.role === "Správce";
  const isOwner = bed?.gardener === currentUser?.name;
  const canRelease = bed && bed.status === "obsazený" && (isOwner || isAdmin);
  const canReserve = bed && bed.status === "volný";

  if (bed === undefined) {
    return null;
  }

  if (!bed) {
    return (
      <section className="garden-bed-detail">
        <div className="garden-bed-detail__card">
          <p className="garden-bed-detail__empty">Záhon nebyl nalezen.</p>
          <div className="garden-bed-detail__actions">
            <Link
              to="/garden-beds"
              className="garden-bed-detail__button garden-bed-detail__button--secondary"
            >
              Zpět na přehled záhonů
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handleReserve = async () => {
    await gardenBedApi.reserve(bed.id, currentUser?.name || "Anna");
  };

  const handleRelease = async () => {
    await gardenBedApi.release(bed.id);
  };

  const handleEdit = () => {
    window.alert(`Úprava záhonu „${bed.name}“ bude doplněna později.`);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Opravdu chcete smazat záhon „${bed.name}“?`)) return;
    await gardenBedApi.remove(bed.id);
    navigate("/garden-beds");
  };

  return (
    <section className="garden-bed-detail">
      <div className="garden-bed-detail__card">
        <div className="garden-bed-detail__header">
          <span className="garden-bed-detail__code">{bed.code}</span>
          <h1 className="garden-bed-detail__title">{bed.name}</h1>
        </div>

        <div className="garden-bed-detail__content">
          <div className="garden-bed-detail__row">
            <span className="garden-bed-detail__label">Stav</span>
            <span
              className={`garden-bed-detail__value garden-bed-detail__status garden-bed-detail__status--${bed.status}`}
            >
              {bed.status}
            </span>
          </div>

          <div className="garden-bed-detail__row">
            <span className="garden-bed-detail__label">Zahradník</span>
            <span className="garden-bed-detail__value">{bed.gardener ? bed.gardener : "Nikdo"}</span>
          </div>

          <div className="garden-bed-detail__row garden-bed-detail__row--top">
            <span className="garden-bed-detail__label">Popis</span>
            <div className="garden-bed-detail__value garden-bed-detail__description">
              {bed.description}
            </div>
          </div>
        </div>

        <div className="garden-bed-detail__actions">
          {canReserve && (
            <button className="garden-bed-detail__button" onClick={handleReserve}>
              Rezervovat
            </button>
          )}

          {canRelease && (
            <button
              className="garden-bed-detail__button garden-bed-detail__button--warning"
              onClick={handleRelease}
            >
              {isOwner ? "Opustit" : "Uvolnit"}
            </button>
          )}

          {isAdmin && (
            <>
              <button
                className="garden-bed-detail__button garden-bed-detail__button--secondary"
                onClick={handleEdit}
              >
                Upravit
              </button>
              <button
                className="garden-bed-detail__button garden-bed-detail__button--danger"
                onClick={handleDelete}
              >
                Smazat
              </button>
            </>
          )}

          <Link
            to="/garden-beds"
            className="garden-bed-detail__button garden-bed-detail__button--secondary"
          >
            Zpět na přehled
          </Link>
        </div>
      </div>
    </section>
  );
}
