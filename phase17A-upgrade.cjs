const fs = require("fs");
const path = require("path");

const root = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src";
const components = path.join(root, "components");
const appFile = path.join(root, "App.jsx");
const canvasFile = path.join(components, "CADCanvas.jsx");
const threeFile = path.join(components, "ThreeDPreview.jsx");
const cssFile = path.join(root, "index.css");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
  console.log("Updated:", file);
}

function backup(file) {
  const backupFile = `${file}.phase17A-backup-${Date.now()}`;
  fs.copyFileSync(file, backupFile);
  console.log("Backup:", backupFile);
}

function replaceOnce(content, from, to, label) {
  if (!content.includes(from)) {
    console.log("SKIPPED:", label);
    return content;
  }

  console.log("PATCHED:", label);
  return content.replace(from, to);
}

function addBefore(content, before, addition, label) {
  if (content.includes(addition.slice(0, 80))) {
    console.log("ALREADY EXISTS:", label);
    return content;
  }

  if (!content.includes(before)) {
    console.log("SKIPPED:", label);
    return content;
  }

  console.log("ADDED:", label);
  return content.replace(before, addition + "\n\n" + before);
}

function appendOnce(content, marker, addition, label) {
  if (content.includes(marker)) {
    console.log("ALREADY EXISTS:", label);
    return content;
  }

  console.log("ADDED:", label);
  return content + "\n\n" + addition;
}

[appFile, canvasFile, threeFile, cssFile].forEach(backup);

/* ---------------- APP PATCHES ---------------- */

let app = read(appFile);

const helpers = `
function makeFurnitureForRoom(room, plan) {
  const scale = plan?.scale || 12;
  const base = {
    floor: room.floor || 0,
    roomId: room.id,
    layer: "furniture",
    rotation: 0
  };

  const items = [];

  function add(type, name, x, y, width, height, color) {
    items.push({
      ...base,
      id: uuidv4(),
      type,
      name,
      x,
      y,
      width,
      height,
      color
    });
  }

  const x = room.x;
  const y = room.y;
  const w = room.width;
  const h = room.height;

  if (room.type === "bedroom") {
    add("bed", "Bed", x + w * 0.12, y + h * 0.16, Math.min(5 * scale, w * 0.42), Math.min(6.5 * scale, h * 0.48), "#c4b5fd");
    add("wardrobe", "Wardrobe", x + w * 0.62, y + h * 0.12, Math.min(3 * scale, w * 0.25), Math.min(1.3 * scale, h * 0.16), "#a78bfa");
    add("side-table", "Side Table", x + w * 0.12, y + h * 0.68, Math.min(1.5 * scale, w * 0.16), Math.min(1.5 * scale, h * 0.16), "#ddd6fe");
  }

  if (room.type === "living" || room.type === "lounge" || room.name?.toLowerCase().includes("lounge")) {
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

function applyPhase17Command(plan, command) {
  if (!plan || !command) return null;

  const text = String(command).toLowerCase();

  const furnitureWords = [
    "add furniture",
    "furniture layout",
    "furnish",
    "add bed",
    "add sofa",
    "add car",
    "add wardrobe",
    "add kitchen counter"
  ];

  if (furnitureWords.some((word) => text.includes(word))) {
    return {
      plan: generateFurnitureLayout(plan),
      viewMode: "2d",
      planMode: "furniture"
    };
  }

  return null;
}
`;

app = addBefore(app, "export default function App()", helpers, "Add Phase17A helper functions");

app = replaceOnce(
  app,
  `    walls: Array.isArray(plan.walls) ? plan.walls : [],`,
  `    walls: Array.isArray(plan.walls) ? plan.walls : [],
    furniture: Array.isArray(plan.furniture) ? plan.furniture : [],`,
  "Normalize furniture"
);

app = replaceOnce(
  app,
  `  const [viewMode, setViewMode] = useState("dashboard");`,
  `  const [viewMode, setViewMode] = useState("dashboard");
  const [planMode, setPlanMode] = useState("architectural");`,
  "Add planMode state"
);

