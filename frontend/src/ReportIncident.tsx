import { useState } from "react";
import { api } from "./api";
import type { Incident } from "./types";

type Props = { onCreated: (i: Incident) => void };

export default function ReportIncident({ onCreated }: Props) {
  const [type, setType] = useState("FIRE");
  const [severity, setSeverity] = useState("HIGH");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await api("/incidents", {
      method: "POST",
      body: JSON.stringify({ type, severity, description }),
    });
    if (!res.ok) {
      setError("Could not report incident");
      return;
    }
    const created: Incident = await res.json();
    onCreated(created);
    setDescription("");
  }

  return (
    <section className="card">
      <h2 className="card-title">Report an incident</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="banner banner-error">{error}</div>}
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="MEDICAL">MEDICAL</option>
            <option value="FIRE">FIRE</option>
            <option value="SECURITY">SECURITY</option>
            <option value="FACILITY">FACILITY</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="severity">Severity</label>
          <select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="desc">Description</label>
          <input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's happening?" />
        </div>
        <button className="btn btn-primary btn-block" type="submit">Report</button>
      </form>
    </section>
  );
}
