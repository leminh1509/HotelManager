import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { showToast } from "../Common/Toast";
import MaintenanceHeader from "../Header/MaintenanceHeader";
import Footer from "../Footer/Footer";
import { searchRequests, updateRequestStatus } from "../../services/receptionistAPI";
import "./MaintenanceDashboard.css"; // Reuse dashboard styles

export default function CleaningTaskList() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchCleaningTasks = async () => {
        try {
            const res = await searchRequests({
                type: "CLEANING",
                status: "PENDING",
                assignedTo: user.userId // Filter by current staff ID
            });
            setTasks(res.data.content || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load cleaning tasks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCleaningTasks();
    }, []);

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(tasks.map(t => ({
            ID: t.id,
            Room: t.room ? t.room.roomNumber : "N/A",
            Description: t.description,
            Priority: t.priority,
            Status: t.status,
            Date: new Date(t.reportedAt).toLocaleDateString()
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaning Tasks");
        XLSX.writeFile(workbook, `cleaning_tasks_${new Date().getTime()}.xlsx`);
    };

    const handleAccept = async (id) => {
        try {
            await updateRequestStatus(id, "IN_PROGRESS");
            fetchCleaningTasks();
        } catch (err) {
            console.error(err);
            showToast("Failed to accept task", "error");
        }
    };

    if (loading) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="maintenance-layout">
            <MaintenanceHeader user={user} onLogout={() => { localStorage.clear(); window.location.href = "/login"; }} />

            <div className="maintenance-container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1>Danh Sách Công Việc Dọn Dẹp</h1>
                        <p>Dưới đây là các phòng cần được dọn dẹp ngay.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-success" onClick={exportExcel}>
                            <i className="fa fa-file-excel-o me-1"></i> Xuất Excel
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="table-responsive shadow-sm bg-white rounded">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Phòng</th>
                                <th>Mô Tả</th>
                                <th>Ưu Tiên</th>
                                <th>Ngày Tạo</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">Hiện không có phòng nào cần dọn dẹp.</td>
                                </tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>#{task.id}</td>
                                        <td><span className="badge bg-info text-dark">Phòng {task.room?.roomNumber}</span></td>
                                        <td>{task.description}</td>
                                        <td>
                                            <span className={`badge ${task.priority === "HIGH" || task.priority === "URGENT" ? "bg-danger" : "bg-warning text-dark"}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td>{new Date(task.reportedAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleAccept(task.id)}
                                            >
                                                Nhận việc
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Footer />
        </div>
    );
}
