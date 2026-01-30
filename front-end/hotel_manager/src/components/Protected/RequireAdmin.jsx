import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getRole } from "../..//utils/auth";

export default function RequireAdmin() {
  const role = (getRole() || "").toUpperCase();
  if (role !== "ADMIN") return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

