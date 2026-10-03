# Frontend

React 19 + TypeScript, built with Vite. See the [main README](../README.md) for running the whole app.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, then build to dist/
npm run lint     # oxlint
```

It expects the backend at `http://localhost:8080` (`API_BASE` in `src/api.ts`).

| File | What it does |
|---|---|
| `Login.tsx` | sign in |
| `Board.tsx` | live incident board: STOMP subscription, severity and status filters, status changes, alerts |
| `ReportIncident.tsx` | report an incident |
| `IncidentDetail.tsx` | an incident's event history |
| `Team.tsx`, `AddUser.tsx` | managers add and remove people at their venue |
| `ChangePassword.tsx` | change your password |
| `notify.ts` | alert sound and desktop notifications |
| `ThemeToggle.tsx` | light and dark themes |
| `api.ts` | API calls with the JWT attached |
