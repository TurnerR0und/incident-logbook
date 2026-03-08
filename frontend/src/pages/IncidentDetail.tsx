import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Shield, UserRound } from 'lucide-react';
import { format } from 'date-fns';

import { authApi } from '../api/auth';
import { incidentApi } from '../api/incidents';
import type { Incident, IncidentSeverity, IncidentStatus } from '../types/incident';
import type { User } from '../types/user';

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

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return format(new Date(value), 'MMM dd, yyyy HH:mm');
}

export default function IncidentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadPage = async () => {
      setIsLoading(true);

      try {
        const [user, incidentData] = await Promise.all([
          authApi.me(),
          incidentApi.get(id),
        ]);

        setCurrentUser(user);
        setIncident(incidentData);
      } catch (error) {
        console.error('Failed to load incident detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [id]);

  const handleCopyId = async () => {
    if (!incident) {
      return;
    }

    try {
      await navigator.clipboard.writeText(incident.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy incident ID:', error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading incident...</div>;
  }

  if (!incident) {
    return <div className="p-8 text-center text-sm text-slate-500">Incident not found.</div>;
  }

  const isAdmin = currentUser?.is_admin ?? false;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f3f4f6_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <section className={`rounded-3xl border p-6 shadow-sm ${isAdmin ? 'border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_60%,#fff7ed_100%)]' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${isAdmin ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
                  {isAdmin ? 'Admin context' : 'Incident detail'}
                </span>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </span>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {incident.title}
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600">{incident.description}</p>
            </div>

            <div className="min-w-[280px] rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Incident ID
              </p>
              <p className="mt-2 break-all font-mono text-sm leading-6 text-slate-100">
                {incident.id}
              </p>
              <button
                type="button"
                onClick={handleCopyId}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy incident ID'}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Raised by
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-900">
              {isAdmin ? <Shield className="h-4 w-4 text-amber-600" /> : <UserRound className="h-4 w-4 text-slate-500" />}
              {incident.owner_email}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Created
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {formatTimestamp(incident.created_at)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Started
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {formatTimestamp(incident.started_at)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Resolved
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {formatTimestamp(incident.resolved_at)}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Root cause
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {incident.root_cause || 'No root cause has been documented yet.'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Metadata
            </p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Owner ID</dt>
                <dd className="font-mono text-xs text-slate-900">{incident.owner_id}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Last updated</dt>
                <dd className="font-medium text-slate-900">
                  {formatTimestamp(incident.updated_at)}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
