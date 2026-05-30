const fs = require("fs");
const path = require("path");

const root = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src";
const components = path.join(root, "components");
const appFile = path.join(root, "App.jsx");
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

/* ---------------- App.jsx AI command upgrade ---------------- */

let app = read(appFile);

const phase15BHelpers = `
function applyNexaCADDesignCommand(plan, command, activeFloor) {
  if (!plan || !command) return null;

  const text = String(command || "").toLowerCase();
  const next = clone(plan);

  next.curvedWalls = Array.isArray(next.curvedWalls) ? next.curvedWalls : [];
  next.facade = next.facade || {
    enabled: true,
    style: "modern",
    color: "#dbeafe",
    accent: "#38bdf8",
    glassBalcony: true,
    blackFrame: true,
    porchColumns: true,
    garden: true,
    driveway: true
  };

  const scale = next.scale || 12;
  const plotWidth = next.plot?.width || 30;
  const plotLength = next.plot?.length || 60;

  let changed = false;
  let preferredView = "2d";

  function addCurve(type, name, options = {}) {
    next.curvedWalls.push({
      id: uuidv4(),
      floor: activeFloor || 0,
      x: options.x ?? Math.round((plotWidth * scale) / 2),
      y: options.y ?? Math.round((plotLength * scale) * 0.18),
      radius: options.radius ?? 84,
      startAngle: options.startAngle ?? 200,
      endAngle: options.endAngle ?? 340,
      thickness: options.thickness ?? 8,
      height: options.height ?? 2.1,
      type,
      name,
      layer: "curves"
    });

    changed = true;
  }

  if (
    text.includes("curved gallery") ||
    text.includes("curve gallery") ||
    text.includes("round gallery")
  ) {
    addCurve("curved-gallery", "Curved Front Gallery", {
      y: Math.round((plotLength * scale) * 0.12),
      radius: 96,
      startAngle: 200,
      endAngle: 340,
      height: 1.4
    });
    preferredView = "2d";
  }

  if (
    text.includes("curved wall") ||
    text.includes("curve wall") ||
    text.includes("round wall") ||
    text.includes("arc wall")
  ) {
    addCurve("curved-wall", "Curved Wall", {
      y: Math.round((plotLength * scale) * 0.35),
      radius: 72,
      startAngle: 210,
      endAngle: 330,
      height: 2.2
    });
    preferredView = "2d";
  }

  if (
    text.includes("curved boundary") ||
    text.includes("round boundary") ||
    text.includes("boundary curve")
  ) {
    addCurve("curved-boundary", "Curved Boundary Wall", {
      y: Math.round((plotLength * scale) * 0.08),
      radius: Math.max(110, Math.round(plotWidth * scale * 0.34)),
      startAngle: 190,
      endAngle: 350,
      height: 1.55,
      thickness: 10
    });
    preferredView = "2d";
  }

  if (
    text.includes("curved balcony") ||
    text.includes("round balcony") ||
    text.includes("curve balcony")
  ) {
    addCurve("curved-balcony", "Curved Glass Balcony", {
      floor: Math.min(1, next.floors - 1),
      y: Math.round((plotLength * scale) * 0.1),
      radius: 78,
      startAngle: 205,
      endAngle: 335,
      height: 1.1,
      thickness: 6
    });

    next.facade.glassBalcony = true;
    changed = true;
    preferredView = "elevation";
  }

  if (
    text.includes("modern") ||
    text.includes("grey") ||
    text.includes("gray") ||
    text.includes("white") ||
    text.includes("black frame")
  ) {
    next.facade.style = "modern-white-grey";
    next.facade.color = "#f8fafc";
    next.facade.accent = "#343a40";
    next.facade.blackFrame = true;
    next.facade.glassBalcony = true;
    changed = true;
    preferredView = "elevation";
  }

  if (
    text.includes("luxury") ||
    text.includes("villa") ||
    text.includes("premium")
  ) {
    next.facade.style = "luxury-villa";
    next.facade.color = "#f8fafc";
    next.facade.accent = "#111827";
    next.facade.blackFrame = true;
    next.facade.glassBalcony = true;
    next.facade.porchColumns = true;
    next.facade.garden = true;
    changed = true;
    preferredView = "elevation";
  }

  if (
    text.includes("commercial") ||
    text.includes("plaza") ||
    text.includes("shops") ||
    text.includes("office elevation")
  ) {
    next.facade.style = "commercial-plaza";
    next.facade.color = "#e5e7eb";
    next.facade.accent = "#0f172a";
    next.facade.blackFrame = true;
    next.facade.glassBalcony = false;
    next.facade.porchColumns = false;
    next.facade.signage = true;
    changed = true;
    preferredView = "elevation";
  }

  if (
    text.includes("classic") ||
    text.includes("traditional")
  ) {
    next.facade.style = "classic-house";
    next.facade.color = "#fef3c7";
    next.facade.accent = "#92400e";
    next.facade.blackFrame = false;
    next.facade.glassBalcony = false;
    next.facade.porchColumns = true;
    changed = true;
    preferredView = "elevation";
  }

  if (text.includes("glass balcony") || text.includes("glass railing")) {
    next.facade.glassBalcony = true;
    changed = true;
    preferredView = "elevation";
  }

  if (text.includes("black frame") || text.includes("dark frame")) {
    next.facade.blackFrame = true;
    next.facade.accent = "#111827";
    changed = true;
    preferredView = "elevation";
  }

  if (text.includes("porch column") || text.includes("front column") || text.includes("columns")) {
    next.facade.porchColumns = true;
    changed = true;
    preferredView = "elevation";
  }

  if (text.includes("garden") || text.includes("lawn") || text.includes("landscape")) {
    next.facade.garden = true;
    changed = true;
    preferredView = "elevation";
  }

  if (text.includes("driveway") || text.includes("car way") || text.includes("parking ramp")) {
    next.facade.driveway = true;
    changed = true;
    preferredView = "elevation";
  }

  if (
    text.includes("outside view") ||
    text.includes("exterior") ||
    text.includes("elevation") ||
    text.includes("front view") ||
    text.includes("front elevation")
  ) {
    next.facade.enabled = true;
    changed = true;
    preferredView = "elevation";
  }

  if (!changed) return null;

  next.updatedAt = new Date().toISOString();

  return {
    plan: next,
    viewMode: preferredView
  };
}
`;

