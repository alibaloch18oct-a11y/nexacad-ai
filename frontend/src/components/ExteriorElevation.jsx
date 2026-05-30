import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Text,
  Edges
} from "@react-three/drei";

const STYLES = {
  modern: {
    label: "Modern",
    body: "#f8fafc",
    accent: "#343a40",
    glass: "#bfdbfe",
    ground: "#d7d9d2"
  },
  luxury: {
    label: "Luxury Villa",
    body: "#f8fafc",
    accent: "#111827",
    glass: "#93c5fd",
    ground: "#ddd8cd"
  },
  commercial: {
    label: "Commercial",
    body: "#e5e7eb",
    accent: "#0f172a",
    glass: "#67e8f9",
    ground: "#cbd5e1"
  }
};

function getPlot(plan) {
  return {
    width: plan?.plot?.width || 30,
    floors: plan?.floors || 2
  };
}

function Landscape({ width, style }) {
  return (
    <group>
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[width + 20, 0.12, 28]} />
        <meshStandardMaterial color={style.ground} roughness={0.82} />
      </mesh>

      <mesh position={[0, -0.01, -7]} receiveShadow>
        <boxGeometry args={[width + 12, 0.08, 3.6]} />
        <meshStandardMaterial color="#475569" roughness={0.84} />
      </mesh>

      <mesh position={[-width * 0.45, 0, -4.2]} receiveShadow>
        <boxGeometry args={[5, 0.08, 5]} />
        <meshStandardMaterial color="#166534" roughness={0.88} />
      </mesh>

      <mesh position={[width * 0.45, 0, -4.2]} receiveShadow>
        <boxGeometry args={[5, 0.08, 5]} />
        <meshStandardMaterial color="#166534" roughness={0.88} />
      </mesh>
    </group>
  );
}

