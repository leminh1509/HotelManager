// /src/components/Admin/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>36 Hotel Admin</h2>
          {user && (
            <p className="admin-user">
              <i className="fa fa-user-circle"></i> {user.firstName} {user.lastName}
            </p>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink 
            to="/admin" 
            end 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-dashboard"></i> Dashboard
          </NavLink>

          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-users"></i> User Management
          </NavLink>

          <NavLink 
            to="/admin/rooms" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-bed"></i> Room Management
          </NavLink>

          <NavLink 
            to="/admin/bookings" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-calendar"></i> Bookings
          </NavLink>

          <NavLink 
            to="/admin/reports" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-bar-chart"></i> Reports
          </NavLink>

          <button onClick={handleLogout} className="nav-item logout-btn">
            <i className="fa fa-sign-out"></i> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}