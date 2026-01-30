import React, { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);



  const role = (user?.role || "").toLowerCase();

  const menu = useMemo(() => {
    const items = [
      { label: "Dashboard", path: "/admin", roles: ["admin"] },
      { label: "User Management", path: "/admin/users", roles: ["admin"] },
      { label: "Room Management", path: "/admin/rooms", roles: ["admin"] },
      { label: "Booking Management", path: "/admin/bookings", roles: ["admin"] },
      { label: "Reports", path: "/admin/reports", roles: ["admin"] },
      { label: "Settings", path: "/admin/settings", roles: ["admin"] },
    ];

    return items.filter(i => i.roles.includes(role));
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-dot" />
          <div>
            <div className="brand-title">HMS Admin</div>
            <div className="brand-sub">Role: {role || "unknown"}</div>
          </div>
        </div>

        <nav className="admin-nav">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                "admin-link" + (isActive ? " active" : "")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div className="topbar-title">Admin Panel</div>
          <div className="topbar-user">
            {user?.firstName || ""} {user?.lastName || ""}
          </div>
        </div>

        {/* QUAN TRỌNG: Outlet để render trang con => nếu thiếu sẽ trắng */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
