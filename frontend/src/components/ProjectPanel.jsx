import React from "react";
import { FolderOpen, Trash2 } from "lucide-react";

export default function ProjectPanel({ projects, onLoadProject, onDeleteProject }) {
  return (
    <section className="project-panel">
      <div className="panel-heading">
        <FolderOpen size={18} />
        <span>Saved Projects</span>
      </div>

      {projects.length === 0 ? (
        <p className="muted">No saved projects yet.</p>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <div className="project-card" key={project.id}>
              <button onClick={() => onLoadProject(project)}>
                <strong>{project.title}</strong>
                <span>
                  {project.plot?.width}x{project.plot?.length} • {project.floors} floor
                  {project.floors > 1 ? "s" : ""}
                </span>
              </button>

              <button
                className="danger-small"
                onClick={() => onDeleteProject(project.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
