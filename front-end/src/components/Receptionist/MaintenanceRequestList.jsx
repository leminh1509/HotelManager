import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function MaintenanceRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [newRequest, setNewRequest] = useState({
        roomId: "",
        description: "",
        type: "MAINTENANCE", // Default from enum
        priority: "MEDIUM"
    });
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    // Fetch requests
    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:9999/api/requests", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Failed to load maintenance requests");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRequest(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newRequest.description) {
            alert("Description is required");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:9999/api/requests", newRequest, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Request created successfully!");
            setShowModal(false);
            setNewRequest({ roomId: "", description: "", type: "MAINTENANCE", priority: "MEDIUM" });
            fetchRequests();
        } catch (err) {
            console.error(err);
            alert("Failed to create request");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Maintenance Requests</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Create Request
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="table-responsive shadow-sm">
                <table className="table table-hover table-striped">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Room</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center">No requests found.</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td>#{req.id}</td>
                                    <td>{req.room ? `Room ${req.room.roomNumber}` : "General"}</td>
                                    <td>{req.description}</td>
                                    <td><span className="badge bg-secondary">{req.type}</span></td>
                                    <td>
                                        <span className={`badge ${req.priority === "HIGH" || req.priority === "URGENT" ? "bg-danger" :
                                                req.priority === "MEDIUM" ? "bg-warning text-dark" : "bg-info"
                                            }`}>
                                            {req.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${req.status === "COMPLETED" ? "bg-success" :
                                                req.status === "IN_PROGRESS" ? "bg-primary" :
                                                    req.status === "CANCELLED" ? "bg-secondary" : "bg-warning text-dark"
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>{new Date(req.reportedAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">New Maintenance Request</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Room ID (Optional)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="roomId"
                                            value={newRequest.roomId}
                                            onChange={handleInputChange}
                                            placeholder="Leave empty for general area"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Type</label>
                                        <select className="form-select" name="type" value={newRequest.type} onChange={handleInputChange}>
                                            <option value="MAINTENANCE">Maintenance</option>
                                            <option value="CLEANING">Cleaning</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Priority</label>
                                        <select className="form-select" name="priority" value={newRequest.priority} onChange={handleInputChange}>
                                            <option value="LIGHT">Light</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            rows="3"
                                            value={newRequest.description}
                                            onChange={handleInputChange}
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? "Submitting..." : "Submit Request"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
