import { useState } from "react";
import { api } from "./api";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await api("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.status === 403) { setError("Current password is incorrect."); return; }
    if (res.status === 400) { setError("New password must be at least 6 characters."); return; }
    if (!res.ok) { setError("Could not change password."); return; }
    setMessage("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <section className="card">
      <h2 className="card-title">Change password</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="banner banner-error">{error}</div>}
        {message && <div className="banner banner-success">{message}</div>}
        <div className="field">
          <label htmlFor="cur-pass">Current password</label>
          <input id="cur-pass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="new-pass">New password</label>
          <input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" type="submit">Update password</button>
      </form>
    </section>
  );
}
