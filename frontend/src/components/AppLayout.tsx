import { Activity, ChevronRight, LogOut, Shield } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function getSectionLabel(pathname: string) {
  if (pathname.startsWith('/incidents/')) {
    return 'Incident Detail';
  }

  return 'Dashboard';
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.is_admin ?? false;
  const sectionLabel = getSectionLabel(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_48%,#f8fafc_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <div className={`rounded-2xl p-2 ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {isAdmin ? <Shield className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Incident Logbook
                </p>
                <p className="text-lg font-semibold text-slate-950">Operations Console</p>
              </div>
            </NavLink>

            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:flex">
              <span>{sectionLabel}</span>
              {location.pathname.startsWith('/incidents/') && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>Timeline</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </nav>

            {user && (
              <div className={`rounded-full px-3 py-2 text-sm font-medium ${isAdmin ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
                {user.email}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Authenticated workspace for incident tracking, triage, and timeline review.</p>
          <p>{isAdmin ? 'Admin scope enabled' : 'Standard user scope'}</p>
        </div>
      </footer>
    </div>
  );
}
