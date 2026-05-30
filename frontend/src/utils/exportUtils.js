import jsPDF from "jspdf";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5100";

export function exportStagePNG(stageRef, plan) {
  if (!stageRef.current || !plan) {
    alert("Generate a plan first.");
    return;
  }

  const uri = stageRef.current.toDataURL({
    pixelRatio: 2
  });

  const link = document.createElement("a");
  link.href = uri;
  link.download = `${plan.title || "nexacad-plan"}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPlanPDF(stageRef, plan, activeFloor = 0) {
  if (!stageRef.current || !plan) {
    alert("Generate a plan first.");
    return;
  }

  const info = plan.projectInfo || {};

  const image = stageRef.current.toDataURL({
    pixelRatio: 2
  });

  const pdf = new jsPDF("landscape", "mm", "a4");

  const pageW = 297;
  const pageH = 210;

  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.5);
  pdf.rect(8, 8, pageW - 16, pageH - 16);

  pdf.setFillColor(15, 23, 42);
  pdf.rect(8, 8, pageW - 16, 18, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(17);
  pdf.text("NexaCAD AI Pro - Architectural Drawing Sheet", 12, 20);

  pdf.setFontSize(8);
  pdf.text("AI Architect Studio + CAD Editor + 3D + BOQ", 208, 20);

  pdf.setTextColor(15, 23, 42);
  pdf.addImage(image, "PNG", 12, 32, 185, 122);

  const estimate = plan.estimate;

  pdf.setFontSize(12);
  pdf.text("Project Details", 204, 34);

  pdf.setFontSize(8.3);
  pdf.text(`Project: ${plan.title || "-"}`, 204, 44);
  pdf.text(`Client: ${info.clientName || "-"}`, 204, 51);
  pdf.text(`Phone: ${info.clientPhone || "-"}`, 204, 58);
  pdf.text(`Location: ${info.projectLocation || "-"}`, 204, 65);
  pdf.text(`Prepared By: ${info.preparedBy || "NexaCAD AI Pro"}`, 204, 72);
  pdf.text(`Status: ${info.drawingStatus || "Concept Drawing"}`, 204, 79);
  pdf.text(`Plot Size: ${plan.plot.width} x ${plan.plot.length} ft`, 204, 86);
  pdf.text(`Floor: ${activeFloor === 0 ? "Ground Floor" : `Floor ${activeFloor}`}`, 204, 93);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 204, 100);

  pdf.setFontSize(12);
  pdf.text("BOQ Snapshot", 204, 115);

  pdf.setFontSize(8.3);
  pdf.text(`Built Area: ${estimate.totalBuiltArea} sq ft`, 204, 124);
  pdf.text(`Wall Length: ${estimate.totalWallLength} ft`, 204, 131);
  pdf.text(`Doors: ${estimate.doorsCount}`, 204, 138);
  pdf.text(`Windows: ${estimate.windowsCount}`, 204, 145);
  pdf.text(`Bricks: ${estimate.materials.bricks}`, 204, 152);
  pdf.text(`Cement Bags: ${estimate.materials.cementBags}`, 204, 159);
  pdf.text(`Steel KG: ${estimate.materials.steelKg}`, 204, 166);

  pdf.setFontSize(8.7);
  pdf.text(`Low: PKR ${estimate.cost.low.toLocaleString()}`, 204, 178);
  pdf.text(`Medium: PKR ${estimate.cost.medium.toLocaleString()}`, 204, 185);
  pdf.text(`High: PKR ${estimate.cost.high.toLocaleString()}`, 204, 192);

  pdf.setFontSize(10);
  pdf.text("Room Schedule", 12, 162);

  const floorRooms = (plan.rooms || []).filter((room) => room.floor === activeFloor);
  let y = 170;

  pdf.setFontSize(7.5);
  pdf.setFillColor(241, 245, 249);
  pdf.rect(12, y - 5, 185, 7, "F");
  pdf.text("Room", 14, y);
  pdf.text("Type", 70, y);
  pdf.text("Size", 115, y);
  pdf.text("Area", 155, y);

  y += 7;

  floorRooms.slice(0, 9).forEach((room) => {
    const w = Math.round(room.width / plan.scale);
    const h = Math.round(room.height / plan.scale);
    const area = w * h;

    pdf.text(String(room.name || "-").slice(0, 28), 14, y);
    pdf.text(String(room.type || "-").slice(0, 18), 70, y);
    pdf.text(`${w}' x ${h}'`, 115, y);
    pdf.text(`${area} sq ft`, 155, y);

    y += 6;
  });

  pdf.setFontSize(7);
  const note = info.projectNotes || "AI-generated concept drawing. Verify by licensed architect/engineer before construction.";
  pdf.text(String(note).slice(0, 145), 12, 202);

  pdf.save(`${plan.title || "nexacad-drawing"}.pdf`);
}

export async function exportPlanDXF(plan) {
  if (!plan) {
    alert("Generate a plan first.");
    return;
  }

  const res = await axios.post(
    `${API_URL}/api/export/dxf`,
    { plan },
    {
      responseType: "blob"
    }
  );

  const blob = new Blob([res.data], {
    type: "application/dxf"
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${plan.title || "nexacad-plan"}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportBOQCSV(plan) {
  if (!plan) {
    alert("Generate a plan first.");
    return;
  }

  const info = plan.projectInfo || {};
  const rows = [];

  rows.push(["NexaCAD AI Pro - BOQ / Estimate"]);
  rows.push(["Project", plan.title]);
  rows.push(["Client", info.clientName || ""]);
  rows.push(["Phone", info.clientPhone || ""]);
  rows.push(["Location", info.projectLocation || ""]);
  rows.push(["Prepared By", info.preparedBy || "NexaCAD AI Pro"]);
  rows.push(["Status", info.drawingStatus || "Concept Drawing"]);
  rows.push(["Plot", `${plan.plot.width} x ${plan.plot.length} ft`]);
  rows.push(["Floors", plan.floors]);
  rows.push([]);
  rows.push(["ROOM SCHEDULE"]);
  rows.push(["Floor", "Room", "Type", "Width ft", "Length ft", "Area sq ft"]);

  plan.rooms.forEach((room) => {
    const width = Math.round(room.width / plan.scale);
    const length = Math.round(room.height / plan.scale);
    const area = Math.round(width * length);

    rows.push([
      room.floor === 0 ? "Ground Floor" : `Floor ${room.floor}`,
      room.name,
      room.type,
      width,
      length,
      area
    ]);
  });

  rows.push([]);
  rows.push(["CAD OBJECTS"]);
  rows.push(["Walls", plan.walls?.length || 0]);
  rows.push(["Dimensions", plan.dimensions?.length || 0]);
  rows.push(["Text Labels", plan.texts?.length || 0]);

  rows.push([]);
  rows.push(["MATERIAL ESTIMATE"]);
  rows.push(["Built Area sq ft", plan.estimate.totalBuiltArea]);
  rows.push(["Wall Length ft", plan.estimate.totalWallLength]);
  rows.push(["Doors", plan.estimate.doorsCount]);
  rows.push(["Windows", plan.estimate.windowsCount]);
  rows.push(["Bricks", plan.estimate.materials.bricks]);
  rows.push(["Cement Bags", plan.estimate.materials.cementBags]);
  rows.push(["Sand CFT", plan.estimate.materials.sandCft]);
  rows.push(["Steel KG", plan.estimate.materials.steelKg]);
  rows.push(["Tiles sq ft", plan.estimate.materials.tileSqft]);
  rows.push(["Paint sq ft", plan.estimate.materials.paintSqft]);

  rows.push([]);
  rows.push(["COST ESTIMATE"]);
  rows.push(["Low Cost PKR", plan.estimate.cost.low]);
  rows.push(["Medium Cost PKR", plan.estimate.cost.medium]);
  rows.push(["High Cost PKR", plan.estimate.cost.high]);
  rows.push([]);
  rows.push(["Note", plan.estimate.note]);

  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${plan.title || "nexacad-boq"}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}