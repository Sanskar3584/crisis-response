import { useState } from "react";
import { api } from "./api";

type Props = { onCreated?: () => void };

export default function AddUser({ onCreated }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await api("/users", {
      method: "POST",
      body: JSON.stringify({ displayName, email, password, role }),
    });
    if (res.status === 409) {
      setError("That email is already registered.");
      return;
    }
    if (!res.ok) {
      setError("Could not create the user.");
      return;
    }
    const created = await res.json();
    setMessage(`Added ${created.displayName} (${created.role}).`);
    setDisplayName("");
    setEmail("");
    setPassword("");
    onCreated?.();
  }

  return (
    <section className="card">
      <h2 className="card-title">Add a team member</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="banner banner-error">{error}</div>}
        {message && <div className="banner banner-success">{message}</div>}
        <div className="field">
          <label htmlFor="n-name">Name</label>
          <input id="n-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="n-email">Email</label>
          <input id="n-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="n-pass">Temporary password</label>
          <input id="n-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="n-role">Role</label>
          <select id="n-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="GUEST">GUEST</option>
            <option value="STAFF">STAFF</option>
            <option value="MANAGER">MANAGER</option>
          </select>
        </div>
        <button className="btn btn-primary btn-block" type="submit">Create user</button>
      </form>
    </section>
  );
}
