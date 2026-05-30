import React from "react";
function money(value) {
  return Number(value || 0).toLocaleString("en-PK");
}

export default function EstimatePanel({ plan }) {
  if (!plan?.estimate) {
    return (
      <section className="estimate-panel">
        <h3>BOQ / Estimate</h3>
        <p className="muted">Generate a plan to see cost and material estimate.</p>
      </section>
    );
  }

  const estimate = plan.estimate;

  return (
    <section className="estimate-panel">
      <h3>BOQ / Estimate</h3>

      <div className="estimate-grid">
        <div>
          <span>Built Area</span>
          <strong>{estimate.totalBuiltArea} sq ft</strong>
        </div>

        <div>
          <span>Wall Length</span>
          <strong>{estimate.totalWallLength} ft</strong>
        </div>

        <div>
          <span>Doors</span>
          <strong>{estimate.doorsCount}</strong>
        </div>

        <div>
          <span>Windows</span>
          <strong>{estimate.windowsCount}</strong>
        </div>
      </div>

      <div className="material-list">
        <p>Bricks: {estimate.materials.bricks}</p>
        <p>Cement Bags: {estimate.materials.cementBags}</p>
        <p>Sand: {estimate.materials.sandCft} CFT</p>
        <p>Steel: {estimate.materials.steelKg} KG</p>
        <p>Tiles: {estimate.materials.tileSqft} sq ft</p>
        <p>Paint: {estimate.materials.paintSqft} sq ft</p>
      </div>

      <div className="cost-box">
        <p>Low: PKR {money(estimate.cost.low)}</p>
        <p>Medium: PKR {money(estimate.cost.medium)}</p>
        <p>High: PKR {money(estimate.cost.high)}</p>
      </div>

      <small>{estimate.note}</small>
    </section>
  );
}
