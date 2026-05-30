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
  const backupFile = `${file}.phase17B-backup-${Date.now()}`;
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
function generateElectricalPlan(plan) {
  const next = clone(plan);
  const scale = next.scale || 12;

  next.electrical = [];

  function add(type, name, floor, x, y, width, height, color, roomId = null) {
    next.electrical.push({
      id: uuidv4(),
      type,
      name,
      floor,
      x,
      y,
      width,
      height,
      color,
      roomId,
      layer: "electrical"
    });
  }

  (next.rooms || []).forEach((room) => {
    const cx = room.x + room.width / 2;
    const cy = room.y + room.height / 2;

    add("light", "Light", room.floor, cx - 9, cy - 9, 18, 18, "#fde047", room.id);

    if (!["bathroom", "store", "parking", "terrace"].includes(room.type)) {
      add("fan", "Fan", room.floor, cx - 12, cy + 18, 24, 24, "#38bdf8", room.id);
    }

    add("switch", "Switch Board", room.floor, room.x + 10, room.y + room.height - 24, 22, 14, "#f97316", room.id);

    if (["bedroom", "living", "drawing", "kitchen"].includes(room.type) || room.name?.toLowerCase().includes("lounge")) {
      add("socket", "Socket", room.floor, room.x + room.width - 28, room.y + room.height - 24, 18, 14, "#22c55e", room.id);
    }

    if (room.type === "bedroom" || room.name?.toLowerCase().includes("bed")) {
      add("ac", "AC Point", room.floor, room.x + room.width - 34, room.y + 12, 28, 16, "#a855f7", room.id);
    }
  });

  const groundRooms = (next.rooms || []).filter((room) => room.floor === 0);

  if (groundRooms.length > 0) {
    add("db", "DB Panel", 0, 18, 18, 34, 26, "#ef4444", null);
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

function generatePlumbingPlan(plan) {
  const next = clone(plan);
  const scale = next.scale || 12;

  next.plumbing = [];

  function add(type, name, floor, x, y, width, height, color, roomId = null) {
    next.plumbing.push({
      id: uuidv4(),
      type,
      name,
      floor,
      x,
      y,
      width,
      height,
      color,
      roomId,
      layer: "plumbing"
    });
  }

  (next.rooms || []).forEach((room) => {
    const lowerName = String(room.name || "").toLowerCase();

    if (room.type === "bathroom" || lowerName.includes("bath") || lowerName.includes("toilet")) {
      add("water", "Water Point", room.floor, room.x + 14, room.y + 14, 18, 18, "#0ea5e9", room.id);
      add("drain", "Drainage", room.floor, room.x + room.width - 32, room.y + room.height - 32, 22, 22, "#64748b", room.id);
      add("toilet", "WC", room.floor, room.x + 16, room.y + room.height - 40, 26, 30, "#f8fafc", room.id);
      add("basin", "Basin", room.floor, room.x + room.width - 42, room.y + 16, 30, 20, "#bae6fd", room.id);
      add("shower", "Shower", room.floor, room.x + room.width - 42, room.y + room.height - 42, 30, 30, "#cffafe", room.id);
    }

    if (room.type === "kitchen" || lowerName.includes("kitchen")) {
      add("sink", "Kitchen Sink", room.floor, room.x + 18, room.y + 16, 32, 20, "#67e8f9", room.id);
      add("water", "Kitchen Water", room.floor, room.x + 58, room.y + 18, 18, 18, "#0ea5e9", room.id);
      add("drain", "Kitchen Drain", room.floor, room.x + 84, room.y + 18, 18, 18, "#64748b", room.id);
    }
  });

  add("tank", "Overhead Tank", Math.max(0, (next.floors || 1) - 1), 20, 20, 50, 34, "#38bdf8", null);
  add("sewer", "Sewer Outlet", 0, (next.plot?.width || 30) * scale - 55, (next.plot?.length || 60) * scale - 45, 40, 28, "#475569", null);

  next.updatedAt = new Date().toISOString();
  return next;
}

function applyPhase17BCommand(plan, command) {
  if (!plan || !command) return null;

  const text = String(command).toLowerCase();

  if (
    text.includes("electrical plan") ||
    text.includes("add lights") ||
    text.includes("add fans") ||
    text.includes("switch board") ||
    text.includes("socket") ||
    text.includes("ac point")
  ) {
    return {
      plan: generateElectricalPlan(plan),
      viewMode: "2d",
      planMode: "electrical"
    };
  }

  if (
    text.includes("plumbing plan") ||
    text.includes("water line") ||
    text.includes("drainage") ||
    text.includes("bathroom drainage") ||
    text.includes("kitchen sink") ||
    text.includes("overhead tank") ||
    text.includes("geyser") ||
    text.includes("sewer")
  ) {
    return {
      plan: generatePlumbingPlan(plan),
      viewMode: "2d",
      planMode: "plumbing"
    };
  }

  return null;
}
`;

app = addBefore(app, "export default function App()", helpers, "Add Phase17B helper functions");

app = replaceOnce(
  app,
  `    furniture: Array.isArray(plan.furniture) ? plan.furniture : [],`,
  `    furniture: Array.isArray(plan.furniture) ? plan.furniture : [],
    electrical: Array.isArray(plan.electrical) ? plan.electrical : [],
    plumbing: Array.isArray(plan.plumbing) ? plan.plumbing : [],`,
  "Normalize electrical/plumbing"
);

app = replaceOnce(
  app,
  `    const phase17Command = applyPhase17Command(plan, aiCommand);`,
  `    const phase17BCommand = applyPhase17BCommand(plan, aiCommand);

    if (phase17BCommand) {
      commit(phase17BCommand.plan);
      setViewMode(phase17BCommand.viewMode);
      setPlanMode(phase17BCommand.planMode);
      setAiCommand("");
      return;
    }

    const phase17Command = applyPhase17Command(plan, aiCommand);`,
  "Intercept electrical/plumbing AI commands"
);

app = replaceOnce(
  app,
  `    if (selected.type === "furniture") next.furniture = next.furniture.filter((item) => item.id !== selected.id);`,
  `    if (selected.type === "furniture") next.furniture = next.furniture.filter((item) => item.id !== selected.id);
    if (selected.type === "electrical") next.electrical = next.electrical.filter((item) => item.id !== selected.id);
    if (selected.type === "plumbing") next.plumbing = next.plumbing.filter((item) => item.id !== selected.id);`,
  "Delete electrical/plumbing"
);

app = replaceOnce(
  app,
  `        : selected.type === "furniture"
        ? "furniture"`,
  `        : selected.type === "furniture"
        ? "furniture"
        : selected.type === "electrical"
        ? "electrical"
        : selected.type === "plumbing"
        ? "plumbing"`,
  "Inspector list electrical/plumbing"
);

app = replaceOnce(
  app,
  `                  onMoveFurniture={(id, updates) => updatePlanList("furniture", id, updates)}
                  planMode={planMode}`,
  `                  onMoveFurniture={(id, updates) => updatePlanList("furniture", id, updates)}
                  onMoveElectrical={(id, updates) => updatePlanList("electrical", id, updates)}
                  onMovePlumbing={(id, updates) => updatePlanList("plumbing", id, updates)}
                  planMode={planMode}`,
  "Pass electrical/plumbing handlers"
);

app = replaceOnce(
  app,
  `                  onClick={() => setPlanMode("electrical")}`,
  `                  onClick={() => {
                    setPlanMode("electrical");
                    if (plan && (!plan.electrical || plan.electrical.length === 0)) {
                      commit(generateElectricalPlan(plan));
                    }
                  }}`,
  "Electrical mode auto-generate"
);

app = replaceOnce(
  app,
  `                  onClick={() => setPlanMode("plumbing")}`,
  `                  onClick={() => {
                    setPlanMode("plumbing");
                    if (plan && (!plan.plumbing || plan.plumbing.length === 0)) {
                      commit(generatePlumbingPlan(plan));
                    }
                  }}`,
  "Plumbing mode auto-generate"
);

write(appFile, app);

/* ---------------- CAD CANVAS PATCHES ---------------- */

let canvas = read(canvasFile);

canvas = replaceOnce(
  canvas,
  `      furniture: Array.isArray(plan.furniture) ? plan.furniture : [],`,
  `      furniture: Array.isArray(plan.furniture) ? plan.furniture : [],
      electrical: Array.isArray(plan.electrical) ? plan.electrical : [],
      plumbing: Array.isArray(plan.plumbing) ? plan.plumbing : [],`,
  "Normalize electrical/plumbing in canvas"
);

canvas = replaceOnce(
  canvas,
  `  onMoveFurniture = () => {},
  planMode = "architectural",`,
  `  onMoveFurniture = () => {},
  onMoveElectrical = () => {},
  onMovePlumbing = () => {},
  planMode = "architectural",`,
  "Add electrical/plumbing props"
);

canvas = replaceOnce(
  canvas,
  `  const furniture = (safePlan.furniture || []).filter((item) => item.floor === activeFloor);`,
  `  const furniture = (safePlan.furniture || []).filter((item) => item.floor === activeFloor);
  const electrical = (safePlan.electrical || []).filter((item) => item.floor === activeFloor);
  const plumbing = (safePlan.plumbing || []).filter((item) => item.floor === activeFloor);`,
  "Electrical/plumbing lists"
);

const electricalBlock = `
            {(planMode === "electrical" || planMode === "architectural") &&
              electrical.map((item) => {
                const selectedItem = isSelected(selected, "electrical", item.id);
                const symbol =
                  item.type === "light"
                    ? "L"
                    : item.type === "fan"
                    ? "F"
                    : item.type === "switch"
                    ? "SW"
                    : item.type === "socket"
                    ? "SO"
                    : item.type === "ac"
                    ? "AC"
                    : item.type === "db"
                    ? "DB"
                    : "E";

                return (
                  <Group
                    key={item.id}
                    x={sheetInsetX + item.x}
                    y={sheetInsetY + item.y}
                    draggable={activeTool === "select"}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      setSelected({ type: "electrical", id: item.id });
                    }}
                    onDragEnd={(event) => {
                      onMoveElectrical(item.id, {
                        x: snap(event.target.x() - sheetInsetX),
                        y: snap(event.target.y() - sheetInsetY)
                      });
                    }}
                  >
                    <Rect
                      width={item.width}
                      height={item.height}
                      fill={item.color || "#fde047"}
                      stroke={selectedItem ? "#2563eb" : "#854d0e"}
                      strokeWidth={selectedItem ? 3 : 1.5}
                      cornerRadius={item.type === "light" || item.type === "fan" ? 999 : 4}
                      opacity={planMode === "electrical" ? 0.98 : 0.68}
                    />
                    <Text
                      text={symbol}
                      x={0}
                      y={Math.max(2, item.height / 2 - 6)}
                      width={item.width}
                      align="center"
                      fontSize={10}
                      fontStyle="bold"
                      fill="#0f172a"
                      listening={false}
                    />
                  </Group>
                );
              })}
