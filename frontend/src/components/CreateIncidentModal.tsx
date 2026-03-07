import { useState, type FormEvent } from "react";
import { createIncident } from "../api/incidents";
import { IncidentSeverity } from "../types";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateIncidentModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>(IncidentSeverity.MEDIUM);
  const [startedAt, setStartedAt] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createIncident({
        title,
        description,
        severity,
        ...(startedAt ? { started_at: new Date(startedAt).toISOString() } : {}),
        ...(rootCause ? { root_cause: rootCause } : {}),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create incident");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Report New Incident</h2>
          <button className="btn btn-sm" onClick={onClose}>X</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label>Title *</label>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief incident summary"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is happening? What is the impact?"
              required
            />
          </div>

          <div className="form-group">
            <label>Severity *</label>
            <select
              className="form-input"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
            >
              {Object.values(IncidentSeverity).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Started At (optional)</label>
            <input
              className="form-input"
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Root Cause (optional)</label>
            <input
              className="form-input"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="If known"
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "1rem",
  },
  modal: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    width: "100%",
    maxWidth: 520,
    maxHeight: "90vh",
    overflowY: "auto" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem",
    borderBottom: "1px solid var(--color-border)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1.25rem",
  },
};
