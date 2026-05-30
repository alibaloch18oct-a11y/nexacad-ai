const fs = require("fs");
const path = require("path");

const root = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src";
const appFile = path.join(root, "App.jsx");
const canvasFile = path.join(root, "components", "CADCanvas.jsx");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
  console.log("Updated:", file);
}

function backup(file) {
  const backupFile = `${file}.fix17-backup-${Date.now()}`;
  fs.copyFileSync(file, backupFile);
  console.log("Backup:", backupFile);
}

backup(appFile);
backup(canvasFile);

/* ---------------- FIX CADCanvas.jsx ---------------- */

let canvas = read(canvasFile);

// 1) Ensure planMode exists in CADCanvas props
if (!canvas.includes("planMode =")) {
  canvas = canvas.replace(
    /onCreateLineObject\s*\n\s*}\)\s*\{/,
    `onCreateLineObject,
  planMode = "architectural"
}) {`
  );

  console.log("Fixed: added planMode prop at end");
} else {
  console.log("OK: planMode prop already exists");
}

// 2) Ensure onMoveFurniture exists
if (!canvas.includes("onMoveFurniture =")) {
  canvas = canvas.replace(
    /onMoveCurvedWall,\s*\n/,
    `onMoveCurvedWall,
  onMoveFurniture = () => {},
`
  );

  console.log("Fixed: added onMoveFurniture prop");
} else {
  console.log("OK: onMoveFurniture prop already exists");
}

// 3) Ensure onMoveElectrical exists
if (!canvas.includes("onMoveElectrical =")) {
  canvas = canvas.replace(
    /onMoveFurniture = \(\) => \{\},\s*\n/,
    `onMoveFurniture = () => {},
  onMoveElectrical = () => {},
  onMovePlumbing = () => {},
`
  );

  console.log("Fixed: added onMoveElectrical/onMovePlumbing props");
} else {
  console.log("OK: electrical/plumbing move props already exist");
}

// 4) Ensure furniture exists in safePlan normalization
if (!canvas.includes("furniture: Array.isArray(plan.furniture)")) {
  canvas = canvas.replace(
    /walls: Array\.isArray\(plan\.walls\) \? plan\.walls : \[\],/,
    `walls: Array.isArray(plan.walls) ? plan.walls : [],
      furniture: Array.isArray(plan.furniture) ? plan.furniture : [],
      electrical: Array.isArray(plan.electrical) ? plan.electrical : [],
      plumbing: Array.isArray(plan.plumbing) ? plan.plumbing : [],`
  );

  console.log("Fixed: added furniture/electrical/plumbing normalization");
} else {
  console.log("OK: furniture normalization exists");
}

// 5) Ensure local lists exist
if (!canvas.includes("const furniture = (safePlan.furniture || [])")) {
  canvas = canvas.replace(
    /const walls = safePlan\.walls\.filter\(\(wall\) => wall\.floor === activeFloor\);/,
    `const walls = safePlan.walls.filter((wall) => wall.floor === activeFloor);
  const furniture = (safePlan.furniture || []).filter((item) => item.floor === activeFloor);
  const electrical = (safePlan.electrical || []).filter((item) => item.floor === activeFloor);
  const plumbing = (safePlan.plumbing || []).filter((item) => item.floor === activeFloor);`
  );

  console.log("Fixed: added furniture/electrical/plumbing lists");
} else {
  console.log("OK: furniture list exists");
}

// 6) Guard against missing planMode anywhere
canvas = canvas.replaceAll("planMode ===", "(planMode || \"architectural\") ===");
canvas = canvas.replaceAll("planMode !==", "(planMode || \"architectural\") !==");

write(canvasFile, canvas);

/* ---------------- FIX App.jsx ---------------- */

let app = read(appFile);

// 1) Ensure planMode state exists
if (!app.includes("const [planMode, setPlanMode]")) {
  app = app.replace(
    `const [viewMode, setViewMode] = useState("dashboard");`,
    `const [viewMode, setViewMode] = useState("dashboard");
  const [planMode, setPlanMode] = useState("architectural");`
  );

  console.log("Fixed: added planMode state");
} else {
  console.log("OK: planMode state exists");
}

