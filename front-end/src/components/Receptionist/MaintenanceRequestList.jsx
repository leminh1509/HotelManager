import React, { useEffect, useState } from "react";
import axios from "axios";

const PAGE_SIZE = 10;

export default function MaintenanceRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:9999/api/requests/cleaning", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data.content || []);
            } catch (err) {
                console.error(err);
                setError("Failed to load cleaning requests");
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    if (loading) return <div>Loading...</div>;

    const filtered = requests.filter(req => {
        const term = searchTerm.toLowerCase();
        return (
            req.id?.toString().includes(term) ||
            req.room?.roomNumber?.toString().toLowerCase().includes(term) ||
            req.description?.toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Cleaning Requests</h2>
                <input
                    type="text"
                    className="form-control w-auto"
                    placeholder="Search by ID, Room or Description..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
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
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    {searchTerm ? `No results for "${searchTerm}"` : "No cleaning requests found."}
                                </td>
                            </tr>
                        ) : (
                            paginated.map((req) => (
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
                <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        &laquo; Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={`btn btn-sm ${currentPage === page ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next &raquo;
                    </button>
                </div>
            )}

            <div className="text-center text-muted mt-2 small">
                Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} requests
                {searchTerm && ` (filtered from ${requests.length} total)`}
            </div>
        </div>
    );
}
