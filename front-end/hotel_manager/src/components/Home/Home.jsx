import React from "react";
import Header from "../Header/Header";  // nếu bạn có Header.jsx
import Footer from "../Footer/Footer";  // nếu bạn có Footer.jsx

export default function Home() {
  return (
    <>
      <Header />
      <div style={{ padding: 20 }}>
        <h2>Home (User)</h2>
        <p>Trang dành cho user/customer.</p>
      </div>
      <Footer />
    </>
  );
}
