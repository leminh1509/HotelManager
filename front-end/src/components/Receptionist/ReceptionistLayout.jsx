import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../Admin/AdminLayout.css"; // Reuse Admin styles for consistency

export default function ReceptionistLayout() {
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
          <h2>Front Desk</h2>
          {user && (
            <p className="admin-user">
              <i className="fa fa-user-circle"></i> {user.firstName} {user.lastName}
            </p>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/receptionist"
            end
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-calendar"></i> Bookings
          </NavLink>

          <NavLink
            to="/receptionist/rooms"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-bed"></i> Rooms
          </NavLink>

          <NavLink
            to="/receptionist/payments"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-credit-card"></i> Payment Status
          </NavLink>

          <NavLink
            to="/receptionist/maintenance"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-wrench"></i> Maintenance
          </NavLink>

          <NavLink
            to="/receptionist/cleaning"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-paint-brush"></i> Cleaning
          </NavLink>

          {/* Add more links if needed */}

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
