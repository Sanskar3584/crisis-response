import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Incident } from "./types";
import ReportIncident from "./ReportIncident";
import ThemeToggle from "./ThemeToggle";
import AddUser from "./AddUser";

type BoardProps = { onLogout: () => void
    theme: "light" | "dark";
    onToggleTheme: () => void;};

function getVenueId(): string | null {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64)).venueId;
    } catch {
        return null;
    }
}
function getRole(): string | null {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64)).role;
    } catch {
        return null;
    }
}

export default function Board({ onLogout,theme, onToggleTheme}: BoardProps) {
    const role = getRole();
    const canManage = role === "MANAGER" || role === "ADMIN";
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [error, setError] = useState("");
    const [announcement, setAnnouncement] = useState("");
    const seenIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:8080/incidents", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
            .then((data: Incident[]) => {
                data.forEach((i) => seenIds.current.add(i.id));
                setIncidents(data);
            })
            .catch(() => setError("Could not load incidents"));
    }, []);

    useEffect(() => {
        const venueId = getVenueId();
        if (!venueId) return;
        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            onConnect: () => {
                client.subscribe(`/topic/venue/${venueId}`, (msg) => {
                    const incident: Incident = JSON.parse(msg.body);
                    const isNew = !seenIds.current.has(incident.id);
                    seenIds.current.add(incident.id);
                    if (isNew && (incident.severity === "HIGH" || incident.severity === "CRITICAL")) {
                        setAnnouncement(`${incident.severity} incident reported: ${incident.type}. ${incident.description ?? ""}`);
                    }
                    setIncidents((prev) => {
                        const others = prev.filter((i) => i.id !== incident.id);
                        return [incident, ...others];
                    });
                });
            },
        });
        client.activate();
        return () => { client.deactivate(); };
    }, []);

    function handleCreated(incident: Incident) {
        seenIds.current.add(incident.id);
        setIncidents((prev) => {
            const others = prev.filter((i) => i.id !== incident.id);
            if (incident.archived) return others;     // archived elsewhere -> remove from board
            return [incident, ...others];
        });
    }
    async function changeStatus(id: string, status: string) {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8080/incidents/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) {
            alert("That status change isn't allowed.");
        }
        // On success the change stream pushes the update back over WebSocket.
    }
    async function archiveIncident(id: string) {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8080/incidents/${id}/archive`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setIncidents((prev) => prev.filter((x) => x.id !== id));
        } else {
            alert("Could not remove the incident.");
        }
    }

    return (
        <>
            <header className="topbar">
                <span className="brand">Rapid Crisis Response</span>
                <div className="topbar-actions">
                    <ThemeToggle theme={theme} onToggle={onToggleTheme} color="#ffffff" borderColor="rgba(255,255,255,0.35)" />
                    <button className="btn-ghost" onClick={onLogout}>Log out</button>
                </div>
            </header>

            <main style={{ maxWidth: 1080, margin: "0 auto", padding: "1.5rem" }}>
                <h1 className="sr-only">Incident console</h1>

                <div aria-live="assertive">
                    {announcement && <div className="alert" role="alert">{announcement}</div>}
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "300px 1fr",
                    gap: "1.5rem",
                    alignItems: "stretch",
                    height: "calc(100vh - 110px)",
                }}>
                    {/* Left column: actions */}
                    <div style={{ overflowY: "auto", paddingRight: 4 }}>
                        <ReportIncident onCreated={handleCreated} />
                        {canManage && <AddUser />}
                    </div>

                    {/* Right column: live incident list */}
                    <div style={{ overflowY: "auto", paddingRight: 4 }}>
                        <h2 style={{ marginTop: 0 }}>Incidents</h2>
                        {error && <p className="error">{error}</p>}
                        {incidents.length === 0 ? (
                            <p>No incidents yet.</p>
                        ) : (
                            <ul className="incident-list">
                                {incidents.map((i) => (
                                    <li
                                        key={i.id}
                                        className={`incident-card incident-card--${i.severity}`}
                                        style={i.status === "RESOLVED"
                                            ? { borderLeftColor: "#16a34a", background: "rgba(22,163,74,0.08)" }
                                            : undefined}
                                    >
                                        <span className={`badge badge-${i.severity}`}>{i.severity}</span>
                                        <span className="incident-type">{i.type}</span>
                                        <span className="incident-desc">{i.description}</span>
                                        <select
                                            value={i.status}
                                            onChange={(e) => changeStatus(i.id, e.target.value)}
                                            aria-label={`Change status for ${i.type} incident`}
                                            style={{
                                                marginLeft: "auto", width: 150, minWidth: 150, maxWidth: 150,
                                                fontSize: "0.72rem", fontWeight: 600, padding: "0.25rem 0.4rem",
                                                background: "var(--surface)", color: "var(--ink)",
                                                border: "1px solid var(--border)", borderRadius: 4,
                                            }}
                                        >
                                            <option value="OPEN">OPEN</option>
                                            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                            <option value="RESOLVED">RESOLVED</option>
                                        </select>
                                        {i.status === "RESOLVED" && (
                                            <button
                                                onClick={() => archiveIncident(i.id)}
                                                style={{
                                                    marginTop: 0, marginLeft: 8, padding: "0.25rem 0.6rem",
                                                    fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
                                                    background: "#16a34a", border: "1px solid #16a34a",
                                                    color: "#fff", borderRadius: 4, cursor: "pointer",
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}