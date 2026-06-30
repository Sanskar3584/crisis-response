import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Incident } from "./types";
import ReportIncident from "./ReportIncident";

type BoardProps = {
    onLogout: () => void;
};

// Decode the venueId claim from the JWT payload.
function getVenueId(): string | null {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        return payload.venueId;
    } catch {
        return null;
    }
}

export default function Board({ onLogout }: BoardProps) {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [error, setError] = useState("");

    // 1. Load existing incidents once.
    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:8080/incidents", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data: Incident[]) => setIncidents(data))
            .catch(() => setError("Could not load incidents"));
    }, []);

    // 2. Subscribe to live updates for this venue.
    useEffect(() => {
        const venueId = getVenueId();
        if (!venueId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            onConnect: () => {
                client.subscribe(`/topic/venue/${venueId}`, (msg) => {
                    const incident: Incident = JSON.parse(msg.body);
                    setIncidents((prev) => {
                        const others = prev.filter((i) => i.id !== incident.id); // drop old copy
                        return [incident, ...others];                            // newest on top
                    });
                });
            },
        });

        client.activate();
        return () => {
            client.deactivate(); // clean up when the board unmounts (e.g., logout)
        };
    }, []);

    function handleCreated(incident: Incident) {
        setIncidents((prev) => {
            const others = prev.filter((i) => i.id !== incident.id);
            return [incident, ...others];
        });
    }

    return (
        <div>
            <h1>Incident Board</h1>
            <button onClick={onLogout}>Log out</button>

            <ReportIncident onCreated={handleCreated} />

            <h2>Incidents</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}

            {incidents.length === 0 ? (
                <p>No incidents yet.</p>
            ) : (
                <ul>
                    {incidents.map((i) => (
                        <li key={i.id}>
                            [{i.severity}] {i.type} - {i.status} - {i.description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}