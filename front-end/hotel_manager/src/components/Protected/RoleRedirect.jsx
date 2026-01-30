import React from "react";
import { Navigate } from "react-router-dom";

const normalizeRole = (role) => {
  if (!role) return "";
  const r = String(role).toUpperCase();
  return r.startsWith("ROLE_") ? r.replace("ROLE_", "") : r;
};

export default function RoleRedirect() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  
  const role = normalizeRole(user?.role);

  if (role === "ADMIN") return <Navigate to="/admin" replace />;
  if (role === "RECEPTIONIST") return <Navigate to="/receptionist/booking-list" replace />;
  if (role === "MAINTENANCE") return <Navigate to="/maintenance/requests" replace />;
  return <Navigate to="/home" replace />;
}
