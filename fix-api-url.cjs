const fs = require("fs");

const appFile = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src\\App.jsx";

let code = fs.readFileSync(appFile, "utf8");

const backup = `${appFile}.api-url-backup-${Date.now()}`;
fs.copyFileSync(appFile, backup);
console.log("Backup:", backup);

// Replace common wrong API URLs
code = code.replaceAll("http://localhost:5000", "${API_BASE}");
code = code.replaceAll("http://localhost:5100", "${API_BASE}");
code = code.replaceAll("https://nexacad-ai-3jwi.vercel.app", "${API_BASE}");

// Ensure API_BASE exists after imports
if (!code.includes("const API_BASE = import.meta.env.VITE_API_URL")) {
  const lastImport = [...code.matchAll(/^import .*;$/gm)].pop();

  if (lastImport) {
    const insertAt = lastImport.index + lastImport[0].length;
    code =
      code.slice(0, insertAt) +
      `\n\nconst API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5100";\n` +
      code.slice(insertAt);
  }
}

// Fix accidental string replacement syntax
code = code.replaceAll('"${API_BASE}', "`${API_BASE}");
code = code.replaceAll('${API_BASE}"', "${API_BASE}`");
code = code.replaceAll("'${API_BASE}", "`\${API_BASE}");
code = code.replaceAll("${API_BASE}'", "${API_BASE}`");

fs.writeFileSync(appFile, code, "utf8");

console.log("API URL patched. Now build and push.");