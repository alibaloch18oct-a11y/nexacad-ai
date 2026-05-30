const fs = require("fs");

const file = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src\\App.jsx";

function backup() {
  const backupFile = `${file}.phase17-buttons-backup-${Date.now()}`;
  fs.copyFileSync(file, backupFile);
  console.log("Backup:", backupFile);
}

function read() {
  return fs.readFileSync(file, "utf8");
}

function write(code) {
  fs.writeFileSync(file, code, "utf8");
  console.log("Updated:", file);
}

backup();

let code = read();

/* -------------------------------------------------------
   1) Add planMode state
------------------------------------------------------- */

if (!code.includes("const [planMode, setPlanMode]")) {
  code = code.replace(
    `const [viewMode, setViewMode] = useState("dashboard");`,
    `const [viewMode, setViewMode] = useState("dashboard");
  const [planMode, setPlanMode] = useState("architectural");`
  );

  console.log("Added: planMode state");
} else {
  console.log("OK: planMode state exists");
}

/* -------------------------------------------------------
   2) Add helpers if missing
------------------------------------------------------- */

if (!code.includes("function generateFurnitureLayout")) {
  const helpers = `
function makeFurnitureForRoom(room, plan) {
  const scale = plan?.scale || 12;
  const items = [];

  function add(type, name, x, y, width, height, color) {
    items.push({
      id: uuidv4(),
      type,
      name,
      floor: room.floor || 0,
      roomId: room.id,
      x,
      y,
      width,
      height,
      color,
      layer: "furniture",
      rotation: 0
    });
  }

  const x = room.x;
  const y = room.y;
  const w = room.width;
  const h = room.height;
  const name = String(room.name || "").toLowerCase();

  if (room.type === "bedroom" || name.includes("bed")) {
    add("bed", "Bed", x + w * 0.12, y + h * 0.16, Math.min(5 * scale, w * 0.42), Math.min(6.5 * scale, h * 0.48), "#c4b5fd");
    add("wardrobe", "Wardrobe", x + w * 0.62, y + h * 0.12, Math.min(3 * scale, w * 0.25), Math.min(1.3 * scale, h * 0.16), "#a78bfa");
  }

  if (room.type === "living" || room.type === "lounge" || name.includes("lounge") || name.includes("living")) {
    add("sofa", "Sofa", x + w * 0.12, y + h * 0.18, Math.min(6 * scale, w * 0.45), Math.min(2.3 * scale, h * 0.22), "#fde68a");
    add("tv-unit", "TV Unit", x + w * 0.62, y + h * 0.2, Math.min(4.5 * scale, w * 0.32), Math.min(1 * scale, h * 0.12), "#f59e0b");
    add("coffee-table", "Coffee Table", x + w * 0.32, y + h * 0.52, Math.min(3 * scale, w * 0.28), Math.min(1.8 * scale, h * 0.18), "#fef3c7");
  }

  if (room.type === "drawing" || name.includes("drawing")) {
    add("sofa-set", "Sofa Set", x + w * 0.14, y + h * 0.2, Math.min(6 * scale, w * 0.5), Math.min(2.2 * scale, h * 0.24), "#bae6fd");
    add("center-table", "Center Table", x + w * 0.34, y + h * 0.55, Math.min(3 * scale, w * 0.3), Math.min(1.8 * scale, h * 0.2), "#e0f2fe");
  }

  if (room.type === "kitchen" || name.includes("kitchen")) {
    add("kitchen-counter", "Kitchen Counter", x + w * 0.1, y + h * 0.1, Math.min(7 * scale, w * 0.72), Math.min(1.3 * scale, h * 0.18), "#94a3b8");
    add("sink", "Sink", x + w * 0.16, y + h * 0.12, Math.min(2 * scale, w * 0.22), Math.min(1 * scale, h * 0.12), "#67e8f9");
  }

  if (room.type === "bathroom" || name.includes("bath")) {
    add("toilet", "Toilet", x + w * 0.14, y + h * 0.16, Math.min(1.8 * scale, w * 0.28), Math.min(2.2 * scale, h * 0.3), "#f8fafc");
    add("basin", "Basin", x + w * 0.58, y + h * 0.16, Math.min(1.8 * scale, w * 0.28), Math.min(1.4 * scale, h * 0.22), "#e0f2fe");
    add("shower", "Shower", x + w * 0.55, y + h * 0.58, Math.min(2.2 * scale, w * 0.32), Math.min(2.2 * scale, h * 0.32), "#cffafe");
  }

  if (room.type === "parking" || name.includes("porch") || name.includes("parking")) {
    add("car", "Car", x + w * 0.18, y + h * 0.18, Math.min(6.5 * scale, w * 0.62), Math.min(12 * scale, h * 0.7), "#bfdbfe");
  }

  return items;
}

function generateFurnitureLayout(plan) {
  const next = clone(plan);
  next.furniture = [];

  (next.rooms || []).forEach((room) => {
    next.furniture.push(...makeFurnitureForRoom(room, next));
  });

  next.updatedAt = new Date().toISOString();
  return next;
}

function generateElectricalPlan(plan) {
  const next = clone(plan);
  next.electrical = [];

  function add(type, name, room, x, y, width, height, color) {
    next.electrical.push({
      id: uuidv4(),
      type,
      name,
      floor: room?.floor || 0,
      roomId: room?.id || null,
      x,
      y,
      width,
      height,
      color,
      layer: "electrical"
    });
  }

  (next.rooms || []).forEach((room) => {
    const cx = room.x + room.width / 2;
    const cy = room.y + room.height / 2;
    const name = String(room.name || "").toLowerCase();

    add("light", "Light", room, cx - 9, cy - 9, 18, 18, "#fde047");

    if (!["bathroom", "store", "parking", "terrace"].includes(room.type)) {
      add("fan", "Fan", room, cx - 12, cy + 18, 24, 24, "#38bdf8");
    }

    add("switch", "Switch Board", room, room.x + 10, room.y + room.height - 24, 22, 14, "#f97316");

    if (["bedroom", "living", "drawing", "kitchen"].includes(room.type) || name.includes("lounge")) {
      add("socket", "Socket", room, room.x + room.width - 28, room.y + room.height - 24, 18, 14, "#22c55e");
    }

    if (room.type === "bedroom" || name.includes("bed")) {
      add("ac", "AC Point", room, room.x + room.width - 34, room.y + 12, 28, 16, "#a855f7");
    }
  });

  next.electrical.push({
    id: uuidv4(),
    type: "db",
    name: "DB Panel",
    floor: 0,
    roomId: null,
    x: 18,
    y: 18,
    width: 34,
    height: 26,
    color: "#ef4444",
    layer: "electrical"
  });

  next.updatedAt = new Date().toISOString();
  return next;
}

function generatePlumbingPlan(plan) {
  const next = clone(plan);
  const scale = next.scale || 12;
  next.plumbing = [];

  function add(type, name, room, x, y, width, height, color) {
    next.plumbing.push({
      id: uuidv4(),
      type,
      name,
      floor: room?.floor || 0,
      roomId: room?.id || null,
      x,
      y,
      width,
      height,
      color,
      layer: "plumbing"
    });
  }

  (next.rooms || []).forEach((room) => {
    const name = String(room.name || "").toLowerCase();

    if (room.type === "bathroom" || name.includes("bath")) {
      add("water", "Water Point", room, room.x + 14, room.y + 14, 18, 18, "#0ea5e9");
      add("drain", "Drainage", room, room.x + room.width - 32, room.y + room.height - 32, 22, 22, "#64748b");
      add("toilet", "WC", room, room.x + 16, room.y + room.height - 40, 26, 30, "#f8fafc");
      add("basin", "Basin", room, room.x + room.width - 42, room.y + 16, 30, 20, "#bae6fd");
      add("shower", "Shower", room, room.x + room.width - 42, room.y + room.height - 42, 30, 30, "#cffafe");
    }

    if (room.type === "kitchen" || name.includes("kitchen")) {
      add("sink", "Kitchen Sink", room, room.x + 18, room.y + 16, 32, 20, "#67e8f9");
      add("water", "Kitchen Water", room, room.x + 58, room.y + 18, 18, 18, "#0ea5e9");
      add("drain", "Kitchen Drain", room, room.x + 84, room.y + 18, 18, 18, "#64748b");
    }
  });

  next.plumbing.push({
    id: uuidv4(),
    type: "tank",
    name: "Overhead Tank",
    floor: Math.max(0, (next.floors || 1) - 1),
    roomId: null,
    x: 20,
    y: 20,
    width: 50,
    height: 34,
    color: "#38bdf8",
    layer: "plumbing"
  });

  next.plumbing.push({
    id: uuidv4(),
    type: "sewer",
    name: "Sewer Outlet",
    floor: 0,
    roomId: null,
    x: (next.plot?.width || 30) * scale - 55,
    y: (next.plot?.length || 60) * scale - 45,
    width: 40,
    height: 28,
    color: "#475569",
    layer: "plumbing"
  });

  next.updatedAt = new Date().toISOString();
  return next;
}
`;

  code = code.replace("export default function App()", `${helpers}\n\nexport default function App()`);
  console.log("Added: furniture/electrical/plumbing helpers");
} else {
  console.log("OK: helpers exist");
}