app = replaceOnce(
  app,
  `    const localDesignCommand = applyNexaCADDesignCommand(plan, aiCommand, activeFloor);`,
  `    const phase17Command = applyPhase17Command(plan, aiCommand);

    if (phase17Command) {
      commit(phase17Command.plan);
      setViewMode(phase17Command.viewMode);
      setPlanMode(phase17Command.planMode);
      setAiCommand("");
      return;
    }

    const localDesignCommand = applyNexaCADDesignCommand(plan, aiCommand, activeFloor);`,
  "Intercept furniture AI commands"
);

app = replaceOnce(
  app,
  `    if (selected.type === "wall") next.walls = next.walls.filter((item) => item.id !== selected.id);`,
  `    if (selected.type === "wall") next.walls = next.walls.filter((item) => item.id !== selected.id);
    if (selected.type === "furniture") next.furniture = next.furniture.filter((item) => item.id !== selected.id);`,
  "Delete furniture"
);

app = replaceOnce(
  app,
  `        : selected.type === "wall"
        ? "walls"`,
  `        : selected.type === "wall"
        ? "walls"
        : selected.type === "furniture"
        ? "furniture"`,
  "Update selected furniture list"
);

app = replaceOnce(
  app,
  `                  onMoveWall={(id, updates) => updatePlanList("walls", id, updates)}
                  onMoveCurvedWall={(id, updates) => updatePlanList("curvedWalls", id, updates)}`,
  `                  onMoveWall={(id, updates) => updatePlanList("walls", id, updates)}
                  onMoveCurvedWall={(id, updates) => updatePlanList("curvedWalls", id, updates)}
                  onMoveFurniture={(id, updates) => updatePlanList("furniture", id, updates)}
                  planMode={planMode}`,
  "Pass furniture props to CADCanvas"
);

app = replaceOnce(
  app,
  `                <button
                  className="view-toggle auto-fix-btn"
                  onClick={autoFixOverlaps}
                  disabled={!plan}
                >
                  <Wand2 size={15} />
                  Auto-Fix Overlaps
                </button>`,
  `                <button
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
                  onClick={() => setPlanMode("electrical")}
                >
                  Electrical
                </button>

                <button
                  className={planMode === "plumbing" ? "active view-toggle" : "view-toggle"}
                  onClick={() => setPlanMode("plumbing")}
                >
                  Plumbing
                </button>

                <button
                  className="view-toggle auto-fix-btn"
                  onClick={autoFixOverlaps}
                  disabled={!plan}
                >
                  <Wand2 size={15} />
                  Auto-Fix Overlaps
                </button>`,
  "Add plan mode buttons"
);

write(appFile, app);

/* ---------------- CAD CANVAS PATCHES ---------------- */

let canvas = read(canvasFile);

canvas = replaceOnce(
  canvas,
  `      walls: Array.isArray(plan.walls) ? plan.walls : [],`,
  `      walls: Array.isArray(plan.walls) ? plan.walls : [],
      furniture: Array.isArray(plan.furniture) ? plan.furniture : [],`,
  "Normalize furniture in canvas"
);

canvas = replaceOnce(
  canvas,
  `  onMoveWall,
  onMoveCurvedWall,`,
  `  onMoveWall,
  onMoveCurvedWall,
  onMoveFurniture = () => {},
  planMode = "architectural",`,
  "Add furniture props"
);

canvas = replaceOnce(
  canvas,
  `  const walls = safePlan.walls.filter((wall) => wall.floor === activeFloor);`,
  `  const walls = safePlan.walls.filter((wall) => wall.floor === activeFloor);
  const furniture = (safePlan.furniture || []).filter((item) => item.floor === activeFloor);`,
  "Furniture list"
);

