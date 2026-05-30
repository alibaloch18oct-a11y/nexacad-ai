const fs = require("fs");

const file = "D:\\ShazeeProjects\\nexacad-ai\\frontend\\src\\App.jsx";
const backup = `${file}.phase17C-backup-${Date.now()}`;
fs.copyFileSync(file, backup);
console.log("Backup:", backup);

let code = fs.readFileSync(file, "utf8");

if (!code.includes('from "./utils/proposalPdf.js"')) {
  const importLine = `import { downloadClientProposalPdf } from "./utils/proposalPdf.js";\n`;
  const lastImportMatch = [...code.matchAll(/^import .*;$/gm)].pop();

  if (lastImportMatch) {
    const index = lastImportMatch.index + lastImportMatch[0].length;
    code = code.slice(0, index) + "\n" + importLine + code.slice(index);
    console.log("Added PDF import");
  }
}

if (!code.includes('data-export-button="proposal-pdf"')) {
  const button = `
                <button
                  data-export-button="proposal-pdf"
                  className="view-toggle proposal-pdf-btn"
                  onClick={() => downloadClientProposalPdf(plan)}
                  disabled={!plan}
                >
                  Client PDF
                </button>
`;

  const boqClose = `                  BOQ CSV
                </button>`;

  if (code.includes(boqClose)) {
    code = code.replace(boqClose, `${boqClose}\n${button}`);
    console.log("Inserted Client PDF button after BOQ CSV");
  } else {
    const zoomText = `Zoom: {Math.round(zoom * 100)}%`;
    code = code.replace(zoomText, `${button}\n                ${zoomText}`);
    console.log("Inserted Client PDF button before zoom");
  }
}

fs.writeFileSync(file, code, "utf8");
console.log("Updated:", file);