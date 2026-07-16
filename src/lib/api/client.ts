import axios, { type AxiosError } from "axios";

// Every backend call in the app goes through this one instance so retry/timeout/
// error-normalization behavior is consistent everywhere.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  timeout: 60_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string }>) => {
    // Blob downloads (reports) return JSON error bodies as Blobs — decode them
    // so the UI shows the real message instead of a generic "Network Error".
    let detail = error.response?.data?.detail;
    const raw = error.response?.data as unknown;
    if ((!detail || typeof detail !== "string") && raw instanceof Blob) {
      try {
        const text = await raw.text();
        const parsed = JSON.parse(text) as { detail?: string };
        detail = parsed.detail;
      } catch {
        // keep falling through to axios message
      }
    }
    const message =
      (typeof detail === "string" ? detail : undefined) ??
      error.message ??
      "Request failed — check your connection and try again.";
    return Promise.reject(new Error(message));
  },
);

/** Small retry helper for the one-shot (non-React-Query) call sites — e.g.
 * scenario comparison, which fetches two forecasts directly rather than
 * through `useForecast()`. Retries only transient failures (network/5xx),
 * never a 4xx (bad request), with a short linear backoff. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const isClientError = typeof status === "number" && status >= 400 && status < 500;
      if (isClientError || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}
