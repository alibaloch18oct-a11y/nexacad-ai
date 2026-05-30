import React from "react";
import { Settings2 } from "lucide-react";

export default function ProjectSettingsPanel({ plan, onUpdateProjectInfo }) {
  if (!plan) {
    return null;
  }

  const info = plan.projectInfo || {};

  function update(field, value) {
    onUpdateProjectInfo({
      ...info,
      [field]: value
    });
  }

  return (
    <section className="project-settings-panel">
      <div className="panel-heading">
        <Settings2 size={18} />
        <span>Project / Client Settings</span>
      </div>

      <div className="settings-grid">
        <label>
          Client Name
          <input
            value={info.clientName || ""}
            onChange={(event) => update("clientName", event.target.value)}
            placeholder="Client name"
          />
        </label>

        <label>
          Client Phone
          <input
            value={info.clientPhone || ""}
            onChange={(event) => update("clientPhone", event.target.value)}
            placeholder="Phone number"
          />
        </label>

        <label>
          Project Location
          <input
            value={info.projectLocation || ""}
            onChange={(event) => update("projectLocation", event.target.value)}
            placeholder="City / area"
          />
        </label>

        <label>
          Prepared By
          <input
            value={info.preparedBy || ""}
            onChange={(event) => update("preparedBy", event.target.value)}
            placeholder="Your company / architect name"
          />
        </label>

        <label>
          Drawing Status
          <select
            value={info.drawingStatus || "Concept Drawing"}
            onChange={(event) => update("drawingStatus", event.target.value)}
          >
            <option value="Concept Drawing">Concept Drawing</option>
            <option value="Client Review">Client Review</option>
            <option value="Draft Proposal">Draft Proposal</option>
            <option value="Final Concept">Final Concept</option>
            <option value="Approved Concept">Approved Concept</option>
          </select>
        </label>

        <label>
          Project Notes
          <textarea
            value={info.projectNotes || ""}
            onChange={(event) => update("projectNotes", event.target.value)}
            placeholder="Any project note for proposal..."
          />
        </label>
      </div>

      <div className="ai-command-help">
        <strong>AI command examples:</strong>
        <span>Add bedroom on first floor</span>
        <span>Remove bathroom</span>
        <span>Move kitchen to back</span>
        <span>Rename bedroom to "Kids Room"</span>
        <span>Client name "Ahmed Khan"</span>
      </div>
    </section>
  );
}