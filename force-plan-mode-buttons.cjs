const fs = require("fs");

const file = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src\\App.jsx";

function backup() {
  const backupFile = `${file}.force-plan-buttons-backup-${Date.now()}`;
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

/* 1) Add planMode state */
if (!code.includes("const [planMode, setPlanMode]")) {
  code = code.replace(
    `const [viewMode, setViewMode] = useState("dashboard");`,
    `const [viewMode, setViewMode] = useState("dashboard");
  const [planMode, setPlanMode] = useState("architectural");`
  );
  console.log("Added planMode state");
}

/* 2) Add simple generators if missing */
if (!code.includes("function generateFurnitureLayout")) {
  const helpers = `
function generateFurnitureLayout(plan) {
  const next = clone(plan);
  const scale = next.scale || 12;
  next.furniture = [];

  function add(room, type, name, x, y, width, height, color) {
    next.furniture.push({
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

  (next.rooms || []).forEach((room) => {
    const name = String(room.name || "").toLowerCase();

    if (room.type === "bedroom" || name.includes("bed")) {
      add(room, "bed", "Bed", room.x + room.width * 0.12, room.y + room.height * 0.18, Math.min(5 * scale, room.width * 0.42), Math.min(6 * scale, room.height * 0.45), "#c4b5fd");
      add(room, "wardrobe", "Wardrobe", room.x + room.width * 0.62, room.y + room.height * 0.12, Math.min(3 * scale, room.width * 0.25), Math.min(1.3 * scale, room.height * 0.16), "#a78bfa");
    }

    if (room.type === "living" || room.type === "drawing" || name.includes("lounge") || name.includes("living") || name.includes("drawing")) {
      add(room, "sofa", "Sofa", room.x + room.width * 0.12, room.y + room.height * 0.18, Math.min(6 * scale, room.width * 0.45), Math.min(2.3 * scale, room.height * 0.22), "#fde68a");
      add(room, "table", "Table", room.x + room.width * 0.35, room.y + room.height * 0.52, Math.min(3 * scale, room.width * 0.28), Math.min(1.8 * scale, room.height * 0.18), "#fef3c7");
      add(room, "tv", "TV Unit", room.x + room.width * 0.65, room.y + room.height * 0.18, Math.min(4 * scale, room.width * 0.3), Math.min(1 * scale, room.height * 0.12), "#f59e0b");
    }

    if (room.type === "kitchen" || name.includes("kitchen")) {
      add(room, "counter", "Kitchen Counter", room.x + room.width * 0.1, room.y + room.height * 0.1, Math.min(7 * scale, room.width * 0.72), Math.min(1.3 * scale, room.height * 0.18), "#94a3b8");
      add(room, "sink", "Sink", room.x + room.width * 0.16, room.y + room.height * 0.12, Math.min(2 * scale, room.width * 0.22), Math.min(1 * scale, room.height * 0.12), "#67e8f9");
    }

    if (room.type === "bathroom" || name.includes("bath")) {
      add(room, "toilet", "Toilet", room.x + room.width * 0.14, room.y + room.height * 0.16, Math.min(1.8 * scale, room.width * 0.28), Math.min(2.2 * scale, room.height * 0.3), "#f8fafc");
      add(room, "basin", "Basin", room.x + room.width * 0.58, room.y + room.height * 0.16, Math.min(1.8 * scale, room.width * 0.28), Math.min(1.4 * scale, room.height * 0.22), "#e0f2fe");
    }

    if (room.type === "parking" || name.includes("porch")) {
      add(room, "car", "Car", room.x + room.width * 0.18, room.y + room.height * 0.18, Math.min(6.5 * scale, room.width * 0.62), Math.min(12 * scale, room.height * 0.7), "#bfdbfe");
    }
  });

  next.updatedAt = new Date().toISOString();
  return next;
}

function generateElectricalPlan(plan) {
  const next = clone(plan);
  next.electrical = [];

  function add(room, type, name, x, y, width, height, color) {
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

    add(room, "light", "Light", cx - 9, cy - 9, 18, 18, "#fde047");

    if (!["bathroom", "store", "parking", "terrace"].includes(room.type)) {
      add(room, "fan", "Fan", cx - 12, cy + 18, 24, 24, "#38bdf8");
    }

    add(room, "switch", "Switch Board", room.x + 10, room.y + room.height - 24, 22, 14, "#f97316");
    add(room, "socket", "Socket", room.x + room.width - 28, room.y + room.height - 24, 18, 14, "#22c55e");

    if (room.type === "bedroom" || String(room.name || "").toLowerCase().includes("bed")) {
      add(room, "ac", "AC Point", room.x + room.width - 34, room.y + 12, 28, 16, "#a855f7");
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

  function add(room, type, name, x, y, width, height, color) {
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
      add(room, "water", "Water", room.x + 14, room.y + 14, 18, 18, "#0ea5e9");
      add(room, "drain", "Drain", room.x + room.width - 32, room.y + room.height - 32, 22, 22, "#64748b");
      add(room, "toilet", "WC", room.x + 16, room.y + room.height - 40, 26, 30, "#f8fafc");
      add(room, "basin", "Basin", room.x + room.width - 42, room.y + 16, 30, 20, "#bae6fd");
    }

    if (room.type === "kitchen" || name.includes("kitchen")) {
      add(room, "sink", "Kitchen Sink", room.x + 18, room.y + 16, 32, 20, "#67e8f9");
      add(room, "water", "Kitchen Water", room.x + 58, room.y + 18, 18, 18, "#0ea5e9");
      add(room, "drain", "Kitchen Drain", room.x + 84, room.y + 18, 18, 18, "#64748b");
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
  console.log("Added generator helpers");
}

/* 3) Make sure normalizePlan has arrays */
["furniture", "electrical", "plumbing"].forEach((key) => {
  const line = `${key}: Array.isArray(plan.${key}) ? plan.${key} : [],`;

  if (!code.includes(line)) {
    code = code.replace(
      `walls: Array.isArray(plan.walls) ? plan.walls : [],`,
      `walls: Array.isArray(plan.walls) ? plan.walls : [],
    ${line}`
    );
    console.log("Added normalize:", key);
  }
});

/* 4) Make sure CADCanvas gets props */
if (!code.includes("planMode={planMode}")) {
  code = code.replace(
    `onMoveCurvedWall={(id, updates) => updatePlanList("curvedWalls", id, updates)}`,
    `onMoveCurvedWall={(id, updates) => updatePlanList("curvedWalls", id, updates)}
                  onMoveFurniture={(id, updates) => updatePlanList("furniture", id, updates)}
                  onMoveElectrical={(id, updates) => updatePlanList("electrical", id, updates)}
                  onMovePlumbing={(id, updates) => updatePlanList("plumbing", id, updates)}
                  planMode={planMode}`
  );
  console.log("Added CADCanvas move props");
}

/* 5) Force insert buttons after BOQ CSV button */
if (!code.includes('data-plan-mode-button="furniture"')) {
  const buttons = `
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
                    if (plan) {
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
                    if (plan) {
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
                    if (plan) {
                      commit(generatePlumbingPlan(plan));
                    }
                  }}
                >
                  Plumbing
                </button>
`;

  const boqClose = `                  BOQ CSV
                </button>`;

  if (code.includes(boqClose)) {
    code = code.replace(boqClose, `${boqClose}\n${buttons}`);
    console.log("Inserted buttons after BOQ CSV");
  } else {
    console.log("BOQ CSV exact location not found. Trying fallback...");

    const fallback = `Zoom: {Math.round(zoom * 100)}%`;

    if (code.includes(fallback)) {
      code = code.replace(fallback, `${buttons}\n                ${fallback}`);
      console.log("Inserted buttons before zoom text");
    } else {
      console.log("Could not insert buttons automatically.");
    }
  }
}

write(code);

console.log("\\nDone. Now run npm run build.");