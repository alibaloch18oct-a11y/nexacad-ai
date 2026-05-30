export function calculateEstimate(plan) {
  const scale = plan.scale || 12;
  const rooms = Array.isArray(plan.rooms) ? plan.rooms : [];
  const doors = Array.isArray(plan.doors) ? plan.doors : [];
  const windows = Array.isArray(plan.windows) ? plan.windows : [];

  const totalBuiltArea = rooms.reduce((sum, room) => {
    return sum + (room.width / scale) * (room.height / scale);
  }, 0);

  const totalWallLength = rooms.reduce((sum, room) => {
    const perimeterPx = room.width * 2 + room.height * 2;
    return sum + perimeterPx / scale;
  }, 0);

  const brickEstimate = Math.round(totalWallLength * 9 * 55);
  const cementBags = Math.round(totalBuiltArea / 35);
  const sandCft = Math.round(totalBuiltArea * 1.1);
  const steelKg = Math.round(totalBuiltArea * 3.25);
  const tileSqft = Math.round(totalBuiltArea * 0.8);
  const paintSqft = Math.round(totalWallLength * 9);

  const lowRate = 3500;
  const midRate = 4500;
  const highRate = 6000;

  return {
    totalBuiltArea: Math.round(totalBuiltArea),
    totalWallLength: Math.round(totalWallLength),
    doorsCount: doors.length,
    windowsCount: windows.length,
    materials: {
      bricks: brickEstimate,
      cementBags,
      sandCft,
      steelKg,
      tileSqft,
      paintSqft
    },
    cost: {
      currency: "PKR",
      low: Math.round(totalBuiltArea * lowRate),
      medium: Math.round(totalBuiltArea * midRate),
      high: Math.round(totalBuiltArea * highRate)
    },
    note:
      "This is a concept-level AI estimate. Final BOQ must be verified by a professional architect, engineer, and local market rates."
  };
}