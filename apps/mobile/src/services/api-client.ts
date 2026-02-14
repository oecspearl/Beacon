// ---------------------------------------------------------------------------
// API Client — sends data to the Beacon coordination backend
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Base URL for the coordination API.
 * Uses the Mac's LAN IP in dev so the phone (on the same Wi-Fi) can reach it.
 * Override with setBaseUrl() for staging / production.
 */
const DEV_HOST = "192.168.100.131";
const PROD_HOST = "https://beacon-o22n.onrender.com";
export let API_BASE_URL =
  typeof __DEV__ !== "undefined" && __DEV__
    ? `http://${DEV_HOST}:3001/api/v1`
    : `${PROD_HOST}/api/v1`;

/** Request timeout in milliseconds. */
const REQUEST_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Auth token
// ---------------------------------------------------------------------------

let _authToken: string | null = null;

/**
 * Store a student auth token that will be attached to every request.
 */
export function setAuthToken(token: string | null): void {
  _authToken = token;
}

/**
 * Override the default API base URL at runtime.
 */
export function setBaseUrl(url: string): void {
  API_BASE_URL = url;
}

// ---------------------------------------------------------------------------
// Generic POST helper
// ---------------------------------------------------------------------------

/**
 * Perform a POST request to the given path with a JSON body.
 *
 * - Attaches the auth token (if set) as a Bearer header.
 * - Enforces a 10-second timeout via AbortController.
 * - Catches network / timeout errors gracefully and returns null instead
 *   of throwing, so callers in offline scenarios can treat null as "failed".
 */
export async function post<T = unknown>(
  path: string,
  body: unknown,
): Promise<T | null> {
  const url = `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (_authToken) {
    headers["Authorization"] = `Bearer ${_authToken}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[API] POST ${path} failed with status ${response.status}`,
      );
      return null;
    }

    const data = (await response.json()) as T;
    return data;
  } catch (err: unknown) {
    // Network error or timeout — expected when offline
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[API] POST ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      console.warn(`[API] POST ${path} network error:`, err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Typed endpoint helpers
// ---------------------------------------------------------------------------

/**
 * POST a panic / SOS alert to the coordination API.
 */
export async function postPanicAlert(data: unknown): Promise<unknown | null> {
  return post("/panic", data);
}

/**
 * POST a status update.
 */
export async function postStatusUpdate(data: unknown): Promise<unknown | null> {
  return post("/status", data);
}

/**
 * POST a check-in.
 */
export async function postCheckIn(data: unknown): Promise<unknown | null> {
  return post("/checkins", data);
}

/**
 * POST a message.
 */
export async function postMessage(data: unknown): Promise<unknown | null> {
  return post("/messages", data);
}

/**
 * POST student registration to the coordination API.
 */
export async function postStudentRegistration(data: unknown): Promise<unknown | null> {
  return post("/students", data);
}
