import { v4 as uuidv4 } from "uuid";
import { calculateEstimate } from "./estimateEngine.js";

function cleanText(value) {
  return String(value || "").toLowerCase().trim();
}

function parsePlotSize(prompt) {
  const text = cleanText(prompt);

  const patterns = [
    /(\d{2,3})\s*[x×\/]\s*(\d{2,3})/,
    /(\d{2,3})\s*by\s*(\d{2,3})/,
    /(\d{2,3})\s*feet\s*by\s*(\d{2,3})/,
    /(\d{2,3})\s*ft\s*by\s*(\d{2,3})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return {
        width: Number(match[1]),
        length: Number(match[2])
      };
    }
  }

  if (text.includes("120 yard") || text.includes("120 sq yard") || text.includes("120 square yard")) {
    return {
      width: 30,
      length: 36
    };
  }

  if (text.includes("240 yard") || text.includes("240 sq yard") || text.includes("240 square yard")) {
    return {
      width: 40,
      length: 54
    };
  }

  return {
    width: 30,
    length: 60
  };
}

function detectFloors(prompt) {
  const text = cleanText(prompt);

  if (
    text.includes("double") ||
    text.includes("2 floor") ||
    text.includes("two floor") ||
    text.includes("first floor") ||
    text.includes("ground plus one") ||
    text.includes("g+1")
  ) {
    return 2;
  }

  if (
    text.includes("triple") ||
    text.includes("3 floor") ||
    text.includes("three floor") ||
    text.includes("g+2")
  ) {
    return 3;
  }

  return 1;
}

function isEmptyPlot(prompt) {
  const text = cleanText(prompt);

  return (
    text.includes("empty") ||
    text.includes("blank") ||
    text.includes("plot only") ||
    text.includes("only plot") ||
    text.includes("boundary only") ||
    text.includes("no room") ||
    text.includes("without rooms")
  );
}

function hasWord(prompt, words) {
  const text = cleanText(prompt);
  return words.some((word) => text.includes(word));
}

function colorByType(type) {
  const map = {
    bedroom: "#fae8ff",
    bathroom: "#ccfbf1",
    kitchen: "#dcfce7",
    drawing: "#e0e7ff",
    living: "#fef3c7",
    lounge: "#fef3c7",
    parking: "#dbeafe",
    terrace: "#bfdbfe",
    store: "#f3f4f6",
    laundry: "#e0f2fe",
    office: "#dbeafe",
    shop: "#fde68a",
    lobby: "#e0f2fe",
    room: "#e0e7ff"
  };

  return map[type] || "#e0e7ff";
}

function makeRoom(name, type, floor, x, y, width, height, scale) {
  return {
    id: uuidv4(),
    name,
    type,
    floor,
    x: x * scale,
    y: y * scale,
    width: width * scale,
    height: height * scale,
    color: colorByType(type),
    wallThickness: 6,
    layer: "architecture",
    locked: false
  };
}

function makeDoor(room, scale) {
  return {
    id: uuidv4(),
    roomId: room.id,
    floor: room.floor,
    x: room.x + room.width / 2 - 18,
    y: room.y + room.height - 8,
    width: 36,
    height: 8,
    type: "door",
    label: "Door",
    layer: "openings"
  };
}

function makeWindow(room) {
  return {
    id: uuidv4(),
    roomId: room.id,
    floor: room.floor,
    x: room.x + room.width - 8,
    y: room.y + room.height / 2 - 22,
    width: 8,
    height: 44,
    type: "window",
    label: "Window",
    layer: "openings"
  };
}

function makeStair(room) {
  return {
    id: uuidv4(),
    floor: room.floor,
    x: room.x,
    y: room.y,
    width: room.width,
    height: room.height,
    type: "straight-stair",
    name: "Stairs",
    layer: "stairs"
  };
}

function makeOuterWalls(width, length, scale, floor = 0) {
  return [
    {
      id: uuidv4(),
      floor,
      x: 0,
      y: 0,
      width: width * scale,
      height: 0,
      thickness: 10,
      type: "wall",
      layer: "walls"
    },
    {
      id: uuidv4(),
      floor,
      x: width * scale,
      y: 0,
      width: 0,
      height: length * scale,
      thickness: 10,
      type: "wall",
      layer: "walls"
    },
    {
      id: uuidv4(),
      floor,
      x: 0,
      y: length * scale,
      width: width * scale,
      height: 0,
      thickness: 10,
      type: "wall",
      layer: "walls"
    },
    {
      id: uuidv4(),
      floor,
      x: 0,
      y: 0,
      width: 0,
      height: length * scale,
      thickness: 10,
      type: "wall",
      layer: "walls"
    }
  ];
}

