// /src/App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import ProtectedRoute from "./components/Protected/ProtectedRoute";
import RequireRole from "./components/Protected/RequireRole";
import AdminLayout from "./components/Admin/AdminLayout";
import UserManagement from "./components/Admin/Usermanagement";
import RoomDetail from "./components/Booking/RoomDetail";
import BookingForm from "./components/Booking/BookingForm";
import BookingConfirmation from "./components/Booking/BookingConfirmation";
import MyBookings from "./components/Booking/MyBookings";
import Home from "./components/Home/Home";
import BookingList from "./components/Receptionist/BookingList";
import MaintenanceDashboard from "./components/Maintenance/MaintenanceDashboard";

const Forbidden = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <h1>403 - Forbidden</h1>
    <p>You don't have permission to access this page.</p>
    <a href="/">Go Home</a>
  </div>
);

const AdminDashboard = () => (
  <div>
    <h1>Admin Dashboard</h1>
    <p>Welcome to admin panel!</p>
  </div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const syncUserFromStorage = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentUser(userData);
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    syncUserFromStorage();
    const onAuthChanged = () => syncUserFromStorage();
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    window.dispatchEvent(new Event("auth:changed"));
  };

  const handleRegisterSuccess = (userData) => {
    setCurrentUser(userData);
    window.dispatchEvent(new Event("auth:changed"));
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setCurrentUser(null);
    window.dispatchEvent(new Event("auth:changed"));
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home user={currentUser} onLogout={handleLogout} />} />
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/rooms/:roomId" element={<RoomDetail />} />
        <Route path="/booking/new/:roomId" element={<BookingForm />} />
        <Route path="/booking/confirmation/:bookingId" element={<BookingConfirmation />} />
        <Route path="/my-bookings" element={<MyBookings />} />
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

      {/* ===== RECEPTIONIST ===== */} <Route element={<ProtectedRoute />}>
        <Route element={<RequireRole allowed={["RECEPTIONIST"]} />}>
          <Route path="/receptionist/booking-list" element={<BookingList />} />
        </Route>
      </Route>

      {/* ===== MAINTENANCE ===== */} <Route element={<ProtectedRoute />}>
        <Route element={<RequireRole allowed={["MAINTENANCE"]} />}>
          <Route path="/maintenance/dashboard" element={<MaintenanceDashboard />} />
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
