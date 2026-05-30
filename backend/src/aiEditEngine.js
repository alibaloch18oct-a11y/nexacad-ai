import { v4 as uuidv4 } from "uuid";
import { calculateEstimate } from "./estimateEngine.js";

function cleanText(value) {
  return String(value || "").toLowerCase().trim();
}

function includesAny(text, words) {
  const clean = cleanText(text);
  return words.some((word) => clean.includes(word));
}

function ensureArrays(plan) {
  return {
    ...plan,
    rooms: Array.isArray(plan.rooms) ? plan.rooms : [],
    doors: Array.isArray(plan.doors) ? plan.doors : [],
    windows: Array.isArray(plan.windows) ? plan.windows : [],
    stairs: Array.isArray(plan.stairs) ? plan.stairs : [],
    walls: Array.isArray(plan.walls) ? plan.walls : [],
    dimensions: Array.isArray(plan.dimensions) ? plan.dimensions : [],
    texts: Array.isArray(plan.texts) ? plan.texts : []
  };
}

function getScale(plan) {
  return plan.scale || 12;
}

function getActiveFloor(command) {
  const clean = cleanText(command);

  if (
    clean.includes("first floor") ||
    clean.includes("1st floor") ||
    clean.includes("upper floor")
  ) {
    return 1;
  }

  if (
    clean.includes("second floor") ||
    clean.includes("2nd floor")
  ) {
    return 2;
  }

  return 0;
}

function findRoom(plan, command) {
  const clean = cleanText(command);

  const priorityNames = [
    "master bedroom",
    "master",
    "bedroom",
    "kitchen",
    "lounge",
    "living",
    "drawing",
    "bathroom",
    "bath",
    "store",
    "laundry",
    "terrace",
    "parking",
    "porch"
  ];

  const matchedName = priorityNames.find((name) => clean.includes(name));

  if (matchedName) {
    return plan.rooms.find((room) => {
      const roomName = cleanText(room.name);
      const roomType = cleanText(room.type);

      if (matchedName === "bath") {
        return roomName.includes("bath") || roomType.includes("bathroom");
      }

      if (matchedName === "porch") {
        return roomName.includes("porch") || roomType.includes("parking");
      }

      return roomName.includes(matchedName) || roomType.includes(matchedName);
    });
  }

  return plan.rooms[0] || null;
}

function getColorByType(type) {
  const map = {
    bedroom: "#fae8ff",
    bathroom: "#ccfbf1",
    kitchen: "#dcfce7",
    living: "#fef3c7",
    lounge: "#fef3c7",
    drawing: "#e0e7ff",
    store: "#f3f4f6",
    laundry: "#e0f2fe",
    terrace: "#bfdbfe",
    parking: "#dbeafe",
    room: "#e0e7ff"
  };

  return map[type] || "#e0e7ff";
}

function detectRoomType(command) {
  const clean = cleanText(command);

  if (clean.includes("bedroom") || clean.includes("bed room")) return "bedroom";
  if (clean.includes("bathroom") || clean.includes("bath")) return "bathroom";
  if (clean.includes("kitchen")) return "kitchen";
  if (clean.includes("drawing")) return "drawing";
  if (clean.includes("lounge") || clean.includes("living")) return "living";
  if (clean.includes("store") || clean.includes("storage")) return "store";
  if (clean.includes("laundry") || clean.includes("washing")) return "laundry";
  if (clean.includes("terrace") || clean.includes("balcony")) return "terrace";
  if (clean.includes("parking") || clean.includes("porch") || clean.includes("garage")) return "parking";

  return "room";
}

function roomNameFromType(type) {
  const names = {
    bedroom: "New Bedroom",
    bathroom: "New Bathroom",
    kitchen: "New Kitchen",
    drawing: "Drawing Room",
    living: "Living Lounge",
    store: "Store Room",
    laundry: "Laundry",
    terrace: "Terrace",
    parking: "Car Porch",
    room: "New Room"
  };

  return names[type] || "New Room";
}