/* -------------------------------------------------------
   3) Add arrays to normalizePlan / safe plan
------------------------------------------------------- */

[
  "furniture",
  "electrical",
  "plumbing"
].forEach((key) => {
  const line = `${key}: Array.isArray(plan.${key}) ? plan.${key} : [],`;

  if (!code.includes(line)) {
    code = code.replace(
      `walls: Array.isArray(plan.walls) ? plan.walls : [],`,
      `walls: Array.isArray(plan.walls) ? plan.walls : [],
    ${line}`
    );
    console.log("Added normalize key:", key);
  }
});

/* -------------------------------------------------------
   4) Pass props to CADCanvas
------------------------------------------------------- */

if (!code.includes("planMode={planMode}")) {
  code = code.replace(
    `onMoveCurvedWall={(id, updates) => updatePlanList("curvedWalls", id, updates)}`,
    `onMoveCurvedWall={(id, updates) => updatePlanList("curvedWalls", id, updates)}
                  onMoveFurniture={(id, updates) => updatePlanList("furniture", id, updates)}
                  onMoveElectrical={(id, updates) => updatePlanList("electrical", id, updates)}
                  onMovePlumbing={(id, updates) => updatePlanList("plumbing", id, updates)}
                  planMode={planMode}`
  );
  console.log("Added: CADCanvas planMode props");
}

