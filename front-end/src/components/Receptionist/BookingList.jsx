import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Booking Management</h2>
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
                {bookings.map((b) => (
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
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">No bookings found</td>
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

