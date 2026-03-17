import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <button 
        className="pagination-btn" 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 0}
      >
        &laquo; Previous
      </button>
      
      <div className="pagination-pages">
        {pages.map(page => (
          <button
            key={page}
            className={`pagination-page-number ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page + 1}
          </button>
        ))}
      </div>

      <button 
        className="pagination-btn" 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages - 1}
      >
        Next &raquo;
      </button>
    </div>
  );
};

export default Pagination;
