import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
type LoginProps = {
    onLogin: (token: string) => void;
    theme: "light" | "dark";
    onToggleTheme: () => void;
};

export default function Login({ onLogin, theme, onToggleTheme }: LoginProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) { setError("Invalid email or password"); return; }
            const data = await res.json();
            localStorage.setItem("token", data.token);
            onLogin(data.token);
        } catch {
            setError("Could not reach the server. Is the backend running?");
        }
    }

    return (
        <div className="auth">
            <div className="auth-top">
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
            <h1>Rapid Crisis Response</h1>
            <p className="sub">Sign in to the incident console</p>
            <form onSubmit={handleSubmit}>
                {error && <p className="error">{error}</p>}
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email}
                       onChange={(e) => setEmail(e.target.value)} />
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password}
                       onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Sign in</button>
            </form>
        </div>
    );
}