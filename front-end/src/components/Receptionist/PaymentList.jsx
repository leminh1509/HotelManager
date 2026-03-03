import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PaymentList() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Search and Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    // Filter logic
    const filteredPayments = payments.filter(p =>
        p.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.roomNumber.toString().includes(searchTerm) ||
        p.bookingId.toString().includes(searchTerm)
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Payment Status (Checked-out)</h2>
                <div className="d-flex gap-3">
                    <div className="search-box">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                                <i className="fa fa-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search Guest or ID..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate("/receptionist")}>
                        &larr; Back
                    </button>
                </div>
            </div>
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
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-4">
                                    {searchTerm ? `No results found for "${searchTerm}"` : "No checked-out bookings found."}
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((booking) => (
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pb-5">
                    <div className="text-muted small">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} entries
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
    );
}
