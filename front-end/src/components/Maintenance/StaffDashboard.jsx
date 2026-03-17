/* src/components/Maintenance/StaffDashboard.jsx */
import React, { useEffect, useState } from "react";
import axios from "axios";
import MaintenanceHeader from "../Header/MaintenanceHeader";
import Footer from "../Footer/Footer";
import "./StaffDashboard.css";

const StaffDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0
    });
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        fetchMyTasks();
    }, []);

    const fetchMyTasks = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:9999/api/requests/search", {
                headers: { Authorization: `Bearer ${token}` },
                params: { assignedTo: user.userId }
            });

            const allTasks = res.data.content || [];
            setTasks(allTasks);

            // Calculate stats
            const s = {
                pending: allTasks.filter(t => t.status === 'New' || t.status === 'PENDING').length, // Assuming Backend uses 'New' or 'PENDING'
                inProgress: allTasks.filter(t => t.status === 'In Progress').length,
                completed: allTasks.filter(t => t.status === 'Completed').length
            };
            setStats(s);
        } catch (err) {
            console.error("Error fetching staff tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:9999/api/requests/${taskId}/status`,
                { status: newStatus, notes: `Status updated by ${user.firstName}` },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchMyTasks();
        } catch (err) {
            alert("Không thể cập nhật trạng thái!");
        }
    };

    return (
        <div className="staff-dashboard-root">
            <MaintenanceHeader
                user={user}
                onLogout={() => { localStorage.clear(); window.location.href = "/login"; }}
            />

            <main className="staff-dashboard-container">
                {/* Header Section */}
                <header className="staff-welcome-section">
                    <h1>Chào buổi tối, {user.firstName}! 👋</h1>
                    <p>Hôm nay bạn có {stats.pending + stats.inProgress} công việc đang chờ xử lý.</p>
                </header>

                {/* Stats Grid */}
                <div className="staff-stats-grid">
                    <div className="staff-stat-card">
                        <div className="staff-stat-icon icon-blue">
                            <i className="fa fa-tasks"></i>
                        </div>
                        <div className="staff-stat-info">
                            <h3>Tổng công việc</h3>
                            <div className="staff-stat-value">{tasks.length}</div>
                        </div>
                    </div>
                    <div className="staff-stat-card">
                        <div className="staff-stat-icon icon-yellow">
                            <i className="fa fa-clock-o"></i>
                        </div>
                        <div className="staff-stat-info">
                            <h3>Đang chờ</h3>
                            <div className="staff-stat-value">{stats.pending + stats.inProgress}</div>
                        </div>
                    </div>
                    <div className="staff-stat-card">
                        <div className="staff-stat-icon icon-green">
                            <i className="fa fa-check-circle"></i>
                        </div>
                        <div className="staff-stat-info">
                            <h3>Hoàn thành</h3>
                            <div className="staff-stat-value">{stats.completed}</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="staff-main-content">
                    <section className="staff-tasks-section">
                        <h2 className="staff-card-title">
                            <i className="fa fa-list-ul"></i> Công việc của tôi
                        </h2>

                        {loading ? (
                            <div className="text-center p-5">Đang tải công việc...</div>
                        ) : tasks.length === 0 ? (
                            <div className="staff-task-item" style={{ justifyContent: 'center', color: '#888' }}>
                                Bạn chưa có công việc nào được giao.
                            </div>
                        ) : (
                            tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').map(task => (
                                <div key={task.id} className="staff-task-item">
                                    <div className="staff-task-info">
                                        <div className="staff-task-room">
                                            Phòng {task.room?.roomNumber || 'Chung'}
                                        </div>
                                        <div className="staff-task-desc">{task.description}</div>
                                        <div className="staff-task-metadata">
                                            <span className={`staff-badge badge-high`}>
                                                <i className="fa fa-bolt"></i> {task.priority}
                                            </span>
                                            <span className="staff-badge badge-cleaning">
                                                <i className="fa fa-info-circle"></i> {task.type === 'CLEANING' ? 'Dọn dẹp' : 'Bảo trì'}
                                            </span>
                                            <span style={{ color: '#94a3b8' }}>
                                                <i className="fa fa-calendar-o"></i> {new Date(task.reportedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="staff-task-actions">
                                        {task.status === 'New' || task.status === 'PENDING' ? (
                                            <button
                                                className="btn-icon btn-accept"
                                                title="Nhận việc"
                                                onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
                                            >
                                                <i className="fa fa-play"></i>
                                            </button>
                                        ) : task.status === 'In Progress' ? (
                                            <button
                                                className="btn-icon btn-accept"
                                                style={{ background: '#dcfce7', color: '#16a34a' }}
                                                title="Hoàn thành"
                                                onClick={() => handleStatusUpdate(task.id, 'COMPLETED')}
                                            >
                                                <i className="fa fa-check"></i>
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </section>

                    <aside className="staff-sidebar">
                        <h2 className="staff-card-title">
                            <i className="fa fa-bell-o"></i> Thông báo
                        </h2>
                        <div className="staff-stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '15px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px' }}>Hôm nay</div>
                            <div style={{ fontSize: '0.85rem' }}>Hệ thống sẽ tự động quét phòng checkout lúc 12:00 hàng ngày.</div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StaffDashboard;
