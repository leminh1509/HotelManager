import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchBookings();
  }, []);

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

  const filtered = searchQuery
    ? bookings.filter(b => b.guestName?.toLowerCase().includes(searchQuery.toLowerCase()))
    : bookings;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Booking Management</h2>

      {/* Search Bar */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by guest name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
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
        {searchQuery && ` (filtered from ${bookings.length} total)`}
      </div>
    </div>
  );
}

