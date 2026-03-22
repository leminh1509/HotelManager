import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingById, checkInBooking, checkOutBooking, cancelBooking, updateCheckoutDate } from "../../services/receptionistAPI";
import { showToast } from "../Common/Toast";

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [newCheckoutDate, setNewCheckoutDate] = useState("");

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const res = await getBookingById(id);
            setBooking(res.data);
            // Preset newCheckoutDate with current checkout date
            if (res.data.checkoutTime) {
                setNewCheckoutDate(res.data.checkoutTime);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load booking details: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus, skipConfirm = false) => {
        if (!skipConfirm && !window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        setUpdating(true);
        try {
            if (newStatus === "Checked-in") {
                await checkInBooking(id);
            } else if (newStatus === "Checked-out") {
                await checkOutBooking(id);
            } else if (newStatus === "Cancelled") {
                await cancelBooking(id);
            }
            // Refresh
            fetchDetail();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Failed to update status";
            showToast(msg, "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleExtendStay = async () => {
        if (!newCheckoutDate) return;
        
        // Ensure format is ISO LocalDateTime
        let payloadDate = newCheckoutDate;
        if (payloadDate.length === 10) payloadDate += "T12:00:00";
        else if (payloadDate.length === 16) payloadDate += ":00";

        if (!window.confirm(`Confirm change check-out date to ${payloadDate}? Total price will be updated.`)) return;

        setUpdating(true);
        try {
            await updateCheckoutDate(id, { checkoutDate: payloadDate });
            showToast("Check-out date updated successfully!", "success");
            setShowExtendModal(false);
            fetchDetail();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Failed to update check-out date";
            showToast(msg, "error");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!booking) return <div>Booking not found</div>;

    const handleConfirmCheckIn = () => {
        setShowCheckInModal(false);
        handleStatusChange("Checked-in", true);
    };

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

                    <div className="d-flex gap-2 flex-wrap">

                        {(booking.status === "Confirmed" || booking.status === "Pending") && (
                            <button
                                className="btn btn-success"
                                disabled={updating}
                                onClick={() => setShowCheckInModal(true)}
                            >
                                Check In
                            </button>
                        )}

                        {booking.status === "Checked-in" && (
                            <>
                                <button
                                    className="btn btn-warning"
                                    disabled={updating}
                                    onClick={() => handleStatusChange("Checked-out")}
                                >
                                    Check Out
                                </button>
                                <button
                                    className="btn btn-info text-white"
                                    disabled={updating}
                                    onClick={() => setShowExtendModal(true)}
                                >
                                    Extend Stay / Change Dates
                                </button>
                            </>
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

            {/* Check-in Verification Modal */}
            {showCheckInModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">Verify Check-In Information</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCheckInModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    Please verify the guest and booking information before proceeding.
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6 className="border-bottom pb-2">Guest Details</h6>
                                        <table className="table table-sm table-borderless">
                                            <tbody>
                                                <tr><td><strong>Name:</strong></td><td>{booking.guestName}</td></tr>
                                                <tr><td><strong>ID Number:</strong></td><td>{booking.guestIdNumber}</td></tr>
                                                <tr><td><strong>Phone:</strong></td><td>{booking.guestPhone}</td></tr>
                                                <tr><td><strong>Nationality:</strong></td><td>{booking.guestNationality}</td></tr>
                                                <tr><td><strong>Special Request:</strong></td><td>{booking.specialRequest || "None"}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="border-bottom pb-2">Booking Details</h6>
                                        <table className="table table-sm table-borderless">
                                            <tbody>
                                                <tr><td><strong>Room:</strong></td><td>{booking.roomNumber} ({booking.roomName})</td></tr>
                                                <tr><td><strong>Check-In Date:</strong></td><td>{new Date(booking.checkinTime).toLocaleDateString()}</td></tr>
                                                <tr><td><strong>Check-Out Date:</strong></td><td>{new Date(booking.checkoutTime).toLocaleDateString()}</td></tr>
                                                <tr><td><strong>Guests:</strong></td><td>{booking.guestCount}</td></tr>
                                                <tr><td><strong>Price:</strong></td><td className="text-danger fw-bold">${booking.totalPrice}</td></tr>
                                                <tr>
                                                    <td><strong>Payment (Prepaid):</strong></td>
                                                    <td>
                                                        {/* Assuming simple logic for now, or fetch from payment status if available */}
                                                        <span className="badge bg-secondary">Pending Check</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCheckInModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-success" onClick={handleConfirmCheckIn} disabled={updating}>
                                    {updating ? "Processing..." : "Confirm & Check In"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Extend Stay Modal */}
            {showExtendModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title">Extend Stay / Change Check-out</h5>
                                <button type="button" className="btn-close" onClick={() => setShowExtendModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Current Check-out: <strong>{booking.checkoutTime}</strong></p>
                                <div className="mb-3">
                                    <label className="form-label">New Check-out Date & Time</label>
                                    <div className="d-flex gap-2">
                                        <input
                                            type="date"
                                            className="form-control"
                                            style={{ flex: 2 }}
                                            value={newCheckoutDate ? newCheckoutDate.split('T')[0] : ""}
                                            min={booking.checkinTime ? booking.checkinTime.split('T')[0] : ""}
                                            onChange={(e) => {
                                                const date = e.target.value;
                                                const time = newCheckoutDate.includes('T') ? newCheckoutDate.split('T')[1] : "12:00";
                                                setNewCheckoutDate(`${date}T${time}`);
                                            }}
                                        />
                                        <select className="form-select" style={{ flex: 1 }}
                                            value={newCheckoutDate && newCheckoutDate.includes('T') ? newCheckoutDate.split('T')[1].split(':')[0] : "12"}
                                            onChange={(e) => {
                                                const date = newCheckoutDate.split('T')[0] || (booking.checkoutTime ? booking.checkoutTime.split('T')[0] : "");
                                                const hour = e.target.value;
                                                const minute = newCheckoutDate.includes('T') && newCheckoutDate.split('T')[1].includes(':') ? newCheckoutDate.split('T')[1].split(':')[1] : "00";
                                                setNewCheckoutDate(`${date}T${hour}:${minute}`);
                                            }}
                                        >
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <select className="form-select" style={{ flex: 1 }}
                                            value={newCheckoutDate && newCheckoutDate.includes('T') && newCheckoutDate.split('T')[1].includes(':') ? newCheckoutDate.split('T')[1].split(':')[1] : "00"}
                                            onChange={(e) => {
                                                const date = newCheckoutDate.split('T')[0] || (booking.checkoutTime ? booking.checkoutTime.split('T')[0] : "");
                                                const hour = newCheckoutDate.includes('T') ? newCheckoutDate.split('T')[1].split(':')[0] : "12";
                                                const minute = e.target.value;
                                                setNewCheckoutDate(`${date}T${hour}:${minute}`);
                                            }}
                                        >
                                            <option value="00">00</option>
                                            <option value="15">15</option>
                                            <option value="30">30</option>
                                            <option value="45">45</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="alert alert-warning">
                                    Changing the date will automatically check room availability and recalculate the total price.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowExtendModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleExtendStay} disabled={updating}>
                                    {updating ? "Updating..." : "Update Date & Price"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
