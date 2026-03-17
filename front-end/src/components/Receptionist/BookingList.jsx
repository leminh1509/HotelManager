import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllRooms, getAllBooking, createBooking } from "../../services/receptionistAPI";
import { showToast } from "../Common/Toast";

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

  // Get today's date in YYYY-MM-DD format for the min date attribute
  const today = new Date().toISOString().split('T')[0];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoomPickerOpen, setIsRoomPickerOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    roomId: "",
    checkinTime: "",
    checkoutTime: "",
    guestCount: 1,
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestIdNumber: "",
    guestNationality: "Vietnam",
    guestAddress: "",
    specialRequest: "",
    earlyCheckin: false,
    lateCheckout: false
  });
  const [creating, setCreating] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await getAllRooms();
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await getAllBooking();
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createBooking(newBooking);
      setIsModalOpen(false);
      setNewBooking({
        roomId: "", checkinTime: "", checkoutTime: "", guestCount: 1,
        guestName: "", guestEmail: "", guestPhone: "", guestIdNumber: "",
        guestNationality: "Vietnam", guestAddress: "", specialRequest: "",
        earlyCheckin: false, lateCheckout: false
      });
      fetchBookings(); // Refresh the list
      showToast("Booking created successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to create booking. Please check requirements.", "error");
    } finally {
      setCreating(false);
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
    <div className="container-fluid position-relative">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Booking Management</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fa fa-plus me-2"></i> Create walk-in Booking
        </button>
      </div>

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
          <small className="text-muted" style={{ fontSize: "0.75rem" }}>Date Created</small>
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            title="Check-Out Date"
            value={filterDateCheckout}
            onChange={(e) => { setFilterDateCheckout(e.target.value); setCurrentPage(1); }}
          />
          <small className="text-muted" style={{ fontSize: "0.75rem" }}>Check-Out</small>
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

      {/* Create Booking Modal */}
      {isModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Walk-in Booking</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <form id="createBookingForm" onSubmit={handleCreateBooking}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Guest Name *</label>
                      <input type="text" className="form-control" required
                        value={newBooking.guestName} onChange={e => setNewBooking({ ...newBooking, guestName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone *</label>
                      <input type="text" className="form-control" required
                        pattern="[0-9]{10}" title="Phone number must be exactly 10 digits"
                        maxLength="10" minLength="10"
                        value={newBooking.guestPhone} onChange={e => setNewBooking({ ...newBooking, guestPhone: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">ID Number / Passport *</label>
                      <input type="text" className="form-control" required
                        pattern="[0-9]{12}" title="ID/Passport must be exactly 12 digits"
                        maxLength="12" minLength="12"
                        value={newBooking.guestIdNumber} onChange={e => setNewBooking({ ...newBooking, guestIdNumber: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control"
                        value={newBooking.guestEmail} onChange={e => setNewBooking({ ...newBooking, guestEmail: e.target.value })}
                      />
                    </div>

                    <hr className="my-4" />

                    <div className="col-md-6">
                      <label className="form-label">Room *</label>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => setIsRoomPickerOpen(true)}
                        >
                          {newBooking.roomId
                            ? `Room ${rooms.find(r => r.roomId === parseInt(newBooking.roomId))?.roomNumber}`
                            : "Select Room"}
                        </button>
                        {newBooking.roomId && (
                          <span className="text-success small"><i className="fa fa-check-circle"></i> Selected</span>
                        )}
                        {/* Hidden input to keep HTML5 'required' validation working */}
                        <input type="hidden" required value={newBooking.roomId} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Guest Count *</label>
                      <input type="number" className="form-control" min="1" required
                        value={newBooking.guestCount} onChange={e => setNewBooking({ ...newBooking, guestCount: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Check-in Date *</label>
                      <input type="date" className="form-control" required
                        min={today}
                        value={newBooking.checkinTime} onChange={e => setNewBooking({ ...newBooking, checkinTime: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Check-out Date *</label>
                      <input type="date" className="form-control" required
                        min={newBooking.checkinTime || today}
                        value={newBooking.checkoutTime} onChange={e => setNewBooking({ ...newBooking, checkoutTime: e.target.value })}
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" form="createBookingForm" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Room Picker Modal — custom layout, bypasses Bootstrap dialog restrictions */}
      {isRoomPickerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1060,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setIsRoomPickerOpen(false)}
        >
          {/* Stop click propagation so clicking inside doesn't close the modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90vw",
              maxWidth: "1400px",
              maxHeight: "90vh",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 32px",
              borderBottom: "1px solid #dee2e6",
              flexShrink: 0,
            }}>
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: "1.25rem" }}>🏨 Select an Available Room</h5>
              <button className="btn-close" onClick={() => setIsRoomPickerOpen(false)} />
            </div>

            {/* Legend */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              padding: "16px 32px",
              borderBottom: "1px solid #f0f0f0",
              flexShrink: 0,
              backgroundColor: "#f8f9fa",
            }}>
              <span className="badge bg-success" style={{ fontSize: "0.85rem", padding: "7px 12px" }}>✓ Available</span>
              <span className="badge bg-danger" style={{ fontSize: "0.85rem", padding: "7px 12px" }}>✕ Occupied / Reserved</span>
              <span className="badge bg-secondary" style={{ fontSize: "0.85rem", padding: "7px 12px" }}>― Maintenance / Other</span>
            </div>

            {/* Scrollable Grid Area */}
            <div style={{ overflowY: "auto", padding: "32px", flexGrow: 1 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "20px",
              }}>
                {rooms.map((r) => {
                  const isAvailable = r.statusName === "Available";
                  const isOccupied = r.statusName === "Occupied" || r.statusName === "Reserved";

                  let bg = "#6c757d";
                  if (isAvailable) bg = "#198754";
                  else if (isOccupied) bg = "#dc3545";

                  const isSelected = newBooking.roomId === r.roomId;

                  return (
                    <div
                      key={r.roomId}
                      onClick={() => {
                        if (isAvailable) {
                          setNewBooking({ ...newBooking, roomId: r.roomId });
                          setIsRoomPickerOpen(false);
                        }
                      }}
                      style={{
                        backgroundColor: bg,
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "16px 12px",
                        textAlign: "center",
                        cursor: isAvailable ? "pointer" : "not-allowed",
                        opacity: isAvailable ? 1 : 0.65,
                        boxShadow: isSelected
                          ? "0 0 0 4px #ffc107, 0 4px 12px rgba(0,0,0,0.2)"
                          : "0 2px 8px rgba(0,0,0,0.15)",
                        transform: isSelected ? "scale(1.06)" : "scale(1)",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        minHeight: "130px",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{r.roomNumber}</div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.9, lineHeight: 1.3 }}>
                        {r.categoryName || r.category?.name}
                      </div>
                      <div style={{
                        marginTop: "6px",
                        backgroundColor: "rgba(255,255,255,0.25)",
                        borderRadius: "6px",
                        padding: "3px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}>
                        {r.statusName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}    </div>
  );
}

