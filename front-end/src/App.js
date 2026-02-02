// /src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import ProtectedRoute from "./components/Protected/ProtectedRoute";
import RequireRole from "./components/Protected/RequireRole";
import RoleRedirect from "./components/Protected/RoleRedirect";

import AdminLayout from "./components/Admin/AdminLayout";
import UserManagement from "./components/Admin/Usermanagement";

import RoomDetail from "./components/Booking/RoomDetail";
import BookingForm from "./components/Booking/BookingForm";
import BookingConfirmation from "./components/Booking/BookingConfirmation";
import MyBookings from "./components/Booking/MyBookings";
import Home from "./components/Home/Home";
import BookingList from "./components/Receptionist/BookingList";
import MaintenanceRequests from "./components/Maintenance/Requests";
import MaintenanceDashboard from "./components/Maintenance/MaintenanceDashboard";
import Payment from "./components/Payment/Payment";

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

  useEffect(() => {
    // Load user khi app khởi động
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
  };

  const handleRegisterSuccess = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setCurrentUser(null);
  };

  return (
    <Routes>
      <Route path="/" element={<Home user={currentUser} role={currentUser?.role} onLogout={handleLogout} />} />
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* ===== CUSTOMER/USER ===== */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home user={currentUser} role={currentUser?.role} onLogout={handleLogout} />} />
        <Route path="/payment" element={<Payment />} />

        {/* ===== BOOKING ===== */}

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
      {/* ===== RECEPTIONIST ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RequireRole allowed={["RECEPTIONIST"]} />}>
          <Route path="/receptionist/booking-list" element={<BookingList />} />
        </Route>
      </Route>
      {/* ===== MAINTENANCE ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RequireRole allowed={["MAINTENANCE"]} />}>
          <Route path="/maintenance/dashboard" element={<MaintenanceDashboard />} />
          <Route path="/maintenance/requests" element={<MaintenanceRequests />} />
        </Route>
      </Route>





    </Routes>
  );
}