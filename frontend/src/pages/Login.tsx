import axios from 'axios';
import { useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail ?? fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setError(getErrorMessage(error, 'An error occurred during login'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1e3a8a_0%,#0f172a_42%,#020617_100%)] px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-200/80">
              Incident Logbook
            </p>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Authentication stays separate from the operational workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
              Sign in to reach the protected incident console, triage queue, and audit timeline.
              Public auth screens stay visually distinct so the app shell only appears after session validation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-300/20 bg-blue-400/10 p-4">
              <p className="text-sm font-medium text-blue-100">Protected routes</p>
              <p className="mt-2 text-sm text-slate-300">`/dashboard` and `/incidents/:id` now live behind the authenticated shell.</p>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
              <p className="text-sm font-medium text-emerald-100">Session-based access</p>
              <p className="mt-2 text-sm text-slate-300">Header, navigation, and footer only render after auth succeeds.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Login</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in to continue into the shared incident application shell.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mr-2 h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Need an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Create one here
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
