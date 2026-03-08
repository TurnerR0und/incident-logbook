import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Check,
  Copy,
  LogOut,
  Plus,
  Search,
  Shield,
  UserRound,
} from 'lucide-react';
import { format } from 'date-fns';

import { authApi } from '../api/auth';
import { incidentApi } from '../api/incidents';
import type { ListIncidentParams } from '../api/incidents';
import CreateIncidentModal from '../components/CreateIncidentModal';
import type { Incident, IncidentSeverity, IncidentStatus } from '../types/incident';
import type { User } from '../types/user';

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
      return 'bg-slate-100 text-slate-800 border-slate-200';
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

function truncateIncidentId(incidentId: string) {
  return `${incidentId.slice(0, 8)}...${incidentId.slice(-6)}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | ''>('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [copiedIncidentId, setCopiedIncidentId] = useState<string | null>(null);
  const deferredOwnerSearch = useDeferredValue(ownerSearch.trim());
  const isAdmin = currentUser?.is_admin ?? false;

  const fetchCurrentUser = useCallback(async () => {
    const user = await authApi.me();
    setCurrentUser(user);
  }, []);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);

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

      const data = await incidentApi.list(params);
      setIncidents(data);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deferredOwnerSearch, isAdmin, severityFilter, statusFilter]);

  useEffect(() => {
    fetchCurrentUser().catch((error) => {
      console.error('Failed to load current user:', error);
    });
  }, [fetchCurrentUser]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_48%,#f8fafc_100%)]">
      <nav className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl p-2 ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {isAdmin ? <Shield className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Incident Logbook
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {isAdmin ? 'Admin Incident Queue' : 'My Incident Queue'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className={`hidden rounded-full px-3 py-1 text-sm font-medium md:flex ${isAdmin ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
                {currentUser.email}
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Report Incident
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${isAdmin ? 'border-amber-200 bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_45%,#ffffff_100%)]' : 'border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_60%,#f8fafc_100%)]'}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${isAdmin ? 'bg-amber-200/70 text-amber-900' : 'bg-blue-200/70 text-blue-900'}`}>
                {isAdmin ? 'Admin View' : 'User View'}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {isAdmin ? 'Cross-user visibility with fast triage controls.' : 'Track the incidents you have raised.'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isAdmin
                  ? 'Search incidents by owner, copy long IDs without opening a row, and keep raised-by context visible at table level.'
                  : 'You are seeing the incidents associated with your account. Admin-only user search and raised-by metadata stay out of the way here.'}
              </p>
            </div>

            {currentUser && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                <UserRound className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Signed in as
                  </p>
                  <p className="text-sm font-medium text-slate-900">{currentUser.email}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-4">
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

            {isAdmin && (
              <label className="flex flex-col gap-2 lg:col-span-2">
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
        </section>

        {isLoading ? (
          <p className="mt-10 text-center text-sm text-slate-500">Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">No incidents found</h3>
            <p className="mt-2 text-sm text-slate-500">
              {isAdmin && deferredOwnerSearch
                ? 'No incidents match the current owner search and filters.'
                : 'Try adjusting your filters or report a new incident.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className={`${isAdmin ? 'bg-amber-50/80' : 'bg-slate-50'}`}>
                  <tr>
                    <th className="py-3.5 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Incident
                    </th>
                    <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      ID
                    </th>
                    {isAdmin && (
                      <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Raised by
                      </th>
                    )}
                    <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Severity
                    </th>
                    <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {incidents.map((incident) => (
                    <tr
                      key={incident.id}
                      onClick={() => navigate(`/incidents/${incident.id}`)}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="py-4 pl-5 pr-3 align-top">
                        <div className="max-w-sm">
                          <p className="text-sm font-semibold text-slate-900">{incident.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {incident.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                            {truncateIncidentId(incident.id)}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => handleCopyIncidentId(event, incident.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
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
                        <td className="px-3 py-4 align-top text-sm text-slate-600">
                          {incident.owner_email}
                        </td>
                      )}
                      <td className="px-3 py-4 align-top text-sm">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top text-sm">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top text-sm text-slate-500">
                        {format(new Date(incident.created_at), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <CreateIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIncidents}
      />
    </div>
  );
}
