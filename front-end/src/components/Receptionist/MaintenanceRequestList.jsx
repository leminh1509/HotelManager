import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function MaintenanceRequestList() {
    const [requests, setRequests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

<<<<<<< HEAD
    // Search and Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Form state
=======
>>>>>>> c79c43284b99177070abadb14ab905f672a38e68
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

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:9999/api/requests/maintenance", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(res.data.content || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Failed to load maintenance requests");
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
            await axios.post("http://localhost:9999/api/requests/maintenance", newRequest, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Request created successfully!");
            setShowModal(false);
            setNewRequest({ roomId: "", description: "", priority: "MEDIUM" });
            fetchRequests();
        } catch (err) {
            console.error(err);
            alert("Failed to create request");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    // Filter logic
    const filteredRequests = requests.filter(req =>
        req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.room && req.room.roomNumber.toString().includes(searchTerm)) ||
        req.id.toString().includes(searchTerm) ||
        req.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Maintenance Requests</h2>
                <div className="d-flex gap-3 align-items-center">
                    <div className="search-box">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Create
                    </button>
                </div>
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
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-4">
                                    {searchTerm ? `No results found for "${searchTerm}"` : "No requests found."}
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((req) => (
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

            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
                    <div className="text-muted small">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length}
                    </div>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => paginate(currentPage - 1)}>Prev</button>
                            </li>
                            {[...Array(totalPages)].map((_, i) => (
                                <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                                    <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => paginate(currentPage + 1)}>Next</button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

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
