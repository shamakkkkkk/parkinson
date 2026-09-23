/**
 * Small fetch wrapper shared by every API module.
 *
 * Centralizing this (instead of each caller building its own fetch options,
 * as the previous `experimentApi.js` did) means auth headers, error
 * handling, and the base URL only need to be correct in one place.
 */
import { getToken } from "./session";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL =
  (rawApiBaseUrl && String(rawApiBaseUrl).trim().replace(/\/+$/, "")) ||
  "http://localhost:3001";

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function requestJson(path, options = {}) {
  const { auth = true, headers, ...rest } = options;
  const url = `${API_BASE_URL}${path}`;
  const token = auth ? getToken() : null;

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (!response.ok) {
    let body = null;
    let message = `Request failed with status ${response.status}`;

    try {
      body = await response.json();
      // myBackend's own errors use {message}; requests proxied straight
      // through to experiment-api use {error} instead (see its openapi.yaml
      // Error schema) - check both instead of only the first.
      const rawMessage = body?.message ?? body?.error;
      if (rawMessage) {
        message = Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage;
      }
    } catch {
      // response wasn't JSON - fall back to the generic message above
    }

    throw new ApiError(message, { status: response.status, body });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