function createRoom(plan, command) {
  const scale = getScale(plan);
  const floor = getActiveFloor(command);
  const type = detectRoomType(command);
  const countSameType = plan.rooms.filter(
    (room) => cleanText(room.type) === type && room.floor === floor
  ).length;

  const widthFt =
    type === "bathroom" ? 7 :
    type === "store" ? 7 :
    type === "laundry" ? 8 :
    type === "parking" ? 14 :
    type === "terrace" ? 12 :
    12;

  const heightFt =
    type === "bathroom" ? 8 :
    type === "store" ? 7 :
    type === "laundry" ? 8 :
    type === "parking" ? 16 :
    type === "terrace" ? 12 :
    12;

  const x = 36 + (countSameType % 3) * 150;
  const y = 36 + Math.floor(countSameType / 3) * 150;

  return {
    id: uuidv4(),
    name: countSameType > 0 ? `${roomNameFromType(type)} ${countSameType + 1}` : roomNameFromType(type),
    type,
    floor,
    x,
    y,
    width: widthFt * scale,
    height: heightFt * scale,
    color: getColorByType(type),
    wallThickness: 6,
    layer: "architecture",
    locked: false
  };
}

function addDoorForRoom(plan, room) {
  plan.doors.push({
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
  });
}

function addWindowForRoom(plan, room) {
  plan.windows.push({
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
  });
}

function addWall(plan, command) {
  const floor = getActiveFloor(command);

  plan.walls.push({
    id: uuidv4(),
    floor,
    x: 60,
    y: 60,
    width: 160,
    height: 0,
    thickness: 8,
    type: "wall",
    layer: "walls"
  });
}

function addDimension(plan, command) {
  const floor = getActiveFloor(command);

  plan.dimensions.push({
    id: uuidv4(),
    floor,
    x: 80,
    y: 80,
    width: 120,
    height: 0,
    label: `${Math.round(120 / getScale(plan))} ft`,
    layer: "dimensions"
  });
}

function addText(plan, command) {
  const floor = getActiveFloor(command);

  const clean = cleanText(command);
  let textValue = "New Note";

  const quoteMatch = String(command).match(/["']([^"']+)["']/);
  if (quoteMatch) {
    textValue = quoteMatch[1];
  } else if (clean.includes("front elevation")) {
    textValue = "Modern Front Elevation Concept";
  } else if (clean.includes("note")) {
    textValue = "Client Review Note";
  }

  plan.texts.push({
    id: uuidv4(),
    floor,
    x: 90,
    y: 90,
    text: textValue,
    fontSize: 16,
    fontStyle: "bold",
    color: "#0f172a",
    layer: "text"
  });
}

function removeRoom(plan, command) {
  const target = findRoom(plan, command);
  if (!target) return false;

  plan.rooms = plan.rooms.filter((room) => room.id !== target.id);
  plan.doors = plan.doors.filter((door) => door.roomId !== target.id);
  plan.windows = plan.windows.filter((windowItem) => windowItem.roomId !== target.id);

  return true;
}

function renameRoom(plan, command) {
  const target = findRoom(plan, command);
  if (!target) return false;

  const quoteMatch = String(command).match(/["']([^"']+)["']/);

  if (quoteMatch) {
    target.name = quoteMatch[1];
    return true;
  }

  if (cleanText(command).includes("master bedroom")) {
    target.name = "Master Bedroom";
    target.type = "bedroom";
    return true;
  }

  return false;
}

function resizeRoom(plan, command, direction) {
  const target = findRoom(plan, command);
  if (!target) return false;

  const scale = getScale(plan);
  const amountW = direction === "bigger" ? 4 * scale : -3 * scale;
  const amountH = direction === "bigger" ? 3 * scale : -2 * scale;

  target.width = Math.max(6 * scale, target.width + amountW);
  target.height = Math.max(6 * scale, target.height + amountH);

  return true;
}

function moveRoom(plan, command) {
  const target = findRoom(plan, command);
  if (!target) return false;

  const clean = cleanText(command);
  const scale = getScale(plan);
  const canvasWidth = plan.canvas?.width || 360;
  const canvasHeight = plan.canvas?.height || 720;

  if (clean.includes("back") || clean.includes("rear")) {
    target.y = Math.max(24, canvasHeight - target.height - 36);
    return true;
  }

  if (clean.includes("front")) {
    target.y = 36;
    return true;
  }

  if (clean.includes("left")) {
    target.x = 36;
    return true;
  }

  if (clean.includes("right")) {
    target.x = Math.max(24, canvasWidth - target.width - 36);
    return true;
  }

  if (clean.includes("up")) {
    target.y = Math.max(24, target.y - 4 * scale);
    return true;
  }

  if (clean.includes("down")) {
    target.y = Math.min(canvasHeight - target.height - 24, target.y + 4 * scale);
    return true;
  }

  return false;
}

