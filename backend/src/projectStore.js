import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve();
const DATA_DIR = path.join(ROOT_DIR, "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

export function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2));
  }
}

export function readProjects() {
  ensureStore();

  try {
    const raw = fs.readFileSync(PROJECTS_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export function writeProjects(projects) {
  ensureStore();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

export function upsertProject(project) {
  const projects = readProjects();
  const index = projects.findIndex((item) => item.id === project.id);

  const finalProject = {
    ...project,
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) {
    projects[index] = finalProject;
  } else {
    projects.unshift(finalProject);
  }

  writeProjects(projects);
  return finalProject;
}

export function deleteProject(projectId) {
  const projects = readProjects();
  const filtered = projects.filter((item) => item.id !== projectId);
  writeProjects(filtered);
  return true;
}

export function findProject(projectId) {
  return readProjects().find((item) => item.id === projectId) || null;
}