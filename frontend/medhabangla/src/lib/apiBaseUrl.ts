const LOCAL_API_URL_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export const getApiBaseUrl = (): string => {
  const rawApiBaseUrl = (import.meta.env.VITE_API_URL || "").trim();

  if (!rawApiBaseUrl) {
    return "";
  }

  const isLocalRuntime =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  // Prevent broken production calls when localhost is accidentally baked into frontend env.
  if (LOCAL_API_URL_PATTERN.test(rawApiBaseUrl) && !isLocalRuntime) {
    return "";
  }

  return rawApiBaseUrl.replace(/\/$/, "");
};