function updateProjectInfo(plan, command) {
  const clean = cleanText(command);

  plan.projectInfo = plan.projectInfo || {
    clientName: "",
    clientPhone: "",
    projectLocation: "",
    preparedBy: "NexaCAD AI Pro",
    drawingStatus: "Concept Drawing",
    projectNotes: ""
  };

  const quoteMatch = String(command).match(/["']([^"']+)["']/);

  if (clean.includes("client name") && quoteMatch) {
    plan.projectInfo.clientName = quoteMatch[1];
    return true;
  }

  if (clean.includes("project location") && quoteMatch) {
    plan.projectInfo.projectLocation = quoteMatch[1];
    return true;
  }

  if (clean.includes("prepared by") && quoteMatch) {
    plan.projectInfo.preparedBy = quoteMatch[1];
    return true;
  }

  if (clean.includes("note") && quoteMatch) {
    plan.projectInfo.projectNotes = quoteMatch[1];
    return true;
  }

  return false;
}

export function editPlanWithCommand(plan, command) {
  const updated = ensureArrays(JSON.parse(JSON.stringify(plan)));
  const clean = cleanText(command);

  if (!updated.projectInfo) {
    updated.projectInfo = {
      clientName: "",
      clientPhone: "",
      projectLocation: "",
      preparedBy: "NexaCAD AI Pro",
      drawingStatus: "Concept Drawing",
      projectNotes: ""
    };
  }

  let actionTaken = false;

  if (includesAny(clean, ["client name", "project location", "prepared by", "project note"])) {
    actionTaken = updateProjectInfo(updated, command) || actionTaken;
  }

  if (includesAny(clean, ["add room", "add bedroom", "add bathroom", "add bath", "add kitchen", "add store", "add laundry", "add terrace", "add parking", "add porch", "add drawing", "add lounge"])) {
    const item = createRoom(updated, command);
    updated.rooms.push(item);

    if (!["terrace", "parking"].includes(item.type)) {
      addDoorForRoom(updated, item);
    }

    if (!["bathroom", "store", "laundry"].includes(item.type)) {
      addWindowForRoom(updated, item);
    }

    actionTaken = true;
  }

  if (includesAny(clean, ["remove room", "delete room", "remove bedroom", "delete bedroom", "remove bathroom", "delete bathroom", "remove kitchen", "delete kitchen", "remove store", "delete store"])) {
    actionTaken = removeRoom(updated, command) || actionTaken;
  }

  if (includesAny(clean, ["rename", "call this", "change name"])) {
    actionTaken = renameRoom(updated, command) || actionTaken;
  }

  if (includesAny(clean, ["make", "bigger", "increase", "larger", "wide", "wider"])) {
    actionTaken = resizeRoom(updated, command, "bigger") || actionTaken;
  }

  if (includesAny(clean, ["smaller", "decrease", "reduce", "less size"])) {
    actionTaken = resizeRoom(updated, command, "smaller") || actionTaken;
  }

  if (includesAny(clean, ["move", "shift"])) {
    actionTaken = moveRoom(updated, command) || actionTaken;
  }

  if (includesAny(clean, ["add wall", "draw wall", "new wall"])) {
    addWall(updated, command);
    actionTaken = true;
  }

  if (includesAny(clean, ["add dimension", "add measurement", "draw dimension", "measure"])) {
    addDimension(updated, command);
    actionTaken = true;
  }

  if (includesAny(clean, ["add text", "add label", "add note", "front elevation note"])) {
    addText(updated, command);
    actionTaken = true;
  }

  if (includesAny(clean, ["add door", "new door"])) {
    const target = findRoom(updated, command) || updated.rooms[0];

    if (target) {
      addDoorForRoom(updated, target);
      actionTaken = true;
    }
  }

  if (includesAny(clean, ["add window", "new window"])) {
    const target = findRoom(updated, command) || updated.rooms[0];

    if (target) {
      addWindowForRoom(updated, target);
      actionTaken = true;
    }
  }

  if (includesAny(clean, ["move stairs right", "stairs on right", "shift stairs right"])) {
    updated.stairs = updated.stairs.map((stair) => ({
      ...stair,
      x: (updated.canvas?.width || 360) - stair.width - 36
    }));

    actionTaken = true;
  }

  if (!actionTaken) {
    addText(updated, `Add note "AI command received: ${command}"`);
  }

  updated.estimate = calculateEstimate(updated);
  updated.updatedAt = new Date().toISOString();

  return updated;
}