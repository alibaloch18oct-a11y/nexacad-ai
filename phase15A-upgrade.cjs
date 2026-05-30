const fs = require("fs");
const path = require("path");

const root = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src";
const components = path.join(root, "components");
const appFile = path.join(root, "App.jsx");
const toolbarFile = path.join(components, "CADToolbar.jsx");
const canvasFile = path.join(components, "CADCanvas.jsx");
const threeFile = path.join(components, "ThreeDPreview.jsx");
const cssFile = path.join(root, "index.css");
const elevationFile = path.join(components, "ExteriorElevation.jsx");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
  console.log("Updated:", file);
}

function replaceOnce(content, from, to, label) {
  if (!content.includes(from)) {
    console.log("SKIPPED:", label);
    return content;
  }

  console.log("PATCHED:", label);
  return content.replace(from, to);
}

function addOnce(content, marker, addition, label) {
  if (content.includes(marker)) {
    console.log("ALREADY EXISTS:", label);
    return content;
  }

  console.log("ADDED:", label);
  return content + "\n\n" + addition;
}

/* ---------------- ExteriorElevation.jsx ---------------- */

write(
  elevationFile,
`import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Text,
  Edges
} from "@react-three/drei";

function getPlanSize(plan) {
  return {
    width: plan?.plot?.width || 30,
    length: plan?.plot?.length || 60,
    floors: plan?.floors || 2
  };
}

function BuildingMass({ plan }) {
  const { width, floors } = getPlanSize(plan);
  const buildingWidth = Math.min(24, Math.max(15, width * 0.7));
  const floorHeight = 3.2;
  const totalHeight = Math.max(1, floors) * floorHeight;

  return (
    <group position={[0, totalHeight / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[buildingWidth, totalHeight, 7]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.58} metalness={0.02} />
        <Edges color="#94a3b8" />
      </mesh>

      <mesh position={[buildingWidth * 0.22, totalHeight * 0.16, -3.65]} castShadow>
        <boxGeometry args={[buildingWidth * 0.32, totalHeight * 0.86, 0.55]} />
        <meshStandardMaterial color="#343a40" roughness={0.55} metalness={0.04} />
        <Edges color="#111827" />
      </mesh>

      <mesh position={[-buildingWidth * 0.25, totalHeight * 0.23, -3.68]} castShadow>
        <boxGeometry args={[buildingWidth * 0.36, totalHeight * 0.45, 0.35]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
        <Edges color="#cbd5e1" />
      </mesh>

      <mesh position={[0, totalHeight / 2 + 0.2, -3.85]} castShadow>
        <boxGeometry args={[buildingWidth + 0.7, 0.36, 1.0]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
    </group>
  );
}

function GlassPanel({ x, y, w = 3.4, h = 2.1 }) {
  return (
    <group position={[x, y, -3.98]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.08]} />
        <meshPhysicalMaterial
          color="#bfdbfe"
          transparent
          opacity={0.56}
          roughness={0.04}
          metalness={0.16}
          transmission={0.28}
        />
        <Edges color="#0f172a" />
      </mesh>

      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[0.08, h, 0.08]} />
        <meshStandardMaterial color="#111827" roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.0, -0.05]}>
        <boxGeometry args={[w, 0.08, 0.08]} />
        <meshStandardMaterial color="#111827" roughness={0.3} />
      </mesh>
    </group>
  );
}

function Balcony({ x, y, w = 5.5 }) {
  return (
    <group position={[x, y, -4.2]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, 0.18, 1.45]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.62} />
        <Edges color="#64748b" />
      </mesh>

      <mesh position={[0, 0.55, -0.68]} castShadow>
        <boxGeometry args={[w, 0.85, 0.08]} />
        <meshPhysicalMaterial
          color="#93c5fd"
          transparent
          opacity={0.45}
          roughness={0.04}
          transmission={0.25}
        />
        <Edges color="#075985" />
      </mesh>

      <mesh position={[-w / 2, 0.52, -0.68]} castShadow>
        <boxGeometry args={[0.08, 0.92, 0.12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      <mesh position={[w / 2, 0.52, -0.68]} castShadow>
        <boxGeometry args={[0.08, 0.92, 0.12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}

function PorchColumns({ plan }) {
  const { width } = getPlanSize(plan);
  const buildingWidth = Math.min(24, Math.max(15, width * 0.7));

  return (
    <group>
      {[-buildingWidth * 0.38, -buildingWidth * 0.18].map((x) => (
        <mesh key={x} position={[x, 1.45, -4.35]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 2.9, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          <Edges color="#cbd5e1" />
        </mesh>
      ))}

      <mesh position={[-buildingWidth * 0.28, 2.95, -4.35]} castShadow>
        <boxGeometry args={[buildingWidth * 0.32, 0.34, 1.1]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.58} />
        <Edges color="#cbd5e1" />
      </mesh>
    </group>
  );
}

function Landscaping({ plan }) {
  const { width, length } = getPlanSize(plan);
  const baseW = Math.max(30, width + 12);
  const baseD = Math.max(28, length * 0.42);

  return (
    <group>
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[baseW, 0.12, baseD]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.82} />
      </mesh>

      <mesh position={[0, -0.02, -7.2]} receiveShadow>
        <boxGeometry args={[baseW * 0.86, 0.08, 3.6]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      <mesh position={[-baseW * 0.34, 0.01, -4.4]} receiveShadow>
        <boxGeometry args={[6, 0.08, 5.5]} />
        <meshStandardMaterial color="#166534" roughness={0.88} />
      </mesh>

      <mesh position={[baseW * 0.34, 0.01, -4.4]} receiveShadow>
        <boxGeometry args={[6, 0.08, 5.5]} />
        <meshStandardMaterial color="#166534" roughness={0.88} />
      </mesh>

      {[
        [-baseW * 0.42, -5],
        [baseW * 0.42, -5],
        [-baseW * 0.47, 1.5],
        [baseW * 0.47, 1.5]
      ].map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh position={[0, 0.52, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.05, 10]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 1.35, 0]} castShadow>
            <sphereGeometry args={[0.7, 18, 18]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ElevationModel({ plan }) {
  const { width, floors } = getPlanSize(plan);
  const buildingWidth = Math.min(24, Math.max(15, width * 0.7));
  const floorHeight = 3.2;
  const totalHeight = Math.max(1, floors) * floorHeight;

  return (
    <group>
      <Landscaping plan={plan} />
      <BuildingMass plan={plan} />
      <PorchColumns plan={plan} />

      <GlassPanel x={-buildingWidth * 0.26} y={1.65} w={3.7} h={2.35} />
      <GlassPanel x={buildingWidth * 0.23} y={1.65} w={3.2} h={2.3} />

      {floors > 1 && (
        <>
          <GlassPanel x={-buildingWidth * 0.27} y={4.95} w={4.0} h={2.1} />
          <GlassPanel x={buildingWidth * 0.23} y={4.95} w={3.4} h={2.1} />
          <Balcony x={buildingWidth * 0.23} y={3.9} w={5.2} />
        </>
      )}

      <mesh position={[0, totalHeight + 0.35, -3.7]} castShadow>
        <boxGeometry args={[buildingWidth + 1.2, 0.45, 1.1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.55} />
        <Edges color="#cbd5e1" />
      </mesh>

      <Text
        position={[0, totalHeight + 1.25, -4.2]}
        fontSize={0.62}
        color="#e0f2fe"
        anchorX="center"
        anchorY="middle"
      >
        Exterior Elevation Studio
      </Text>
    </group>
  );
}

export default function ExteriorElevation({ plan }) {
  const title = useMemo(() => {
    if (!plan) return "No exterior model loaded";
    return plan.title || "NexaCAD Exterior Elevation";
  }, [plan]);

  if (!plan) {
    return (
      <div className="three-empty premium-empty">
        <div className="empty-orb">EL</div>
        <h2>No elevation loaded</h2>
        <p>Generate or open a project, then view exterior elevation.</p>
      </div>
    );
  }

  return (
    <div className="three-preview elevation-preview">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={["#d7d9d2"]} />

        <Environment preset="city" />
        <PerspectiveCamera makeDefault position={[18, 10, 24]} fov={45} />

        <ambientLight intensity={0.52} />
        <directionalLight
          position={[12, 18, 10]}
          intensity={1.7}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-8, 8, 10]} intensity={0.45} color="#93c5fd" />

        <ElevationModel plan={plan} />

        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.56}
          scale={60}
          blur={3}
          far={35}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={8}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>

      <div className="three-hint premium-three-hint">
        <strong>{title}</strong>
        <span>Modern white/grey façade • dark frame • glass balcony • porch columns • landscaping</span>
      </div>

      <div className="three-mode-badge">EXTERIOR ELEVATION STUDIO</div>
    </div>
  );
}
`
);

