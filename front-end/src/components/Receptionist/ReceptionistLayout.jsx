import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../Admin/AdminLayout.css"; // Reuse Admin styles for consistency

export default function ReceptionistLayout() {
  const [user, setUser] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

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
    <div className={`admin-layout ${isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="d-flex justify-content-between align-items-center">
            {!isCollapsed && <h2>Front Desk</h2>}
            <button className="toggle-btn" onClick={toggleSidebar}>
              <i className={`fa ${isCollapsed ? "fa-indent" : "fa-outdent"}`}></i>
            </button>
          </div>
          {user && !isCollapsed && (
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
            <i className="fa fa-calendar"></i> {!isCollapsed && "Bookings"}
          </NavLink>

          <NavLink
            to="/receptionist/rooms"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-bed"></i> {!isCollapsed && "Rooms"}
          </NavLink>

          <NavLink
            to="/receptionist/payments"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-credit-card"></i> {!isCollapsed && "Payment Status"}
          </NavLink>

          <NavLink
            to="/receptionist/maintenance"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <i className="fa fa-cog"></i> {!isCollapsed && "Cleaning Requests"}
          </NavLink>



          {/* Add more links if needed */}

          <button onClick={handleLogout} className="nav-item logout-btn">
            <i className="fa fa-sign-out"></i> {!isCollapsed && "Logout"}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${isCollapsed ? "collapsed" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
