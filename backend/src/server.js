import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generatePlanFromPrompt } from "./aiPlanner.js";
import { editPlanWithCommand } from "./aiEditEngine.js";
import {
  ensureStore,
  readProjects,
  upsertProject,
  deleteProject,
  findProject
} from "./projectStore.js";
import { createDXF } from "./dxfExporter.js";

dotenv.config();
ensureStore();

const app = express();
const PORT = process.env.PORT || 5100;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://nexacad-ai.vercel.app",
      "https://nexacad-ai-3jwi.vercel.app"
    ],
    credentials: true
  })
);

app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    app: "NexaCAD AI Pro Backend",
    message: "Backend is running. Use /api/health."
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "NexaCAD AI Pro",
    status: "online",
    version: "1.0.0",
    routes: [
      "GET /api/health",
      "GET /api/projects",
      "POST /api/projects",
      "POST /api/ai/generate-plan",
      "POST /api/ai/edit-plan",
      "POST /api/export/dxf"
    ],
    time: new Date().toISOString()
  });
});

app.get("/api/projects", (req, res) => {
  const projects = readProjects();

  res.json({
    ok: true,
    projects
  });
});

app.post("/api/projects", (req, res) => {
  const { project } = req.body;

  if (!project || !project.id) {
    return res.status(400).json({
      ok: false,
      message: "Invalid project."
    });
  }

  const saved = upsertProject(project);

  res.json({
    ok: true,
    project: saved
  });
});

app.get("/api/projects/:id", (req, res) => {
  const project = findProject(req.params.id);

  if (!project) {
    return res.status(404).json({
      ok: false,
      message: "Project not found."
    });
  }

  res.json({
    ok: true,
    project
  });
});

app.delete("/api/projects/:id", (req, res) => {
  deleteProject(req.params.id);

  res.json({
    ok: true
  });
});

app.post("/api/ai/generate-plan", (req, res) => {
  try {
    const { prompt } = req.body;
    const plan = generatePlanFromPrompt(prompt);

    res.json({
      ok: true,
      plan
    });
  } catch (error) {
    console.error("Generate plan error:", error);

    res.status(500).json({
      ok: false,
      message: "Plan generation failed"
    });
  }
});

app.post("/api/ai/edit-plan", (req, res) => {
  const { plan, command } = req.body;

  if (!plan || !command) {
    return res.status(400).json({
      ok: false,
      message: "Plan and command are required."
    });
  }

  const updatedPlan = editPlanWithCommand(plan, command);

  res.json({
    ok: true,
    plan: updatedPlan
  });
});

app.post("/api/export/dxf", (req, res) => {
  const { plan } = req.body;

  if (!plan) {
    return res.status(400).json({
      ok: false,
      message: "Plan is required."
    });
  }

  const dxf = createDXF(plan);

  res.setHeader("Content-Type", "application/dxf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${plan.title || "nexacad-plan"}.dxf"`
  );

  res.send(dxf);
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`NexaCAD AI backend running on port ${PORT}`);
});