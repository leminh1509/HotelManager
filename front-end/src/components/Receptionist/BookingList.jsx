import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterDateCreated, setFilterDateCreated] = useState("");
  const [filterDateCheckout, setFilterDateCheckout] = useState("");
  const [rooms, setRooms] = useState([]);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get("http://localhost:9999/api/rooms");
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:9999/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: "bg-warning",
      Confirmed: "bg-primary",
      "Checked-in": "bg-success",
      "Checked-out": "bg-secondary",
      Cancelled: "bg-danger",
    };
    const colorClass = colors[status] || "bg-secondary";
    return <span className={`badge ${colorClass}`}>{status}</span>;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  const filtered = bookings.filter(b => {
    const matchSearch = searchQuery ? b.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchStatus = filterStatus ? b.status === filterStatus : true;
    const matchRoom = filterRoom ? 
        b.roomNumber?.toString().includes(filterRoom) || b.roomName?.toLowerCase().includes(filterRoom.toLowerCase()) 
        : true;
    const matchCreated = filterDateCreated ? 
        new Date(b.createdAt).toISOString().split('T')[0] === filterDateCreated 
        : true;
    const matchCheckout = filterDateCheckout ? 
        new Date(b.checkoutTime).toISOString().split('T')[0] === filterDateCheckout 
        : true;

    return matchSearch && matchStatus && matchRoom && matchCreated && matchCheckout;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilters = searchQuery || filterStatus || filterRoom || filterDateCreated || filterDateCheckout;

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Booking Management</h2>

      {/* Filters */}
      <div className="row mb-3 g-2">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search guest name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="col-md-2">
          <select 
            className="form-select" 
            value={filterStatus} 
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Checked-out">Checked-out</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={filterRoom}
            onChange={(e) => { setFilterRoom(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Rooms</option>
            {rooms.map(r => (
              <option key={r.roomId} value={r.roomNumber}>{r.roomNumber}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            title="Date Created"
            value={filterDateCreated}
            onChange={(e) => { setFilterDateCreated(e.target.value); setCurrentPage(1); }}
          />
          <small className="text-muted" style={{fontSize: "0.75rem"}}>Date Created</small>
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            title="Check-Out Date"
            value={filterDateCheckout}
            onChange={(e) => { setFilterDateCheckout(e.target.value); setCurrentPage(1); }}
          />
          <small className="text-muted" style={{fontSize: "0.75rem"}}>Check-Out</small>
        </div>
        <div className="col-md-1">
            <button 
                className="btn btn-outline-secondary w-100" 
                onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("");
                    setFilterRoom("");
                    setFilterDateCreated("");
                    setFilterDateCheckout("");
                    setCurrentPage(1);
                }}
                disabled={!hasFilters}
            >
                Clear
            </button>
        </div>
      </div>
      <div className="card shadow filter-card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b) => (
                  <tr key={b.bookingId}>
                    <td>#{b.bookingId}</td>
                    <td>
                      <strong> {b.guestName} </strong> <br />
                      <small>{b.guestPhone}</small>
                    </td>
                    <td>{b.roomNumber} ({b.roomName})</td>
                    <td>{new Date(b.checkinTime).toLocaleString()}</td>
                    <td>{new Date(b.checkoutTime).toLocaleString()}</td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/receptionist/bookings/${b.bookingId}`} className="btn btn-sm btn-info">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">No bookings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
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
        Showing {filtered.length === 0 ? 0 : Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} bookings
        {hasFilters && ` (filtered from ${bookings.length} total)`}
      </div>
    </div>
  );
}