function Building({ width, floors, style }) {
  const buildingWidth = Math.min(24, Math.max(16, width * 0.72));
  const totalHeight = floors * 3.2;

  return (
    <group>
      <mesh position={[0, totalHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[buildingWidth, totalHeight, 7]} />
        <meshStandardMaterial color={style.body} roughness={0.58} />
        <Edges color="#94a3b8" />
      </mesh>

      <mesh position={[buildingWidth * 0.22, totalHeight * 0.62, -3.7]} castShadow>
        <boxGeometry args={[buildingWidth * 0.32, totalHeight * 0.9, 0.55]} />
        <meshStandardMaterial color={style.accent} roughness={0.45} />
      </mesh>

      <mesh position={[-buildingWidth * 0.22, totalHeight * 0.28, -3.92]} castShadow>
        <boxGeometry args={[buildingWidth * 0.36, totalHeight * 0.42, 0.3]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.55} />
      </mesh>

      <mesh position={[0, totalHeight + 0.22, -3.75]} castShadow>
        <boxGeometry args={[buildingWidth + 0.8, 0.36, 0.95]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.48} />
      </mesh>

      <mesh position={[0, 1.65, -4.02]} castShadow>
        <boxGeometry args={[buildingWidth * 0.22, 2.2, 0.16]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.46} />
        <Edges color="#431407" />
      </mesh>

      {[-buildingWidth * 0.26, buildingWidth * 0.22].map((x, index) => (
        <mesh key={index} position={[x, 1.8, -4]} castShadow>
          <boxGeometry args={[buildingWidth * 0.18, 2.3, 0.08]} />
          <meshPhysicalMaterial
            color={style.glass}
            transparent
            opacity={0.56}
            roughness={0.03}
            transmission={0.22}
          />
          <Edges color="#075985" />
        </mesh>
      ))}

      {floors > 1 && (
        <>
          <mesh position={[-buildingWidth * 0.26, 5.1, -4]} castShadow>
            <boxGeometry args={[buildingWidth * 0.2, 2.05, 0.08]} />
            <meshPhysicalMaterial
              color={style.glass}
              transparent
              opacity={0.56}
              roughness={0.03}
              transmission={0.22}
            />
            <Edges color="#075985" />
          </mesh>

          <mesh position={[buildingWidth * 0.22, 4.15, -4.2]} castShadow>
            <boxGeometry args={[buildingWidth * 0.24, 0.18, 1.5]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
            <Edges color="#64748b" />
          </mesh>

          <mesh position={[buildingWidth * 0.22, 4.72, -4.9]} castShadow>
            <boxGeometry args={[buildingWidth * 0.24, 0.9, 0.08]} />
            <meshPhysicalMaterial
              color={style.glass}
              transparent
              opacity={0.48}
              roughness={0.03}
              transmission={0.25}
            />
            <Edges color="#075985" />
          </mesh>
        </>
      )}

      {[-buildingWidth * 0.38, -buildingWidth * 0.18].map((x, idx) => (
        <mesh key={idx} position={[x, 1.42, -4.35]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 2.85, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.58} />
          <Edges color="#cbd5e1" />
        </mesh>
      ))}

      <Text
        position={[0, totalHeight + 1.1, -4.15]}
        fontSize={0.58}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
      >
        Exterior Elevation Studio
      </Text>
    </group>
  );
}

export default function ExteriorElevation({ plan }) {
  const [selectedStyle, setSelectedStyle] = useState("modern");

  const style = useMemo(() => {
    return STYLES[selectedStyle] || STYLES.modern;
  }, [selectedStyle]);

  const title = useMemo(() => {
    return plan?.title || "NexaCAD Exterior Elevation";
  }, [plan]);

  if (!plan) {
    return (
      <div className="three-empty premium-empty">
        <div className="empty-orb">EL</div>
        <h2>No elevation loaded</h2>
        <p>Generate a plan first, then open exterior elevation.</p>
      </div>
    );
  }

  const { width, floors } = getPlot(plan);

  const barStyle = {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 35,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    pointerEvents: "auto"
  };

  const buttonStyle = {
    border: "1px solid rgba(15,23,42,0.14)",
    borderRadius: 999,
    background: "rgba(248,250,252,0.82)",
    color: "#0f172a",
    padding: "9px 12px",
    fontSize: 12,
    fontWeight: 900,
    backdropFilter: "blur(12px)",
    boxShadow: "0 12px 32px rgba(15,23,42,0.12)"
  };

  const activeStyle = {
    ...buttonStyle,
    color: "#ffffff",
    border: "none",
    background: "linear-gradient(135deg, #111827, #2563eb)"
  };

  const hintStyle = {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    zIndex: 35,
    padding: "12px 16px",
    borderRadius: 18,
    background: "rgba(2, 6, 23, 0.68)",
    border: "1px solid rgba(125,211,252,0.16)",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    backdropFilter: "blur(16px)"
  };

  return (
    <div className="three-preview elevation-preview" style={{ position: "relative" }}>
      <div style={barStyle}>
        {Object.entries(STYLES).map(([key, value]) => (
          <button
            key={key}
            style={selectedStyle === key ? activeStyle : buttonStyle}
            onClick={() => setSelectedStyle(key)}
          >
            {value.label}
          </button>
        ))}
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={[style.ground]} />
        <Environment preset="city" />
        <PerspectiveCamera makeDefault position={[18, 10, 24]} fov={45} />

        <ambientLight intensity={0.52} />
        <directionalLight
          position={[12, 18, 10]}
          intensity={1.72}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-8, 8, 10]} intensity={0.45} color="#93c5fd" />

        <Landscape width={width} style={style} />
        <Building width={width} floors={floors} style={style} />

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

      <div style={hintStyle}>
        <strong>{title}</strong>
        <span style={{ fontSize: 13, color: "#cbd5e1" }}>
          Dedicated outside house view • modern façade • glass balcony • porch columns • presentation ready
        </span>
      </div>
    </div>
  );
}