/* ---------------- CADToolbar.jsx add curved wall tool ---------------- */

let toolbar = read(toolbarFile);

toolbar = replaceOnce(
  toolbar,
  `  Minus,
  DoorOpen,`,
  `  Minus,
  Waves,
  DoorOpen,`,
  "Import Waves icon"
);

toolbar = replaceOnce(
  toolbar,
  `    { id: "wall", label: "Wall", icon: Minus },
    { id: "door", label: "Door", icon: DoorOpen },`,
  `    { id: "wall", label: "Wall", icon: Minus },
    { id: "curved-wall", label: "Curve", icon: Waves },
    { id: "door", label: "Door", icon: DoorOpen },`,
  "Add curved wall tool"
);

write(toolbarFile, toolbar);

/* ---------------- App.jsx patches ---------------- */

let app = read(appFile);

app = replaceOnce(
  app,
  `import ThreeDPreview from "./components/ThreeDPreview.jsx";`,
  `import ThreeDPreview from "./components/ThreeDPreview.jsx";
import ExteriorElevation from "./components/ExteriorElevation.jsx";`,
  "Import ExteriorElevation"
);

app = replaceOnce(
  app,
  `{ id: "facade", name: "Façade Concept", visible: true, locked: false }`,
  `{ id: "facade", name: "Façade Concept", visible: true, locked: false },
    { id: "curves", name: "Curved Walls / Gallery", visible: true, locked: false }`,
  "Add curves layer"
);

