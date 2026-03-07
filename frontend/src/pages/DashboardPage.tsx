import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listIncidents } from "../api/incidents";
import type { Incident, IncidentFilters } from "../types";
import { IncidentStatus, IncidentSeverity } from "../types";
import CreateIncidentModal from "../components/CreateIncidentModal";

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "">("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");

  const navigate = useNavigate();

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters: IncidentFilters = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (statusFilter) filters.status = statusFilter;
      if (severityFilter) filters.severity = severityFilter;
      if (createdAfter) filters.created_after = new Date(createdAfter).toISOString();
      if (createdBefore) filters.created_before = new Date(createdBefore).toISOString();

      const data = await listIncidents(filters);
      setIncidents(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, severityFilter, createdAfter, createdBefore]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  function handleFilterReset() {
    setStatusFilter("");
    setSeverityFilter("");
    setCreatedAfter("");
    setCreatedBefore("");
    setPage(0);
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <h2 style={styles.heading}>Incidents</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Report New Incident
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as IncidentStatus | ""); setPage(0); }}
        >
          <option value="">All Statuses</option>
          {Object.values(IncidentStatus).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="form-input"
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value as IncidentSeverity | ""); setPage(0); }}
        >
          <option value="">All Severities</option>
          {Object.values(IncidentSeverity).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          className="form-input"
          type="date"
          value={createdAfter}
          onChange={(e) => { setCreatedAfter(e.target.value); setPage(0); }}
          placeholder="Created after"
          title="Created after"
        />

        <input
          className="form-input"
          type="date"
          value={createdBefore}
          onChange={(e) => { setCreatedBefore(e.target.value); setPage(0); }}
          placeholder="Created before"
          title="Created before"
        />

        <button className="btn btn-sm" onClick={handleFilterReset}>
          Clear
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Severity</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={styles.empty}>Loading...</td>
              </tr>
            )}
            {!loading && incidents.length === 0 && (
              <tr>
                <td colSpan={4} style={styles.empty}>
                  No incidents found. Adjust your filters or report a new incident.
                </td>
              </tr>
            )}
            {!loading &&
              incidents.map((inc) => (
                <tr
                  key={inc.id}
                  style={styles.row}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                >
                  <td style={styles.td}>{inc.title}</td>
                  <td style={styles.td}>
                    <span className={`badge badge-${inc.status.toLowerCase()}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span className={`badge badge-${inc.severity.toLowerCase()}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    {formatDate(inc.created_at)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={styles.pagination}>
        <button
          className="btn btn-sm"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Page {page + 1}
        </span>
        <button
          className="btn btn-sm"
          disabled={!hasMore}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {showCreate && (
        <CreateIncidentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchIncidents();
          }}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "1.5rem",
    maxWidth: 1100,
    margin: "0 auto",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  heading: {
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  filters: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
    marginBottom: "1rem",
    alignItems: "center",
  },
  tableWrap: {
    overflowX: "auto" as const,
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-surface)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    textAlign: "left" as const,
    padding: "0.65rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    color: "var(--color-text-muted)",
    borderBottom: "1px solid var(--color-border)",
  },
  td: {
    padding: "0.65rem 1rem",
    borderBottom: "1px solid var(--color-border)",
  },
  row: {
    cursor: "pointer",
    transition: "background 0.1s",
  },
  empty: {
    padding: "2rem 1rem",
    textAlign: "center" as const,
    color: "var(--color-text-muted)",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "1rem",
  },
};
