import React, { useState } from 'react';
import Header from '../Header/Header';
import './MaintenanceDashboard.css';

const MaintenanceDashboard = () => {
    // Mock User from localStorage (in real app, use Context or Prop)
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { firstName: 'Staff' };

    // Mock Data for Dashboard
    const [stats] = useState({
        total: 12,
        pending: 5,
        inProgress: 3,
        completed: 4
    });

    // Mock Tasks (based on maintenance_request schema)
    const [tasks, setTasks] = useState([
        {
            id: 101,
            title: "AC Not Cooling",
            room: "305",
            priority: "High",
            status: "In Progress",
            date: "2023-10-25",
            description: "Guest reported AC is blowing hot air."
        },
        {
            id: 102,
            title: "Leaky Faucet",
            room: "201",
            priority: "Low",
            status: "New",
            date: "2023-10-26",
            description: "Bathroom sink faucet dripping constantly."
        },
        {
            id: 103,
            title: "Broken Chair Leg",
            room: "Lobby",
            priority: "Medium",
            status: "Pending",
            date: "2023-10-26",
            description: "One leg is wobbly on the waiting area chair."
        },
        {
            id: 104,
            title: "TV Remote Missing",
            room: "402",
            priority: "Low",
            status: "Completed",
            date: "2023-10-24",
            description: "Replaced remote control."
        }
    ]);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'Urgent': return 'red';
            case 'High': return 'orange';
            case 'Medium': return 'blue';
            default: return 'green';
        }
    };

    const getStatusBadge = (s) => {
        let className = 'badge-status ';
        switch (s) {
            case 'New': className += 'status-new'; break;
            case 'In Progress': className += 'status-progress'; break;
            case 'Completed': className += 'status-completed'; break;
            default: className += 'status-pending';
        }
        return <span className={className}>{s}</span>;
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="maintenance-layout">
            {/* Reusing existing Header but ideally Maintenance has its own nav links */}
            <Header user={user} role="maintenance" onLogout={handleLogout} />

            <div className="maintenance-container">
                <div className="maintenance-header">
                    <h1>Maintenance Dashboard</h1>
                    <p>Welcome back, {user.firstName}. Here are your tasks for today.</p>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-card total">
                        <div className="stat-icon">🔧</div>
                        <div className="stat-info">
                            <h3>{stats.total}</h3>
                            <span>Total Tasks</span>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <h3>{stats.pending}</h3>
                            <span>Pending</span>
                        </div>
                    </div>
                    <div className="stat-card progress">
                        <div className="stat-icon">⚙️</div>
                        <div className="stat-info">
                            <h3>{stats.inProgress}</h3>
                            <span>In Progress</span>
                        </div>
                    </div>
                    <div className="stat-card completed">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>{stats.completed}</h3>
                            <span>Completed</span>
                        </div>
                    </div>
                </div>

                {/* Recent Tasks Table */}
                <div className="tasks-section">
                    <div className="section-header">
                        <h2>Current Assignments</h2>
                        <button className="view-all-btn">View All</button>
                    </div>

                    <div className="table-responsive">
                        <table className="tasks-table">
                            <thead>
                                <tr>
                                    <th>Task ID</th>
                                    <th>Issue</th>
                                    <th>Location/Room</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id}>
                                        <td>#{task.id}</td>
                                        <td>
                                            <div className="task-title">{task.title}</div>
                                            <div className="task-desc">{task.description}</div>
                                        </td>
                                        <td>{task.room}</td>
                                        <td>
                                            <span style={{ color: getPriorityColor(task.priority), fontWeight: 'bold' }}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(task.status)}</td>
                                        <td>{task.date}</td>
                                        <td>
                                            <button className="action-btn">Update</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceDashboard;
