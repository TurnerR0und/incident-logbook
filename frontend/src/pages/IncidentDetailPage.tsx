import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getIncident,
  updateIncident,
  listComments,
  addComment,
} from "../api/incidents";
import type { Incident, Comment } from "../types";
import { IncidentStatus, IncidentSeverity } from "../types";

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<IncidentStatus>(IncidentStatus.OPEN);
  const [editSeverity, setEditSeverity] = useState<IncidentSeverity>(IncidentSeverity.MEDIUM);
  const [editRootCause, setEditRootCause] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Comment state
  const [commentBody, setCommentBody] = useState("");
  const [commenting, setCommenting] = useState(false);

  const isClosed = incident?.status === IncidentStatus.CLOSED;

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [inc, cmts] = await Promise.all([
        getIncident(id),
        listComments(id),
      ]);
      setIncident(inc);
      setComments(cmts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function startEditing() {
    if (!incident) return;
    setEditTitle(incident.title);
    setEditDescription(incident.description);
    setEditStatus(incident.status);
    setEditSeverity(incident.severity);
    setEditRootCause(incident.root_cause ?? "");
    setSaveError("");
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!incident || !id) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateIncident(id, {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        severity: editSeverity,
        root_cause: editRootCause || undefined,
      });
      setIncident(updated);
      setEditing(false);
      // Refresh comments in case system events were created
      const cmts = await listComments(id);
      setComments(cmts);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!id || !commentBody.trim()) return;
    setCommenting(true);
    try {
      const newComment = await addComment(id, commentBody.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentBody("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setCommenting(false);
    }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isSystemComment(body: string): boolean {
    return body.startsWith("System:");
  }

  if (loading) {
    return <div style={styles.center}>Loading incident...</div>;
  }

  if (error || !incident) {
    return (
      <div style={styles.center}>
        <div className="error-msg">{error || "Incident not found"}</div>
        <button className="btn" onClick={() => navigate("/")} style={{ marginTop: "1rem" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button className="btn btn-sm" onClick={() => navigate("/")} style={{ marginBottom: "1rem" }}>
        &larr; Back
      </button>

      {isClosed && (
        <div style={styles.readOnlyBanner}>
          This incident is CLOSED and read-only. No further edits are allowed.
        </div>
      )}

      {/* Overview Section */}
      <div style={styles.card}>
        {editing ? (
          <form onSubmit={handleSave} style={styles.editForm}>
            {saveError && <div className="error-msg">{saveError}</div>}

            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Status</label>
                <select className="form-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}>
                  {Object.values(IncidentStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Severity</label>
                <select className="form-input" value={editSeverity} onChange={(e) => setEditSeverity(e.target.value as IncidentSeverity)}>
                  {Object.values(IncidentSeverity).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Root Cause</label>
              <input className="form-input" value={editRootCause} onChange={(e) => setEditRootCause(e.target.value)} placeholder="If known" />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={styles.overviewHeader}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, flex: 1 }}>{incident.title}</h2>
              {!isClosed && (
                <button className="btn btn-sm" onClick={startEditing}>Edit</button>
              )}
            </div>

            <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 1rem" }}>
              {incident.description}
            </p>

            <div style={styles.metaGrid}>
              <div>
                <span style={styles.metaLabel}>Status</span>
                <span className={`badge badge-${incident.status.toLowerCase()}`}>{incident.status}</span>
              </div>
              <div>
                <span style={styles.metaLabel}>Severity</span>
                <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
              </div>
              <div>
                <span style={styles.metaLabel}>Created</span>
                <span style={styles.metaValue}>{formatDate(incident.created_at)}</span>
              </div>
              <div>
                <span style={styles.metaLabel}>Started</span>
                <span style={styles.metaValue}>{formatDate(incident.started_at)}</span>
              </div>
              <div>
                <span style={styles.metaLabel}>Resolved</span>
                <span style={styles.metaValue}>{formatDate(incident.resolved_at)}</span>
              </div>
              <div>
                <span style={styles.metaLabel}>Last Updated</span>
                <span style={styles.metaValue}>{formatDate(incident.updated_at)}</span>
              </div>
              {incident.root_cause && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={styles.metaLabel}>Root Cause</span>
                  <span style={styles.metaValue}>{incident.root_cause}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Timeline */}
      <div style={styles.card}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
          Timeline &amp; Audit Trail
        </h3>

        {comments.length === 0 && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            No comments yet.
          </p>
        )}

        <div style={styles.timeline}>
          {comments.map((c) => {
            const isSystem = isSystemComment(c.body);
            return (
              <div
                key={c.id}
                style={{
                  ...styles.commentCard,
                  ...(isSystem ? styles.systemComment : {}),
                }}
              >
                <div style={styles.commentHeader}>
                  <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>
                    {isSystem ? "System Event" : "Comment"}
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                    {formatDate(c.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{c.body}</p>
              </div>
            );
          })}
        </div>

        {/* Comment box */}
        {!isClosed ? (
          <form onSubmit={handleComment} style={styles.commentForm}>
            <textarea
              className="form-input"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={commenting || !commentBody.trim()}
              style={{ alignSelf: "flex-end" }}
            >
              {commenting ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "1rem", fontStyle: "italic" }}>
            Comments are disabled for closed incidents.
          </p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "1.5rem",
    maxWidth: 850,
    margin: "0 auto",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },
  readOnlyBanner: {
    padding: "0.6rem 1rem",
    background: "rgba(107, 114, 128, 0.15)",
    border: "1px solid rgba(107, 114, 128, 0.3)",
    borderRadius: 8,
    color: "var(--color-text-muted)",
    fontSize: "0.85rem",
    fontWeight: 500,
    marginBottom: "1rem",
    textAlign: "center" as const,
  },
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  overviewHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "0.75rem",
  },
  metaLabel: {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    color: "var(--color-text-muted)",
    marginBottom: "0.2rem",
  },
  metaValue: {
    fontSize: "0.9rem",
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  commentCard: {
    padding: "0.75rem 1rem",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
  },
  systemComment: {
    borderLeft: "3px solid var(--color-primary)",
    background: "rgba(79, 143, 247, 0.05)",
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.3rem",
  },
  commentForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginTop: "1rem",
  },
};
