import { useEffect, useState } from "react";
import { api } from "./api";
import type { Incident, IncidentEvent } from "./types";

type Props = { incident: Incident; onClose: () => void };

export default function IncidentDetail({ incident, onClose }: Props) {
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/incidents/${incident.id}/events`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: IncidentEvent[]) => setEvents(data))
      .catch(() => setError("Could not load history"))
      .finally(() => setLoading(false));
  }, [incident.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Incident history" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className={`badge badge-${incident.severity}`}>{incident.severity}</span>
            <h2 className="modal-title">{incident.type}</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <p className="modal-sub">
          <span className={`pill pill-${incident.status}`}>{incident.status}</span>
          {incident.description ? <span>· {incident.description}</span> : null}
        </p>

        {loading && <p className="muted" style={{ marginTop: "1rem" }}>Loading history…</p>}
        {error && <div className="banner banner-error" style={{ marginTop: "1rem" }}>{error}</div>}

        {!loading && !error && (
          <ol className="timeline">
            {events.map((ev) => (
              <li key={ev.id} className="timeline-item">
                <span className="timeline-dot" />
                <div className="timeline-type">{ev.type}</div>
                <div className="timeline-detail">{ev.detail}</div>
                <div className="timeline-time">{new Date(ev.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