app = replaceOnce(
  app,
  `    walls: Array.isArray(plan.walls) ? plan.walls : [],
    dimensions: Array.isArray(plan.dimensions)`,
  `    walls: Array.isArray(plan.walls) ? plan.walls : [],
    curvedWalls: Array.isArray(plan.curvedWalls) ? plan.curvedWalls : [],
    dimensions: Array.isArray(plan.dimensions)`,
  "Normalize curvedWalls"
);

app = replaceOnce(
  app,
  `        : selected.type === "wall"
        ? "walls"`,
  `        : selected.type === "wall"
        ? "walls"
        : selected.type === "curvedWall"
        ? "curvedWalls"`,
  "Inspector update curvedWall"
);

app = replaceOnce(
  app,
  `    if (selected.type === "wall") next.walls = next.walls.filter((item) => item.id !== selected.id);`,
  `    if (selected.type === "wall") next.walls = next.walls.filter((item) => item.id !== selected.id);
    if (selected.type === "curvedWall") next.curvedWalls = next.curvedWalls.filter((item) => item.id !== selected.id);`,
  "Delete curvedWall"
);

app = replaceOnce(
  app,
  `        : selected.type === "wall"
        ? "walls"`,
  `        : selected.type === "wall"
        ? "walls"
        : selected.type === "curvedWall"
        ? "curvedWalls"`,
  "Duplicate curvedWall"
);

