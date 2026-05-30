function line(x1, y1, x2, y2, layer = "NEXACAD") {
  return `0
LINE
8
${layer}
10
${x1}
20
${y1}
30
0
11
${x2}
21
${y2}
31
0
`;
}

function text(x, y, value, height = 8, layer = "TEXT") {
  return `0
TEXT
8
${layer}
10
${x}
20
${y}
30
0
40
${height}
1
${value}
`;
}

function rect(x, y, w, h, layer) {
  return (
    line(x, y, x + w, y, layer) +
    line(x + w, y, x + w, y + h, layer) +
    line(x + w, y + h, x, y + h, layer) +
    line(x, y + h, x, y, layer)
  );
}

export function createDXF(plan) {
  let dxf = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
TABLES
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  const rooms = plan.rooms || [];
  const doors = plan.doors || [];
  const windows = plan.windows || [];
  const stairs = plan.stairs || [];
  const walls = plan.walls || [];
  const dimensions = plan.dimensions || [];
  const texts = plan.texts || [];

  rooms.forEach((room) => {
    dxf += rect(room.x, -room.y, room.width, -room.height, "ROOMS");
    dxf += text(room.x + 8, -room.y - 18, room.name, 7, "LABELS");
  });

  walls.forEach((wall) => {
    dxf += line(
      wall.x,
      -wall.y,
      wall.x + wall.width,
      -(wall.y + wall.height),
      "WALLS"
    );
  });

  doors.forEach((door) => {
    dxf += rect(door.x, -door.y, door.width, -door.height, "DOORS");
  });

  windows.forEach((windowItem) => {
    dxf += rect(
      windowItem.x,
      -windowItem.y,
      windowItem.width,
      -windowItem.height,
      "WINDOWS"
    );
  });

  stairs.forEach((stair) => {
    dxf += rect(stair.x, -stair.y, stair.width, -stair.height, "STAIRS");
    dxf += text(stair.x + 8, -stair.y - 18, "STAIRS", 7, "LABELS");
  });

  dimensions.forEach((dimension) => {
    dxf += line(
      dimension.x,
      -dimension.y,
      dimension.x + dimension.width,
      -dimension.y,
      "DIMENSIONS"
    );
    dxf += text(
      dimension.x + dimension.width / 2,
      -dimension.y + 16,
      dimension.label || "Dimension",
      6,
      "DIMENSION_TEXT"
    );
  });

  texts.forEach((textItem) => {
    dxf += text(
      textItem.x,
      -textItem.y,
      textItem.text || "Text",
      textItem.fontSize || 8,
      "TEXT_LABELS"
    );
  });

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}