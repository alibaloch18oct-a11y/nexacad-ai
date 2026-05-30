const fs = require("fs");
const path = require("path");

const file = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src\\components\\CADCanvas.jsx";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Updated:", filePath);
}

function backup(filePath) {
  const backupFile = `${filePath}.final-fix-backup-${Date.now()}`;
  fs.copyFileSync(filePath, backupFile);
  console.log("Backup:", backupFile);
}

backup(file);

let code = read(file);

/* -------------------------------------------------------
   1) Fix duplicate safePlan keys
------------------------------------------------------- */

const duplicateKeys = [
  "curvedWalls",
  "furniture",
  "electrical",
  "plumbing"
];

duplicateKeys.forEach((key) => {
  const pattern = new RegExp(
    `(\\s*${key}: Array\\.isArray\\(plan\\.${key}\\) \\? plan\\.${key} : \\[\\],\\n)(?:\\s*${key}: Array\\.isArray\\(plan\\.${key}\\) \\? plan\\.${key} : \\[\\],\\n)+`,
    "g"
  );

  code = code.replace(pattern, "$1");
});

console.log("Fixed: duplicate safePlan keys");

/* -------------------------------------------------------
   2) Force CADCanvas props to include planMode + handlers
------------------------------------------------------- */

const functionStart = code.indexOf("export default function CADCanvas({");

if (functionStart === -1) {
  console.log("ERROR: Could not find CADCanvas function signature.");
  process.exit(1);
}

const propsStart = code.indexOf("{", functionStart) + 1;
const propsEnd = code.indexOf("}) {", propsStart);

if (propsEnd === -1) {
  console.log("ERROR: Could not find end of CADCanvas props.");
  process.exit(1);
}

let propsRaw = code.slice(propsStart, propsEnd);

function ensureProp(propText, searchText) {
  if (!propsRaw.includes(searchText)) {
    propsRaw = propsRaw.trimEnd();

    if (!propsRaw.endsWith(",")) {
      propsRaw += ",";
    }

    propsRaw += `\n  ${propText}`;
    console.log("Added prop:", propText);
  } else {
    console.log("OK prop:", searchText);
  }
}

ensureProp("onMoveFurniture = () => {},", "onMoveFurniture");
ensureProp("onMoveElectrical = () => {},", "onMoveElectrical");
ensureProp("onMovePlumbing = () => {},", "onMovePlumbing");
ensureProp('planMode = "architectural"', "planMode");

code = code.slice(0, propsStart) + propsRaw + code.slice(propsEnd);

/* -------------------------------------------------------
   3) Ensure safePlan arrays exist
------------------------------------------------------- */

function ensureSafePlanArray(key) {
  const line = `${key}: Array.isArray(plan.${key}) ? plan.${key} : [],`;

  if (!code.includes(line)) {
    code = code.replace(
      `walls: Array.isArray(plan.walls) ? plan.walls : [],`,
      `walls: Array.isArray(plan.walls) ? plan.walls : [],
      ${line}`
    );

    console.log("Added safePlan array:", key);
  } else {
    console.log("OK safePlan array:", key);
  }
}

ensureSafePlanArray("curvedWalls");
ensureSafePlanArray("furniture");
ensureSafePlanArray("electrical");
ensureSafePlanArray("plumbing");

/* -------------------------------------------------------
   4) Ensure local filtered lists exist
------------------------------------------------------- */

if (!code.includes("const furniture = (safePlan.furniture || [])")) {
  code = code.replace(
    `const walls = safePlan.walls.filter((wall) => wall.floor === activeFloor);`,
    `const walls = safePlan.walls.filter((wall) => wall.floor === activeFloor);
  const furniture = (safePlan.furniture || []).filter((item) => item.floor === activeFloor);
  const electrical = (safePlan.electrical || []).filter((item) => item.floor === activeFloor);
  const plumbing = (safePlan.plumbing || []).filter((item) => item.floor === activeFloor);`
  );

  console.log("Added furniture/electrical/plumbing local lists");
} else {
  console.log("OK local furniture list exists");

  if (!code.includes("const electrical = (safePlan.electrical || [])")) {
    code = code.replace(
      `const furniture = (safePlan.furniture || []).filter((item) => item.floor === activeFloor);`,
      `const furniture = (safePlan.furniture || []).filter((item) => item.floor === activeFloor);
  const electrical = (safePlan.electrical || []).filter((item) => item.floor === activeFloor);
  const plumbing = (safePlan.plumbing || []).filter((item) => item.floor === activeFloor);`
    );

    console.log("Added electrical/plumbing local lists");
  }
}

/* -------------------------------------------------------
   5) Fix possible broken replacements from previous scripts
------------------------------------------------------- */

code = code.replaceAll('(planMode || "architectural") ===', 'planMode ===');
code = code.replaceAll('(planMode || "architectural") !==', 'planMode !==');

write(file, code);

console.log("\nCADCanvas final repair complete.");
console.log("Now run:");
console.log("cd D:\\\\ShazeeProjects\\\\nexacad-ai\\\\frontend");
console.log("npm run build");