import React, { useState, useEffect } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./Guidelines.css";

export default function Guidelines({ user, role, onLogout }) {
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:9999/api/guidelines");
      if (!res.ok) {
        throw new Error("Failed to fetch guidelines");
      }
      const data = await res.json();
      setGuidelines(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load guidelines. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="guidelines-page-wrapper">
      <Header user={user} role={role} onLogout={onLogout} />

      <main className="guidelines-main-content">
        <div className="guidelines-header-banner">
          <h1>Hotel Guidelines & Policies</h1>
          <p>Please review our guidelines to ensure a pleasant stay.</p>
        </div>

        <div className="container guidelines-container">
          {loading ? (
            <div className="guidelines-loading">Loading guidelines...</div>
          ) : error ? (
            <div className="guidelines-error">{error}</div>
          ) : guidelines.length === 0 ? (
            <div className="guidelines-empty">No guidelines available at the moment.</div>
          ) : (
            <div className="guidelines-list">
              {guidelines.map((g) => (
                <div key={g.guidelineId} className="guideline-card">
                  <div className="guideline-card-header">
                    <h2>{g.title}</h2>
                    <span className="guideline-date">
                      Last updated: {formatDate(g.updatedAt)}
                    </span>
                  </div>
                  <div className="guideline-card-body">
                    {g.content.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
