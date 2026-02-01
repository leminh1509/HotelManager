// /src/components/Maintenance/Requests.jsx
import React from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

export default function MaintenanceRequests() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <>
      <Header user={user} role="maintenance" onLogout={handleLogout} />
      <div style={{ padding: 40, minHeight: "60vh" }}>
        <h2>Maintenance Requests</h2>
        <p>Quản lý các yêu cầu bảo trì.</p>
        {/* TODO: Implement maintenance requests */}
      </div>
      <Footer />
    </>
  );
}