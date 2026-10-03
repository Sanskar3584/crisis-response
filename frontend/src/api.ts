export const API_BASE = "http://localhost:8080";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

function claims(): any | null {
  const t = getToken();
  if (!t) return null;
  try {
    const b64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function getVenueId(): string | null {
  return claims()?.venueId ?? null;
}

export function getRole(): string | null {
  return claims()?.role ?? null;
}

export function getUserId(): string | null {
  return claims()?.sub ?? null;
}


export async function api(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}
