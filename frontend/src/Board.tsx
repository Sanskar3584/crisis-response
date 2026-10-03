import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE, api, getToken, getVenueId, getRole } from "./api";
import type { Incident, Stats } from "./types";
import ReportIncident from "./ReportIncident";
import IncidentDetail from "./IncidentDetail";
import ChangePassword from "./ChangePassword";
import Team from "./Team";
import ThemeToggle from "./ThemeToggle";
import { playAlert, requestNotifPermission, desktopNotify } from "./notify";

type Props = {
  onLogout: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

type Page = "incidents" | "team" | "settings";

const RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function formatAvg(mins: number | null | undefined): string {
  if (mins == null) return "—";
  if (mins < 1) return "<1m";
  if (mins < 60) return `${Math.round(mins)}m`;
  return `${(mins / 60).toFixed(1)}h`;
}

export default function Board({ onLogout, theme, onToggleTheme }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [venueStats, setVenueStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState<Page>("incidents");
  const seenIds = useRef<Set<string>>(new Set());

  const role = getRole();
  const canManage = role === "MANAGER" || role === "ADMIN";
  const isGuest = role === "GUEST";

  useEffect(() => {
    if (!isGuest) requestNotifPermission();
  }, [isGuest]);

  function loadStats() {
    api("/incidents/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((s: Stats | null) => s && setVenueStats(s))
      .catch(() => {});
  }

  useEffect(() => {
    api("/incidents")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Incident[]) => {
        data.forEach((i) => seenIds.current.add(i.id));
        setIncidents(data);
      })
      .catch(() => setError("Could not load incidents. Make sure the backend is running and you're logged in."))
      .finally(() => setLoading(false));
    loadStats();
  }, []);

  useEffect(() => {
    const venueId = getVenueId();
    if (!venueId) return;
    const guest = getRole() === "GUEST";
    // Staff watch their whole venue; guests only receive their own reports on a private
    // queue. The server enforces this when we subscribe (StompAuthChannelInterceptor).
    const destination = guest ? "/user/queue/incidents" : `/topic/venue/${venueId}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
      connectHeaders: { Authorization: `Bearer ${getToken() ?? ""}` },
      // An ERROR frame means the token or subscription was rejected, so retrying won't help.
      onStompError: () => void client.deactivate(),
      onConnect: () => {
        client.subscribe(destination, (msg) => {
          const incident: Incident = JSON.parse(msg.body);

          const isNew = !seenIds.current.has(incident.id);
          seenIds.current.add(incident.id);
          if (!guest && isNew && (incident.severity === "HIGH" || incident.severity === "CRITICAL")) {
            const text = `${incident.severity} incident: ${incident.type}. ${incident.description ?? ""}`;
            setAnnouncement(text);
            playAlert();
            desktopNotify(`${incident.severity} incident reported`, `${incident.type} - ${incident.description ?? ""}`);
          }
          setIncidents((prev) => {
            const others = prev.filter((i) => i.id !== incident.id);
            if (incident.archived) return others;
            return [incident, ...others];
          });
          loadStats();
        });
      },
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, []);

  function upsert(incident: Incident) {
    seenIds.current.add(incident.id);
    setIncidents((prev) => {
      const others = prev.filter((i) => i.id !== incident.id);
      if (incident.archived) return others;
      return [incident, ...others];
    });
    loadStats();
  }

  async function changeStatus(id: string, status: string) {
    const res = await api(`/incidents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) alert("That status change isn't allowed.");
  }

  async function archiveIncident(id: string) {
    const res = await api(`/incidents/${id}/archive`, { method: "PATCH" });
    if (res.ok) setIncidents((prev) => prev.filter((x) => x.id !== id));
    else alert("Could not remove the incident.");
  }

  const opStats = {
    open: incidents.filter((i) => i.status === "OPEN").length,
    inProgress: incidents.filter((i) => i.status === "IN_PROGRESS").length,
    resolved: incidents.filter((i) => i.status === "RESOLVED").length,
    critical: incidents.filter((i) => i.severity === "CRITICAL").length,
  };

  const filtered = incidents
    .filter((i) => severityFilter === "ALL" || i.severity === severityFilter)
    .filter((i) => statusFilter === "ALL" || i.status === statusFilter)
    .slice()
    .sort((a, b) => RANK[a.severity] - RANK[b.severity]);

  const navItem = (id: Page, label: string) => (
    <button className={`navlink ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
      {label}
    </button>
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <span className="brand-mark">RCR</span>
            <span className="brand-text">Rapid Crisis Response</span>
          </div>
          <nav className="topnav">
            {navItem("incidents", "Incidents")}
            {canManage && navItem("team", "Team")}
            {navItem("settings", "Settings")}
          </nav>
        </div>
        <div className="topbar-actions">
          {role && <span className="role-chip">{role}</span>}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <div className="live-region" aria-live="assertive">
        {announcement && <div className="banner banner-alert" role="alert">{announcement}</div>}
      </div>

      {page === "incidents" && (
        <main className="layout">
          <aside className="sidebar">
            <ReportIncident onCreated={upsert} />
          </aside>

          <section className="content">
            <div className="stats">
              {isGuest ? (
                <>
                  <div className="stat"><div className="stat-value">{venueStats?.myReports ?? 0}</div><div className="stat-label">My reports</div></div>
                  <div className="stat"><div className="stat-value">{venueStats?.open ?? 0}</div><div className="stat-label">Open at venue</div></div>
                  <div className="stat stat-good"><div className="stat-value">{venueStats?.resolved ?? 0}</div><div className="stat-label">Resolved</div></div>
                  <div className="stat"><div className="stat-value">{formatAvg(venueStats?.avgResolutionMinutes)}</div><div className="stat-label">Avg resolve time</div></div>
                </>
              ) : (
                <>
                  <div className="stat"><div className="stat-value">{opStats.open}</div><div className="stat-label">Open</div></div>
                  <div className="stat"><div className="stat-value">{opStats.inProgress}</div><div className="stat-label">In progress</div></div>
                  <div className="stat stat-good"><div className="stat-value">{opStats.resolved}</div><div className="stat-label">Resolved</div></div>
                  <div className="stat stat-bad"><div className="stat-value">{opStats.critical}</div><div className="stat-label">Critical</div></div>
                </>
              )}
            </div>

            <div className="toolbar">
              <h2 className="section-title">{isGuest ? "My reports" : "Incidents"}</h2>
              {!isGuest && (
                <div className="filters">
                  <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                    <option value="ALL">All severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="ALL">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="ACKNOWLEDGED">Acknowledged</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              )}
            </div>

            {loading ? (
              <p className="muted">Loading…</p>
            ) : error ? (
              <div className="banner banner-error">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="empty">{isGuest ? "You haven't reported anything yet." : "No incidents match your filters."}</div>
            ) : (
              <ul className="incident-list">
                {filtered.map((i) => (
                  <li
                    key={i.id}
                    className={`incident incident-${i.severity} ${i.status === "RESOLVED" ? "incident-resolved" : ""}`}
                    onClick={() => setSelected(i)}
                  >
                    <span className={`badge badge-${i.severity}`}>{i.severity}</span>
                    <span className="incident-type">{i.type}</span>
                    <span className="incident-desc">{i.description}</span>
                    {isGuest ? (
                      <span className={`pill pill-${i.status}`} style={{ marginLeft: "auto" }}>{i.status}</span>
                    ) : (
                      <select
                        className="status-select"
                        value={i.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => changeStatus(i.id, e.target.value)}
                        aria-label={`Change status for ${i.type}`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    )}
                    {!isGuest && i.status === "RESOLVED" && canManage && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={(e) => { e.stopPropagation(); archiveIncident(i.id); }}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      )}

      {page === "team" && (
        <div className="page-wide">
          <Team />
        </div>
      )}

      {page === "settings" && (
        <div className="page-narrow">
          <ChangePassword />
        </div>
      )}

      {selected && <IncidentDetail incident={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
