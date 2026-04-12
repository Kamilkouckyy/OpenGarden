import React from "react";
import { Link, useParams } from "react-router-dom";
import "./GardenBedDetailview.css";

const MOCK_BEDS = [
  {
    id: 1,
    code: "A1",
    name: "Záhon A1",
    status: "obsazený",
    gardener: "Anna",
    description: "Záhon určený pro pěstování rajčat a bylinek.",
  },
  {
    id: 2,
    code: "A2",
    name: "Záhon A2",
    status: "obsazený",
    gardener: "David",
    description: "Záhon rezervovaný pro sezónní zeleninu.",
  },
  {
    id: 3,
    code: "H1",
    name: "Záhon horní",
    status: "obsazený",
    gardener: "Karel",
    description: "Vyvýšený záhon v horní části zahrady.",
  },
  {
    id: 4,
    code: "D1",
    name: "Záhon dolní",
    status: "volný",
    gardener: null,
    description: "Volný záhon připravený k rezervaci.",
  },
  {
    id: 5,
    code: "B3",
    name: "Záhon B3",
    status: "volný",
    gardener: null,
    description: "Záhon vhodný pro kořenovou zeleninu.",
  },
];

export default function GardenBedDetailview({ currentUser }) {
  const { id } = useParams();

  const bed = MOCK_BEDS.find((item) => String(item.id) === String(id));
  const isAdmin = currentUser?.role === "Správce";
  const isOwner = bed?.gardener === currentUser?.name;
  const canRelease = bed && bed.status === "obsazený" && (isOwner || isAdmin);
  const canReserve = bed && bed.status === "volný";

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

  const handleReserve = () => {
    window.alert(`Rezervace záhonu „${bed.name}“ bude napojena později.`);
  };

  const handleRelease = () => {
    window.alert(`Uvolnění záhonu „${bed.name}“ bude napojeno později.`);
  };

  const handleEdit = () => {
    window.alert(`Úprava záhonu „${bed.name}“ bude doplněna později.`);
  };

  const handleDelete = () => {
    if (!window.confirm(`Opravdu chcete smazat záhon „${bed.name}“?`)) return;
    window.alert(`Mazání záhonu „${bed.name}“ bude napojeno později.`);
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
            <span className="garden-bed-detail__value">
              {bed.gardener ? bed.gardener : "Nikdo"}
            </span>
          </div>

          <div className="garden-bed-detail__description">
            <span className="garden-bed-detail__label">Popis</span>
            <p className="garden-bed-detail__text">
              {bed.description ? bed.description : "Popis není k dispozici."}
            </p>
          </div>
        </div>

        <div className="garden-bed-detail__actions">
          <button
            type="button"
            className="garden-bed-detail__button"
            onClick={handleReserve}
            disabled={!canReserve}
            title={
              !canReserve
                ? "Rezervace není pro tento záhon aktuálně dostupná."
                : ""
            }
          >
            Rezervovat
          </button>

          {canRelease && (
            <button
              type="button"
              className="garden-bed-detail__button garden-bed-detail__button--warning"
              onClick={handleRelease}
            >
              Uvolnit
            </button>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                className="garden-bed-detail__button garden-bed-detail__button--secondary"
                onClick={handleEdit}
              >
                Upravit
              </button>

              <button
                type="button"
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