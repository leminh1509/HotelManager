export function setAuth({ token, role }) {
  localStorage.setItem("accessToken", token);
  localStorage.setItem("role", normalizeRole(role));
}

export function getToken() {
  return localStorage.getItem("accessToken");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("role");
}

function normalizeRole(role) {
  if (!role) return "";
  const r = String(role).toUpperCase();
  return r.startsWith("ROLE_") ? r.replace("ROLE_", "") : r;
}
