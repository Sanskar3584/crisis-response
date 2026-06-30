import { useState } from "react";

type LoginProps = {
    onLogin: (token: string) => void;
};

export default function Login({ onLogin }: LoginProps) {
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

            if (!res.ok) {
                setError("Invalid email or password");
                return;
            }

            const data = await res.json();
            localStorage.setItem("token", data.token);
            onLogin(data.token); // tell App we're logged in
        } catch {
            setError("Could not reach the server. Is the backend running?");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h1>Rapid Crisis Response</h1>
            <h2>Log in</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div>
                <label htmlFor="email">Email</label><br />
                <input id="email" type="email" value={email}
                       onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
                <label htmlFor="password">Password</label><br />
                <input id="password" type="password" value={password}
                       onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button type="submit">Log in</button>
        </form>
    );
}