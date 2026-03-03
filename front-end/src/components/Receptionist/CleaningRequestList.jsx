import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CleaningRequestList() {
    const [requests, setRequests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [newRequest, setNewRequest] = useState({
        roomId: "",
        description: "",
        priority: "MEDIUM"
    });
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    const fetchRooms = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:9999/api/rooms", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const roomList = res.data;
            setRooms(roomList);
            if (roomList.length > 0) {
                setNewRequest(prev => ({ ...prev, roomId: roomList[0].roomId }));
            }
        } catch (err) {
            console.error("Failed to load rooms", err);
        }
    };

    // Fetch requests
    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token");
            // Use the specific cleaning endpoint
            const res = await axios.get("http://localhost:9999/api/requests/cleaning", {
                headers: { Authorization: `Bearer ${token}` },
            });
            // The endpoint returns a Page object, so we likely need res.data.content
            setRequests(res.data.content || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Failed to load cleaning requests");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchRooms();
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
            await axios.post("http://localhost:9999/api/requests/cleaning", newRequest, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Cleaning request created successfully!");
            setShowModal(false);
            setNewRequest({ roomId: "", description: "", priority: "MEDIUM" });
            fetchRequests();
        } catch (err) {
            console.error(err);
            alert("Failed to create cleaning request");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Cleaning Requests</h2>
                <button className="btn btn-success" onClick={() => setShowModal(true)}>
                    + Request Cleaning
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
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center">No cleaning requests found.</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td>#{req.id}</td>
                                    <td>{req.room ? `Room ${req.room.roomNumber}` : "General"}</td>
                                    <td>{req.description}</td>
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
                                <h5 className="modal-title">New Cleaning Request</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Room (Optional)</label>
                                        <select
                                            className="form-select"
                                            name="roomId"
                                            value={newRequest.roomId}
                                            onChange={handleInputChange}
                                        >
                                            {rooms.map(room => (
                                                <option key={room.roomId} value={room.roomId}>
                                                    Room {room.roomNumber} — {room.category?.name || ""}
                                                </option>
                                            ))}
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
                                            placeholder="e.g., Needs fresh towels, Spill in lobby..."
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? "Submit Request" : "Submit Request"}
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
