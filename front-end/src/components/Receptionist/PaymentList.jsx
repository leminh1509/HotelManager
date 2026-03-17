import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getBookingsByStatus } from "../../services/receptionistAPI";

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
                const res = await getBookingsByStatus("Checked-out");
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

    const exportSinglePDF = (booking) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("HOTEL INVOICE", 105, 20, { align: "center" });

        // Hotel Info
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Grand Oasis Hotel", 14, 30);
        doc.text("123 Luxury Avenue, District 1, HCMC", 14, 35);
        doc.text("Phone: +84 (123) 456-789", 14, 40);
        doc.text("Email: contact@grandoasis.com", 14, 45);

        // Invoice Info
        doc.setFont("helvetica", "bold");
        doc.text(`INVOICE NO: INV-${booking.bookingId}`, 150, 30);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 35);

        // Line break
        doc.setLineWidth(0.5);
        doc.line(14, 50, 196, 50);

        // Guest Info
        doc.setFont("helvetica", "bold");
        doc.text("Bill To:", 14, 60);
        doc.setFont("helvetica", "normal");
        doc.text(`Guest Name: ${booking.guestName}`, 14, 66);
        doc.text(`Guest ID/Email: ${booking.guestId}`, 14, 72);

        // Booking Info
        doc.setFont("helvetica", "bold");
        doc.text("Booking Details:", 110, 60);
        doc.setFont("helvetica", "normal");
        doc.text(`Booking ID: #${booking.bookingId}`, 110, 66);
        doc.text(`Room Number: ${booking.roomNumber}`, 110, 72);
        doc.text(`Check-in: ${new Date(booking.checkinTime).toLocaleDateString()}`, 110, 78);
        doc.text(`Check-out: ${new Date(booking.checkoutTime).toLocaleDateString()}`, 110, 84);

        // Items Table
        autoTable(doc, {
            startY: 95,
            head: [["Description", "Amount"]],
            body: [
                [`Room Stay (${booking.roomNumber})`, `${(booking.totalPrice || 0).toLocaleString()} VND`]
            ],
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 }
        });

        // Totals
        const finalY = doc.lastAutoTable.finalY || 120;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Total Paid:", 120, finalY + 15);
        doc.setTextColor(39, 174, 96); // Green text
        doc.text(`${(booking.totalPrice || 0).toLocaleString()} VND`, 160, finalY + 15);

        // Status Stamp
        doc.setTextColor(0);
        doc.setFontSize(14);
        doc.text("Status: COMPLETED", 14, finalY + 15);

        // Footer
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        doc.text("Thank you for your stay with us!", 105, 280, { align: "center" });

        doc.save(`Invoice_INV-${booking.bookingId}_${booking.guestName.replace(/ /g, "_")}.pdf`);
    };

    const exportExcel = () => {
        // Define headers explicitly — these will always appear even if data is empty
        const headers = ["Booking ID", "Guest Name", "Room", "Check-in", "Check-out", "Total Amount", "Payment Status"];

        const dataRows = filteredPayments.map(b => [
            `#${b.bookingId}`,
            b.guestName,
            b.roomNumber,
            new Date(b.checkinTime).toLocaleDateString(),
            new Date(b.checkoutTime).toLocaleDateString(),
            `$${b.totalPrice}`,
            "Completed",
        ]);

        // aoa_to_sheet always writes headers as the first row even if dataRows is empty
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

        // Set column widths to match content
        worksheet["!cols"] = [
            { wch: 14 }, { wch: 28 }, { wch: 10 },
            { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
        XLSX.writeFile(workbook, `payment_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };



    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Payment Status (Checked-out)</h2>
                <div className="d-flex gap-2">
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
                    <button className="btn btn-success" onClick={exportExcel} title="Export all filtered payments to Excel">
                        <i className="fa fa-file-excel-o me-1"></i> Export Excel
                    </button>
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
                            <th className="text-center">Action</th>
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
                                    <td className="text-center">
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => exportSinglePDF(booking)}
                                            title="Download PDF Invoice"
                                        >
                                            <i className="fa fa-file-pdf-o"></i> Invoice
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="d-flex justify-content-end mt-3">
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

            <div className="text-center text-muted mt-2 small">
                Showing {filteredPayments.length === 0 ? 0 : indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} entries
                {searchTerm && ` (filtered from ${payments.length} total)`}
            </div>
        </div>
    );
}
