import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FilterX,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';

import { incidentApi } from '../api/incidents';
import type { ListIncidentParams } from '../api/incidents';
import CreateIncidentModal from '../components/CreateIncidentModal';
import { useAuth } from '../context/AuthContext';
import type { Incident, IncidentSeverity, IncidentStatus } from '../types/incident';

const STATUS_OPTIONS: IncidentStatus[] = [
  'OPEN',
  'INVESTIGATING',
  'MITIGATED',
  'RESOLVED',
  'CLOSED',
];

const SEVERITY_OPTIONS: IncidentSeverity[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
];

function getSeverityColor(severity: IncidentSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-green-100 text-green-800 border-green-200';
  }
}

function getStatusColor(status: IncidentStatus) {
  switch (status) {
    case 'OPEN':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'INVESTIGATING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'MITIGATED':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'RESOLVED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getIncidentRowClass(status: IncidentStatus) {
  switch (status) {
    case 'OPEN':
      return 'bg-sky-50/80 hover:bg-sky-100/80';
    case 'INVESTIGATING':
      return 'bg-blue-50/70 hover:bg-blue-100/75';
    case 'MITIGATED':
      return 'bg-violet-50/55 hover:bg-violet-100/70';
    case 'RESOLVED':
      return 'bg-emerald-50/55 hover:bg-emerald-100/70';
    default:
      return 'bg-white hover:bg-slate-50';
  }
}

function getIncidentMarkerClass(status: IncidentStatus) {
  switch (status) {
    case 'OPEN':
      return 'bg-sky-500';
    case 'INVESTIGATING':
      return 'bg-blue-500';
    case 'MITIGATED':
      return 'bg-violet-500';
    case 'RESOLVED':
      return 'bg-emerald-500';
    default:
      return 'bg-slate-300';
  }
}

function truncateIncidentId(incidentId: string) {
  return `${incidentId.slice(0, 8)}...${incidentId.slice(-6)}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | ''>('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [copiedIncidentId, setCopiedIncidentId] = useState<string | null>(null);
  const deferredOwnerSearch = useDeferredValue(ownerSearch.trim());
  const isAdmin = currentUser?.is_admin ?? false;
  const hasInvalidDateRange =
    createdAfter !== '' && createdBefore !== '' && createdAfter > createdBefore;
  const hasActiveFilters = Boolean(
    statusFilter || severityFilter || ownerSearch.trim() || createdAfter || createdBefore,
  );
  const filterKey = [
    statusFilter,
    severityFilter,
    createdAfter,
    createdBefore,
    deferredOwnerSearch,
    isAdmin ? 'admin' : 'user',
  ].join('|');
  const previousFilterKeyRef = useRef(filterKey);
  const hasLoadedOnceRef = useRef(false);
  const requestSequenceRef = useRef(0);

  const fetchIncidents = useCallback(async () => {
    if (hasInvalidDateRange) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;

    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const params: ListIncidentParams = {};

      if (statusFilter) {
        params.status = statusFilter;
      }
      if (severityFilter) {
        params.severity = severityFilter;
      }
      if (isAdmin && deferredOwnerSearch) {
        params.owner_email = deferredOwnerSearch;
      }
      if (createdAfter) {
        params.created_after = `${createdAfter}T00:00:00Z`;
      }
      if (createdBefore) {
        params.created_before = `${createdBefore}T23:59:59.999Z`;
      }
      params.skip = page * pageSize;
      params.limit = pageSize;

      const data = await incidentApi.list(params);

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      hasLoadedOnceRef.current = true;
      setIncidents(data);
    } catch (error) {
      if (requestId !== requestSequenceRef.current) {
        return;
      }

      console.error('Failed to load incidents:', error);
    } finally {
      if (requestId === requestSequenceRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [
    createdAfter,
    createdBefore,
    deferredOwnerSearch,
    hasInvalidDateRange,
    isAdmin,
    page,
    pageSize,
    severityFilter,
    statusFilter,
  ]);

  useEffect(() => {
    const filtersChanged = previousFilterKeyRef.current !== filterKey;

    if (filtersChanged) {
      previousFilterKeyRef.current = filterKey;

      if (page !== 0) {
        setPage(0);
        return;
      }
    }

    fetchIncidents();
  }, [fetchIncidents, filterKey, page]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setSeverityFilter('');
    setCreatedAfter('');
    setCreatedBefore('');
    setOwnerSearch('');
    setPage(0);
  };

  const canGoToPreviousPage = page > 0 && !isRefreshing && !hasInvalidDateRange;
  const canGoToNextPage =
    incidents.length === pageSize && !isRefreshing && !hasInvalidDateRange;

  const handleCopyIncidentId = async (
    event: React.MouseEvent<HTMLButtonElement>,
    incidentId: string,
  ) => {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(incidentId);
      setCopiedIncidentId(incidentId);
      window.setTimeout(() => {
        setCopiedIncidentId((currentValue) =>
          currentValue === incidentId ? null : currentValue,
        );
      }, 1500);
    } catch (error) {
      console.error('Failed to copy incident ID:', error);
    }
  };

  const openCount = incidents.filter((incident) => incident.status === 'OPEN').length;
  const activeCount = incidents.filter((incident) => incident.status !== 'CLOSED').length;
  const criticalCount = incidents.filter((incident) => incident.severity === 'CRITICAL').length;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Incident Queue</h1>
              {isRefreshing && !isLoading && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Refreshing
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Active incidents stay highlighted so open work is easier to spot.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
              Open {openCount}
            </div>
            <div className="rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800">
              Active {activeCount}
            </div>
            <div className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              Critical {criticalCount}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((currentValue) => !currentValue)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Report Incident
            </button>
          </div>
        </div>
      </section>

      {showFilters && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Status
              </span>
              <select
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as IncidentStatus | '')}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Severity
              </span>
              <select
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value as IncidentSeverity | '')}
              >
                <option value="">All severities</option>
                {SEVERITY_OPTIONS.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Created after
              </span>
              <input
                type="date"
                value={createdAfter}
                onChange={(event) => setCreatedAfter(event.target.value)}
                className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition ${hasInvalidDateRange ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Created before
              </span>
              <input
                type="date"
                value={createdBefore}
                onChange={(event) => setCreatedBefore(event.target.value)}
                className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition ${hasInvalidDateRange ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
              />
            </label>

            {isAdmin && (
              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Search by user
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-amber-500">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={ownerSearch}
                    onChange={(event) => setOwnerSearch(event.target.value)}
                    placeholder="Filter by email, e.g. alice@company.com"
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className={`text-sm ${hasInvalidDateRange ? 'text-red-600' : 'text-slate-500'}`}>
                {hasInvalidDateRange
                  ? 'Created after must be on or before created before.'
                  : 'Filters combine across status, severity, owner, and created date.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FilterX className="h-4 w-4" />
              Clear Filters
            </button>
          </div>
        </section>
      )}

      {isLoading ? (
        <p className="mt-10 text-center text-sm text-slate-500">Loading incidents...</p>
      ) : incidents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">No incidents found</h3>
          <p className="mt-2 text-sm text-slate-500">
            {hasActiveFilters
              ? 'No incidents match the current filters.'
              : 'Try adjusting your filters or report a new incident.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    Incident
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    ID
                  </th>
                  {isAdmin && (
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Raised by
                    </th>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    Severity
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className={`cursor-pointer transition ${getIncidentRowClass(incident.status)}`}
                  >
                    <td className="py-3.5 pl-5 pr-3 align-top">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${getIncidentMarkerClass(incident.status)}`} />
                        <div className="max-w-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{incident.title}</p>
                            {incident.status !== 'CLOSED' && (
                              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                            {incident.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 align-top">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-white/80 px-2 py-1 font-mono text-xs text-slate-700 shadow-sm">
                          {truncateIncidentId(incident.id)}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => handleCopyIncidentId(event, incident.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/90 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          {copiedIncidentId === incident.id ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-3.5 align-top text-sm text-slate-600">
                        {incident.owner_email}
                      </td>
                    )}
                    <td className="px-3 py-3.5 align-top text-sm">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 align-top text-sm">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 align-top">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700">
                          {format(new Date(incident.created_at), 'MMM dd, yyyy')}
                        </span>
                        <span className="mt-0.5 text-xs text-slate-400">
                          {format(new Date(incident.created_at), 'HH:mm')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page {page + 1}
            <span className="ml-2 text-slate-400">Up to {pageSize} incidents per page</span>
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage - 1)}
              disabled={!canGoToPreviousPage}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              {page + 1}
            </div>
            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={!canGoToNextPage}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <CreateIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIncidents}
      />
    </div>
  );
}