app = addBefore(
  app,
  "export default function App()",
  phase15BHelpers,
  "Add Phase 15B AI design command helper"
);

app = replaceOnce(
  app,
  `    setCommandLoading(true);

    try {`,
  `    const localDesignCommand = applyNexaCADDesignCommand(plan, aiCommand, activeFloor);

    if (localDesignCommand) {
      commit(localDesignCommand.plan);
      setViewMode(localDesignCommand.viewMode);
      setAiCommand("");
      return;
    }

    setCommandLoading(true);

    try {`,
  "Intercept AI edit commands for curved/elevation"
);

app = replaceOnce(
  app,
  `    facade: plan.facade || {
      enabled: true,
      style: "modern",
      color: "#dbeafe",
      accent: "#38bdf8"
    },`,
  `    facade: plan.facade || {
      enabled: true,
      style: "modern-white-grey",
      color: "#f8fafc",
      accent: "#343a40",
      glassBalcony: true,
      blackFrame: true,
      porchColumns: true,
      garden: true,
      driveway: true,
      signage: false
    },`,
  "Upgrade default facade object"
);

write(appFile, app);

/* ---------------- Replace ExteriorElevation.jsx with 15B version ---------------- */

write(
  elevationFile,
`import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Text,
  Edges
} from "@react-three/drei";

const STYLE_PRESETS = {
  "modern-white-grey": {
    label: "Modern White + Grey",
    body: "#f8fafc",
    accent: "#343a40",
    glass: "#bfdbfe",
    ground: "#d7d9d2"
  },
  "luxury-villa": {
    label: "Luxury Villa",
    body: "#f8fafc",
    accent: "#111827",
    glass: "#93c5fd",
    ground: "#d9d6cc"
  },
  "commercial-plaza": {
    label: "Commercial Plaza",
    body: "#e5e7eb",
    accent: "#0f172a",
    glass: "#67e8f9",
    ground: "#cbd5e1"
  },
  "classic-house": {
    label: "Classic House",
    body: "#fef3c7",
    accent: "#92400e",
    glass: "#bae6fd",
    ground: "#d6d3c4"
  }
};

function getFacade(plan, selectedPreset) {
  const facade = plan?.facade || {};
  const style = selectedPreset || facade.style || "modern-white-grey";
  const preset = STYLE_PRESETS[style] || STYLE_PRESETS["modern-white-grey"];

  return {
    ...preset,
    style,
    body: facade.color || preset.body,
    accent: facade.accent || preset.accent,
    glassBalcony: facade.glassBalcony !== false,
    blackFrame: facade.blackFrame !== false,
    porchColumns: facade.porchColumns !== false,
    garden: facade.garden !== false,
    driveway: facade.driveway !== false,
    signage: Boolean(facade.signage)
  };
}

function getPlanSize(plan) {
  return {
    width: plan?.plot?.width || 30,
    length: plan?.plot?.length || 60,
    floors: plan?.floors || 2
  };
}

function BuildingMass({ plan, facade }) {
  const { width, floors } = getPlanSize(plan);
  const buildingWidth = Math.min(26, Math.max(16, width * 0.72));
  const floorHeight = 3.25;
  const totalHeight = Math.max(1, floors) * floorHeight;

  return (
    <group position={[0, totalHeight / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[buildingWidth, totalHeight, 7.2]} />
        <meshStandardMaterial color={facade.body} roughness={0.55} metalness={0.02} />
        <Edges color="#94a3b8" />
      </mesh>

      {facade.blackFrame && (
        <mesh position={[buildingWidth * 0.22, totalHeight * 0.16, -3.75]} castShadow>
          <boxGeometry args={[buildingWidth * 0.34, totalHeight * 0.86, 0.62]} />
          <meshStandardMaterial color={facade.accent} roughness={0.52} metalness={0.04} />
          <Edges color="#111827" />
        </mesh>
      )}

      <mesh position={[-buildingWidth * 0.25, totalHeight * 0.23, -3.78]} castShadow>
        <boxGeometry args={[buildingWidth * 0.37, totalHeight * 0.46, 0.36]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
        <Edges color="#cbd5e1" />
      </mesh>

      <mesh position={[0, totalHeight / 2 + 0.2, -3.98]} castShadow>
        <boxGeometry args={[buildingWidth + 0.8, 0.38, 1.05]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
    </group>
  );
}

function GlassPanel({ x, y, w = 3.4, h = 2.1, facade }) {
  return (
    <group position={[x, y, -4.1]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.08]} />
        <meshPhysicalMaterial
          color={facade.glass}
          transparent
          opacity={0.58}
          roughness={0.03}
          metalness={0.18}
          transmission={0.28}
        />
        <Edges color="#0f172a" />
      </mesh>

      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[0.08, h, 0.08]} />
        <meshStandardMaterial color="#111827" roughness={0.3} />
      </mesh>

      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[w, 0.08, 0.08]} />
        <meshStandardMaterial color="#111827" roughness={0.3} />
      </mesh>
    </group>
  );
}

function Balcony({ x, y, w = 5.5, facade }) {
  if (!facade.glassBalcony) return null;

  return (
    <group position={[x, y, -4.32]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, 0.18, 1.5]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.62} />
        <Edges color="#64748b" />
      </mesh>

      <mesh position={[0, 0.58, -0.72]} castShadow>
        <boxGeometry args={[w, 0.88, 0.08]} />
        <meshPhysicalMaterial
          color={facade.glass}
          transparent
          opacity={0.48}
          roughness={0.03}
          transmission={0.25}
        />
        <Edges color="#075985" />
      </mesh>

      {[-w / 2, 0, w / 2].map((xPos) => (
        <mesh key={xPos} position={[xPos, 0.55, -0.72]} castShadow>
          <boxGeometry args={[0.08, 0.95, 0.12]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
    </group>
  );
}

function PorchColumns({ plan, facade }) {
  if (!facade.porchColumns) return null;

  const { width } = getPlanSize(plan);
  const buildingWidth = Math.min(26, Math.max(16, width * 0.72));

  return (
    <group>
      {[-buildingWidth * 0.38, -buildingWidth * 0.18].map((x) => (
        <mesh key={x} position={[x, 1.45, -4.5]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 2.9, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          <Edges color="#cbd5e1" />
        </mesh>
      ))}

      <mesh position={[-buildingWidth * 0.28, 2.95, -4.5]} castShadow>
        <boxGeometry args={[buildingWidth * 0.34, 0.34, 1.1]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.58} />
        <Edges color="#cbd5e1" />
      </mesh>
    </group>
  );
}

function CurvedExteriorGallery({ plan, facade }) {
  const curves = (plan.curvedWalls || []).filter((item) =>
    ["curved-gallery", "curved-balcony", "curved-boundary"].includes(item.type)
  );

  if (curves.length === 0) return null;

  const { width } = getPlanSize(plan);
  const buildingWidth = Math.min(26, Math.max(16, width * 0.72));

  return (
    <group>
      {curves.slice(0, 3).map((curve, index) => (
        <mesh
          key={curve.id}
          position={[0, 0.85 + index * 1.6, -5.05 - index * 0.08]}
          castShadow
          receiveShadow
        >
          <torusGeometry
            args={[
              Math.min(buildingWidth * 0.28, Math.max(2.6, (curve.radius || 80) / 24)),
              0.08,
              10,
              64,
              Math.PI
            ]}
          />
          <meshStandardMaterial
            color={curve.type === "curved-balcony" ? facade.glass : "#e9d5ff"}
            transparent={curve.type === "curved-balcony"}
            opacity={curve.type === "curved-balcony" ? 0.58 : 1}
            roughness={0.32}
          />
        </mesh>
      ))}
    </group>
  );
}

function Signage({ plan, facade }) {
  if (!facade.signage) return null;

  const { width, floors } = getPlanSize(plan);
  const buildingWidth = Math.min(26, Math.max(16, width * 0.72));
  const totalHeight = Math.max(1, floors) * 3.25;

  return (
    <group position={[0, totalHeight + 0.15, -4.25]}>
      <mesh castShadow>
        <boxGeometry args={[buildingWidth * 0.75, 0.72, 0.16]} />
        <meshStandardMaterial color="#020617" roughness={0.4} />
      </mesh>

      <Text
        position={[0, 0.03, -0.12]}
        fontSize={0.34}
        color="#e0f2fe"
        anchorX="center"
        anchorY="middle"
      >
        COMMERCIAL PLAZA
      </Text>
    </group>
  );
}

function Landscaping({ plan, facade }) {
  const { width, length } = getPlanSize(plan);
  const baseW = Math.max(30, width + 12);
  const baseD = Math.max(28, length * 0.42);

  return (
    <group>
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[baseW, 0.12, baseD]} />
        <meshStandardMaterial color={facade.ground} roughness={0.82} />
      </mesh>

      {facade.driveway && (
        <mesh position={[0, -0.02, -7.2]} receiveShadow>
          <boxGeometry args={[baseW * 0.86, 0.08, 3.6]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
      )}

      {facade.garden && (
        <>
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
        </>
      )}
    </group>
  );
}

function ElevationModel({ plan, facade }) {
  const { width, floors } = getPlanSize(plan);
  const buildingWidth = Math.min(26, Math.max(16, width * 0.72));
  const floorHeight = 3.25;
  const totalHeight = Math.max(1, floors) * floorHeight;

  return (
    <group>
      <Landscaping plan={plan} facade={facade} />
      <BuildingMass plan={plan} facade={facade} />
      <PorchColumns plan={plan} facade={facade} />
      <CurvedExteriorGallery plan={plan} facade={facade} />
      <Signage plan={plan} facade={facade} />

      <GlassPanel x={-buildingWidth * 0.26} y={1.65} w={3.7} h={2.35} facade={facade} />
      <GlassPanel x={buildingWidth * 0.23} y={1.65} w={3.2} h={2.3} facade={facade} />

      {floors > 1 && (
        <>
          <GlassPanel x={-buildingWidth * 0.27} y={4.95} w={4.0} h={2.1} facade={facade} />
          <GlassPanel x={buildingWidth * 0.23} y={4.95} w={3.4} h={2.1} facade={facade} />
          <Balcony x={buildingWidth * 0.23} y={3.9} w={5.2} facade={facade} />
        </>
      )}

      <mesh position={[0, totalHeight + 0.35, -3.82]} castShadow>
        <boxGeometry args={[buildingWidth + 1.2, 0.45, 1.1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.55} />
        <Edges color="#cbd5e1" />
      </mesh>

      <Text
        position={[0, totalHeight + 1.25, -4.35]}
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
  const [selectedPreset, setSelectedPreset] = useState(plan?.facade?.style || "modern-white-grey");
  const facade = useMemo(() => getFacade(plan, selectedPreset), [plan, selectedPreset]);

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
      <div className="elevation-style-bar">
        {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            className={selectedPreset === key ? "active" : ""}
            onClick={() => setSelectedPreset(key)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={[facade.ground]} />

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

        <ElevationModel plan={plan} facade={facade} />

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
        <span>
          {STYLE_PRESETS[facade.style]?.label || "Modern Elevation"} • glass balcony • façade frame • garden • driveway
        </span>
      </div>

      <div className="three-mode-badge">EXTERIOR ELEVATION STUDIO 15B</div>
    </div>
  );
}
`
);

/* ---------------- CSS ---------------- */

let css = read(cssFile);

const cssAddition = `
/* PHASE 15B - ELEVATION STYLE PRESETS */
.elevation-style-bar {
  position: absolute;
  top: 18px;
  left: 18px;
  right: 18px;
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  pointer-events: auto;
}

.elevation-style-bar button {
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.72);
  color: #0f172a;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 950;
  backdrop-filter: blur(14px);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
}

.elevation-style-bar button:hover {
  border-color: rgba(37, 99, 235, 0.38);
  background: rgba(219, 234, 254, 0.86);
}

.elevation-style-bar button.active {
  color: #ffffff;
  border-color: transparent;
  background:
    radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.2), transparent 25%),
    linear-gradient(135deg, #111827, #2563eb);
}
`;

css = appendOnce(css, "PHASE 15B - ELEVATION STYLE PRESETS", cssAddition, "Phase 15B CSS");
write(cssFile, css);

console.log("\\nPhase 15B upgrade completed.");
console.log("Now run:");
console.log("cd D:\\\\ShazeeProjects\\\\nexacad-ai\\\\frontend");
console.log("npm run build");