// src/components/Header/MaintenanceHeader.jsx
import React from 'react';
import { NavLink, Link } from "react-router-dom";
import "./MaintenanceHeader.css";

const MaintenanceHeader = ({ user, onLogout }) => {
    return (
        <header className="maintenance-header-wrapper">
            <div className="mh-top-bar">
                <div className="mh-container">
                    <div className="mh-brand">
                        <Link to="/maintenance/dashboard" className="mh-logo-text">
                            <i className="fa fa-wrench"></i> Maintenance Portal
                        </Link>
                    </div>
                    <div className="mh-user-actions">
                        <span className="mh-user-name">
                            Hi, {user?.firstName || 'Staff'}
                        </span>
                        <button onClick={onLogout} className="mh-logout-btn">
                            <i className="fa fa-sign-out"></i> Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="mh-nav-bar">
                <div className="mh-container">
                    <nav className="mh-nav">
                        <NavLink to="/maintenance/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                            <i className="fa fa-dashboard me-2"></i> Dashboard
                        </NavLink>
                        <NavLink to="/maintenance/cleaning-tasks" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                            <i className="fa fa-broom me-2"></i> Dọn dẹp
                        </NavLink>
                        {/* Add more maintenance specific links here later if needed */}
                        {/* Example: 
                        <NavLink to="/maintenance/schedule" className={({isActive}) => isActive ? 'active' : ''}>
                            Schedule
                        </NavLink> 
                        */}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default MaintenanceHeader;