app = replaceOnce(
  app,
  `    if (activeTool === "wall") addWall(position);
    if (activeTool === "door") addDoor(position);`,
  `    if (activeTool === "wall") addWall(position);
    if (activeTool === "curved-wall") addCurvedWall(position);
    if (activeTool === "door") addDoor(position);`,
  "Canvas command curved wall"
);

app = replaceOnce(
  app,
  `  function addWall(position = { x: 60, y: 60 }) {`,
  `  function addCurvedWall(position = { x: 120, y: 120 }) {
    if (!plan) return;

    const next = normalizePlan(clone(plan));

    const item = {
      id: uuidv4(),
      floor: activeFloor,
      x: position.x,
      y: position.y,
      radius: 72,
      startAngle: 205,
      endAngle: 335,
      thickness: 8,
      height: 2.1,
      type: "curved-wall",
      name: "Curved Gallery Wall",
      layer: "curves"
    };

    next.curvedWalls.push(item);
    commit(next);
    setSelected({ type: "curvedWall", id: item.id });
  }

  function addWall(position = { x: 60, y: 60 }) {`,
  "Add addCurvedWall function"
);

app = replaceOnce(
  app,
  `                  onMoveWall={(id, updates) => updatePlanList("walls", id, updates)}
                  onResizeWallEndpoint={updateWallEndpoint}`,
  `                  onMoveWall={(id, updates) => updatePlanList("walls", id, updates)}
                  onMoveCurvedWall={(id, updates) => updatePlanList("curvedWalls", id, updates)}
                  onResizeWallEndpoint={updateWallEndpoint}`,
  "Pass curved wall handler to CADCanvas"
);

app = replaceOnce(
  app,
  `<button
                  className={viewMode === "3d" ? "active view-toggle" : "view-toggle"}
                  onClick={() => setViewMode("3d")}
                >
                  <Box size={15} />
                  3D Preview
                </button>`,
  `<button
                  className={viewMode === "3d" ? "active view-toggle" : "view-toggle"}
                  onClick={() => setViewMode("3d")}
                >
                  <Box size={15} />
                  3D Preview
                </button>

                <button
                  className={viewMode === "elevation" ? "active view-toggle" : "view-toggle"}
                  onClick={() => setViewMode("elevation")}
                >
                  <Building2 size={15} />
                  Exterior Elevation
                </button>`,
  "Add elevation tab"
);

app = replaceOnce(
  app,
  `              {viewMode === "2d" ? (
                <CADCanvas`,
  `              {viewMode === "2d" ? (
                <CADCanvas`,
  "Locate render condition"
);

app = replaceOnce(
  app,
  `              ) : (
                <ThreeDPreview plan={plan} activeFloor={activeFloor} />
              )}`,
  `              ) : viewMode === "3d" ? (
                <ThreeDPreview plan={plan} activeFloor={activeFloor} />
              ) : (
                <ExteriorElevation plan={plan} />
              )}`,
  "Render elevation view"
);

write(appFile, app);

/* ---------------- CADCanvas.jsx patches ---------------- */

let canvas = read(canvasFile);

canvas = replaceOnce(
  canvas,
  `      walls: Array.isArray(plan.walls) ? plan.walls : [],`,
  `      walls: Array.isArray(plan.walls) ? plan.walls : [],
      curvedWalls: Array.isArray(plan.curvedWalls) ? plan.curvedWalls : [],`,
  "Normalize curved walls in canvas"
);

canvas = replaceOnce(
  canvas,
  `  onMoveWall,
  onResizeWallEndpoint,`,
  `  onMoveWall,
  onMoveCurvedWall,
  onResizeWallEndpoint,`,
  "Canvas props curved handler"
);

canvas = replaceOnce(
  canvas,
  `  const walls = safePlan.walls.filter((wall) => wall.floor === activeFloor);
  const dimensions`,
  `  const walls = safePlan.walls.filter((wall) => wall.floor === activeFloor);
  const curvedWalls = safePlan.curvedWalls.filter((wall) => wall.floor === activeFloor);
  const dimensions`,
  "Canvas curved wall list"
);

