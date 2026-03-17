import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

export default function CleaningRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:9999/api/requests/cleaning", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data.content || []);
            } catch (err) {
                console.error(err);
                setError("Failed to load cleaning requests");
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Cleaning Requests Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

        const tableData = requests.map(req => [
            req.id,
            req.room ? `Room ${req.room.roomNumber}` : "General",
            req.description,
            req.priority,
            req.status,
            new Date(req.reportedAt).toLocaleDateString()
        ]);

        autoTable(doc, {
            startY: 35,
            head: [["ID", "Room", "Description", "Priority", "Status", "Date"]],
            body: tableData,
            theme: "grid",
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`cleaning_requests_${new Date().getTime()}.pdf`);
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(requests.map(req => ({
            ID: req.id,
            Room: req.room ? req.room.roomNumber : "General",
            Description: req.description,
            Priority: req.priority,
            Status: req.status,
            Date: new Date(req.reportedAt).toLocaleDateString()
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaning Requests");
        XLSX.writeFile(workbook, `cleaning_requests_${new Date().getTime()}.xlsx`);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Cleaning Requests</h2>
                <div className="d-flex gap-2">
                    <button className="btn btn-danger" onClick={exportPDF}>
                        <i className="fa fa-file-pdf-o me-1"></i> Export PDF
                    </button>
                    <button className="btn btn-success" onClick={exportExcel}>
                        <i className="fa fa-file-excel-o me-1"></i> Export Excel
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate("/receptionist")}>
                        Back
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="table-responsive shadow-sm">
                <table className="table table-hover table-striped">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Room</th>
                            <th>Description</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center">No cleaning requests found.</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td>#{req.id}</td>
                                    <td>{req.room ? `Room ${req.room.roomNumber}` : "General"}</td>
                                    <td>{req.description}</td>
                                    <td>
                                        <span className={`badge ${req.priority === "HIGH" || req.priority === "URGENT" ? "bg-danger" :
                                            req.priority === "MEDIUM" ? "bg-warning text-dark" : "bg-info"
                                            }`}>
                                            {req.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${req.status === "COMPLETED" ? "bg-success" :
                                            req.status === "IN_PROGRESS" ? "bg-primary" :
                                                req.status === "CANCELLED" ? "bg-secondary" : "bg-warning text-dark"
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>{new Date(req.reportedAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
