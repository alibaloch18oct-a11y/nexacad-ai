import React from "react";
import { Sparkles, Wand2 } from "lucide-react";

export default function AICommandPanel({
  prompt,
  setPrompt,
  onGenerate,
  aiCommand,
  setAiCommand,
  onEditPlan,
  loading,
  commandLoading
}) {
  return (
    <section className="ai-panel">
      <div className="panel-heading">
        <Sparkles size={18} />
        <span>AI Architect</span>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Create a 30x60 double-story house with 4 bedrooms..."
      />

      <button className="primary-btn" onClick={onGenerate} disabled={loading}>
        <Wand2 size={18} />
        {loading ? "Generating..." : "Generate Full Plan"}
      </button>

      <div className="mini-divider" />

      <div className="panel-heading">
        <Sparkles size={18} />
        <span>AI Edit Command</span>
      </div>

      <input
        value={aiCommand}
        onChange={(event) => setAiCommand(event.target.value)}
        placeholder="Example: move kitchen to back"
      />

      <button className="secondary-btn" onClick={onEditPlan} disabled={commandLoading}>
        <Wand2 size={18} />
        {commandLoading ? "Editing..." : "Apply AI Edit"}
      </button>
    </section>
  );
}