canvas = replaceOnce(
  canvas,
  `activeTool === "window" ||
                activeTool === "stairs" ||`,
  `activeTool === "window" ||
                activeTool === "stairs" ||
                activeTool === "curved-wall" ||`,
  "Tool hint curved wall"
);

const curveHelper = `
function arcPoints(cx, cy, radius, startAngle, endAngle) {
  const points = [];
  const start = (startAngle * Math.PI) / 180;
  const end = (endAngle * Math.PI) / 180;
  const steps = 36;

  for (let i = 0; i <= steps; i += 1) {
    const t = start + ((end - start) * i) / steps;
    points.push(cx + Math.cos(t) * radius);
    points.push(cy + Math.sin(t) * radius);
  }

  return points;
}
`;

if (!canvas.includes("function arcPoints")) {
  canvas = canvas.replace(
    `function floorLabel(floor) {
  return floor === 0 ? "GROUND FLOOR PLAN" : \`FLOOR \${floor} PLAN\`;
}`,
    `function floorLabel(floor) {
  return floor === 0 ? "GROUND FLOOR PLAN" : \`FLOOR \${floor} PLAN\`;
}

${curveHelper}`
  );
  console.log("ADDED: arcPoints helper");
}

const curvedRenderBlock = `
            {layerVisible("curves") &&
              curvedWalls.map((curve) => {
                const selectedCurve = isSelected(selected, "curvedWall", curve.id);
                const points = arcPoints(
                  sheetInsetX + curve.x,
                  sheetInsetY + curve.y,
                  curve.radius || 72,
                  curve.startAngle || 205,
                  curve.endAngle || 335
                );

                return (
                  <Group
                    key={curve.id}
                    draggable={activeTool === "select"}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      setSelected({ type: "curvedWall", id: curve.id });
                    }}
                    onDragEnd={(event) => {
                      onMoveCurvedWall(curve.id, {
                        x: snap(curve.x + event.target.x()),
                        y: snap(curve.y + event.target.y())
                      });
                      event.target.position({ x: 0, y: 0 });
                    }}
                  >
                    <Line
                      points={points}
                      stroke={selectedCurve ? "#7c3aed" : "#0f172a"}
                      strokeWidth={curve.thickness || 8}
                      lineCap="round"
                      lineJoin="round"
                      shadowColor={selectedCurve ? "#a78bfa" : "transparent"}
                      shadowBlur={selectedCurve ? 12 : 0}
                    />

                    <Text
                      text={curve.name || "Curved Wall"}
                      x={sheetInsetX + curve.x - 55}
                      y={sheetInsetY + curve.y - (curve.radius || 72) - 22}
                      width={110}
                      align="center"
                      fontSize={11}
                      fontStyle="bold"
                      fill={selectedCurve ? "#7c3aed" : "#334155"}
                      listening={false}
                    />

                    {selectedCurve && (
                      <>
                        <Circle
                          x={sheetInsetX + curve.x}
                          y={sheetInsetY + curve.y}
                          radius={6}
                          fill="#7c3aed"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />

                        <Circle
                          x={sheetInsetX + curve.x + (curve.radius || 72)}
                          y={sheetInsetY + curve.y}
                          radius={8}
                          fill="#a78bfa"
                          stroke="#ffffff"
                          strokeWidth={2}
                          draggable
                          onDragEnd={(event) => {
                            event.cancelBubble = true;
                            const dx = event.target.x() - (sheetInsetX + curve.x);
                            const dy = event.target.y() - (sheetInsetY + curve.y);
                            const radius = Math.max(24, snap(Math.sqrt(dx * dx + dy * dy)));
                            onMoveCurvedWall(curve.id, { radius });
                          }}
                        />
                      </>
                    )}
                  </Group>
                );
              })}
`;

