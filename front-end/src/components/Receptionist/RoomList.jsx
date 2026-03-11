import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function RoomList() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search, filter and Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
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
        const colors = {
            Available: "bg-success",
            Occupied: "bg-danger",
            Cleaning: "bg-warning text-dark",
            Maintenance: "bg-secondary",
            Reserved: "bg-primary",
            OutOfService: "bg-dark",
        };
        const colorClass = colors[status] || "bg-info";
        return <span className={`badge ${colorClass}`}>{status}</span>;
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;

    // Derive unique categories and statuses for dropdowns
    const uniqueCategories = [...new Set(rooms.map(r => r.categoryName).filter(Boolean))].sort();
    const uniqueStatuses = [...new Set(rooms.map(r => r.statusName).filter(Boolean))].sort();

    // Combined filter logic
    const filteredRooms = rooms.filter(r => {
        const matchSearch = !searchTerm ||
            r.roomNumber?.toString().includes(searchTerm) ||
            r.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.statusName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = !filterCategory || r.categoryName === filterCategory;
        const matchStatus = !filterStatus || r.statusName === filterStatus;
        return matchSearch && matchCategory && matchStatus;
    });

    const hasFilters = searchTerm || filterCategory || filterStatus;

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setFilterCategory("");
        setFilterStatus("");
        setCurrentPage(1);
    };

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Room List</h2>
            </div>

            {/* Filters Row */}
            <div className="row g-2 mb-3 align-items-end">
                {/* Search */}
                <div className="col-md-4">
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

                {/* Filter by Category */}
                <div className="col-md-3">
                    <select
                        className="form-select"
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">All Categories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Filter by Status */}
                <div className="col-md-3">
                    <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        {uniqueStatuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Clear */}
                <div className="col-md-2">
                    <button
                        className="btn btn-outline-secondary w-100"
                        onClick={clearFilters}
                        disabled={!hasFilters}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Showing result count */}
            {hasFilters && (
                <p className="text-muted small mb-2">
                    Showing {filteredRooms.length} result{filteredRooms.length !== 1 ? "s" : ""} (filtered from {rooms.length} total rooms)
                </p>
            )}

            <div className="card shadow filter-card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Room #</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Price</th>
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
                                        <td>{r.price?.toLocaleString()} VND</td>
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
                                            {hasFilters ? "No rooms match the selected filters." : "No rooms found"}
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
                            Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredRooms.length)} of {filteredRooms.length}
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

