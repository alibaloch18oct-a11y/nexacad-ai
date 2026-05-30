import React, { useRef } from "react";
import { Download, Upload, ShieldCheck, AlertTriangle } from "lucide-react";

export default function ProjectBackupPanel({
  plan,
  collisionWarnings,
  onExportJSON,
  onImportJSON
}) {
  const fileRef = useRef(null);

  return (
    <section className="project-backup-panel">
      <div className="panel-heading">
        <ShieldCheck size={18} />
        <span>Project Safety / Backup</span>
      </div>

      <div className="safety-status">
        {collisionWarnings.length === 0 ? (
          <div className="safe-box">
            <ShieldCheck size={17} />
            <div>
              <strong>No room overlap detected</strong>
              <span>Current floor plans look clean.</span>
            </div>
          </div>
        ) : (
          <div className="warning-box">
            <AlertTriangle size={17} />
            <div>
              <strong>{collisionWarnings.length} overlap warning(s)</strong>
              <span>Some rooms are crossing each other.</span>
            </div>
          </div>
        )}
      </div>

      {collisionWarnings.length > 0 && (
        <div className="collision-list">
          {collisionWarnings.slice(0, 5).map((warning) => (
            <div key={warning.id}>
              <strong>{warning.floorLabel}</strong>
              <span>
                {warning.roomA} overlaps with {warning.roomB}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="backup-actions">
        <button onClick={onExportJSON} disabled={!plan}>
          <Download size={16} />
          Export JSON
        </button>

        <button onClick={() => fileRef.current?.click()}>
          <Upload size={16} />
          Import JSON
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportJSON(file);
            }
            event.target.value = "";
          }}
        />
      </div>

      <p className="backup-note">
        Use JSON backup to move projects between laptops or recover work later.
      </p>
    </section>
  );
}