// 2) Ensure furniture generator helper exists
if (!app.includes("function generateFurnitureLayout")) {
  const helper = `
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

  if (room.type === "bedroom") {
    add("bed", "Bed", x + w * 0.12, y + h * 0.16, Math.min(5 * scale, w * 0.42), Math.min(6.5 * scale, h * 0.48), "#c4b5fd");
    add("wardrobe", "Wardrobe", x + w * 0.62, y + h * 0.12, Math.min(3 * scale, w * 0.25), Math.min(1.3 * scale, h * 0.16), "#a78bfa");
  }

  if (room.type === "living" || room.type === "lounge" || String(room.name || "").toLowerCase().includes("lounge")) {
    add("sofa", "Sofa", x + w * 0.12, y + h * 0.18, Math.min(6 * scale, w * 0.45), Math.min(2.3 * scale, h * 0.22), "#fde68a");
    add("tv-unit", "TV Unit", x + w * 0.62, y + h * 0.2, Math.min(4.5 * scale, w * 0.32), Math.min(1 * scale, h * 0.12), "#f59e0b");
    add("coffee-table", "Coffee Table", x + w * 0.32, y + h * 0.52, Math.min(3 * scale, w * 0.28), Math.min(1.8 * scale, h * 0.18), "#fef3c7");
  }

  if (room.type === "drawing") {
    add("sofa-set", "Sofa Set", x + w * 0.14, y + h * 0.2, Math.min(6 * scale, w * 0.5), Math.min(2.2 * scale, h * 0.24), "#bae6fd");
    add("center-table", "Center Table", x + w * 0.34, y + h * 0.55, Math.min(3 * scale, w * 0.3), Math.min(1.8 * scale, h * 0.2), "#e0f2fe");
  }

  if (room.type === "kitchen") {
    add("kitchen-counter", "Kitchen Counter", x + w * 0.1, y + h * 0.1, Math.min(7 * scale, w * 0.72), Math.min(1.3 * scale, h * 0.18), "#94a3b8");
    add("sink", "Sink", x + w * 0.16, y + h * 0.12, Math.min(2 * scale, w * 0.22), Math.min(1 * scale, h * 0.12), "#67e8f9");
  }

  if (room.type === "bathroom") {
    add("toilet", "Toilet", x + w * 0.14, y + h * 0.16, Math.min(1.8 * scale, w * 0.28), Math.min(2.2 * scale, h * 0.3), "#f8fafc");
    add("basin", "Basin", x + w * 0.58, y + h * 0.16, Math.min(1.8 * scale, w * 0.28), Math.min(1.4 * scale, h * 0.22), "#e0f2fe");
    add("shower", "Shower", x + w * 0.55, y + h * 0.58, Math.min(2.2 * scale, w * 0.32), Math.min(2.2 * scale, h * 0.32), "#cffafe");
  }

  if (room.type === "parking") {
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
`;

  app = app.replace("export default function App()", `${helper}\n\nexport default function App()`);
  console.log("Fixed: added furniture generator helpers");
} else {
  console.log("OK: furniture generator exists");
}

// 3) Ensure CADCanvas receives planMode and handlers
if (!app.includes("planMode={planMode}")) {
  app = app.replace(
    /onMoveCurvedWall=\{\(id, updates\) => updatePlanList\("curvedWalls", id, updates\)\}/,
    `onMoveCurvedWall={(id, updates) => updatePlanList("curvedWalls", id, updates)}
                  onMoveFurniture={(id, updates) => updatePlanList("furniture", id, updates)}
                  onMoveElectrical={(id, updates) => updatePlanList("electrical", id, updates)}
                  onMovePlumbing={(id, updates) => updatePlanList("plumbing", id, updates)}
                  planMode={planMode}`
  );

  console.log("Fixed: passed planMode and object move handlers to CADCanvas");
} else {
  console.log("OK: CADCanvas planMode prop exists");
}

// 4) Add plan mode buttons if missing
if (!app.includes("Furniture</button>") && !app.includes(">Furniture</button>")) {
  const planModeButtons = `
                <button
                  className={planMode === "architectural" ? "active view-toggle" : "view-toggle"}
                  onClick={() => setPlanMode("architectural")}
                >
                  Architectural
                </button>

                <button
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
                  className={planMode === "electrical" ? "active view-toggle" : "view-toggle"}
                  onClick={() => {
                    setPlanMode("electrical");
                    if (typeof generateElectricalPlan === "function" && plan && (!plan.electrical || plan.electrical.length === 0)) {
                      commit(generateElectricalPlan(plan));
                    }
                  }}
                >
                  Electrical
                </button>

                <button
                  className={planMode === "plumbing" ? "active view-toggle" : "view-toggle"}
                  onClick={() => {
                    setPlanMode("plumbing");
                    if (typeof generatePlumbingPlan === "function" && plan && (!plan.plumbing || plan.plumbing.length === 0)) {
                      commit(generatePlumbingPlan(plan));
                    }
                  }}
                >
                  Plumbing
                </button>
`;

  if (app.includes(`<button
                  className="view-toggle auto-fix-btn"`)) {
    app = app.replace(
      `<button
                  className="view-toggle auto-fix-btn"`,
      `${planModeButtons}
                <button
                  className="view-toggle auto-fix-btn"`
    );
    console.log("Fixed: inserted plan mode buttons before Auto-Fix");
  } else if (app.includes(`Auto-Fix Overlaps`)) {
    app = app.replace(`Auto-Fix Overlaps`, `Auto-Fix Overlaps`);
    console.log("WARNING: Could not find exact button location. Buttons not inserted.");
  } else {
    console.log("WARNING: Auto-Fix button not found. Buttons not inserted.");
  }
} else {
  console.log("OK: Furniture button exists");
}

// 5) Ensure normalizePlan includes arrays
if (!app.includes("furniture: Array.isArray(plan.furniture)")) {
  app = app.replace(
    /walls: Array\.isArray\(plan\.walls\) \? plan\.walls : \[\],/,
    `walls: Array.isArray(plan.walls) ? plan.walls : [],
    furniture: Array.isArray(plan.furniture) ? plan.furniture : [],
    electrical: Array.isArray(plan.electrical) ? plan.electrical : [],
    plumbing: Array.isArray(plan.plumbing) ? plan.plumbing : [],`
  );

  console.log("Fixed: normalizePlan arrays");
} else {
  console.log("OK: normalizePlan arrays exist");
}

write(appFile, app);

console.log("\\nPhase 17 repair completed.");
console.log("Now run:");
console.log("cd D:\\\\ShazeeProjects\\\\nexacad-ai\\\\frontend");
console.log("npm run build");