const furnitureBlock = `
            {furniture.map((item) => {
              const selectedFurniture = isSelected(selected, "furniture", item.id);

              return (
                <Group
                  key={item.id}
                  x={sheetInsetX + item.x}
                  y={sheetInsetY + item.y}
                  draggable={activeTool === "select"}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setSelected({ type: "furniture", id: item.id });
                  }}
                  onDragEnd={(event) => {
                    onMoveFurniture(item.id, {
                      x: snap(event.target.x() - sheetInsetX),
                      y: snap(event.target.y() - sheetInsetY)
                    });
                  }}
                >
                  <Rect
                    width={item.width}
                    height={item.height}
                    fill={item.color || "#fde68a"}
                    opacity={planMode === "furniture" ? 0.96 : 0.72}
                    stroke={selectedFurniture ? "#2563eb" : "#334155"}
                    strokeWidth={selectedFurniture ? 3 : 1.5}
                    cornerRadius={6}
                    shadowColor={selectedFurniture ? "#2563eb" : "transparent"}
                    shadowBlur={selectedFurniture ? 8 : 0}
                  />

                  <Text
                    text={item.name || item.type}
                    x={4}
                    y={Math.max(4, item.height / 2 - 7)}
                    width={Math.max(1, item.width - 8)}
                    align="center"
                    fontSize={11}
                    fontStyle="bold"
                    fill="#0f172a"
                    listening={false}
                  />
                </Group>
              );
            })}
`;

if (!canvas.includes('selectedFurniture ? "#2563eb"')) {
  canvas = canvas.replace(
    `            {layerVisible("openings") &&`,
    `${furnitureBlock}

            {layerVisible("openings") &&`
  );
  console.log("ADDED: 2D furniture rendering");
} else {
  console.log("ALREADY EXISTS: 2D furniture rendering");
}

write(canvasFile, canvas);

/* ---------------- 3D PATCHES ---------------- */

let three = read(threeFile);

three = replaceOnce(
  three,
  `function Furniture({ rooms, plan, floorY }) {`,
  `function Furniture({ rooms, furniture = [], plan, floorY }) {`,
  "Update Furniture signature"
);

three = replaceOnce(
  three,
  `  return (
    <group>
      {rooms
        .filter((room) => room.type === "bedroom")`,
  `  if (Array.isArray(furniture) && furniture.length > 0) {
    return (
      <group>
        {furniture.map((item) => {
          const s = toScene(item, plan);
          const x = s.x + s.w / 2;
          const z = s.z + s.d / 2;

          return (
            <mesh key={item.id} position={[x, floorY + 0.35, z]} castShadow receiveShadow>
              <boxGeometry args={[s.w, 0.5, s.d]} />
              <meshStandardMaterial color={item.color || "#fde68a"} roughness={0.68} />
              <Edges color="#334155" />
            </mesh>
          );
        })}
      </group>
    );
  }

  return (
    <group>
      {rooms
        .filter((room) => room.type === "bedroom")`,
  "Use plan furniture in 3D"
);

three = replaceOnce(
  three,
  `      <Furniture rooms={model.rooms} plan={plan} floorY={model.floorY} />`,
  `      <Furniture rooms={model.rooms} furniture={model.furniture} plan={plan} floorY={model.floorY} />`,
  "Pass furniture to 3D"
);

three = replaceOnce(
  three,
  `      curvedWalls: (plan.curvedWalls || []).filter((wall) => wall.floor === activeFloor)`,
  `      curvedWalls: (plan.curvedWalls || []).filter((wall) => wall.floor === activeFloor),
      furniture: (plan.furniture || []).filter((item) => item.floor === activeFloor)`,
  "Model furniture"
);

write(threeFile, three);

/* ---------------- CSS ---------------- */

let css = read(cssFile);

const cssAdd = `
/* PHASE 17A - PLAN MODES + FURNITURE */
.view-toggle {
  white-space: nowrap;
}

.floor-tabs .view-toggle.active {
  background: linear-gradient(135deg, #2563eb, #06b6d4) !important;
  color: #ffffff !important;
  border-color: transparent !important;
  box-shadow: 0 16px 40px rgba(37, 99, 235, 0.2);
}
`;

css = appendOnce(css, "PHASE 17A - PLAN MODES + FURNITURE", cssAdd, "Phase17A CSS");
write(cssFile, css);

console.log("\\nPhase 17A completed.");
console.log("Now run:");
console.log("cd D:\\\\ShazeeProjects\\\\nexacad-ai\\\\frontend");
console.log("npm run build");