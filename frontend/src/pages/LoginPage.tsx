import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await login(email, password);
      // Decode the JWT to get user info — we need to fetch user from register
      // or store email + decode. For now we parse the JWT payload.
      const payload = JSON.parse(atob(token.access_token.split(".")[1]));
      setAuth(token.access_token, {
        id: "",
        email: payload.sub,
        is_admin: false,
        created_at: "",
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Incident Logbook</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label>Email</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={styles.footer}>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "100%",
    maxWidth: 380,
    padding: "2rem",
    background: "var(--color-surface)",
    borderRadius: 12,
    border: "1px solid var(--color-border)",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "var(--color-text-muted)",
    textAlign: "center" as const,
    marginBottom: "0.5rem",
  },
  footer: {
    fontSize: "0.85rem",
    color: "var(--color-text-muted)",
    textAlign: "center" as const,
  },
};
