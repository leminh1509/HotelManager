// src/pages/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import './Usermanagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blacklistedUsers: 0,
    adminCount: 0,
    receptionistCount: 0,
    customerCount: 0,
    maintenanceCount: 0
  });

  
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form data
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    birthday: ''
  });

  const [newRoleId, setNewRoleId] = useState('');

  const API_BASE_URL = 'http://localhost:9999/api';

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Apply filters when users or filters change
  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const getToken = () => localStorage.getItem('token');

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchStatistics()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/all`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/roles/list`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/statistics`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Filter by role
    if (filters.role) {
      filtered = filtered.filter(user => 
        user.roleName.toLowerCase() === filters.role.toLowerCase()
      );
    }

    // Filter by status
    if (filters.status === 'active') {
      filtered = filtered.filter(user => user.isActive);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(user => !user.isActive);
    } else if (filters.status === 'blacklist') {
      filtered = filtered.filter(user => user.isBlackList);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      email: user.email,
      mobilePhone: user.mobilePhone || '',
      birthday: user.birthday || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      showAlert('User updated successfully!');
      setShowEditModal(false);
      fetchAllData();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  };

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setNewRoleId(user.roleId);
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();

    if (!newRoleId) {
      showAlert('Please select a role', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser.userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ roleId: parseInt(newRoleId) })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change role');
      }

      showAlert('Role changed successfully!');
      setShowRoleModal(false);
      fetchAllData();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this account?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle active status');
      }

      const result = await response.json();
      showAlert(result.message);
      fetchAllData();
    } catch (error) {
      showAlert('Failed to change status', 'error');
    }
  };

  const handleToggleBlacklist = async (userId, isBlackList) => {
    const action = isBlackList ? 'remove from' : 'add to';
    if (!window.confirm(`Are you sure you want to ${action} blacklist this user?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-blacklist`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle blacklist');
      }

      const result = await response.json();
      showAlert(result.message);
      fetchAllData();
    } catch (error) {
      showAlert('Failed to change blacklist status', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? The account will be deactivated.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      const result = await response.json();
      showAlert(result.message);
      fetchAllData();
    } catch (error) {
      showAlert('Failed to delete user', 'error');
    }
  };

  const getRoleBadgeClass = (roleName) => {
    const roleClasses = {
      admin: 'badge-admin',
      receptionist: 'badge-receptionist',
      customer: 'badge-customer',
      maintenance: 'badge-maintenance'
    };
    return roleClasses[roleName.toLowerCase()] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <p className="text-muted">Manage all users and their roles</p>
      </div>

      {/* Alert Message */}
      {alert.show && (
        <div className={`alert alert-${alert.type === 'error' ? 'danger' : 'success'}`}>
          {alert.message}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-details">
            <h3>{statistics.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-details">
            <h3>{statistics.activeUsers}</h3>
            <p>Active Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blacklist">
            <i className="fas fa-user-slash"></i>
          </div>
          <div className="stat-details">
            <h3>{statistics.blacklistedUsers}</h3>
            <p>Blacklisted</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon admin">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="stat-details">
            <h3>{statistics.adminCount}</h3>
            <p>Admins</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon receptionist">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="stat-details">
            <h3>{statistics.receptionistCount}</h3>
            <p>Receptionists</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon customer">
            <i className="fas fa-user-friends"></i>
          </div>
          <div className="stat-details">
            <h3>{statistics.customerCount}</h3>
            <p>Customers</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Role</label>
          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="form-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="receptionist">Receptionist</option>
            <option value="customer">Customer</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="form-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blacklist">Blacklisted</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search</label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            className="form-control"
            placeholder="Search by email or name..."
          />
        </div>

        <button className="btn-refresh" onClick={() => fetchAllData()}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="table-section">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.userId}>
                    <td>{user.userId}</td>
                    <td>
                      {user.firstName} {user.middleName || ''} {user.lastName}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.mobilePhone || '-'}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.roleName)}`}>
                        {user.roleName}
                      </span>
                    </td>
                    <td>
                      <div className="status-badges">
                        {user.isActive ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-danger">Inactive</span>
                        )}
                        {user.isBlackList && (
                          <span className="badge badge-dark">Blacklist</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditUser(user)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn-action btn-role"
                          onClick={() => handleChangeRole(user)}
                          title="Change Role"
                        >
                          <i className="fas fa-user-tag"></i>
                        </button>
                        <button
                          className="btn-action btn-toggle"
                          onClick={() => handleToggleActive(user.userId, user.isActive)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <i className={`fas fa-${user.isActive ? 'lock' : 'unlock'}`}></i>
                        </button>
                        <button
                          className="btn-action btn-blacklist"
                          onClick={() => handleToggleBlacklist(user.userId, user.isBlackList)}
                          title={user.isBlackList ? 'Remove from Blacklist' : 'Add to Blacklist'}
                        >
                          <i className={`fas fa-${user.isBlackList ? 'check' : 'ban'}`}></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteUser(user.userId)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User Information</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={editFormData.firstName}
                  onChange={handleEditFormChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={editFormData.middleName}
                  onChange={handleEditFormChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={editFormData.lastName}
                  onChange={handleEditFormChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Phone</label>
                <input
                  type="text"
                  name="mobilePhone"
                  value={editFormData.mobilePhone}
                  onChange={handleEditFormChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  value={editFormData.birthday}
                  onChange={handleEditFormChange}
                  className="form-control"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change User Role</h2>
              <button className="close-btn" onClick={() => setShowRoleModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <div className="form-group">
                <label>User</label>
                <input
                  type="text"
                  value={`${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`}
                  className="form-control"
                  readOnly
                />
              </div>

              <div className="form-group">
                <label>Select New Role *</label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">-- Select Role --</option>
                  {roles.map(role => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Change Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;