`;

const plumbingBlock = `
            {(planMode === "plumbing" || planMode === "architectural") &&
              plumbing.map((item) => {
                const selectedItem = isSelected(selected, "plumbing", item.id);
                const symbol =
                  item.type === "water"
                    ? "W"
                    : item.type === "drain"
                    ? "D"
                    : item.type === "toilet"
                    ? "WC"
                    : item.type === "basin"
                    ? "B"
                    : item.type === "shower"
                    ? "SH"
                    : item.type === "sink"
                    ? "SK"
                    : item.type === "tank"
                    ? "T"
                    : item.type === "sewer"
                    ? "S"
                    : "P";

                return (
                  <Group
                    key={item.id}
                    x={sheetInsetX + item.x}
                    y={sheetInsetY + item.y}
                    draggable={activeTool === "select"}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      setSelected({ type: "plumbing", id: item.id });
                    }}
                    onDragEnd={(event) => {
                      onMovePlumbing(item.id, {
                        x: snap(event.target.x() - sheetInsetX),
                        y: snap(event.target.y() - sheetInsetY)
                      });
                    }}
                  >
                    <Rect
                      width={item.width}
                      height={item.height}
                      fill={item.color || "#38bdf8"}
                      stroke={selectedItem ? "#2563eb" : "#075985"}
                      strokeWidth={selectedItem ? 3 : 1.5}
                      cornerRadius={6}
                      opacity={planMode === "plumbing" ? 0.98 : 0.68}
                    />
                    <Text
                      text={symbol}
                      x={0}
                      y={Math.max(2, item.height / 2 - 6)}
                      width={item.width}
                      align="center"
                      fontSize={10}
                      fontStyle="bold"
                      fill="#0f172a"
                      listening={false}
                    />
                  </Group>
                );
              })}
