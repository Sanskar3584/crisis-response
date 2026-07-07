import { useState } from "react";

export default function AddUser() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState("STAFF");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage("");
        setError("");
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8080/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email, password, displayName, role }),
            });

            if (res.status === 409) { setError("That email is already registered."); return; }
            if (!res.ok) { setError("Could not create the user."); return; }

            const created = await res.json();
            setMessage(`Created ${created.displayName} (${created.role}) in ${created.venueId}.`);
            setEmail("");
            setPassword("");
            setDisplayName("");
        } catch {
            setError("Could not reach the server.");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Add a team member</h2>
            {error && <p className="error">{error}</p>}
            {message && <p style={{ color: "#16a34a", fontSize: "0.88rem" }}>{message}</p>}

            <div>
                <label htmlFor="newName">Name</label>
                <input id="newName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div>
                <label htmlFor="newEmail">Email</label>
                <input id="newEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
                <label htmlFor="newPassword">Temporary password</label>
                <input id="newPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div>
                <label htmlFor="newRole">Role</label>
                <select id="newRole" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="GUEST">GUEST</option>
                    <option value="STAFF">STAFF</option>
                    <option value="MANAGER">MANAGER</option>
                </select>
            </div>

            <button type="submit">Create user</button>
        </form>
    );}