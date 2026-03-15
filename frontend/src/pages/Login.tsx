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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#1e3a8a_0%,#0f172a_42%,#020617_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Incident Logbook</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Access the incident workspace.
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
    </div>
  );
}
