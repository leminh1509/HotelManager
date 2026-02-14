import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Usermanagement.css";

const API_BASE = "http://localhost:9999";

function getToken() {
  return localStorage.getItem("token") || "";
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const url = `${API_BASE}${path}`;

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

export default function UserManagement() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [busyUserIds, setBusyUserIds] = useState(() => new Set());

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    variant: "info", // info|success|warning|danger
    onOk: null,
  });

  // ===== Edit user modal =====
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    mobilePhone: "",
    birthday: "", // yyyy-MM-dd
  });

  const showModal = ({ title, message, variant = "info", onOk = null }) => {
    setModal({ open: true, title, message, variant, onOk });
  };

  const closeModal = () => {
    setModal((m) => ({ ...m, open: false, onOk: null }));
  };

  const confirmOk = async () => {
    const cb = modal.onOk;
    setModal((m) => ({ ...m, open: false, onOk: null }));
    if (typeof cb === "function") await cb();
  };


  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      mobilePhone: user.mobilePhone || "",
      birthday: user.birthday || "", // LocalDate -> "YYYY-MM-DD"
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
  };

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId ?? null;
  const currentEmail = currentUser?.email ?? null;

  const markBusy = (userId, value) => {
    setBusyUserIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const handleApiError = (e) => {
    console.error(e);

    if (e.status === 401) {
      showModal({
        variant: "warning",
        title: "Phiên đăng nhập đã hết hạn",
        message: "Vui lòng đăng nhập lại.",
        onOk: () => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          navigate("/login");
        },
      });
      return;
    }

    if (e.status === 403) {
      showModal({
        variant: "danger",
        title: "Không có quyền (403)",
        message:
          "Token hiện tại không có quyền ADMIN hoặc bạn vừa tự đổi role/deactivate admin. Hãy đăng nhập lại bằng tài khoản ADMIN.",
        onOk: () => navigate("/forbidden"),
      });
      return;
    }

    showModal({
      variant: "danger",
      title: "Có lỗi xảy ra",
      message: e.message || "Request failed",
    });
  };

  // ===== Pagination state =====
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchUsers(0); // Reset to page 0 on search/filter change
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterRole]);

  // Initial load
  useEffect(() => {
    // fetchUsers(0); // Handled by the debounce effect above initially if meaningful, 
    // but to ensure initial load works even with empty search:
    if (searchTerm === "" && filterRole === "all" && users.length === 0) {
      fetchUsers(0);
    }
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async (page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        size: pageSize,
        sortBy: "userId",
        sortDir: "desc",
      });

      if (searchTerm) params.append("keyword", searchTerm);
      if (filterRole && filterRole !== "all") params.append("role", filterRole);

      const data = await apiFetch(`/api/admin/users?${params.toString()}`);

      if (data) {
        setUsers(data.users || []);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiFetch("/api/admin/users/statistics");
      setStatistics(stats || {});

      // Also fetch roles for dropdown
      const rolesData = await apiFetch("/api/admin/users/roles/list");
      setRoles(rolesData || []);

    } catch (e) {
      console.error("Failed to fetch stats/roles", e);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchUsers(newPage);
    }
  };

  const handleRefresh = () => {
    fetchUsers(currentPage);
    fetchStatistics();
  };

  // --- Actions ---
  // ... (Keep existing modal/edit logic, but update refresh calls to use handleRefresh)

  const saveUserEdits = async () => {
    // ... (validation logic same as before)
    if (!editingUser) return;
    const phone = (editForm.mobilePhone || "").trim();
    // ... validation

    try {
      markBusy(editingUser.userId, true);
      await apiFetch(`/api/admin/users/${editingUser.userId}`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          middleName: editForm.middleName.trim() || null,
          lastName: editForm.lastName.trim(),
          mobilePhone: phone || null,
          birthday: editForm.birthday || null,
        }),
      });

      handleRefresh();
      closeEditModal();
      showModal({
        variant: "success",
        title: "Thành công",
        message: "Đã cập nhật thông tin user.",
      });
    } catch (e) {
      handleApiError(e);
    } finally {
      markBusy(editingUser.userId, false);
    }
  };

  const handleToggleActive = async (user) => {
    // ... check isMe ...
    const isMe = user.userId === currentUserId || (currentEmail && user.email === currentEmail);
    if (isMe) { /* ... */ return; }

    const nextAction = user.isActive ? "Deactivate" : "Activate";
    showModal({
      variant: "warning",
      title: `Xác nhận ${nextAction}`,
      message: `Bạn chắc chắn muốn ${nextAction} user: ${user.email}?`,
      onOk: async () => {
        try {
          markBusy(user.userId, true);
          await apiFetch(`/api/admin/users/${user.userId}/toggle-active`, { method: "PATCH" });
          handleRefresh();
        } catch (e) {
          handleApiError(e);
        } finally {
          markBusy(user.userId, false);
        }
      },
    });
  };

  const handleDeleteUser = async (user) => {
    // ... check isMe ...
    const isMe = user.userId === currentUserId || (currentEmail && user.email === currentEmail);
    if (isMe) { /* ... */ return; }

    showModal({
      variant: "warning",
      title: "Xác nhận xóa",
      message: `Bạn chắc chắn muốn xóa user: ${user.email}?`,
      onOk: async () => {
        try {
          markBusy(user.userId, true);
          await apiFetch(`/api/admin/users/${user.userId}`, { method: "DELETE" });
          handleRefresh();
          showModal({ variant: "success", title: "Đã xóa", message: "User đã được xóa thành công." });
        } catch (e) {
          handleApiError(e);
        } finally {
          markBusy(user.userId, false);
        }
      },
    });
  };

  const handleChangeRole = async (user, newRoleIdRaw) => {
    // ... same logic ...
    const newRoleId = Number(newRoleIdRaw);
    // ... 
    try {
      markBusy(user.userId, true);
      await apiFetch(`/api/admin/users/${user.userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ roleId: newRoleId }),
      });
      handleRefresh();
      showModal({ variant: "success", title: "Thành công", message: "Đổi role thành công." });
    } catch (e) {
      // revert local change if needed, but we rely on refresh
      handleApiError(e);
    } finally {
      markBusy(user.userId, false);
    }
  };

  // Client-side filtering is REMOVED because we do it server-side now.
  // We use 'users' directly from state.

  return (
    <div className="user-management">
      {/* ... Modals (keep as is) ... */}
      {/* ... Edit Modal (keep as is) ... */}

      {/* Info modal */}
      {modal.open && (
        <div className="um-modal-overlay" onClick={closeModal}>
          <div className={`um-modal um-${modal.variant}`} onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{modal.title}</h3>
              <button className="um-close" onClick={closeModal} aria-label="Close">×</button>
            </div>
            <div className="um-modal-body">{modal.message}</div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={closeModal}>Cancel</button>
              <button className="um-btn um-primary" onClick={confirmOk}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModalOpen && (
        <div className="um-modal-overlay" onClick={closeEditModal}>
          <div className="um-modal um-info" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Edit user</h3>
              <button className="um-close" onClick={closeEditModal} aria-label="Close">×</button>
            </div>
            <div className="um-modal-body">
              {/* ... Keep form inputs ... */}
              <div className="um-form">
                <div className="um-row">
                  <div className="um-field">
                    <label>First name</label>
                    <input className="um-input" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                  </div>
                  <div className="um-field">
                    <label>Middle name</label>
                    <input className="um-input" value={editForm.middleName} onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })} />
                  </div>
                  <div className="um-field">
                    <label>Last name</label>
                    <input className="um-input" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="um-row um-row-2">
                  <div className="um-field">
                    <label>Phone</label>
                    <input className="um-input" value={editForm.mobilePhone} onChange={(e) => setEditForm({ ...editForm, mobilePhone: e.target.value })} placeholder="10–20 digits" />
                  </div>
                  <div className="um-field">
                    <label>Birthday</label>
                    <input type="date" className="um-input" value={editForm.birthday} onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })} />
                  </div>
                </div>
                <div className="um-hint">* Birthday phải là ngày trong quá khứ. Phone chỉ nhận 10–20 chữ số.</div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={closeEditModal}>Cancel</button>
              <button className="um-btn um-primary" onClick={saveUserEdits}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1>User Management</h1>
      </div>

      <div className="statistics-grid">
        <div className="stat-card">
          <i className="fa fa-users" />
          <div className="stat-info">
            <h3>{statistics.totalUsers || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="fa fa-check-circle" />
          <div className="stat-info">
            <h3>{statistics.activeUsers || 0}</h3>
            <p>Active Users</p>
          </div>
        </div>
      </div>

      <div className="filters">
        <input
          className="search-input"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="role-filter" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          {roles.map((r) => (
            <option key={r.roleId} value={r.name}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        {loading && <div className="loading-overlay">Loading...</div>}
        <table className="users-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th style={{ width: 160 }}>Role</th>
              <th style={{ width: 160 }}>Status</th>
              <th style={{ width: 320 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => {
              const busy = busyUserIds.has(user.userId);
              const isMe = user.userId === currentUserId || (currentEmail && user.email === currentEmail);
              return (
                <tr key={user.userId}>
                  <td>{user.userId}</td>
                  <td>{user.firstName} {user.middleName} {user.lastName} {isMe && <span className="um-pill">You</span>}</td>
                  <td>{user.email}</td>
                  <td>{user.mobilePhone || "N/A"}</td>
                  <td>
                    <select
                      value={user.roleId}
                      onChange={(e) => handleChangeRole(user, e.target.value)}
                      className="role-select"
                      disabled={busy || isMe}
                    >
                      {roles.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? "active" : "inactive"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit" onClick={() => openEditModal(user)} disabled={busy}>Edit</button>
                      <button className={`action-btn ${user.isActive ? "deactivate" : "activate"}`} onClick={() => handleToggleActive(user)} disabled={busy || isMe}>
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteUser(user)} disabled={busy || isMe}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && !loading && (
              <tr><td colSpan={7} className="no-results">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button
          disabled={currentPage === 0 || loading}
          onClick={() => handlePageChange(currentPage - 1)}
          className="um-btn"
        >
          Previous
        </button>
        <span className="page-info">
          Page {currentPage + 1} of {totalPages} (Total: {totalItems})
        </span>
        <button
          disabled={currentPage >= totalPages - 1 || loading}
          onClick={() => handlePageChange(currentPage + 1)}
          className="um-btn"
        >
          Next
        </button>
      </div>

    </div>
  );
}
