import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function RoomList() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search and Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

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

    // Filter logic
    const filteredRooms = rooms.filter(r =>
        r.roomNumber.toString().includes(searchTerm) ||
        r.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.statusName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Room List</h2>
                <div className="search-box">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="fa fa-search text-muted"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search Room #, Type, Status..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
            </div>
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
                                {currentItems.map((r) => (
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
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4">
                                            {searchTerm ? `No results found for "${searchTerm}"` : "No rooms found"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="card-footer bg-white border-top-0 d-flex justify-content-between align-items-center pb-4">
                        <div className="text-muted small">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRooms.length)} of {filteredRooms.length}
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
            </div>
        </div>
    );
}
