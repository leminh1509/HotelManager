import React, { useEffect, useState } from "react";
import axios from "axios";

export default function MaintenanceRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:9999/api/requests/maintenance", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data.content || []);
            } catch (err) {
                console.error(err);
                setError("Failed to load maintenance requests");
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Maintenance Requests</h2>

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
                                <td colSpan="6" className="text-center">No maintenance requests found.</td>
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
        </div>
    );
}
