import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const PAGE_SIZE = 10;

export default function MaintenanceRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [rooms, setRooms] = useState([]);

    // Real-time notification state
    const [wsMessage, setWsMessage] = useState(null);

    // Custom Toast State
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Search and Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Form state
    const [newRequest, setNewRequest] = useState({
        roomId: "",
        description: "",
        priority: "MEDIUM"
    });
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

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

        // Setup WebSocket
        const socket = new SockJS("http://localhost:9999/ws");
        const stompClient = Stomp.over(socket);

        // Disable debug logs if preferred
        stompClient.debug = () => { };

        stompClient.connect({}, (frame) => {
            console.log("Connected to WebSocket: " + frame);
            stompClient.subscribe("/topic/maintenance", (message) => {
                if (message && message.body) {
                    setWsMessage(message.body);
                    // auto hide after 7 seconds
                    setTimeout(() => setWsMessage(null), 7000);
                    // Optionally, refresh list if needed
                    fetchRequests();
                }
            });
        }, (err) => {
            console.error("WebSocket error: ", err);
        });

        // Cleanup on unmount
        return () => {
            if (stompClient.connected) {
                stompClient.disconnect();
            }
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRequest(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newRequest.description) {
            showToast("Description is required", "error");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:9999/api/requests/maintenance", newRequest, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast("Request created successfully!");
            setShowModal(false);
            setNewRequest({ roomId: "", description: "", priority: "MEDIUM" });
            fetchRequests();
        } catch (err) {
            console.error(err);
            showToast("Failed to create request", "error");
        } finally {
            setSubmitting(false);
        }
    };
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

            {
                totalPages > 1 && (
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
                )
            }

            <div className="text-center text-muted mt-2 small">
                Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} requests
                {searchTerm && ` (filtered from ${requests.length} total)`}
            </div>
        </div>
    );
}
