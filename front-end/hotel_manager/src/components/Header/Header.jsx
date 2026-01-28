// src/components/Header/Header.jsx
import React, { useMemo, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Header.css";

export default function Header({
  user = null,
  role = "guest",
  pageActive = null,
  onLogout,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isReceptionistMenu = useMemo(() => {
    return role === "receptionist" || Boolean(pageActive);
  }, [role, pageActive]);

  const receptionistItems = [
    { key: "booking-list", label: "Booking List", to: "/receptionist/booking-list" },
    { key: "create-booking", label: "Create Booking", to: "/receptionist/create-booking" },
    { key: "room-fees", label: "Room Fees", to: "/receptionist/room-fees" },
    { key: "bills", label: "Bills", to: "/receptionist/bills" },
    { key: "rules", label: "Rules", to: "/receptionist/rules" },
    { key: "rooms", label: "Rooms", to: "/receptionist/rooms" },
  ];

  const guestItems = [
    { label: "Home", to: "/home", end: true },
    { label: "Rooms", to: "/rooms" },
    { label: "Guidelines", to: "/guidelines" },
    { label: "Rules", to: "/rules" },
    { label: "My Requests", to: "/user/requests" },
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="header-section">
      <div className="top-nav">
        <div className="container">
          <div className="row top-nav-row">
            <div className="col-left">
              <ul className="tn-left">
                <li>
                  <i className="fa fa-phone" /> (84) 359 797 703
                </li>
                <li>
                  <i className="fa fa-envelope" /> 36hotel@gmail.com
                </li>
              </ul>
            </div>

            <div className="col-right">
              <div className="tn-right">
                {!user ? (
                  <>
                    <NavLink to="/login" className="user-nav-link">
                      <i className="fa fa-sign-in" /> Login
                    </NavLink>
                    <NavLink to="/register" className="user-nav-link register-btn">
                      <i className="fa fa-user-plus" /> Be our member
                    </NavLink>
                  </>
                ) : (
                  <>
                    <div className="user-nav-link user-welcome">
                      <NavLink to="/profile">
                        <i className="fa fa-user-circle-o" /> Hi, {user.firstName}
                      </NavLink>
                    </div>

                    <NavLink to="/my-bookings" className="user-nav-link">
                      <i className="fa fa-book" /> My Bookings
                    </NavLink>
                    <button
                      type="button"
                      className="user-nav-link btn-linklike"
                      onClick={() => {
                        onLogout?.();
                      }}
                    >
                      <i className="fa fa-sign-out" /> Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN MENU */}
      <div className="menu-item">
        <div className="container">
          <div className="row menu-row">
            <div className="logo-col">
              <div className="logo">
                <Link to="/home">
                  <img
                    src="/hms/img/36x.png"
                    alt="36 Hotel Logo"
                    className="logo-img"
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </Link>
              </div>
            </div>

            <div className="nav-col">
              <div className="nav-menu">
                {/* Mobile toggle */}
                <button
                  type="button"
                  className="mobile-toggle"
                  onClick={() => setMobileOpen((s) => !s)}
                  aria-label="Toggle menu"
                  aria-expanded={mobileOpen}
                >
                  <i className="fa fa-bars" />
                </button>

                <nav className={`mainmenu ${mobileOpen ? "open" : ""}`}>
                  {isReceptionistMenu ? (
                    <ul>
                      {receptionistItems.map((it) => (
                        <li key={it.key} className={pageActive === it.key ? "active" : ""}>
                          <Link to={it.to} onClick={closeMobile}>
                            {it.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul>
                      {guestItems.map((it) => (
                        <li key={it.to}>
                          <NavLink
                            to={it.to}
                            end={Boolean(it.end)}
                            className={({ isActive }) => (isActive ? "active-link" : "")}
                            onClick={closeMobile}
                          >
                            {it.label}
                          </NavLink>
                        </li>
                      ))}
                      {user && (
                        <li className="mobile-only-link">
                          <NavLink
                            to="/my-bookings"
                            className={({ isActive }) => (isActive ? "active-link" : "")}
                            onClick={closeMobile}
                          >
                            My Bookings
                          </NavLink>
                        </li>
                      )}
                    </ul>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
