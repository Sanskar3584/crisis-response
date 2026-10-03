# Rapid Crisis Response

Real-time incident coordination for venues such as hotels and event spaces. Guests and staff report incidents from the browser, and every responder's board updates the moment an incident is reported or changes status, without polling.

**Stack:** Spring Boot 3.3 (Java 21), MongoDB 7, STOMP over WebSocket (SockJS), Spring Security with JWT, React 19 + TypeScript (Vite).

## What it does

- **Live incident board.** Staff see their venue's incidents sorted by severity and move each one through `OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED`.
- **Alerts that reach people.** A new HIGH or CRITICAL incident plays a sound, raises a desktop notification and is announced to screen readers through an ARIA live region.
- **Guests report.** A guest can report an incident and follow its status, but sees only their own reports.
- **History for every incident.** Creation, each status change and archiving are recorded in an event log that the API only ever adds to.
- **Team management.** Managers add and remove staff and guests at their own venue. Admins can't be created or removed this way.
- **Stats.** Open and resolved counts, your own reports and the average time to resolve.
- Light and dark themes.

## How live updates work

1. The API writes the incident to MongoDB.
2. A MongoDB change stream on the `incidents` collection fires. Change streams need a replica set, which is why MongoDB runs as one even with a single node.
3. `IncidentChangeStreamListener` pushes the full incident over STOMP to `/topic/venue/{venueId}`, which every staff board at that venue subscribes to, and to the reporter's private queue, `/user/queue/incidents`.

Because the push starts from the database's change stream rather than from a controller, any write to `incidents` reaches the boards, whichever code path made it.

## Security

Every check runs on the server.

- **Authentication.** Passwords are stored as BCrypt hashes. An HMAC-signed JWT carries the user's ID, role and venue, and requests are stateless.
- **Venue isolation over REST.** Incident lists only ever come from the caller's own venue. Updating an incident, archiving it or reading its history checks the incident's venue against the caller's. Guests see only their own reports. Archiving needs a manager or admin and a resolved incident.
- **Venue isolation over WebSocket.** The `/ws` handshake is open, so `StompAuthChannelInterceptor` checks every STOMP frame instead. `CONNECT` needs a valid JWT. `SUBSCRIBE` is allowed only to your own venue's board (not for guests) or your own private queue. Clients can't `SEND` to `/topic` or `/queue`, so nobody can push a fake incident onto other boards.
- **Concurrent edits.** Incidents carry a `@Version` field. When two responders update the same incident at once, the stale write is rejected instead of silently overwriting the newer one.

## Tests

17 unit tests (JUnit 5, Mockito). 13 of them check the access rules: cross-venue status updates and history reads, archiving as staff, what guests can see, and the STOMP connect, subscribe and send rules. They don't need MongoDB.

```
cd backend
mvn test
```

## Run locally

You need Java 21, Maven, Docker and Node.js 22 or later.

```powershell
# 1. MongoDB as a single-node replica set (change streams need one)
cd backend
docker compose up -d
docker exec crisis-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"

# 2. Backend on http://localhost:8080
mvn spring-boot:run

# 3. Frontend on http://localhost:5173 (in a second terminal, from the repo root)
cd frontend
npm install
npm run dev
```

The `rs.initiate` step is needed only the first time, because the data lives in the `mongo-data` volume.

Create the first account through the registration endpoint, then sign in at http://localhost:5173 and add staff and guests from the Team screen:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/auth/register -ContentType "application/json" `
  -Body '{"email":"admin@hotel.com","password":"secret123","displayName":"Admin","role":"ADMIN","venueId":"venue-1"}'
```

`backend/requests.http` walks through the API (reporting, status changes, the event log) and the cross-venue checks. Open it in IntelliJ's HTTP client.

For anything beyond local use, set the `JWT_SECRET` environment variable to at least 32 characters. The default in `application.properties` is for development only.

## API

| Method | Path | Who can call it |
|---|---|---|
| POST | `/auth/register` | anyone (see limitations) |
| POST | `/auth/login` | anyone |
| POST | `/auth/change-password` | signed in |
| POST | `/incidents` | signed in |
| GET | `/incidents` | signed in: your venue's incidents, or your own reports if you're a guest |
| GET | `/incidents/stats` | signed in |
| PATCH | `/incidents/{id}/status` | signed in, same venue |
| PATCH | `/incidents/{id}/archive` | manager or admin, same venue, resolved incidents only |
| GET | `/incidents/{id}/events` | signed in, same venue |
| GET, POST | `/users` | manager or admin, own venue |
| DELETE | `/users/{id}` | manager or admin, own venue (not admins, not yourself) |
| GET | `/health` | anyone |
| STOMP | `/ws`, then subscribe to `/topic/venue/{venueId}` or `/user/queue/incidents` | signed in |

## Project layout

```
backend/
  docker-compose.yml            MongoDB 7 started as replica set rs0
  requests.http                 API walkthrough, including the cross-venue checks
  src/main/java/com/crisis/
    auth/                       registration, login, JWT
    config/                     security filter chain, CORS, WebSocket broker
    incident/                   incidents, lifecycle, event log, stats
    realtime/                   change-stream listener, STOMP access checks
    user/                       team management
  src/main/resources/static/
    live.html                   bare-bones live board for testing the WebSocket feed
frontend/                       React 19 + TypeScript app (Vite)
```

## Known limitations

- `POST /auth/register` is open and trusts the role and venue in the request. It exists to bootstrap a local demo; a real deployment needs invite-only sign-up, which managers already have through `/users`.
- Status changes are checked against the caller's venue but not their role. The UI hides the status controls from guests, but the API doesn't block them.
- `GET /users/{id}` isn't limited to the caller's venue.
- A rejected concurrent edit comes back as HTTP 500. It should be a 409 Conflict.
- The STOMP broker is Spring's in-memory one, so the app runs on a single server. Running several would need an external broker.
- The API address (`http://localhost:8080`) and the allowed CORS origin (`http://localhost:5173`) are hard-coded for local development.
