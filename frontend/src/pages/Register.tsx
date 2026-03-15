import axios from 'axios';
import { useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../api/auth';
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

export default function Register() {
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
      await authApi.register(email, password);
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setError(getErrorMessage(error, 'An error occurred during registration'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#064e3b_0%,#052e2b_35%,#020617_100%)] px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex items-center order-2 lg:order-1">
          <div className="w-full rounded-[2rem] bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Register</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Create your account</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Register once, then continue straight into the protected application shell.
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
                  className="mt-2 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                Sign in here
              </Link>
            </p>
          </div>
        </section>

        <section className="order-1 flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-10 lg:order-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/80">
              New Access
            </p>
            <h2 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Provision access before the incident shell appears.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
              Registration stays outside the app shell, so navigation, shared chrome, and protected data remain separate from onboarding.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
              <p className="text-sm font-medium text-emerald-100">Distinct public routes</p>
              <p className="mt-2 text-sm text-slate-300">`/login` and `/register` keep their own visual system and do not inherit the authenticated shell.</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
              <p className="text-sm font-medium text-cyan-100">Stable navigation</p>
              <p className="mt-2 text-sm text-slate-300">After signup, the route still lands on `/dashboard` with the shared app header and footer.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
