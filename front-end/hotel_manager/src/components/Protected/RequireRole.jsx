import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const normalizeRole = (role) => {
  if (!role) return "";
  const r = String(role).toUpperCase();
  return r.startsWith("ROLE_") ? r.replace("ROLE_", "") : r;
};

export default function RequireRole({ allowed = [] }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = normalizeRole(user?.role);
  const ok = allowed.map(a => a.toUpperCase()).includes(role);

  if (!ok) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
