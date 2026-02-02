import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:9999/api/bookings/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBooking(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        setUpdating(true);
        try {
            const token = localStorage.getItem("token");
            // Use PUT /api/bookings/{id}/status?status=...
            await axios.put(
                `http://localhost:9999/api/bookings/${id}/status`,
                null,
                {
                    params: { status: newStatus },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            // Refresh
            fetchDetail();
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!booking) return <div>Booking not found</div>;

    return (
        <div className="container mt-4">
            <button className="btn btn-secondary mb-3" onClick={() => navigate("/receptionist")}>
                &larr; Back to List
            </button>

            <div className="card shadow">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h3 className="mb-0">Booking #{booking.bookingId}</h3>
                    <span className="badge bg-light text-dark">{booking.status}</span>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <h5>Guest Information</h5>
                            <p><strong>Name:</strong> {booking.guestName}</p>
                            <p><strong>Phone:</strong> {booking.guestPhone}</p>
                            <p><strong>Email:</strong> {booking.guestEmail}</p>
                            <p><strong>ID Number:</strong> {booking.guestIdNumber}</p>
                            <p><strong>Nationality:</strong> {booking.guestNationality}</p>
                            <p><strong>Guest Count:</strong> {booking.guestCount}</p>
                        </div>
                        <div className="col-md-6">
                            <h5>Room Information</h5>
                            <p><strong>Room:</strong> {booking.roomNumber} - {booking.roomName}</p>
                            <p><strong>Check-In:</strong> {new Date(booking.checkinTime).toLocaleString()}</p>
                            <p><strong>Check-Out:</strong> {new Date(booking.checkoutTime).toLocaleString()}</p>
                            <p className="text-danger fs-5"><strong>Total Price:</strong> ${booking.totalPrice}</p>
                        </div>
                    </div>

                    <hr />

                    <div className="d-flex gap-2">
                        {booking.status === "Pending" && (
                            <button
                                className="btn btn-primary"
                                disabled={updating}
                                onClick={() => handleStatusChange("Confirmed")}
                            >
                                Confirm Booking
                            </button>
                        )}

                        {(booking.status === "Confirmed" || booking.status === "Pending") && (
                            <button
                                className="btn btn-success"
                                disabled={updating}
                                onClick={() => handleStatusChange("Checked-in")}
                            >
                                Check In
                            </button>
                        )}

                        {booking.status === "Checked-in" && (
                            <button
                                className="btn btn-warning"
                                disabled={updating}
                                onClick={() => handleStatusChange("Checked-out")}
                            >
                                Check Out
                            </button>
                        )}

                        {(booking.status === "Pending" || booking.status === "Confirmed") && (
                            <button
                                className="btn btn-danger"
                                disabled={updating}
                                onClick={() => handleStatusChange("Cancelled")}
                            >
                                Cancel Booking
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
