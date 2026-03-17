import React, { useState, useEffect } from "react";
import Pagination from "../Common/Pagination";
import { getRules, createRule, updateRule, deleteRule } from "../../services/receptionistAPI";
import { showToast } from "../Common/Toast";
import "../Admin/AdminLayout.css";
import "./RulesManagement.css";

export default function RulesManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRules(currentPage);
  }, [currentPage]);

  const fetchRules = async (page) => {
    try {
      setLoading(true);
      const data = await getRules(page, 10);
      setRules(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error(err);
      setError("Unable to load rules. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setFormData({ title: "", content: "" });
    setShowModal(true);
  };

  const handleOpenEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({ title: rule.title, content: rule.content });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
    setFormData({ title: "", content: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast("Title and Content are required.", "warning");
      return;
    }

    try {
      setIsSaving(true);
      const isEditing = !!editingRule;

      if (isEditing) {
        await updateRule(editingRule.ruleId, formData);
        showToast("Rule updated successfully!", "success");
      } else {
        await createRule(formData);
        showToast("Rule created successfully!", "success");
      }

      await fetchRules(currentPage);
      handleCloseModal();
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) {
      return;
    }

    try {
      await deleteRule(id);
      showToast("Rule deleted successfully!", "success");
      await fetchRules(currentPage);
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  return (
    <div className="rules-mgmt-container">
      <div className="mgmt-header">
        <h2>Rules Management</h2>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <i className="fa fa-plus"></i> Add New Rule
        </button>
      </div>

      {loading ? (
        <div className="alert alert-info">Loading rules...</div>
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
              {rules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No rules found.</td>
                </tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.ruleId}>
                    <td>{r.ruleId}</td>
                    <td>{r.title}</td>
                    <td className="content-preview">
                      {r.content.length > 80 ? r.content.substring(0, 80) + "..." : r.content}
                    </td>
                    <td>{formatDate(r.updatedAt)}</td>
                    <td className="text-center actions-col">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpenEditModal(r)}
                        title="Edit"
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(r.ruleId)}
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

      {!loading && !error && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="custom-modal">
            <div className="modal-header">
              <h3>{editingRule ? "Edit Rule" : "Add New Rule"}</h3>
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
                    placeholder="Enter rule title"
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
                    placeholder="Enter detailed rule content..."
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