function makeDimensions(width, length, scale, floor = 0) {
  return [
    {
      id: uuidv4(),
      floor,
      x: 0,
      y: -28,
      width: width * scale,
      height: 0,
      label: `${width} ft`,
      layer: "dimensions"
    },
    {
      id: uuidv4(),
      floor,
      x: -34,
      y: 0,
      width: 0,
      height: length * scale,
      label: `${length} ft`,
      layer: "dimensions"
    }
  ];
}

function makeBasePlan(prompt) {
  const plot = parsePlotSize(prompt);
  const floors = detectFloors(prompt);
  const scale = 12;

  return {
    id: uuidv4(),
    title: `NexaCAD ${plot.width}x${plot.length} Concept`,
    prompt,
    plot,
    floors,
    scale,
    canvas: {
      width: Math.max(720, plot.width * scale),
      height: Math.max(640, plot.length * scale)
    },
    rooms: [],
    doors: [],
    windows: [],
    stairs: [],
    walls: [],
    dimensions: [],
    texts: [],
    facade: {
      enabled: true,
      style: "modern",
      color: "#dbeafe",
      accent: "#38bdf8"
    },
    projectInfo: {
      clientName: "",
      clientPhone: "",
      projectLocation: "",
      preparedBy: "NexaCAD AI Pro",
      drawingStatus: "Concept Drawing",
      projectNotes: "AI-generated concept drawing. Verify by licensed architect/engineer before construction."
    },
    layers: [
      { id: "architecture", name: "Architecture", visible: true, locked: false },
      { id: "walls", name: "Walls", visible: true, locked: false },
      { id: "openings", name: "Doors & Windows", visible: true, locked: false },
      { id: "stairs", name: "Stairs", visible: true, locked: false },
      { id: "dimensions", name: "Dimensions", visible: true, locked: false },
      { id: "text", name: "Text Labels", visible: true, locked: false },
      { id: "facade", name: "Façade Concept", visible: true, locked: false }
    ],
    updatedAt: new Date().toISOString()
  };
}

function createEmptyPlot(prompt) {
  const plan = makeBasePlan(prompt);

  for (let floor = 0; floor < plan.floors; floor += 1) {
    plan.walls.push(...makeOuterWalls(plan.plot.width, plan.plot.length, plan.scale, floor));
    plan.dimensions.push(...makeDimensions(plan.plot.width, plan.plot.length, plan.scale, floor));
  }

  plan.texts.push({
    id: uuidv4(),
    floor: 0,
    x: 16,
    y: 20,
    text: `Empty ${plan.plot.width} x ${plan.plot.length} plot`,
    fontSize: 18,
    fontStyle: "bold",
    color: "#0f172a",
    layer: "text"
  });

  plan.estimate = calculateEstimate(plan);
  return plan;
}

