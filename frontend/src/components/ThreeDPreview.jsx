import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Text,
  Edges,
  ContactShadows,
  Environment,
  Sky
} from "@react-three/drei";

const FLOOR_HEIGHT = 3.35;

function getPlot(plan) {
  return {
    width: plan?.plot?.width || 30,
    length: plan?.plot?.length || 60,
    scale: plan?.scale || 12,
    floors: Math.max(1, plan?.floors || 1)
  };
}

function toScene(item, plan) {
  const { width, length, scale } = getPlot(plan);

  return {
    x: item.x / scale - width / 2,
    z: item.y / scale - length / 2,
    w: Math.max(0.25, item.width / scale),
    d: Math.max(0.25, item.height / scale)
  };
}

function CameraController({ viewMode, plan, activeFloor, resetKey }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!plan) return;

    const { width, length, floors } = getPlot(plan);
    const floorY = activeFloor * FLOOR_HEIGHT;
    const totalHeight = floors * FLOOR_HEIGHT;

    camera.rotation.order = "YXZ";

    if (viewMode === "floor") {
      camera.position.set(width * 0.9, floorY + 25, length * 0.82);
      camera.lookAt(0, floorY + 0.8, 0);
      return;
    }

    if (viewMode === "exterior") {
      camera.position.set(width * 0.55, totalHeight * 0.72 + 3, length / 2 + 34);
      camera.lookAt(0, totalHeight * 0.48, -length * 0.08);
      return;
    }

    if (viewMode === "walk") {
      camera.position.set(0, floorY + 1.75, length / 2 - 8);
      camera.rotation.set(0, Math.PI, 0);
    }
  }, [viewMode, plan, activeFloor, resetKey, camera]);

  return null;
}

function WalkController({ enabled, plan, activeFloor, resetKey }) {
  const { camera, gl } = useThree();
  const keys = useRef({});
  const mouseDown = useRef(false);
  const yaw = useRef(Math.PI);
  const pitch = useRef(0);

  useEffect(() => {
    if (!enabled || !plan) return;

    const { length } = getPlot(plan);
    const floorY = activeFloor * FLOOR_HEIGHT;

    camera.position.set(0, floorY + 1.75, length / 2 - 8);
    yaw.current = Math.PI;
    pitch.current = 0;
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, yaw.current, 0);
  }, [enabled, plan, activeFloor, resetKey, camera]);

  useEffect(() => {
    function onKeyDown(event) {
      keys.current[event.key.toLowerCase()] = true;
    }

    function onKeyUp(event) {
      keys.current[event.key.toLowerCase()] = false;
    }

    function onMouseDown(event) {
      if (!enabled) return;
      if (event.button !== 0) return;

      mouseDown.current = true;
      gl.domElement.style.cursor = "grabbing";
    }

    function onMouseUp() {
      mouseDown.current = false;
      gl.domElement.style.cursor = enabled ? "grab" : "default";
    }

    function onMouseMove(event) {
      if (!enabled || !mouseDown.current) return;

      const sensitivity = 0.0032;

      yaw.current -= event.movementX * sensitivity;
      pitch.current -= event.movementY * sensitivity;

      const maxPitch = Math.PI / 2.7;
      pitch.current = Math.max(-maxPitch, Math.min(maxPitch, pitch.current));

      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw.current;
      camera.rotation.x = pitch.current;
      camera.rotation.z = 0;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    gl.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    if (enabled) {
      gl.domElement.style.cursor = "grab";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      gl.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      gl.domElement.style.cursor = "default";
    };
  }, [enabled, camera, gl]);

  useFrame((_, delta) => {
    if (!enabled || !plan) return;

    const { width, length } = getPlot(plan);
    const floorY = activeFloor * FLOOR_HEIGHT;
    const speed = keys.current.shift ? 8 : 4;

    const forward = {
      x: -Math.sin(yaw.current),
      z: -Math.cos(yaw.current)
    };

    const right = {
      x: Math.cos(yaw.current),
      z: -Math.sin(yaw.current)
    };

    if (keys.current.w || keys.current.arrowup) {
      camera.position.x += forward.x * speed * delta;
      camera.position.z += forward.z * speed * delta;
    }

    if (keys.current.s || keys.current.arrowdown) {
      camera.position.x -= forward.x * speed * delta;
      camera.position.z -= forward.z * speed * delta;
    }

    if (keys.current.a || keys.current.arrowleft) {
      camera.position.x -= right.x * speed * delta;
      camera.position.z -= right.z * speed * delta;
    }

    if (keys.current.d || keys.current.arrowright) {
      camera.position.x += right.x * speed * delta;
      camera.position.z += right.z * speed * delta;
    }

    camera.position.y = floorY + 1.75;
    camera.position.x = Math.max(-width / 2 + 1, Math.min(width / 2 - 1, camera.position.x));
    camera.position.z = Math.max(-length / 2 + 1, Math.min(length / 2 - 1, camera.position.z));
  });

  return null;
}

