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
            return [incident, ...others];
        });
    }
    async function changeStatus(id: string, status: string) {
        const token = localStorage.getItem("token");
        await fetch(`http://localhost:8080/incidents/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });
        // The change stream pushes the updated incident back over the WebSocket,
        // so the board refreshes on its own. No manual state update needed.
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
                                    <li key={i.id} className={`incident-card incident-card--${i.severity}`}>
                                        <span className={`badge badge-${i.severity}`}>{i.severity}</span>
                                        <span className="incident-type">{i.type}</span>
                                        <span className="incident-desc">{i.description}</span>
                                        <select
                                            value={i.status}
                                            onChange={(e) => changeStatus(i.id, e.target.value)}
                                            aria-label={`Change status for ${i.type} incident`}
                                            style={{
                                                marginLeft: "auto",
                                                width: 150,
                                                minWidth: 150,
                                                maxWidth: 150,
                                                fontSize: "0.72rem",
                                                fontWeight: 600,
                                                padding: "0.25rem 0.4rem",
                                                background: "var(--surface)",
                                                color: "var(--ink)",
                                                border: "1px solid var(--border)",
                                                borderRadius: 4,
                                            }}
                                        >
                                            <option value="OPEN">OPEN</option>
                                            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                            <option value="RESOLVED">RESOLVED</option>
                                        </select>
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