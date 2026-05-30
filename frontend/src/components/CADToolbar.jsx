import React from "react";
import {
  MousePointer2,
  Hand,
  Home,
  Minus,
  DoorOpen,
  PanelTop,
  Boxes,
  Ruler,
  Type,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Save,
  Image,
  FileText,
  DraftingCompass
} from "lucide-react";

export default function CADToolbar({
  activeTool,
  setActiveTool,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onSave,
  onPNG,
  onPDF,
  onDXF,
  canEdit
}) {
  const drawTools = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "pan", label: "Pan", icon: Hand },
    { id: "room", label: "Room", icon: Home },
    { id: "wall", label: "Wall", icon: Minus },
    { id: "door", label: "Door", icon: DoorOpen },
    { id: "window", label: "Window", icon: PanelTop },
    { id: "stairs", label: "Stairs", icon: Boxes },
    { id: "dimension", label: "Dim", icon: Ruler },
    { id: "text", label: "Text", icon: Type }
  ];

  const editTools = [
    { id: "duplicate", label: "Copy", icon: Copy, onClick: onDuplicate, disabled: !canEdit },
    { id: "delete", label: "Delete", icon: Trash2, onClick: onDelete, disabled: !canEdit },
    { id: "undo", label: "Undo", icon: Undo2, onClick: onUndo },
    { id: "redo", label: "Redo", icon: Redo2, onClick: onRedo }
  ];

  const viewTools = [
    { id: "zoom-in", label: "Zoom +", icon: ZoomIn, onClick: onZoomIn },
    { id: "zoom-out", label: "Zoom -", icon: ZoomOut, onClick: onZoomOut },
    { id: "save", label: "Save", icon: Save, onClick: onSave }
  ];

  const exportTools = [
    { id: "png", label: "PNG", icon: Image, onClick: onPNG },
    { id: "pdf", label: "PDF", icon: FileText, onClick: onPDF },
    { id: "dxf", label: "DXF", icon: DraftingCompass, onClick: onDXF }
  ];

  return (
    <aside className="cad-toolbar studio-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-title">Draw</span>
        <div className="tool-grid">
          {drawTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                key={tool.id}
                className={activeTool === tool.id ? "active" : ""}
                onClick={() => setActiveTool(tool.id)}
              >
                <Icon size={18} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tool-separator" />

      <div className="toolbar-section">
        <span className="toolbar-title">Edit</span>
        <div className="tool-grid compact">
          {editTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                key={tool.id}
                onClick={tool.onClick}
                disabled={tool.disabled}
              >
                <Icon size={18} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tool-separator" />

      <div className="toolbar-section">
        <span className="toolbar-title">View</span>
        <div className="tool-grid compact">
          {viewTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button key={tool.id} onClick={tool.onClick}>
                <Icon size={18} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tool-separator" />

      <div className="toolbar-section">
        <span className="toolbar-title">Export</span>
        <div className="tool-grid compact">
          {exportTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button key={tool.id} onClick={tool.onClick}>
                <Icon size={18} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}