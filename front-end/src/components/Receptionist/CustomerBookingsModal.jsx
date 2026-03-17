import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerList.css'; // Reusing some base styles

const CustomerBookingsModal = ({ isOpen, onClose, customer }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && customer) {
            fetchBookings();
        }
    }, [isOpen, customer]);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:9999/api/receptionist/customers/bookings`, {
                params: {
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data);
        } catch (err) {
            console.error('Error fetching customer bookings:', err);
            setError('Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="custom-modal" style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <h3>Booking History: {customer?.name}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div className="text-center p-4">Loading bookings...</div>
                    ) : error ? (
                        <div className="alert alert-danger">{error}</div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center p-4">No bookings found for this customer.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mgmt-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Room</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Status</th>
                                        <th>Total Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking.bookingId}>
                                            <td>#{booking.bookingId}</td>
                                            <td> {booking.roomNumber}</td>
                                            <td>{new Date(booking.checkinTime).toLocaleDateString()}</td>
                                            <td>{new Date(booking.checkoutTime).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge bg-${
                                                    booking.status === 'Checked-out' ? 'secondary' :
                                                    booking.status === 'Checked-in' ? 'success' :
                                                    booking.status === 'Confirmed' ? 'primary' :
                                                    booking.status === 'Cancelled' ? 'danger' : 'warning'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td>{booking.totalPrice.toLocaleString()} VND</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default CustomerBookingsModal;