`;

if (!canvas.includes('selectedItem ? "#2563eb" : "#854d0e"')) {
  canvas = canvas.replace(
    `            {furniture.map((item) => {`,
    `${electricalBlock}

${plumbingBlock}

            {furniture.map((item) => {`
  );
  console.log("ADDED: 2D electrical/plumbing rendering");
} else {
  console.log("ALREADY EXISTS: electrical/plumbing rendering");
}

write(canvasFile, canvas);

/* ---------------- 3D PATCHES ---------------- */

let three = read(threeFile);

const utility3D = `
function UtilityObjects3D({ electrical = [], plumbing = [], plan, floorY }) {
  return (
    <group>
      {electrical.map((item) => {
        const s = toScene(item, plan);
        const x = s.x + s.w / 2;
        const z = s.z + s.d / 2;

        return (
          <mesh key={\`electrical-\${item.id}\`} position={[x, floorY + 0.75, z]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(0.25, s.w), 0.18, Math.max(0.25, s.d)]} />
            <meshStandardMaterial color={item.color || "#fde047"} roughness={0.52} />
            <Edges color="#854d0e" />
          </mesh>
        );
      })}

      {plumbing.map((item) => {
        const s = toScene(item, plan);
        const x = s.x + s.w / 2;
        const z = s.z + s.d / 2;

        return (
          <mesh key={\`plumbing-\${item.id}\`} position={[x, floorY + 0.55, z]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(0.25, s.w), 0.2, Math.max(0.25, s.d)]} />
            <meshStandardMaterial color={item.color || "#38bdf8"} roughness={0.52} />
            <Edges color="#075985" />
          </mesh>
        );
      })}
    </group>
  );
}
`;

three = addBefore(three, "function ExteriorFloorBand", utility3D, "Add utility objects 3D");

three = replaceOnce(
  three,
  `      <Furniture rooms={model.rooms} furniture={model.furniture} plan={plan} floorY={model.floorY} />`,
  `      <Furniture rooms={model.rooms} furniture={model.furniture} plan={plan} floorY={model.floorY} />

      <UtilityObjects3D
        electrical={model.electrical}
        plumbing={model.plumbing}
        plan={plan}
        floorY={model.floorY}
      />`,
  "Render utilities in 3D"
);

three = replaceOnce(
  three,
  `      furniture: (plan.furniture || []).filter((item) => item.floor === activeFloor)`,
  `      furniture: (plan.furniture || []).filter((item) => item.floor === activeFloor),
      electrical: (plan.electrical || []).filter((item) => item.floor === activeFloor),
      plumbing: (plan.plumbing || []).filter((item) => item.floor === activeFloor)`,
  "Model utilities"
);

write(threeFile, three);

/* ---------------- CSS ---------------- */

let css = read(cssFile);

const cssAdd = `
/* PHASE 17B - ELECTRICAL + PLUMBING */
.utility-symbol {
  font-weight: 950;
  letter-spacing: 0.4px;
}
`;

css = appendOnce(css, "PHASE 17B - ELECTRICAL + PLUMBING", cssAdd, "Phase17B CSS");

write(cssFile, css);

console.log("\\nPhase 17B completed.");
console.log("Now run:");
console.log("cd D:\\\\ShazeeProjects\\\\nexacad-ai\\\\frontend");
console.log("npm run build");