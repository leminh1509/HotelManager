import React, { useState, useEffect } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Pagination from "../Common/Pagination";
import DetailModal from "../Common/DetailModal";
import "./Guidelines.css";

export default function Guidelines({ user, role, onLogout }) {
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Detail Modal State
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchGuidelines(currentPage);
  }, [currentPage]);

  const fetchGuidelines = async (page) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:9999/api/guidelines?page=${page}&size=10`);
      if (!res.ok) {
        throw new Error("Failed to fetch guidelines");
      }
      const data = await res.json();
      setGuidelines(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      setError("Unable to load guidelines. Please try again later.");
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

  const handleViewDetail = (guideline) => {
    setSelectedGuideline(guideline);
    setIsModalOpen(true);
  };

  const truncateContent = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
                <div 
                  key={g.guidelineId} 
                  className="guideline-card"
                  onClick={() => handleViewDetail(g)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="guideline-card-header">
                    <h2>{g.title}</h2>
                    <span className="guideline-date">
                      Last updated: {formatDate(g.updatedAt)}
                    </span>
                  </div>
                  <div className="guideline-card-body">
                    <p>{truncateContent(g.content)}</p>
                    {g.content.length > 200 && (
                      <button 
                        className="btn-view-detail" 
                        onClick={() => handleViewDetail(g)}
                      >
                        View Detail
                      </button>
                    )}
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

      {selectedGuideline && (
        <DetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedGuideline.title}
          content={selectedGuideline.content}
          updatedAt={selectedGuideline.updatedAt}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}