function addStandardHouseRooms(plan, prompt) {
  const scale = plan.scale;
  const width = plan.plot.width;
  const length = plan.plot.length;

  const isLuxury = hasWord(prompt, ["luxury", "villa", "premium", "mansion"]);
  const isCommercial = hasWord(prompt, ["commercial", "plaza", "shop", "shops", "office", "offices"]);
  const bedroomsMatch = cleanText(prompt).match(/(\d+)\s*(bed|bedroom|bedrooms)/);
  const bedroomCount = bedroomsMatch ? Number(bedroomsMatch[1]) : isLuxury ? 5 : 3;

  if (isCommercial) {
    const shopW = Math.max(8, Math.floor(width / 3) - 1);

    plan.rooms.push(
      makeRoom("Shop 1", "shop", 0, 1, 1, shopW, 16, scale),
      makeRoom("Shop 2", "shop", 0, shopW + 2, 1, shopW, 16, scale),
      makeRoom("Shop 3", "shop", 0, shopW * 2 + 3, 1, shopW, 16, scale),
      makeRoom("Lobby", "lobby", 0, 1, 19, Math.max(12, width - 12), 12, scale),
      makeRoom("Washroom", "bathroom", 0, width - 8, 19, 7, 8, scale),
      makeRoom("Stairs", "stairs", 0, width - 10, 30, 9, 14, scale)
    );

    if (plan.floors > 1) {
      plan.rooms.push(
        makeRoom("Office Hall", "office", 1, 1, 1, width - 2, 20, scale),
        makeRoom("Office 1", "office", 1, 1, 23, Math.max(10, Math.floor(width / 2) - 2), 12, scale),
        makeRoom("Office 2", "office", 1, Math.floor(width / 2), 23, Math.max(10, Math.floor(width / 2) - 2), 12, scale),
        makeRoom("Washroom", "bathroom", 1, width - 8, 37, 7, 8, scale)
      );
    }

    return;
  }

  plan.rooms.push(
    makeRoom("Car Porch", "parking", 0, 1, 1, Math.min(14, width - 2), 15, scale),
    makeRoom("Drawing Room", "drawing", 0, Math.max(1, width - 14), 1, Math.min(13, width - 2), 13, scale),
    makeRoom("Kitchen", "kitchen", 0, 1, 18, Math.min(11, width - 2), 11, scale),
    makeRoom("Living Lounge", "living", 0, Math.max(12, Math.floor(width / 2) - 2), 17, Math.min(16, width - 14), 14, scale),
    makeRoom("Bath", "bathroom", 0, 1, 32, 7, 8, scale),
    makeRoom("Stairs", "stairs", 0, Math.max(10, width - 10), 32, 8, 13, scale)
  );

  if (bedroomCount >= 1) {
    plan.rooms.push(makeRoom("Bedroom 1", "bedroom", 0, 1, 42, Math.min(12, width - 2), 13, scale));
  }

  if (plan.floors > 1) {
    plan.rooms.push(
      makeRoom("Master Bedroom", "bedroom", 1, 1, 1, Math.min(13, width - 2), 14, scale),
      makeRoom("Bedroom 2", "bedroom", 1, Math.max(14, Math.floor(width / 2)), 1, Math.min(12, width - 15), 13, scale),
      makeRoom("Family Lounge", "living", 1, Math.max(12, Math.floor(width / 2) - 2), 17, Math.min(16, width - 14), 13, scale),
      makeRoom("Terrace", "terrace", 1, 1, Math.max(34, Math.floor(length * 0.58)), Math.max(12, width - 4), 11, scale)
    );

    if (bedroomCount >= 4) {
      plan.rooms.push(makeRoom("Bedroom 3", "bedroom", 1, 1, 17, Math.min(12, width - 2), 13, scale));
    }

    if (bedroomCount >= 5) {
      plan.rooms.push(makeRoom("Bedroom 4", "bedroom", 1, 1, 31, Math.min(12, width - 2), 12, scale));
    }
  } else {
    if (bedroomCount >= 2) {
      plan.rooms.push(makeRoom("Bedroom 2", "bedroom", 0, Math.max(14, Math.floor(width / 2)), 42, Math.min(12, width - 15), 13, scale));
    }

    if (bedroomCount >= 3) {
      plan.rooms.push(makeRoom("Bedroom 3", "bedroom", 0, 1, Math.max(50, length - 14), Math.min(12, width - 2), 12, scale));
    }
  }

  if (hasWord(prompt, ["store", "storage"])) {
    plan.rooms.push(makeRoom("Store", "store", 0, Math.max(1, width - 8), Math.max(45, length - 12), 7, 7, scale));
  }

  if (hasWord(prompt, ["laundry", "washing"])) {
    plan.rooms.push(makeRoom("Laundry", "laundry", 0, Math.max(1, width - 9), Math.max(36, length - 20), 8, 8, scale));
  }
}

function finalizeObjects(plan) {
  for (let floor = 0; floor < plan.floors; floor += 1) {
    plan.walls.push(...makeOuterWalls(plan.plot.width, plan.plot.length, plan.scale, floor));
    plan.dimensions.push(...makeDimensions(plan.plot.width, plan.plot.length, plan.scale, floor));
  }

  plan.rooms.forEach((room) => {
    if (room.type === "stairs") {
      plan.stairs.push(makeStair(room));
      return;
    }

    if (!["terrace", "parking"].includes(room.type)) {
      plan.doors.push(makeDoor(room, plan.scale));
    }

    if (!["bathroom", "store", "laundry"].includes(room.type)) {
      plan.windows.push(makeWindow(room));
    }
  });

  plan.rooms = plan.rooms.filter((room) => room.type !== "stairs");

  plan.texts.push({
    id: uuidv4(),
    floor: 0,
    x: 16,
    y: plan.plot.length * plan.scale - 35,
    text: "Modern Front Elevation Concept",
    fontSize: 16,
    fontStyle: "bold",
    color: "#0f172a",
    layer: "text"
  });

  plan.estimate = calculateEstimate(plan);
  return plan;
}

export function generatePlanFromPrompt(prompt) {
  const userPrompt = String(prompt || "").trim() || "Create a 30x60 house plan";
  const plan = makeBasePlan(userPrompt);

  if (isEmptyPlot(userPrompt)) {
    return createEmptyPlot(userPrompt);
  }

  addStandardHouseRooms(plan, userPrompt);
  return finalizeObjects(plan);
}