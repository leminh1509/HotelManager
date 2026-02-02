import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function RoomList() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:9999/api/rooms", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRooms(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        // Basic mapping, can be improved based on RoomStatus entity
        const colors = {
            Available: "bg-success",
            Occupied: "bg-danger",
            Cleaning: "bg-warning",
            Maintenance: "bg-secondary",
        };
        const colorClass = colors[status] || "bg-info";
        return <span className={`badge ${colorClass}`}>{status}</span>;
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Room List</h2>
            <div className="card shadow filter-card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Room #</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Price ($)</th>
                                    <th>Capacity</th>
                                    <th>Floor</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map((r) => (
                                    <tr key={r.roomId}>
                                        <td><strong>{r.roomNumber}</strong></td>
                                        <td>{r.categoryName}</td>
                                        <td>{getStatusBadge(r.statusName)}</td>
                                        <td>{r.price}</td>
                                        <td>{r.capacity}</td>
                                        <td>{r.floor}</td>
                                        <td>
                                            <Link to={`/receptionist/rooms/${r.roomId}`} className="btn btn-sm btn-info">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {rooms.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center">No rooms found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
