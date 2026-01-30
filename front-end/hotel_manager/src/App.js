import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./components/Login/Login";

import ProtectedRoute from "./components/Protected/ProtectedRoute";
import RequireRole from "./components/Protected/RequireRole";
import RoleRedirect from "./components/Protected/RoleRedirect";

import AdminLayout from "./components/Admin/AdminLayout";
import UserManagement from "./components/Admin/Usermanagement";

// ====== USER HOME (bạn thay đúng path Home của bạn) ======
import Home from "./components/Home/Home";

// ====== RECEPTIONIST (bạn thay đúng component thật) ======
import BookingList from "./components/Receptionist/BookingList";

// ====== MAINTENANCE (bạn thay đúng component thật) ======
import MaintenanceRequests from "./components/Maintenance/Requests";

const Forbidden = () => <div style={{ padding: 20 }}>403 - Forbidden</div>;
const AdminDashboard = () => <div>Admin Dashboard</div>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* ===== USER ===== */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
      </Route>

      {/* ===== ADMIN ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RequireRole allowed={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Route>
      </Route>

      {/* ===== RECEPTIONIST ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RequireRole allowed={["RECEPTIONIST"]} />}>
          <Route path="/receptionist/booking-list" element={<BookingList />} />
        </Route>
      </Route>

      {/* ===== MAINTENANCE ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RequireRole allowed={["MAINTENANCE"]} />}>
          <Route path="/maintenance/requests" element={<MaintenanceRequests />} />
        </Route>
      </Route>
    </Routes>
  );
}