function WallPiece({ position, size, color = "#eef2f7", edge = "#334155", opacity = 1 }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.62}
        metalness={0.02}
        transparent={opacity < 1}
        opacity={opacity}
      />
      <Edges color={edge} />
    </mesh>
  );
}

function SiteBase({ plan }) {
  const { width, length } = getPlot(plan);

  return (
    <group>
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[width + 28, 0.18, length + 28]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} />
      </mesh>

      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[width + 3, 0.16, length + 3]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.82} />
        <Edges color="#1e293b" />
      </mesh>

      <mesh position={[0, -0.02, length / 2 + 3.8]} receiveShadow>
        <boxGeometry args={[width + 22, 0.08, 5.5]} />
        <meshStandardMaterial color="#374151" roughness={0.85} />
      </mesh>

      <mesh position={[-width / 2 - 4.5, 0, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.07, length + 12]} />
        <meshStandardMaterial color="#166534" roughness={0.92} />
      </mesh>

      <mesh position={[width / 2 + 4.5, 0, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.07, length + 12]} />
        <meshStandardMaterial color="#166534" roughness={0.92} />
      </mesh>
    </group>
  );
}

function Trees({ plan }) {
  const { width, length } = getPlot(plan);

  const points = [
    [-width / 2 - 5.3, length / 2 - 6],
    [width / 2 + 5.3, length / 2 - 8],
    [-width / 2 - 5.3, -length / 2 + 8],
    [width / 2 + 5.3, -length / 2 + 8]
  ];

  return (
    <group>
      {points.map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.18, 1.1, 10]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>

          <mesh position={[0, 1.35, 0]} castShadow>
            <sphereGeometry args={[0.7, 18, 18]} />
            <meshStandardMaterial color="#15803d" roughness={0.78} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FloorSlab({ plan, floorY }) {
  const { width, length } = getPlot(plan);

  return (
    <group>
      <mesh position={[0, floorY, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, 0.22, length]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.75} />
        <Edges color="#0f172a" />
      </mesh>

      <mesh position={[0, floorY + 0.16, 0]} receiveShadow>
        <boxGeometry args={[width - 0.45, 0.03, length - 0.45]} />
        <meshStandardMaterial color="#ffffff" roughness={0.45} />
      </mesh>
    </group>
  );
}

function RoomFloor({ room, plan, floorY, labels }) {
  const s = toScene(room, plan);
  const x = s.x + s.w / 2;
  const z = s.z + s.d / 2;

  const color =
    room.type === "parking"
      ? "#cbd5e1"
      : room.type === "terrace"
      ? "#bfdbfe"
      : room.color || "#e0e7ff";

  return (
    <group position={[x, floorY + 0.09, z]}>
      <mesh receiveShadow>
        <boxGeometry args={[s.w, 0.12, s.d]} />
        <meshStandardMaterial color={color} roughness={0.68} />
        <Edges color="#0f172a" />
      </mesh>

      {labels && (
        <Text
          position={[0, 0.18, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.34}
          color="#111827"
          anchorX="center"
          anchorY="middle"
        >
          {room.name}
        </Text>
      )}
    </group>
  );
}

function RoomWalls({ room, plan, floorY, viewMode }) {
  const s = toScene(room, plan);

  if (["terrace", "parking"].includes(room.type)) return null;

  const x = s.x;
  const z = s.z;
  const w = s.w;
  const d = s.d;

  const t = Math.max(0.2, (room.wallThickness || 7) / (plan.scale || 12));
  const h = viewMode === "floor" ? 2.25 : 2.95;
  const opacity = viewMode === "floor" ? 0.98 : 1;

  const wallColor =
    room.type === "bathroom"
      ? "#dbeafe"
      : room.type === "kitchen"
      ? "#dcfce7"
      : room.type === "bedroom"
      ? "#f5f3ff"
      : "#eef2f7";

  return (
    <group>
      <WallPiece position={[x + w / 2, floorY + h / 2, z]} size={[w, h, t]} color={wallColor} edge="#1e293b" opacity={opacity} />
      <WallPiece position={[x + w / 2, floorY + h / 2, z + d]} size={[w, h, t]} color={wallColor} edge="#1e293b" opacity={opacity} />
      <WallPiece position={[x, floorY + h / 2, z + d / 2]} size={[t, h, d]} color={wallColor} edge="#1e293b" opacity={opacity} />
      <WallPiece position={[x + w, floorY + h / 2, z + d / 2]} size={[t, h, d]} color={wallColor} edge="#1e293b" opacity={opacity} />

      <mesh position={[x + w / 2, floorY + 0.2, z + d / 2]} receiveShadow>
        <boxGeometry args={[Math.max(0.2, w - 0.35), 0.035, Math.max(0.2, d - 0.35)]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.2} roughness={0.45} />
      </mesh>
    </group>
  );
}

function CADWall({ wall, plan, floorY, viewMode }) {
  const { width, length, scale } = getPlot(plan);

  const x1 = wall.x / scale - width / 2;
  const z1 = wall.y / scale - length / 2;
  const x2 = (wall.x + wall.width) / scale - width / 2;
  const z2 = (wall.y + wall.height) / scale - length / 2;

  const dx = x2 - x1;
  const dz = z2 - z1;
  const wallLength = Math.max(0.2, Math.hypot(dx, dz));
  const angle = Math.atan2(dz, dx);
  const thickness = Math.max(0.2, (wall.thickness || 8) / scale);
  const h = viewMode === "floor" ? 2.25 : 2.95;

  return (
    <mesh
      position={[(x1 + x2) / 2, floorY + h / 2, (z1 + z2) / 2]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[wallLength, h, thickness]} />
      <meshStandardMaterial color="#eef2f7" roughness={0.68} />
      <Edges color="#334155" />
    </mesh>
  );
}

function CurvedWall({ curve, plan, floorY, viewMode }) {
  const { width, length, scale } = getPlot(plan);
  const cx = curve.x / scale - width / 2;
  const cz = curve.y / scale - length / 2;
  const radius = Math.max(2, (curve.radius || 72) / scale);
  const start = ((curve.startAngle || 205) * Math.PI) / 180;
  const end = ((curve.endAngle || 335) * Math.PI) / 180;
  const steps = 28;
  const height = viewMode === "floor" ? 1.85 : curve.height || 2.2;
  const thickness = Math.max(0.18, (curve.thickness || 8) / scale);

  return (
    <group>
      {Array.from({ length: steps }).map((_, index) => {
        const a1 = start + ((end - start) * index) / steps;
        const a2 = start + ((end - start) * (index + 1)) / steps;
        const mid = (a1 + a2) / 2;

        const x1 = cx + Math.cos(a1) * radius;
        const z1 = cz + Math.sin(a1) * radius;
        const x2 = cx + Math.cos(a2) * radius;
        const z2 = cz + Math.sin(a2) * radius;

        const len = Math.max(0.2, Math.hypot(x2 - x1, z2 - z1));
        const x = cx + Math.cos(mid) * radius;
        const z = cz + Math.sin(mid) * radius;

        return (
          <mesh
            key={index}
            position={[x, floorY + height / 2, z]}
            rotation={[0, -mid, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[len, height, thickness]} />
            <meshStandardMaterial color="#ede9fe" roughness={0.64} />
            <Edges color="#5b21b6" />
          </mesh>
        );
      })}
    </group>
  );
}

function Door({ door, plan, floorY }) {
  const s = toScene(door, plan);
  const x = s.x + s.w / 2;
  const z = s.z + s.d / 2;
  const horizontal = s.w >= s.d;

  return (
    <group position={[x, floorY, z]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[horizontal ? s.w : 0.18, 2.1, horizontal ? 0.18 : s.d]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.48} />
        <Edges color="#431407" />
      </mesh>

      <mesh position={[horizontal ? s.w * 0.28 : 0.1, 1.12, horizontal ? -0.1 : s.d * 0.28]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#facc15" metalness={0.65} roughness={0.22} />
      </mesh>
    </group>
  );
}

function Window({ windowItem, plan, floorY }) {
  const s = toScene(windowItem, plan);
  const x = s.x + s.w / 2;
  const z = s.z + s.d / 2;
  const horizontal = s.w >= s.d;

  return (
    <group position={[x, floorY + 1.55, z]}>
      <mesh castShadow>
        <boxGeometry args={[horizontal ? s.w : 0.12, 1.05, horizontal ? 0.12 : s.d]} />
        <meshPhysicalMaterial
          color="#7dd3fc"
          transparent
          opacity={0.48}
          roughness={0.04}
          metalness={0.14}
          transmission={0.28}
        />
        <Edges color="#075985" />
      </mesh>

      <mesh position={[0, 0.56, 0]} castShadow>
        <boxGeometry args={[horizontal ? s.w + 0.12 : 0.16, 0.08, horizontal ? 0.16 : s.d + 0.12]} />
        <meshStandardMaterial color="#111827" roughness={0.35} />
      </mesh>

      <mesh position={[0, -0.56, 0]} castShadow>
        <boxGeometry args={[horizontal ? s.w + 0.12 : 0.16, 0.08, horizontal ? 0.16 : s.d + 0.12]} />
        <meshStandardMaterial color="#111827" roughness={0.35} />
      </mesh>
    </group>
  );
}

function Stairs({ stair, plan, floorY }) {
  const s = toScene(stair, plan);
  const steps = 10;
  const stepDepth = s.d / steps;
  const totalHeight = 2.25;

  return (
    <group>
      {Array.from({ length: steps }).map((_, index) => {
        const stepH = ((index + 1) / steps) * totalHeight;
        const x = s.x + s.w / 2;
        const z = s.z + stepDepth * index + stepDepth / 2;

        return (
          <mesh key={index} position={[x, floorY + stepH / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[s.w, stepH, stepDepth]} />
            <meshStandardMaterial color="#fecaca" roughness={0.64} />
            <Edges color="#7f1d1d" />
          </mesh>
        );
      })}
    </group>
  );
}

function Furniture({ rooms, furniture = [], plan, floorY }) {
  return (
    <group>
      {rooms
        .filter((room) => room.type === "bedroom")
        .map((room) => {
          const s = toScene(room, plan);

          return (
            <mesh
              key={`bed-${room.id}`}
              position={[s.x + s.w * 0.3, floorY + 0.32, s.z + s.d * 0.35]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[Math.min(4, s.w * 0.42), 0.38, Math.min(6, s.d * 0.42)]} />
              <meshStandardMaterial color="#c4b5fd" roughness={0.7} />
              <Edges color="#6d28d9" />
            </mesh>
          );
        })}

      {rooms
        .filter((room) => room.type === "kitchen")
        .map((room) => {
          const s = toScene(room, plan);

          return (
            <mesh
              key={`kitchen-${room.id}`}
              position={[s.x + s.w * 0.5, floorY + 0.45, s.z + s.d * 0.14]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[Math.min(6, s.w * 0.7), 0.9, 0.65]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.62} />
              <Edges color="#334155" />
            </mesh>
          );
        })}
    </group>
  );
}

function InteriorModel({ plan, model, viewMode, labels }) {
  return (
    <group>
      <FloorSlab plan={plan} floorY={model.floorY} />

      {model.rooms.map((room) => (
        <RoomFloor
          key={`room-floor-${room.id}`}
          room={room}
          plan={plan}
          floorY={model.floorY}
          labels={labels}
        />
      ))}

      {model.rooms.map((room) => (
        <RoomWalls
          key={`room-walls-${room.id}`}
          room={room}
          plan={plan}
          floorY={model.floorY}
          viewMode={viewMode}
        />
      ))}

      {model.walls.map((wall) => (
        <CADWall
          key={`cad-wall-${wall.id}`}
          wall={wall}
          plan={plan}
          floorY={model.floorY}
          viewMode={viewMode}
        />
      ))}

      {model.curvedWalls.map((curve) => (
        <CurvedWall
          key={`curve-wall-${curve.id}`}
          curve={curve}
          plan={plan}
          floorY={model.floorY}
          viewMode={viewMode}
        />
      ))}

      {model.doors.map((door) => (
        <Door key={`door-${door.id}`} door={door} plan={plan} floorY={model.floorY} />
      ))}

      {model.windows.map((windowItem) => (
        <Window
          key={`window-${windowItem.id}`}
          windowItem={windowItem}
          plan={plan}
          floorY={model.floorY}
        />
      ))}

      {model.stairs.map((stair) => (
        <Stairs key={`stairs-${stair.id}`} stair={stair} plan={plan} floorY={model.floorY} />
      ))}

      <Furniture rooms={model.rooms} furniture={model.furniture} plan={plan} floorY={model.floorY} />

      <UtilityObjects3D
        electrical={model.electrical}
        plumbing={model.plumbing}
        plan={plan}
        floorY={model.floorY}
      />
    </group>
  );
}


function UtilityObjects3D({ electrical = [], plumbing = [], plan, floorY }) {
  return (
    <group>
      {electrical.map((item) => {
        const s = toScene(item, plan);
        const x = s.x + s.w / 2;
        const z = s.z + s.d / 2;

        return (
          <mesh key={`electrical-${item.id}`} position={[x, floorY + 0.75, z]} castShadow receiveShadow>
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
          <mesh key={`plumbing-${item.id}`} position={[x, floorY + 0.55, z]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(0.25, s.w), 0.2, Math.max(0.25, s.d)]} />
            <meshStandardMaterial color={item.color || "#38bdf8"} roughness={0.52} />
            <Edges color="#075985" />
          </mesh>
        );
      })}
    </group>
  );
}


function ExteriorFloorBand({ floor, width, depth, bodyColor, accentColor, hasBalcony }) {
  const y = floor * FLOOR_HEIGHT;

  return (
    <group>
      <mesh position={[0, y + FLOOR_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, FLOOR_HEIGHT, depth]} />
        <meshStandardMaterial color={bodyColor} roughness={0.56} />
        <Edges color="#94a3b8" />
      </mesh>

      <mesh position={[width * 0.23, y + FLOOR_HEIGHT / 2, -depth / 2 - 0.32]} castShadow>
        <boxGeometry args={[width * 0.34, FLOOR_HEIGHT * 0.9, 0.58]} />
        <meshStandardMaterial color={accentColor} roughness={0.46} />
      </mesh>

      <mesh position={[-width * 0.26, y + 1.65, -depth / 2 - 0.45]} castShadow>
        <boxGeometry args={[width * 0.22, 2.15, 0.12]} />
        <meshPhysicalMaterial color="#93c5fd" transparent opacity={0.58} roughness={0.04} transmission={0.24} />
        <Edges color="#075985" />
      </mesh>

      <mesh position={[width * 0.22, y + 1.65, -depth / 2 - 0.45]} castShadow>
        <boxGeometry args={[width * 0.18, 2.15, 0.12]} />
        <meshPhysicalMaterial color="#93c5fd" transparent opacity={0.58} roughness={0.04} transmission={0.24} />
        <Edges color="#075985" />
      </mesh>

      {hasBalcony && (
        <>
          <mesh position={[width * 0.22, y + 0.75, -depth / 2 - 0.72]} castShadow>
            <boxGeometry args={[width * 0.3, 0.18, 1.55]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.62} />
            <Edges color="#64748b" />
          </mesh>

          <mesh position={[width * 0.22, y + 1.32, -depth / 2 - 1.44]} castShadow>
            <boxGeometry args={[width * 0.3, 0.88, 0.08]} />
            <meshPhysicalMaterial color="#93c5fd" transparent opacity={0.48} roughness={0.03} transmission={0.24} />
            <Edges color="#075985" />
          </mesh>
        </>
      )}
    </group>
  );
}

function ExteriorHouse({ plan }) {
  const { width, length, floors } = getPlot(plan);
  const bodyWidth = Math.min(width * 0.86, width - 2);
  const bodyDepth = Math.min(length * 0.62, length - 5);
  const totalHeight = floors * FLOOR_HEIGHT;

  const facade = plan.facade || {};
  const bodyColor = facade.color || "#f8fafc";
  const accentColor = facade.accent || "#343a40";

  return (
    <group position={[0, 0, -length * 0.08]}>
      {Array.from({ length: floors }).map((_, floor) => (
        <ExteriorFloorBand
          key={floor}
          floor={floor}
          width={bodyWidth}
          depth={bodyDepth}
          bodyColor={bodyColor}
          accentColor={accentColor}
          hasBalcony={floor > 0}
        />
      ))}

      <mesh position={[0, totalHeight + 0.24, -bodyDepth / 2 - 0.38]} castShadow>
        <boxGeometry args={[bodyWidth + 0.9, 0.38, 0.95]} />
        <meshStandardMaterial color="#ffffff" roughness={0.48} />
        <Edges color="#cbd5e1" />
      </mesh>

      <mesh position={[0, totalHeight + 0.64, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyWidth, 0.65, bodyDepth]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        <Edges color="#64748b" />
      </mesh>

      <WallPiece position={[0, totalHeight + 1.2, -bodyDepth / 2]} size={[bodyWidth, 0.95, 0.24]} color="#cbd5e1" />
      <WallPiece position={[0, totalHeight + 1.2, bodyDepth / 2]} size={[bodyWidth, 0.95, 0.24]} color="#cbd5e1" />
      <WallPiece position={[-bodyWidth / 2, totalHeight + 1.2, 0]} size={[0.24, 0.95, bodyDepth]} color="#cbd5e1" />
      <WallPiece position={[bodyWidth / 2, totalHeight + 1.2, 0]} size={[0.24, 0.95, bodyDepth]} color="#cbd5e1" />

      {[-bodyWidth * 0.38, -bodyWidth * 0.18].map((x) => (
        <mesh key={x} position={[x, 1.42, -bodyDepth / 2 - 0.82]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 2.85, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.58} />
          <Edges color="#cbd5e1" />
        </mesh>
      ))}

      {(plan.curvedWalls || []).slice(0, 2).map((curve, index) => (
        <mesh
          key={curve.id}
          position={[0, 0.85 + index * 1.4, -bodyDepth / 2 - 1.3]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[Math.max(2.5, Math.min(5.5, (curve.radius || 72) / 20)), 0.08, 10, 64, Math.PI]} />
          <meshStandardMaterial
            color={curve.type === "curved-balcony" ? "#93c5fd" : "#e9d5ff"}
            roughness={0.35}
            transparent
            opacity={0.72}
          />
        </mesh>
      ))}

      <Text
        position={[0, totalHeight + 2.2, -bodyDepth / 2 - 1.4]}
        fontSize={0.55}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
      >
        Full {floors}-Floor Exterior Render
      </Text>
    </group>
  );
}

export default function ThreeDPreview({ plan, activeFloor }) {
  const [viewMode, setViewMode] = useState("floor");
  const [labels, setLabels] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const model = useMemo(() => {
    if (!plan) return null;

    return {
      floorY: activeFloor * FLOOR_HEIGHT,
      rooms: (plan.rooms || []).filter((room) => room.floor === activeFloor),
      doors: (plan.doors || []).filter((door) => door.floor === activeFloor),
      windows: (plan.windows || []).filter((windowItem) => windowItem.floor === activeFloor),
      stairs: (plan.stairs || []).filter((stair) => stair.floor === activeFloor),
      walls: (plan.walls || []).filter((wall) => wall.floor === activeFloor),
      curvedWalls: (plan.curvedWalls || []).filter((wall) => wall.floor === activeFloor),
      furniture: (plan.furniture || []).filter((item) => item.floor === activeFloor),
      electrical: (plan.electrical || []).filter((item) => item.floor === activeFloor),
      plumbing: (plan.plumbing || []).filter((item) => item.floor === activeFloor)
    };
  }, [plan, activeFloor]);

  if (!plan || !model) {
    return (
      <div className="three-empty premium-empty">
        <div className="empty-orb">3D</div>
        <h2>No 3D model loaded</h2>
        <p>Generate a plan first, then open 3D Preview.</p>
      </div>
    );
  }

  const buttonBase = {
    border: "1px solid rgba(125,211,252,0.25)",
    borderRadius: 999,
    background: "rgba(2,6,23,0.78)",
    color: "#dbeafe",
    padding: "9px 12px",
    fontSize: 12,
    fontWeight: 900,
    backdropFilter: "blur(14px)"
  };

  const buttonActive = {
    ...buttonBase,
    border: "1px solid transparent",
    color: "#fff",
    background: "linear-gradient(135deg,#2563eb,#06b6d4)"
  };

  return (
    <div className="three-preview premium-three-preview" style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap"
        }}
      >
        <button
          style={viewMode === "floor" ? buttonActive : buttonBase}
          onClick={() => {
            setViewMode("floor");
            setResetKey((v) => v + 1);
          }}
        >
          Floor Plan 3D
        </button>

        <button
          style={viewMode === "exterior" ? buttonActive : buttonBase}
          onClick={() => {
            setViewMode("exterior");
            setResetKey((v) => v + 1);
          }}
        >
          Exterior House
        </button>

        <button
          style={viewMode === "walk" ? buttonActive : buttonBase}
          onClick={() => {
            setViewMode("walk");
            setResetKey((v) => v + 1);
          }}
        >
          Walkthrough
        </button>

        <button style={buttonBase} onClick={() => setResetKey((v) => v + 1)}>
          Reset Camera
        </button>

        <button style={labels ? buttonActive : buttonBase} onClick={() => setLabels((v) => !v)}>
          Labels
        </button>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={["#d7d9d2"]} />

        <Sky
          sunPosition={[80, 24, 80]}
          turbidity={7}
          rayleigh={1.2}
          mieCoefficient={0.004}
          mieDirectionalG={0.82}
        />

        <Environment preset="city" />

        <PerspectiveCamera makeDefault position={[28, 22, 38]} fov={46} />

        <CameraController viewMode={viewMode} plan={plan} activeFloor={activeFloor} resetKey={resetKey} />

        <WalkController
          enabled={viewMode === "walk"}
          plan={plan}
          activeFloor={activeFloor}
          resetKey={resetKey}
        />

        <ambientLight intensity={0.55} />

        <directionalLight
          position={[18, 26, 14]}
          intensity={1.75}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
        />

        <pointLight position={[-18, 10, -16]} intensity={0.55} color="#38bdf8" />
        <pointLight position={[18, 12, 18]} intensity={0.35} color="#c084fc" />

        <SiteBase plan={plan} />
        <Trees plan={plan} />

        {viewMode === "exterior" ? (
          <ExteriorHouse plan={plan} />
        ) : (
          <InteriorModel plan={plan} model={model} viewMode={viewMode} labels={labels} />
        )}

        <ContactShadows position={[0, -0.02, 0]} opacity={0.48} scale={110} blur={2.8} far={45} />

        {viewMode !== "walk" && (
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            target={[
              0,
              viewMode === "exterior"
                ? getPlot(plan).floors * FLOOR_HEIGHT * 0.45
                : model.floorY + 0.8,
              0
            ]}
            minDistance={8}
            maxDistance={140}
            maxPolarAngle={Math.PI / 2.05}
          />
        )}
      </Canvas>

      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          zIndex: 40,
          padding: "12px 16px",
          borderRadius: 18,
          background: "rgba(2,6,23,0.72)",
          border: "1px solid rgba(125,211,252,0.2)",
          color: "#e2e8f0",
          backdropFilter: "blur(16px)"
        }}
      >
        <strong>
          {viewMode === "floor"
            ? "Complete Floor Plan 3D"
            : viewMode === "exterior"
              ? `Full ${getPlot(plan).floors}-Floor Exterior House`
              : "Walkthrough Mode"}
        </strong>

        <div style={{ marginTop: 4, color: "#cbd5e1", fontSize: 13 }}>
          {viewMode === "floor"
            ? "Rooms, walls, doors, windows, stairs and furniture blocks are visible. Drag to orbit and scroll to zoom."
            : viewMode === "exterior"
              ? "Exterior render shows the complete building with all floors together."
              : "Hold left mouse button and move mouse to look around. W/A/S/D move, Shift faster."}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 86,
          right: 18,
          zIndex: 40,
          padding: "10px 14px",
          borderRadius: 999,
          background: "linear-gradient(135deg,rgba(37,99,235,.92),rgba(6,182,212,.92))",
          color: "#fff",
          fontWeight: 900,
          fontSize: 11,
          letterSpacing: 0.6
        }}
      >
        {viewMode === "floor"
          ? "FULL 3D FLOOR"
          : viewMode === "exterior"
            ? "ALL FLOORS EXTERIOR"
            : "MOUSE WALKTHROUGH"}
      </div>
    </div>
  );
}