import React from "react";
import "./GardenBedDetailView.css";

function GardenBedDetailView({ bed }) {
  if (!bed) {
    return (
      <section className="garden-bed-detail">
        <p className="garden-bed-detail__empty">No garden bed data available.</p>
      </section>
    );
  }

  return (
    <section className="garden-bed-detail">
      <div className="garden-bed-detail__card">
        <div className="garden-bed-detail__header">
          <span className="garden-bed-detail__code">{bed.code}</span>
          <h1 className="garden-bed-detail__title">{bed.name}</h1>
        </div>

        <div className="garden-bed-detail__content">
          <div className="garden-bed-detail__row">
            <span className="garden-bed-detail__label">Status</span>
            <span className={`garden-bed-detail__value garden-bed-detail__status garden-bed-detail__status--${bed.status}`}>
              {bed.status}
            </span>
          </div>

          <div className="garden-bed-detail__row">
            <span className="garden-bed-detail__label">Area</span>
            <span className="garden-bed-detail__value">{bed.area}</span>
          </div>

          <div className="garden-bed-detail__row">
            <span className="garden-bed-detail__label">Gardener</span>
            <span className="garden-bed-detail__value">
              {bed.gardener ? bed.gardener : "Unassigned"}
            </span>
          </div>

          {bed.description && (
            <div className="garden-bed-detail__description">
              <span className="garden-bed-detail__label">Description</span>
              <p className="garden-bed-detail__text">{bed.description}</p>
            </div>
          )}
        </div>

        {bed.status === "available" && (
          <div className="garden-bed-detail__actions">
            <button type="button" className="garden-bed-detail__button">
              Reserve garden bed
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default GardenBedDetailView;