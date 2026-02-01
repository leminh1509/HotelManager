// /src/components/Home/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";  
import Footer from "../Footer/Footer";  

export default function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user từ localStorage
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, []);

  const handleLogout = () => {
    // Xóa tất cả data trong localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    
    // Redirect về login
    navigate("/login", { replace: true });
  };

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      <div style={{ padding: 20, minHeight: "60vh" }}>
        <h2>Welcome to 36 Hotel</h2>
        {user ? (
          <p>Hello, {user.firstName} {user.lastName}! ({user.role})</p>
        ) : (
          <p>Please login to continue.</p>
        )}
      </div>
      <Footer />
    </>
  );
}