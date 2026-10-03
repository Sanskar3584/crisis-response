import { useState } from "react";
import { API_BASE } from "./api";
import ThemeToggle from "./ThemeToggle";

type Props = {
  onLogin: (token: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export default function Login({ onLogin, theme, onToggleTheme }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Invalid email or password");
        return;
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      onLogin(data.token);
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <span className="brand-mark">RCR</span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <h1 className="auth-title">Rapid Crisis Response</h1>
        <p className="auth-sub">Sign in to the incident console</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="banner banner-error">{error}</div>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@venue.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
