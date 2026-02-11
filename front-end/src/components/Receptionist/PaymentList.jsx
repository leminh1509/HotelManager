import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PaymentList() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:9999/api/bookings?status=Checked-out", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPayments(res.data);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch payment status");
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Payment Status (Checked-out Bookings)</h2>
            <button className="btn btn-secondary mb-3" onClick={() => navigate("/receptionist")}>
                &larr; Back to Dashboard
            </button>
            <div className="table-responsive shadow-sm">
                <table className="table table-hover table-striped">
                    <thead className="table-dark">
                        <tr>
                            <th>Booking ID</th>
                            <th>Guest Name</th>
                            <th>Room</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Total Amount</th>
                            <th>Payment Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center">No checked-out bookings found.</td>
                            </tr>
                        ) : (
                            payments.map((booking) => (
                                <tr key={booking.bookingId}>
                                    <td>#{booking.bookingId}</td>
                                    <td>{booking.guestName}</td>
                                    <td>{booking.roomNumber}</td>
                                    <td>{new Date(booking.checkinTime).toLocaleDateString()}</td>
                                    <td>{new Date(booking.checkoutTime).toLocaleDateString()}</td>
                                    <td className="fw-bold text-success">${booking.totalPrice}</td>
                                    <td>
                                        <span className="badge bg-success">Completed</span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => navigate(`/receptionist/booking/${booking.bookingId}`)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
