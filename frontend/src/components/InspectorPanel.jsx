import React from "react";

export default function InspectorPanel({
  plan,
  selected,
  updateSelectedEntity,
  toggleLayer
}) {
  if (!plan) {
    return (
      <aside className="right-panel">
        <h3>Inspector</h3>
        <p className="muted">Generate a drawing to inspect CAD objects.</p>
      </aside>
    );
  }

  const entity = getSelectedEntity(plan, selected);

  return (
    <aside className="right-panel">
      <h3>Inspector</h3>

      {!entity ? (
        <p className="muted">Select a room, wall, door, window, stairs, dimension, or text.</p>
      ) : (
        <div className="form-grid">
          <div className="selected-type">
            Selected: <strong>{selected.type}</strong>
          </div>

          {"name" in entity && (
            <label>
              Name
              <input
                value={entity.name || ""}
                onChange={(event) =>
                  updateSelectedEntity({
                    name: event.target.value
                  })
                }
              />
            </label>
          )}

          {"text" in entity && (
            <label>
              Text
              <input
                value={entity.text || ""}
                onChange={(event) =>
                  updateSelectedEntity({
                    text: event.target.value
                  })
                }
              />
            </label>
          )}

          {"label" in entity && (
            <label>
              Label
              <input
                value={entity.label || ""}
                onChange={(event) =>
                  updateSelectedEntity({
                    label: event.target.value
                  })
                }
              />
            </label>
          )}

          {"type" in entity && (
            <label>
              Type
              <input
                value={entity.type || ""}
                onChange={(event) =>
                  updateSelectedEntity({
                    type: event.target.value
                  })
                }
              />
            </label>
          )}

          {"x" in entity && (
            <label>
              X
              <input
                type="number"
                value={Math.round(entity.x || 0)}
                onChange={(event) =>
                  updateSelectedEntity({
                    x: Number(event.target.value)
                  })
                }
              />
            </label>
          )}

          {"y" in entity && (
            <label>
              Y
              <input
                type="number"
                value={Math.round(entity.y || 0)}
                onChange={(event) =>
                  updateSelectedEntity({
                    y: Number(event.target.value)
                  })
                }
              />
            </label>
          )}

          {"width" in entity && (
            <label>
              Width
              <input
                type="number"
                value={Math.round(entity.width || 0)}
                onChange={(event) =>
                  updateSelectedEntity({
                    width: Number(event.target.value)
                  })
                }
              />
            </label>
          )}

          {"height" in entity && (
            <label>
              Height
              <input
                type="number"
                value={Math.round(entity.height || 0)}
                onChange={(event) =>
                  updateSelectedEntity({
                    height: Number(event.target.value)
                  })
                }
              />
            </label>
          )}

          {"wallThickness" in entity && (
            <label>
              Wall Thickness
              <input
                type="number"
                value={entity.wallThickness || 6}
                onChange={(event) =>
                  updateSelectedEntity({
                    wallThickness: Number(event.target.value)
                  })
                }
              />
            </label>
          )}

          {"thickness" in entity && (
            <label>
              Thickness
              <input
                type="number"
                value={entity.thickness || 8}
                onChange={(event) =>
                  updateSelectedEntity({
                    thickness: Number(event.target.value)
                  })
                }
              />
            </label>
          )}

          {"fontSize" in entity && (
            <label>
              Font Size
              <input
                type="number"
                value={entity.fontSize || 16}
                onChange={(event) =>
                  updateSelectedEntity({
                    fontSize: Number(event.target.value)
                  })
                }
              />
            </label>
          )}

          {"color" in entity && (
            <label>
              Color
              <input
                type="color"
                value={entity.color || "#0f172a"}
                onChange={(event) =>
                  updateSelectedEntity({
                    color: event.target.value
                  })
                }
              />
            </label>
          )}
        </div>
      )}

      <div className="layer-box">
        <h4>Layers</h4>

        {plan.layers?.map((layer) => (
          <label className="layer-row" key={layer.id}>
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => toggleLayer(layer.id)}
            />
            <span>{layer.name}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}

function getSelectedEntity(plan, selected) {
  if (!selected) return null;

  if (selected.type === "room") {
    return plan.rooms.find((item) => item.id === selected.id) || null;
  }

  if (selected.type === "door") {
    return plan.doors.find((item) => item.id === selected.id) || null;
  }

  if (selected.type === "window") {
    return plan.windows.find((item) => item.id === selected.id) || null;
  }

  if (selected.type === "stairs") {
    return plan.stairs.find((item) => item.id === selected.id) || null;
  }

  if (selected.type === "wall") {
    return plan.walls?.find((item) => item.id === selected.id) || null;
  }

  if (selected.type === "dimension") {
    return plan.dimensions?.find((item) => item.id === selected.id) || null;
  }

  if (selected.type === "text") {
    return plan.texts?.find((item) => item.id === selected.id) || null;
  }

  return null;
}