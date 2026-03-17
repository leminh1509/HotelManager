import React from 'react';
import './DetailModal.css';

const DetailModal = ({ isOpen, onClose, title, content, updatedAt, formatDate }) => {
  if (!isOpen) return null;

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <h2>{title}</h2>
          <button className="detail-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="detail-modal-body">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Title</th>
                <td>{title}</td>
              </tr>
              <tr>
                <th>Content</th>
                <td>
                  <div className="detail-modal-text">
                    {content.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <th>Last Updated</th>
                <td>{formatDate(updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="detail-modal-footer">
          <button className="detail-modal-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
