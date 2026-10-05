/** Turns any backend/network failure into a friendly, user-safe message. */
export class ApiError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(fallback: string, cause: unknown): ApiError {
  // Never surface raw stack traces or provider internals to the user.
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return new ApiError("You appear to be offline. Check your connection and try again.", cause);
  }
  console.error("[api]", fallback, cause);
  return new ApiError(fallback, cause);
}