if (!canvas.includes('selectedCurve ? "#7c3aed"')) {
  canvas = canvas.replace(
    `            {layerVisible("architecture") &&`,
    `${curvedRenderBlock}

            {layerVisible("architecture") &&`
  );
  console.log("ADDED: curved wall rendering");
}

write(canvasFile, canvas);

/* ---------------- ThreeDPreview.jsx patches ---------------- */

let three = read(threeFile);

three = replaceOnce(
  three,
  `const FLOOR_HEIGHT = 3.35;`,
  `const FLOOR_HEIGHT = 3.35;

function CurvedWall3D({ curve, plan, floorLevel }) {
  const scale = plan.scale || 12;
  const plotWidth = plan.plot?.width || 30;
  const plotLength = plan.plot?.length || 60;

  const cx = curve.x / scale - plotWidth / 2;
  const cz = curve.y / scale - plotLength / 2;
  const radius = Math.max(2, (curve.radius || 72) / scale);
  const start = ((curve.startAngle || 205) * Math.PI) / 180;
  const end = ((curve.endAngle || 335) * Math.PI) / 180;
  const steps = 24;
  const height = curve.height || 2.1;
  const thickness = Math.max(0.16, (curve.thickness || 8) / scale);

  const parts = [];

  for (let i = 0; i < steps; i += 1) {
    const a1 = start + ((end - start) * i) / steps;
    const a2 = start + ((end - start) * (i + 1)) / steps;
    const mid = (a1 + a2) / 2;

    const x1 = cx + Math.cos(a1) * radius;
    const z1 = cz + Math.sin(a1) * radius;
    const x2 = cx + Math.cos(a2) * radius;
    const z2 = cz + Math.sin(a2) * radius;

    const length = Math.max(0.2, Math.hypot(x2 - x1, z2 - z1));
    const x = cx + Math.cos(mid) * radius;
    const z = cz + Math.sin(mid) * radius;
    const angle = -mid;

    parts.push(
      <mesh
        key={i}
        position={[x, floorLevel + height / 2, z]}
        rotation={[0, angle, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[length, height, thickness]} />
        <meshStandardMaterial color="#e9d5ff" roughness={0.64} metalness={0.03} />
        <Edges color="#581c87" />
      </mesh>
    );
  }

  return <group>{parts}</group>;
}`,
  "Add CurvedWall3D"
);

three = replaceOnce(
  three,
  `    const walls = (plan.walls || []).filter((wall) => wall.floor === activeFloor);

    return { floorLevel, rooms, doors, windows, stairs, walls };`,
  `    const walls = (plan.walls || []).filter((wall) => wall.floor === activeFloor);
    const curvedWalls = (plan.curvedWalls || []).filter((wall) => wall.floor === activeFloor);

    return { floorLevel, rooms, doors, windows, stairs, walls, curvedWalls };`,
  "3D model curvedWalls"
);

three = replaceOnce(
  three,
  `        {model.walls.map((wall) => (
          <Wall3D`,
  `        {model.curvedWalls.map((curve) => (
          <CurvedWall3D
            key={curve.id}
            curve={curve}
            plan={plan}
            floorLevel={model.floorLevel}
          />
        ))}

        {model.walls.map((wall) => (
          <Wall3D`,
  "Render curved walls in 3D"
);

write(threeFile, three);

/* ---------------- CSS ---------------- */

const cssAddition = `
/* PHASE 15A - CURVED ARCHITECTURE + EXTERIOR ELEVATION */
.elevation-preview {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.28), transparent 32%),
    linear-gradient(135deg, #d7d9d2, #f1f5f9) !important;
}

.view-toggle.active {
  box-shadow: 0 18px 42px rgba(37, 99, 235, 0.22);
}
`;

let css = read(cssFile);
css = addOnce(css, "PHASE 15A - CURVED ARCHITECTURE", cssAddition, "Phase 15A CSS");
write(cssFile, css);

console.log("\\nPhase 15A upgrade completed.");
console.log("Now run: cd D:\\\\ShazeeProjects\\\\nexacad-ai\\\\frontend && npm run build");