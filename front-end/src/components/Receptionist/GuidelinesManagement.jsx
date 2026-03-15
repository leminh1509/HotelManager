import React, { useState, useEffect } from "react";
import "../Admin/AdminLayout.css"; // Reuse generic admin styles or create specific ones if needed
import "./GuidelinesManagement.css";

export default function GuidelinesManagement() {
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);

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
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // --- Handlers for Modal ---
  const handleOpenAddModal = () => {
    setEditingGuideline(null);
    setFormData({ title: "", content: "" });
    setShowModal(true);
  };

  const handleOpenEditModal = (guideline) => {
    setEditingGuideline(guideline);
    setFormData({ title: guideline.title, content: guideline.content });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGuideline(null);
    setFormData({ title: "", content: "" });
  };

  // --- CRUD API Calls ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Title and Content are required.");
      return;
    }

    try {
      setIsSaving(true);
      const isEditing = !!editingGuideline;
      const url = isEditing
        ? `http://localhost:9999/api/guidelines/${editingGuideline.guidelineId}`
        : "http://localhost:9999/api/guidelines";
      
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "create"} guideline`);
      }

      await fetchGuidelines(); 
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this guideline?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:9999/api/guidelines/${id}`, {
        method: "DELETE",
        headers: {
           "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to delete guideline");
      }

      await fetchGuidelines();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="guidelines-mgmt-container">
      <div className="mgmt-header">
        <h2>Guidelines Management</h2>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <i className="fa fa-plus"></i> Add New Guideline
        </button>
      </div>

      {loading ? (
        <div className="alert alert-info">Loading guidelines...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped mgmt-table">
            <thead>
              <tr>
                <th width="5%">ID</th>
                <th width="20%">Title</th>
                <th width="45%">Content Preview</th>
                <th width="15%">Last Updated</th>
                <th width="15%" className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guidelines.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No guidelines found.</td>
                </tr>
              ) : (
                guidelines.map((g) => (
                  <tr key={g.guidelineId}>
                    <td>{g.guidelineId}</td>
                    <td>{g.title}</td>
                    <td className="content-preview">
                      {g.content.length > 80 ? g.content.substring(0, 80) + "..." : g.content}
                    </td>
                    <td>{formatDate(g.updatedAt)}</td>
                    <td className="text-center actions-col">
                      <button 
                        className="btn btn-sm btn-outline-primary me-2" 
                        onClick={() => handleOpenEditModal(g)}
                        title="Edit"
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => handleDelete(g.guidelineId)}
                        title="Delete"
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Add / Edit Modal --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="custom-modal">
            <div className="modal-header">
              <h3>{editingGuideline ? "Edit Guideline" : "Add New Guideline"}</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label>Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter policy title"
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Content <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    rows="8"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter detailed policy content..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
