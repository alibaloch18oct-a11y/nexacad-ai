import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Line,
  Group,
  Transformer,
  Circle
} from "react-konva";

function snap(value, gridSize = 12) {
  return Math.round(value / gridSize) * gridSize;
}

function isSelected(selected, type, id) {
  return selected?.type === type && selected?.id === id;
}

function distanceFeet(start, end, scale) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const px = Math.sqrt(dx * dx + dy * dy);
  return Math.max(1, Math.round(px / scale));
}

function floorLabel(floor) {
  return floor === 0 ? "GROUND FLOOR PLAN" : `FLOOR ${floor} PLAN`;
}

function isCanvasTarget(target) {
  const name = target?.name?.();

  return (
    name === "draw-hit-area" ||
    name === "sheet-bg" ||
    name === "sheet-paper" ||
    name === "plan-border"
  );
}

export default function CADCanvas({
  plan,
  activeFloor,
  activeTool,
  selected,
  setSelected,
  stageRef,
  zoom,
  stagePosition,
  setStagePosition,
  onMoveRoom,
  onResizeRoom,
  onMoveDoor,
  onMoveWindow,
  onMoveStair,
  onMoveWall,
onMoveCurvedWall = () => {},
onResizeWallEndpoint,
  onMoveDimension,
  onMoveText,
  onCanvasCommand,
  onCreateLineObject,
  onMoveFurniture = () => {},
  onMoveElectrical = () => {},
  onMovePlumbing = () => {},
  planMode = "architectural"}) {
  const transformerRef = useRef(null);
  const roomRefs = useRef({});
  const [drawStart, setDrawStart] = useState(null);
  const [drawPreview, setDrawPreview] = useState(null);

  const safePlan = useMemo(() => {
    if (!plan) return null;

    return {
      ...plan,
      rooms: Array.isArray(plan.rooms) ? plan.rooms : [],
      doors: Array.isArray(plan.doors) ? plan.doors : [],
      windows: Array.isArray(plan.windows) ? plan.windows : [],
      stairs: Array.isArray(plan.stairs) ? plan.stairs : [],
      walls: Array.isArray(plan.walls) ? plan.walls : [],
      furniture: Array.isArray(plan.furniture) ? plan.furniture : [],
      electrical: Array.isArray(plan.electrical) ? plan.electrical : [],
      plumbing: Array.isArray(plan.plumbing) ? plan.plumbing : [],
curvedWalls: Array.isArray(plan.curvedWalls) ? plan.curvedWalls : [],
      curvedWalls: Array.isArray(plan.curvedWalls) ? plan.curvedWalls : [],
      dimensions: Array.isArray(plan.dimensions) ? plan.dimensions : [],
      texts: Array.isArray(plan.texts) ? plan.texts : []
    };
  }, [plan]);

  useEffect(() => {
    setDrawStart(null);
    setDrawPreview(null);
  }, [activeTool, activeFloor]);

  useEffect(() => {
    if (!transformerRef.current || !selected) return;

    if (selected.type === "room") {
      const node = roomRefs.current[selected.id];

      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected, safePlan]);

  if (!safePlan) {
    return (
      <div className="empty-canvas premium-empty">
        <div className="empty-orb">NC</div>
        <h2>No drawing loaded</h2>
        <p>Open dashboard, choose a starter template, or generate from AI prompt.</p>
      </div>
    );
  }

  const planWidth = Math.max(540, safePlan.canvas?.width || 720);
  const planHeight = Math.max(420, safePlan.canvas?.height || 540);

  const sheetInsetX = 90;
  const sheetInsetY = 70;

  const sheetWidth = planWidth + 180;
  const sheetHeight = planHeight + 160;

  const rooms = safePlan.rooms.filter((room) => room.floor === activeFloor);
  const doors = safePlan.doors.filter((door) => door.floor === activeFloor);
  const windows = safePlan.windows.filter((windowItem) => windowItem.floor === activeFloor);
  const stairs = safePlan.stairs.filter((stair) => stair.floor === activeFloor);
  const walls = safePlan.walls.filter((wall) => wall.floor === activeFloor);
  const furniture = (safePlan.furniture || []).filter((item) => item.floor === activeFloor);
  const electrical = (safePlan.electrical || []).filter((item) => item.floor === activeFloor);
  const plumbing = (safePlan.plumbing || []).filter((item) => item.floor === activeFloor);
const curvedWalls = (safePlan.curvedWalls || []).filter(
  (wall) => wall.floor === activeFloor
);
  const dimensions = safePlan.dimensions.filter((dimension) => dimension.floor === activeFloor);
  const texts = safePlan.texts.filter((textItem) => textItem.floor === activeFloor);

  const layerVisible = (layerId) => {
    const layer = safePlan.layers?.find((item) => item.id === layerId);
    return layer ? layer.visible : true;
  };

  function getPointerPlanPosition(event) {
    const stage = event.target.getStage();
    const pointer = stage.getPointerPosition();

    if (!pointer) {
      return { x: 0, y: 0 };
    }

    const stageX = stage.x();
    const stageY = stage.y();
    const scale = stage.scaleX() || zoom || 1;

    return {
      x: snap((pointer.x - stageX) / scale - sheetInsetX),
      y: snap((pointer.y - stageY) / scale - sheetInsetY)
    };
  }

  function clampToPlan(position) {
    return {
      x: Math.max(-250, Math.min(planWidth + 250, position.x)),
      y: Math.max(-250, Math.min(planHeight + 250, position.y))
    };
  }

  function handleSheetClick(event) {
    const lineTool = activeTool === "wall" || activeTool === "dimension";

    if (!isCanvasTarget(event.target)) {
      return;
    }

    const position = clampToPlan(getPointerPlanPosition(event));

    if (!lineTool) {
      setSelected(null);
      return;
    }

    if (!drawStart) {
      setDrawStart(position);
      setDrawPreview(position);
      setSelected(null);
      return;
    }

    const widthValue = position.x - drawStart.x;
    const heightValue = position.y - drawStart.y;

    if (Math.abs(widthValue) < 12 && Math.abs(heightValue) < 12) {
      setDrawStart(null);
      setDrawPreview(null);
      return;
    }

    if (activeTool === "wall") {
      onCreateLineObject("wall", {
        x: drawStart.x,
        y: drawStart.y,
        width: widthValue,
        height: heightValue
      });
    }

    if (activeTool === "dimension") {
      const feet = distanceFeet(drawStart, position, safePlan.scale || 12);

      onCreateLineObject("dimension", {
        x: drawStart.x,
        y: drawStart.y,
        width: widthValue,
        height: heightValue,
        label: `${feet} ft`
      });
    }

    setDrawStart(null);
    setDrawPreview(null);
  }

  function handleMouseMove(event) {
    if (!drawStart) return;

    const position = clampToPlan(getPointerPlanPosition(event));
    setDrawPreview(position);
  }

  function handleDoubleClick(event) {
    if (activeTool === "wall" || activeTool === "dimension") return;
    if (!isCanvasTarget(event.target)) return;

    const position = clampToPlan(getPointerPlanPosition(event));
    onCanvasCommand(position);
  }

  function resizeWallEndpoint(wall, endpoint, event) {
    event.cancelBubble = true;

    const node = event.target;
    const nextPoint = {
      x: snap(wall.x + node.x()),
      y: snap(wall.y + node.y())
    };

    onResizeWallEndpoint(wall.id, endpoint, nextPoint);
  }

  const showDrawPreview =
    drawStart &&
    drawPreview &&
    (activeTool === "wall" || activeTool === "dimension");

  const previewFeet =
    showDrawPreview && activeTool === "dimension"
      ? distanceFeet(drawStart, drawPreview, safePlan.scale || 12)
      : null;

  return (
    <div className="cad-canvas-wrap premium-cad-wrap">
      <div className="canvas-tool-hint premium-tool-hint">
        <div>
          <strong>{activeTool.toUpperCase()} MODE</strong>
          <span>
            {activeTool === "wall"
              ? drawStart
                ? "Now click the second point to create wall"
                : "Click first point on sheet/grid"
              : activeTool === "dimension"
              ? drawStart
                ? "Now click the second point to create dimension"
                : "Click first point on sheet/grid"
              : activeTool === "room" ||
                activeTool === "door" ||
                activeTool === "window" ||
                activeTool === "stairs" ||
                activeTool === "text"
              ? "Double click on drawing sheet to add object"
              : activeTool === "select"
              ? "Select, move, resize rooms, and drag blue wall endpoints"
              : "Use pan mode to move around the sheet"}
          </span>
        </div>

        <small>
          {floorLabel(activeFloor)} • Scale 1ft = {safePlan.scale}px • Zoom {Math.round(zoom * 100)}%
        </small>
      </div>

      <div className="sheet-stage-center">
        <Stage
          ref={stageRef}
          width={sheetWidth}
          height={sheetHeight}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePosition.x}
          y={stagePosition.y}
          draggable={activeTool === "pan"}
          onDragEnd={(event) => {
            if (activeTool === "pan") {
              setStagePosition({
                x: event.target.x(),
                y: event.target.y()
              });
            }
          }}
          onMouseMove={handleMouseMove}
          onDblClick={handleDoubleClick}
          className="konva-stage premium-konva-stage"
        >
          <Layer>
            <Rect
              name="sheet-bg"
              x={0}
              y={0}
              width={sheetWidth}
              height={sheetHeight}
              fill="#dbe2ea"
              onClick={handleSheetClick}
            />

            <Rect
              name="sheet-paper"
              x={22}
              y={22}
              width={sheetWidth - 44}
              height={sheetHeight - 44}
              fill="#ffffff"
              cornerRadius={10}
              shadowColor="#0f172a"
              shadowBlur={28}
              shadowOpacity={0.16}
              onClick={handleSheetClick}
            />

            <Rect
              name="sheet-paper"
              x={22}
              y={22}
              width={sheetWidth - 44}
              height={sheetHeight - 44}
              stroke="#0f172a"
              strokeWidth={2}
              cornerRadius={10}
              onClick={handleSheetClick}
            />

            <Rect
              x={22}
              y={22}
              width={sheetWidth - 44}
              height={34}
              fill="#0f172a"
              listening={false}
            />

            <Rect
              x={22}
              y={22}
              width={34}
              height={sheetHeight - 44}
              fill="#0f172a"
              listening={false}
            />

            {Array.from({ length: Math.ceil(planWidth / 12) + 1 }).map((_, index) => (
              <Line
                key={`minor-v-${index}`}
                points={[
                  sheetInsetX + index * 12,
                  sheetInsetY,
                  sheetInsetX + index * 12,
                  sheetInsetY + planHeight
                ]}
                stroke="#edf2f7"
                strokeWidth={1}
                listening={false}
              />
            ))}

            {Array.from({ length: Math.ceil(planHeight / 12) + 1 }).map((_, index) => (
              <Line
                key={`minor-h-${index}`}
                points={[
                  sheetInsetX,
                  sheetInsetY + index * 12,
                  sheetInsetX + planWidth,
                  sheetInsetY + index * 12
                ]}
                stroke="#edf2f7"
                strokeWidth={1}
                listening={false}
              />
            ))}

            {Array.from({ length: Math.ceil(planWidth / 48) + 1 }).map((_, index) => (
              <Line
                key={`major-v-${index}`}
                points={[
                  sheetInsetX + index * 48,
                  sheetInsetY,
                  sheetInsetX + index * 48,
                  sheetInsetY + planHeight
                ]}
                stroke="#cfe0f5"
                strokeWidth={1.6}
                listening={false}
              />
            ))}

            {Array.from({ length: Math.ceil(planHeight / 48) + 1 }).map((_, index) => (
              <Line
                key={`major-h-${index}`}
                points={[
                  sheetInsetX,
                  sheetInsetY + index * 48,
                  sheetInsetX + planWidth,
                  sheetInsetY + index * 48
                ]}
                stroke="#cfe0f5"
                strokeWidth={1.6}
                listening={false}
              />
            ))}

            {Array.from({ length: Math.ceil(planWidth / 96) + 1 }).map((_, index) => (
              <Text
                key={`ruler-x-${index}`}
                text={`${Math.round((index * 96) / safePlan.scale)}'`}
                x={sheetInsetX + index * 96 + 4}
                y={33}
                fontSize={10}
                fill="#cbd5e1"
                listening={false}
              />
            ))}

            {Array.from({ length: Math.ceil(planHeight / 96) + 1 }).map((_, index) => (
              <Text
                key={`ruler-y-${index}`}
                text={`${Math.round((index * 96) / safePlan.scale)}'`}
                x={26}
                y={sheetInsetY + index * 96 + 3}
                fontSize={10}
                fill="#cbd5e1"
                listening={false}
              />
            ))}

            <Rect
              name="plan-border"
              x={sheetInsetX}
              y={sheetInsetY}
              width={planWidth}
              height={planHeight}
              stroke="#0f172a"
              strokeWidth={3}
              onClick={handleSheetClick}
            />

            <Rect
              name="draw-hit-area"
              x={sheetInsetX}
              y={sheetInsetY}
              width={planWidth}
              height={planHeight}
              fill="rgba(0,0,0,0.001)"
              onClick={handleSheetClick}
            />

            <Text
              text={floorLabel(activeFloor)}
              x={sheetInsetX}
              y={sheetHeight - 72}
              fontSize={18}
              fontStyle="bold"
              fill="#0f172a"
              listening={false}
            />

            <Text
              text={`PROJECT: ${safePlan.title || "NexaCAD Project"}  |  PLOT: ${safePlan.plot?.width || 30}' x ${safePlan.plot?.length || 60}'  |  SCALE: 1ft = ${safePlan.scale}px`}
              x={sheetInsetX}
              y={sheetHeight - 48}
              fontSize={10}
              fill="#334155"
              listening={false}
            />

            <Group x={sheetWidth - 280} y={sheetHeight - 108} listening={false}>
              <Rect width={235} height={74} fill="#f8fafc" stroke="#0f172a" strokeWidth={2} />
              <Line points={[0, 24, 235, 24]} stroke="#0f172a" strokeWidth={1.5} />
              <Line points={[110, 24, 110, 74]} stroke="#0f172a" strokeWidth={1.5} />
              <Line points={[170, 24, 170, 74]} stroke="#0f172a" strokeWidth={1.5} />
              <Text text="TITLE BLOCK" x={8} y={6} fontSize={12} fontStyle="bold" fill="#0f172a" />
              <Text text={safePlan.title || "NexaCAD Project"} x={8} y={34} fontSize={10} fill="#0f172a" />
              <Text text={`Floor ${activeFloor === 0 ? "G" : activeFloor}`} x={118} y={34} fontSize={10} fill="#0f172a" />
              <Text text="AI CAD" x={178} y={34} fontSize={10} fill="#0f172a" />
              <Text text="Prepared by NexaCAD AI Pro" x={8} y={54} fontSize={9} fill="#475569" />
            </Group>

            {layerVisible("walls") &&
              walls.map((wall) => {
                const selectedWall = isSelected(selected, "wall", wall.id);

                return (
                  <Group
                    key={wall.id}
                    x={sheetInsetX + wall.x}
                    y={sheetInsetY + wall.y}
                    draggable={activeTool === "select"}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      setSelected({ type: "wall", id: wall.id });
                    }}
                    onDragEnd={(event) => {
                      onMoveWall(wall.id, {
                        x: snap(event.target.x() - sheetInsetX),
                        y: snap(event.target.y() - sheetInsetY)
                      });
                    }}
                  >
                    <Line
                      points={[0, 0, wall.width, wall.height]}
                      stroke={selectedWall ? "#2563eb" : "#0f172a"}
                      strokeWidth={wall.thickness || 8}
                      lineCap="square"
                      shadowColor={selectedWall ? "#2563eb" : "transparent"}
                      shadowBlur={selectedWall ? 10 : 0}
                    />

                    {selectedWall && (
                      <>
                        <Circle
                          x={0}
                          y={0}
                          radius={9}
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth={2}
                          draggable
                          onMouseDown={(event) => {
                            event.cancelBubble = true;
                          }}
                          onDragStart={(event) => {
                            event.cancelBubble = true;
                          }}
                          onDragEnd={(event) => {
                            resizeWallEndpoint(wall, "start", event);
                          }}
                        />

                        <Circle
                          x={wall.width}
                          y={wall.height}
                          radius={9}
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth={2}
                          draggable
                          onMouseDown={(event) => {
                            event.cancelBubble = true;
                          }}
                          onDragStart={(event) => {
                            event.cancelBubble = true;
                          }}
                          onDragEnd={(event) => {
                            resizeWallEndpoint(wall, "end", event);
                          }}
                        />

                        <Text
                          text="drag endpoints"
                          x={Math.min(0, wall.width) + Math.abs(wall.width) / 2 - 45}
                          y={(wall.height || 0) / 2 - 28}
                          width={90}
                          align="center"
                          fontSize={11}
                          fill="#2563eb"
                          fontStyle="bold"
                          listening={false}
                        />
                      </>
                    )}
                  </Group>
                );
              })}


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


            {layerVisible("architecture") &&
              rooms.map((room) => {
                const selectedRoom = isSelected(selected, "room", room.id);

                return (
                  <Group
                    key={room.id}
                    x={sheetInsetX + room.x}
                    y={sheetInsetY + room.y}
                    draggable={activeTool === "select" && !room.locked}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      setSelected({ type: "room", id: room.id });
                    }}
                    onTap={() => setSelected({ type: "room", id: room.id })}
                    onDragEnd={(event) => {
                      onMoveRoom(room.id, {
                        x: snap(event.target.x() - sheetInsetX),
                        y: snap(event.target.y() - sheetInsetY)
                      });
                    }}
                    onTransformEnd={(event) => {
                      const node = event.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();

                      node.scaleX(1);
                      node.scaleY(1);

                      const newWidth = Math.max(36, snap(room.width * scaleX));
                      const newHeight = Math.max(36, snap(room.height * scaleY));

                      onResizeRoom(room.id, {
                        x: snap(node.x() - sheetInsetX),
                        y: snap(node.y() - sheetInsetY),
                        width: newWidth,
                        height: newHeight
                      });
                    }}
                    ref={(node) => {
                      if (node) roomRefs.current[room.id] = node;
                    }}
                  >
                    <Rect
                      width={room.width}
                      height={room.height}
                      fill={room.color || "#e0e7ff"}
                      opacity={0.95}
                      stroke={selectedRoom ? "#2563eb" : "#111827"}
                      strokeWidth={selectedRoom ? 5 : room.wallThickness || 6}
                      cornerRadius={3}
                      shadowColor={selectedRoom ? "#2563eb" : "#0f172a"}
                      shadowBlur={selectedRoom ? 12 : 2}
                      shadowOpacity={selectedRoom ? 0.3 : 0.12}
                    />

                    <Rect
                      x={5}
                      y={5}
                      width={Math.max(1, room.width - 10)}
                      height={Math.max(1, room.height - 10)}
                      stroke="#ffffff"
                      strokeWidth={1}
                      opacity={0.35}
                      cornerRadius={2}
                      listening={false}
                    />

                    <Text
                      text={room.name}
                      x={8}
                      y={12}
                      width={Math.max(1, room.width - 16)}
                      align="center"
                      fontSize={14}
                      fontStyle="bold"
                      fill="#0f172a"
                      listening={false}
                    />

                    <Text
                      text={`${Math.round(room.width / safePlan.scale)}' x ${Math.round(
                        room.height / safePlan.scale
                      )}'`}
                      x={8}
                      y={35}
                      width={Math.max(1, room.width - 16)}
                      align="center"
                      fontSize={12}
                      fill="#334155"
                      listening={false}
                    />

                    <Text
                      text={`${Math.round((room.width / safePlan.scale) * (room.height / safePlan.scale))} sq ft`}
                      x={8}
                      y={55}
                      width={Math.max(1, room.width - 16)}
                      align="center"
                      fontSize={10}
                      fill="#475569"
                      listening={false}
                    />
                  </Group>
                );
              })}



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


            {layerVisible("openings") &&
              doors.map((door) => (
                <Rect
                  key={door.id}
                  x={sheetInsetX + door.x}
                  y={sheetInsetY + door.y}
                  width={door.width}
                  height={door.height}
                  fill="#92400e"
                  stroke={isSelected(selected, "door", door.id) ? "#2563eb" : "#451a03"}
                  strokeWidth={isSelected(selected, "door", door.id) ? 3 : 1}
                  cornerRadius={2}
                  draggable={activeTool === "select"}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setSelected({ type: "door", id: door.id });
                  }}
                  onDragEnd={(event) => {
                    onMoveDoor(door.id, {
                      x: snap(event.target.x() - sheetInsetX),
                      y: snap(event.target.y() - sheetInsetY)
                    });
                  }}
                />
              ))}

            {layerVisible("openings") &&
              windows.map((windowItem) => (
                <Rect
                  key={windowItem.id}
                  x={sheetInsetX + windowItem.x}
                  y={sheetInsetY + windowItem.y}
                  width={windowItem.width}
                  height={windowItem.height}
                  fill="#0284c7"
                  stroke={isSelected(selected, "window", windowItem.id) ? "#2563eb" : "#075985"}
                  strokeWidth={isSelected(selected, "window", windowItem.id) ? 3 : 1}
                  cornerRadius={2}
                  draggable={activeTool === "select"}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setSelected({ type: "window", id: windowItem.id });
                  }}
                  onDragEnd={(event) => {
                    onMoveWindow(windowItem.id, {
                      x: snap(event.target.x() - sheetInsetX),
                      y: snap(event.target.y() - sheetInsetY)
                    });
                  }}
                />
              ))}

            {layerVisible("stairs") &&
              stairs.map((stair) => (
                <Group
                  key={stair.id}
                  x={sheetInsetX + stair.x}
                  y={sheetInsetY + stair.y}
                  draggable={activeTool === "select"}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setSelected({ type: "stairs", id: stair.id });
                  }}
                  onDragEnd={(event) => {
                    onMoveStair(stair.id, {
                      x: snap(event.target.x() - sheetInsetX),
                      y: snap(event.target.y() - sheetInsetY)
                    });
                  }}
                >
                  <Rect
                    width={stair.width}
                    height={stair.height}
                    fill="#fee2e2"
                    stroke={isSelected(selected, "stairs", stair.id) ? "#2563eb" : "#991b1b"}
                    strokeWidth={isSelected(selected, "stairs", stair.id) ? 4 : 3}
                    cornerRadius={3}
                  />

                  {Array.from({ length: 7 }).map((_, index) => (
                    <Line
                      key={index}
                      points={[
                        0,
                        ((index + 1) * stair.height) / 8,
                        stair.width,
                        ((index + 1) * stair.height) / 8
                      ]}
                      stroke="#991b1b"
                      strokeWidth={1}
                      listening={false}
                    />
                  ))}

                  <Text
                    text="STAIRS"
                    x={6}
                    y={stair.height / 2 - 8}
                    width={stair.width - 12}
                    align="center"
                    fontSize={13}
                    fontStyle="bold"
                    fill="#7f1d1d"
                    listening={false}
                  />
                </Group>
              ))}

            {layerVisible("dimensions") &&
              dimensions.map((dimension) => (
                <Group
                  key={dimension.id}
                  x={sheetInsetX + dimension.x}
                  y={sheetInsetY + dimension.y}
                  draggable={activeTool === "select"}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setSelected({ type: "dimension", id: dimension.id });
                  }}
                  onDragEnd={(event) => {
                    onMoveDimension(dimension.id, {
                      x: snap(event.target.x() - sheetInsetX),
                      y: snap(event.target.y() - sheetInsetY)
                    });
                  }}
                >
                  <Line
                    points={[0, 0, dimension.width, dimension.height || 0]}
                    stroke={isSelected(selected, "dimension", dimension.id) ? "#2563eb" : "#dc2626"}
                    strokeWidth={2}
                  />

                  <Circle x={0} y={0} radius={4} fill="#dc2626" listening={false} />
                  <Circle x={dimension.width} y={dimension.height || 0} radius={4} fill="#dc2626" listening={false} />

                  <Text
                    text={dimension.label}
                    x={Math.min(0, dimension.width) + Math.abs(dimension.width) / 2 - 40}
                    y={(dimension.height || 0) / 2 - 24}
                    width={80}
                    align="center"
                    fontSize={12}
                    fontStyle="bold"
                    fill="#991b1b"
                    listening={false}
                  />
                </Group>
              ))}

            {layerVisible("text") &&
              texts.map((textItem) => (
                <Text
                  key={textItem.id}
                  x={sheetInsetX + textItem.x}
                  y={sheetInsetY + textItem.y}
                  text={textItem.text}
                  fontSize={textItem.fontSize || 16}
                  fontStyle={textItem.fontStyle || "bold"}
                  fill={isSelected(selected, "text", textItem.id) ? "#2563eb" : textItem.color || "#0f172a"}
                  draggable={activeTool === "select"}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    setSelected({ type: "text", id: textItem.id });
                  }}
                  onDragEnd={(event) => {
                    onMoveText(textItem.id, {
                      x: snap(event.target.x() - sheetInsetX),
                      y: snap(event.target.y() - sheetInsetY)
                    });
                  }}
                />
              ))}

            {showDrawPreview && (
              <>
                <Line
                  points={[
                    sheetInsetX + drawStart.x,
                    sheetInsetY + drawStart.y,
                    sheetInsetX + drawPreview.x,
                    sheetInsetY + drawPreview.y
                  ]}
                  stroke={activeTool === "wall" ? "#2563eb" : "#dc2626"}
                  strokeWidth={activeTool === "wall" ? 8 : 2}
                  dash={[8, 6]}
                  lineCap="square"
                  listening={false}
                />

                <Circle
                  x={sheetInsetX + drawStart.x}
                  y={sheetInsetY + drawStart.y}
                  radius={6}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={2}
                  listening={false}
                />

                <Circle
                  x={sheetInsetX + drawPreview.x}
                  y={sheetInsetY + drawPreview.y}
                  radius={6}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={2}
                  listening={false}
                />

                {activeTool === "dimension" && (
                  <Text
                    text={`${previewFeet} ft`}
                    x={(sheetInsetX + drawStart.x + sheetInsetX + drawPreview.x) / 2 - 35}
                    y={(sheetInsetY + drawStart.y + sheetInsetY + drawPreview.y) / 2 - 24}
                    width={70}
                    align="center"
                    fontSize={13}
                    fontStyle="bold"
                    fill="#991b1b"
                    listening={false}
                  />
                )}
              </>
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center"
              ]}
              anchorFill="#2563eb"
              anchorStroke="#ffffff"
              anchorSize={9}
              borderStroke="#2563eb"
              borderDash={[6, 4]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 36 || newBox.height < 36) {
                  return oldBox;
                }

                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}