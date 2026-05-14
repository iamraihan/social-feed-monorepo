import "server-only";
import { env } from "@/config/env";
import type { ApiError, ApiErrorCode, ApiSuccess } from "./api-types";
import { logError } from "./safe-log";

// Thin typed wrapper around `fetch` that talks to the backend.
//
// Responsibilities:
//   - Set the base URL + JSON headers once.
//   - Unwrap the canonical `{success, data}` envelope so callers receive
//     plain payloads.
//   - Throw `ApiClientError` carrying the backend's semantic code, message,
//     and field-level details on any non-success response. Server actions
//     catch and translate this into form-level error state.
//   - Forward an optional Bearer token (caller supplies — keeps the client
//     agnostic so it can be used both for the auth handshake and for
//     authenticated requests later).
//   - Forward an optional Cookie header (for endpoints whose Set-Cookie
//     header we need to capture, e.g. /auth/login → refresh_token cookie).
//   - Enforce a request timeout (default 10s) via AbortController so a
//     hung backend never stalls a Server Action indefinitely.
//   - Safely parse JSON — backend gateways sometimes return HTML 502 pages
//     which would otherwise throw SyntaxError and skip our error mapping.
//   - Default `cache: 'no-store'` for credential flows; callers can opt
//     into Next.js cache semantics per-call once authenticated GETs land.

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: string[];

  constructor(args: {
    code: ApiErrorCode;
    message: string;
    status: number;
    details?: string[];
  }) {
    super(args.message);
    this.name = "ApiClientError";
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string;
  cookieHeader?: string;
  signal?: AbortSignal;
  /** Override the default 10s timeout. Set to 0 to disable. */
  timeoutMs?: number;
  /** Next.js fetch cache directive. Defaults to 'no-store'. */
  cache?: RequestCache;
  /** Next.js revalidation hints (per-call). */
  next?: NextFetchRequestConfig;
}

interface RequestResult<TData, TMeta = unknown> {
  data: TData;
  /** Optional pagination/meta object from the backend envelope. */
  meta?: TMeta;
  response: Response;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function statusToCode(status: number): ApiErrorCode {
  if (status >= 500) return "INTERNAL_SERVER_ERROR";
  if (status === 429) return "TOO_MANY_REQUESTS";
  if (status === 415) return "UNSUPPORTED_MEDIA_TYPE";
  if (status === 413) return "PAYLOAD_TOO_LARGE";
  if (status === 409) return "CONFLICT";
  if (status === 404) return "NOT_FOUND";
  if (status === 403) return "FORBIDDEN";
  if (status === 401) return "UNAUTHORIZED";
  return "BAD_REQUEST";
}

export async function apiRequest<TData, TMeta = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<RequestResult<TData, TMeta>> {
  // FormData carries its own multipart boundary in Content-Type — setting
  // application/json would corrupt it. Detect and let the browser/runtime
  // fill the header automatically.
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (options.accessToken)
    headers.Authorization = `Bearer ${options.accessToken}`;
  if (options.cookieHeader) headers.Cookie = options.cookieHeader;

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutHandle =
    timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  // Chain caller signal → our controller so either source aborts the fetch.
  // `aborted`-already check first: addEventListener won't fire for events
  // that already happened, so the caller's pre-aborted signal would silently
  // no-op without this branch.
  if (options.signal?.aborted) {
    controller.abort();
  } else {
    options.signal?.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  let response: Response;
  try {
    response = await fetch(`${env.API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      cache: options.cache ?? "no-store",
      next: options.next,
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      logError("[api-client] request timed out", { path, timeoutMs });
      throw new ApiClientError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Request timed out. Please try again.",
        status: 504,
      });
    }
    logError("[api-client] network failure", {
      path,
      message: (err as Error).message,
    });
    throw new ApiClientError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Backend is unreachable.",
      status: 0,
    });
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }

  // 204 No Content — endpoints like /auth/logout return empty body. Treat
  // `undefined` as TData; callers that don't care typecheck it as `void`.
  if (response.status === 204) {
    return { data: undefined as TData, response };
  }

  let raw: ApiSuccess<TData> | ApiError;
  try {
    raw = (await response.json()) as ApiSuccess<TData> | ApiError;
  } catch {
    logError("[api-client] non-JSON response", {
      path,
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    throw new ApiClientError({
      code: statusToCode(response.status),
      message: `Backend returned non-JSON ${response.status}`,
      status: response.status,
    });
  }

  if (!raw.success) {
    throw new ApiClientError({
      code: raw.error.code,
      message: raw.error.message,
      status: response.status,
      details: raw.error.details,
    });
  }

  return { data: raw.data, meta: raw.meta as TMeta | undefined, response };
}
