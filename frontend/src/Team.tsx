import { useEffect, useState } from "react";
import { api, getUserId } from "./api";
import AddUser from "./AddUser";

type Member = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  venueId: string;
};

export default function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const myId = getUserId();

  function load() {
    api("/users")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Member[]) => setMembers(data))
      .catch(() => setError("Could not load team members"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string, name: string) {
    if (!window.confirm(`Remove ${name}? They will no longer be able to log in.`)) return;
    const res = await api(`/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } else if (res.status === 409) {
      alert("You cannot remove yourself.");
    } else {
      alert("Could not remove this member.");
    }
  }

  return (
    <div className="team-grid">
      <AddUser onCreated={load} />

      <section className="card">
        <h2 className="card-title">Team members ({members.length})</h2>
        {error && <div className="banner banner-error">{error}</div>}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : members.length === 0 ? (
          <p className="muted">No team members yet.</p>
        ) : (
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.id} className="member">
                <div>
                  <div className="member-name">{m.displayName}</div>
                  <div className="member-email">{m.email}</div>
                </div>
                <div className="member-actions">
                  <span className="pill">{m.role}</span>
                  {m.id !== myId && m.role !== "ADMIN" && (
                    <button className="btn btn-ghost btn-sm member-remove" onClick={() => remove(m.id, m.displayName)}>
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
