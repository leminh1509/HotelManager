import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function normalizeRole(role) {
  if (!role) return "";
  const r = String(role).toUpperCase();
  return r.startsWith("ROLE_") ? r.slice(5) : r;
}

export default function RequireRole({ allowed = [] }) {
  const token = localStorage.getItem("token");
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();

  const role = normalizeRole(user?.role || localStorage.getItem("role"));

  if (!token) return <Navigate to="/login" replace />;
  if (!allowed.map(normalizeRole).includes(role)) return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}