/* -------------------------------------------------------
   5) Insert visible plan mode buttons after 2D / 3D / Exterior tabs
------------------------------------------------------- */

if (!code.includes('data-plan-mode-button="furniture"')) {
  const buttons = `
                <span className="plan-mode-separator">|</span>

                <button
                  data-plan-mode-button="architectural"
                  className={planMode === "architectural" ? "active view-toggle" : "view-toggle"}
                  onClick={() => setPlanMode("architectural")}
                >
                  Architectural
                </button>

                <button
                  data-plan-mode-button="furniture"
                  className={planMode === "furniture" ? "active view-toggle" : "view-toggle"}
                  onClick={() => {
                    setPlanMode("furniture");
                    if (plan && (!plan.furniture || plan.furniture.length === 0)) {
                      commit(generateFurnitureLayout(plan));
                    }
                  }}
                >
                  Furniture
                </button>

                <button
                  data-plan-mode-button="electrical"
                  className={planMode === "electrical" ? "active view-toggle" : "view-toggle"}
                  onClick={() => {
                    setPlanMode("electrical");
                    if (plan && (!plan.electrical || plan.electrical.length === 0)) {
                      commit(generateElectricalPlan(plan));
                    }
                  }}
                >
                  Electrical
                </button>

                <button
                  data-plan-mode-button="plumbing"
                  className={planMode === "plumbing" ? "active view-toggle" : "view-toggle"}
                  onClick={() => {
                    setPlanMode("plumbing");
                    if (plan && (!plan.plumbing || plan.plumbing.length === 0)) {
                      commit(generatePlumbingPlan(plan));
                    }
                  }}
                >
                  Plumbing
                </button>
`;

  const exteriorButtonClose = `                  Exterior Elevation
                </button>`;

  if (code.includes(exteriorButtonClose)) {
    code = code.replace(exteriorButtonClose, `${exteriorButtonClose}\n${buttons}`);
    console.log("Added: plan mode buttons after Exterior Elevation");
  } else {
    const threeDButtonClose = `                  3D Preview
                </button>`;
    code = code.replace(threeDButtonClose, `${threeDButtonClose}\n${buttons}`);
    console.log("Added: plan mode buttons after 3D Preview");
  }
} else {
  console.log("OK: plan mode buttons already exist");
}

write(code);

console.log("\\nApp buttons fix complete.");
console.log("Now run:");
console.log("cd D:\\\\ShazeeProjects\\\\nexacad-ai\\\\frontend");
console.log("npm run build");