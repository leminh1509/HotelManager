import React, { useState, useEffect } from 'react';
import MaintenanceHeader from '../Header/MaintenanceHeader';
import Footer from '../Footer/Footer';
import './MaintenanceDashboard.css';
import { getAllRooms } from '../../services/roomAPI'; // Assuming this exists or I'll use fetch
import axios from 'axios';

const MaintenanceDashboard = () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { firstName: 'Staff', role: 'MAINTENANCE' };
    const ROLE_MAINTENANCE = 'MAINTENANCE';
    const ROLE_RECEPTIONIST = 'RECEPTIONIST'; // or ADMIN

    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
    const [rooms, setRooms] = useState([]);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Search & Filter State
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        type: '',
        page: 0,
        size: 10
    });
    const [totalPages, setTotalPages] = useState(0);

    // New Request Form State
    const [newRequest, setNewRequest] = useState({
        roomId: '',
        description: '',
        type: 'MAINTENANCE',
        priority: 'MEDIUM'
    });

    // Update Status Form State
    const [updateData, setUpdateData] = useState({
        status: '',
        notes: ''
    });

    const API_URL = 'http://localhost:9999/api/requests';

    useEffect(() => {
        fetchRequests();
    }, [filters]); // Re-fetch when filters change (including page)

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            // If using Search API
            const params = {
                page: filters.page,
                size: filters.size,
                search: filters.search || undefined,
                status: filters.status || undefined,
                type: filters.type || undefined
            };

            const res = await axios.get(`${API_URL}/search`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            // Backend returns Page<ServiceRequest>
            setRequests(res.data.content);
            setTotalPages(res.data.totalPages);

            // For stats, we might need a separate call or just mock it based on current View 
            // Better: separate endpoint for stats. For now, let's keep stats static or simple logic?
            // Since getAllRequests was simple, let's do a quick separate fetch for full stats if feasible, 
            // or just rely on backend to provide stats endpoint later. 
            // To prevent breaking stats, let's fetch ALL for stats calculation once.
            fetchAllForStats(token);

        } catch (error) {
            console.error("Error fetching requests", error);
        }
    };

    const fetchAllForStats = async (token) => {
        try {
            // Optional: If backend supports simple stats endpoint, use that. 
            // Currently fallback to fetching all for correct counts (Performance warning with large data)
            // Temporarily fetch all just to calculate stats numbers
            const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
            calculateStats(res.data);
        } catch (e) {
            console.error("Stats fetch error", e);
        }
    }

    const fetchRooms = async () => {
        try {
            // Using the existing service if possible, or direct call
            const res = await getAllRooms();
            setRooms(res.data);
        } catch (error) {
            console.error("Error fetching rooms", error);
        }
    };

    const calculateStats = (data) => {
        const s = {
            total: data.length,
            pending: data.filter(r => r.status === 'PENDING').length,
            inProgress: data.filter(r => r.status === 'IN_PROGRESS').length,
            completed: data.filter(r => r.status === 'COMPLETED').length
        };
        setStats(s);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 0 // Reset to page 0 on filter change
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(API_URL, newRequest, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCreateModalOpen(false);
            setNewRequest({ roomId: '', description: '', type: 'MAINTENANCE', priority: 'MEDIUM' });
            fetchRequests();
            alert('Request created successfully!');
        } catch (error) {
            console.error("Error creating request", error);
            alert('Failed to create request');
        }
    };

    const handleUpdateClick = (req) => {
        setSelectedRequest(req);
        setUpdateData({ status: req.status, notes: req.resolutionNotes || '' });
        setUpdateModalOpen(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/${selectedRequest.id}/status`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUpdateModalOpen(false);
            fetchRequests();
        } catch (error) {
            console.error("Error updating request", error);
            alert('Failed to update request');
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'URGENT': return 'red';
            case 'HIGH': return 'orange';
            case 'MEDIUM': return 'blue';
            default: return 'green';
        }
    };

    const getStatusBadge = (s) => {
        let className = 'badge-status ';
        switch (s) {
            case 'PENDING': className += 'status-pending'; break; // new/pending
            case 'IN_PROGRESS': className += 'status-progress'; break;
            case 'COMPLETED': className += 'status-completed'; break;
            case 'CANCELLED': className += 'status-cancelled'; break;
            default: className += 'status-pending';
        }
        return <span className={className}>{s.replace('_', ' ')}</span>;
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="maintenance-layout">
            <MaintenanceHeader user={user} onLogout={handleLogout} />

            <div className="maintenance-container">
                <div className="maintenance-header">
                    <div>
                        <h1>Maintenance & Cleaning Dashboard</h1>
                        <p>Welcome back, {user.firstName || 'Staff'}.</p>
                    </div>
                    <button className="create-btn" onClick={() => setCreateModalOpen(true)}>
                        + New Request
                    </button>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-card total" onClick={() => setFilters({ ...filters, status: '', page: 0 })}>
                        <div className="stat-icon">Testing</div>
                        <div className="stat-info">
                            <h3>{stats.total}</h3>
                            <span>Total Tasks</span>
                        </div>
                    </div>
                    <div className="stat-card pending" onClick={() => setFilters({ ...filters, status: 'PENDING', page: 0 })}>
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <h3>{stats.pending}</h3>
                            <span>Pending</span>
                        </div>
                    </div>
                    <div className="stat-card progress" onClick={() => setFilters({ ...filters, status: 'IN_PROGRESS', page: 0 })}>
                        <div className="stat-icon">⚙️</div>
                        <div className="stat-info">
                            <h3>{stats.inProgress}</h3>
                            <span>In Progress</span>
                        </div>
                    </div>
                    <div className="stat-card completed" onClick={() => setFilters({ ...filters, status: 'COMPLETED', page: 0 })}>
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>{stats.completed}</h3>
                            <span>Completed</span>
                        </div>
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="tasks-section">
                    <div className="section-header-row">
                        <h2>Request List</h2>

                        <div className="filter-bar">
                            <input
                                type="text"
                                name="search"
                                placeholder="Search desc or room..."
                                value={filters.search}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />
                            <select name="type" value={filters.type} onChange={handleFilterChange} className="filter-select">
                                <option value="">All Types</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="CLEANING">Cleaning</option>
                            </select>
                            <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
                                <option value="">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="tasks-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Location/Room</th>
                                    <th>Description</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.length === 0 ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No requests found.</td></tr>
                                ) : requests.map(req => (
                                    <tr key={req.id}>
                                        <td>#{req.id}</td>
                                        <td>
                                            <span className={`type-badge ${req.type?.toLowerCase()}`}>{req.type}</span>
                                        </td>
                                        <td>{req.room ? req.room.roomNumber : 'General'}</td>
                                        <td>
                                            <div className="task-desc">{req.description}</div>
                                            {req.resolutionNotes && <div className="task-note">Note: {req.resolutionNotes}</div>}
                                        </td>
                                        <td>
                                            <span style={{ color: getPriorityColor(req.priority), fontWeight: 'bold' }}>
                                                {req.priority}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(req.status)}</td>
                                        <td>{new Date(req.reportedAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="action-btn" onClick={() => handleUpdateClick(req)}>Update</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <button
                            disabled={filters.page === 0}
                            onClick={() => handlePageChange(filters.page - 1)}
                        >
                            &laquo; Prev
                        </button>
                        <span>Page {filters.page + 1} of {totalPages || 1}</span>
                        <button
                            disabled={filters.page >= totalPages - 1}
                            onClick={() => handlePageChange(filters.page + 1)}
                        >
                            Next &raquo;
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Request Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Request</h2>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="form-group">
                                <label>Request Type</label>
                                <select
                                    value={newRequest.type}
                                    onChange={e => setNewRequest({ ...newRequest, type: e.target.value })}
                                >
                                    <option value="MAINTENANCE">Maintenance (Sửa chữa)</option>
                                    <option value="CLEANING">Cleaning (Dọn phòng)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Room (Optional)</label>
                                <select
                                    value={newRequest.roomId}
                                    onChange={e => setNewRequest({ ...newRequest, roomId: e.target.value })}
                                >
                                    <option value="">-- General / Lobby --</option>
                                    {rooms.map(room => (
                                        <option key={room.roomId} value={room.roomId}>{room.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={newRequest.priority}
                                    onChange={e => setNewRequest({ ...newRequest, priority: e.target.value })}
                                >
                                    <option value="LIGHT">Light</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    required
                                    value={newRequest.description}
                                    onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                                    placeholder="Describe the issue..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setCreateModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Create Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {isUpdateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Update Status #{selectedRequest?.id}</h2>
                        <form onSubmit={handleUpdateSubmit}>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={updateData.status}
                                    onChange={e => setUpdateData({ ...updateData, status: e.target.value })}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Resolution / Notes</label>
                                <textarea
                                    value={updateData.notes}
                                    onChange={e => setUpdateData({ ...updateData, notes: e.target.value })}
                                    placeholder="Work done..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setUpdateModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default MaintenanceDashboard;
