import React, { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getRole, logout } from "../../utils/auth";
import "./Sidebar.css";

const MENU = [
  { label: "Dashboard", to: "/admin", roles: ["ADMIN", "MANAGER", "RECEPTIONIST"] },
  { label: "User Management", to: "/admin/users", roles: ["ADMIN"] },
,
];


export default function Sidebar() {
  const nav = useNavigate();
  const role = (getRole() || "").toUpperCase();


  const items = useMemo(() => {
    return MENU.filter((m) => !m.roles || m.roles.includes(role));
  }, [role]);

  const onLogout = () => {
    logout();
    nav("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebarBrand">HMS Admin</div>

      <div className="sidebarRole">Role: {role || "UNKNOWN"}</div>

      <nav className="sidebarNav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/admin"}
            className={({ isActive }) =>
              "sidebarLink" + (isActive ? " sidebarLinkActive" : "")
            }
          >
            {it.label}
          </NavLink>
        ))}
      </nav>

      <button className="sidebarLogout" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}
