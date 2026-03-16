import React, { useState, useEffect } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Pagination from "../Common/Pagination";
import "./Rules.css";

export default function Rules({ user, role, onLogout }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchRules(currentPage);
  }, [currentPage]);

  const fetchRules = async (page) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:9999/api/rules?page=${page}&size=10`);
      if (!res.ok) {
        throw new Error("Failed to fetch hotel rules");
      }
      const data = await res.json();
      setRules(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      setError("Unable to load hotel rules. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="rules-page-wrapper">
      <Header user={user} role={role} onLogout={onLogout} />

      <main className="rules-main-content">
        <div className="rules-header-banner">
          <h1>Hotel Rules & Regulations</h1>
          <p>Important information for all our guests to ensure security and comfort.</p>
        </div>

        <div className="container rules-container">
          {loading ? (
            <div className="rules-loading">Loading rules...</div>
          ) : error ? (
            <div className="rules-error">{error}</div>
          ) : rules.length === 0 ? (
            <div className="rules-empty">No specific rules available at the moment.</div>
          ) : (
            <div className="rules-list">
              {rules.map((r) => (
                <div key={r.ruleId} className="rule-card">
                  <div className="rule-card-header">
                    <h2>{r.title}</h2>
                    <span className="rule-date">
                      Last updated: {formatDate(r.updatedAt)}
                    </span>
                  </div>
                  <div className="rule-card-body">
                    {r.content.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}

              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
