export const ACCESS_TOKEN = "accessToken";
export function getToken() {
  return localStorage.getItem(ACCESS_TOKEN);
}
export function setToken(token) {
  localStorage.setItem(ACCESS_TOKEN, token);
}
export function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN);
}
export function isAuthenticated() {
  return Boolean(getToken());
}
export function getTokenPayload() {
  const token = getToken();
  if (!token) return null;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    // JWT uses base64url
    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
export function getUserFullNameFromToken() {
  const payload = getTokenPayload();
  if (!payload) return "";
  const first = payload.first_name ?? "";
  const last = payload.last_name ?? "";
  return `${first} ${last}`.trim();
}

export function getUserProjectNameFromToken() {
  return getUserFullNameFromToken().toUpperCase();
}

export function isAdmin() {
  return Boolean(getTokenPayload()?.is_admin);
}