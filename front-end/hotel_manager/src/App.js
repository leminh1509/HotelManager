// src/App.js
import "./App.css";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import PaymentPage from "./components/PaymentPage";


function App() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="App">
      <Header
        user={user}
        role={user?.role === "RECEPTIONIST" ? "receptionist" : "guest"}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1 }}>
        <PaymentPage />
      </main>
      <Footer />
    </div>
  );
}

export default App;
