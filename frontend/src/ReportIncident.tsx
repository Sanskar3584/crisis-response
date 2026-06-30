import { useState } from "react";
import type { Incident } from "./types";

type ReportIncidentProps = {
    onCreated: (incident: Incident) => void;
};

export default function ReportIncident({ onCreated }: ReportIncidentProps) {
    const [type, setType] = useState("FIRE");
    const [severity, setSeverity] = useState("HIGH");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8080/incidents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ type, severity, description }),
            });

            if (!res.ok) {
                setError("Could not report incident");
                return;
            }

            const created: Incident = await res.json();
            onCreated(created);   // hand the new incident up to the board
            setDescription("");   // clear the field for the next one
        } catch {
            setError("Could not reach the server");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Report an incident</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <div>
                <label htmlFor="type">Type</label><br />
                <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="MEDICAL">MEDICAL</option>
                    <option value="FIRE">FIRE</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="FACILITY">FACILITY</option>
                    <option value="OTHER">OTHER</option>
                </select>
            </div>

            <div>
                <label htmlFor="severity">Severity</label><br />
                <select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                </select>
            </div>

            <div>
                <label htmlFor="description">Description</label><br />
                <input id="description" type="text" value={description}
                       onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <button type="submit">Report</button>
        </form>
    );
}