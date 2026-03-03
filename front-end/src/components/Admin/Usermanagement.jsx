import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Usermanagement.css";

const API_BASE = "http://localhost:9999";

function getToken() {
  return localStorage.getItem("token") || "";
}
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const url = `${API_BASE}${path}`;
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { ...options, headers });
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) { try { data = await res.json(); } catch { data = null; } }
  else { try { const text = await res.text(); data = text ? { message: text } : null; } catch { data = null; } }
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(msg); err.status = res.status; err.payload = data; throw err;
  }
  return data;
}

const EMPTY_CREATE_FORM = {
  firstName: "", middleName: "", lastName: "",
  email: "", password: "", confirmPassword: "",
  mobilePhone: "", birthday: "", roleId: "", isActive: true,
};

export default function UserManagement() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [busyUserIds, setBusyUserIds] = useState(() => new Set());

  // Info/confirm modal
  const [modal, setModal] = useState({ open: false, title: "", message: "", variant: "info", onOk: null });

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", middleName: "", lastName: "", mobilePhone: "", birthday: "" });

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createErrors, setCreateErrors] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId ?? null;
  const currentEmail = currentUser?.email ?? null;

  // ---- Modal helpers ----
  const showModal = ({ title, message, variant = "info", onOk = null }) =>
    setModal({ open: true, title, message, variant, onOk });
  const closeModal = () => setModal((m) => ({ ...m, open: false, onOk: null }));
  const confirmOk = async () => {
    const cb = modal.onOk;
    setModal((m) => ({ ...m, open: false, onOk: null }));
    if (typeof cb === "function") await cb();
  };

  const markBusy = (userId, value) =>
    setBusyUserIds((prev) => { const next = new Set(prev); value ? next.add(userId) : next.delete(userId); return next; });

  const handleApiError = (e) => {
    if (e.status === 401) {
      showModal({ variant: "warning", title: "Phiên đăng nhập hết hạn", message: "Vui lòng đăng nhập lại.",
        onOk: () => { localStorage.clear(); navigate("/login"); } });
      return;
    }
    if (e.status === 403) {
      showModal({ variant: "danger", title: "Không có quyền (403)", message: "Bạn không có quyền ADMIN.",
        onOk: () => navigate("/forbidden") });
      return;
    }
    showModal({ variant: "danger", title: "Có lỗi xảy ra", message: e.message || "Request failed" });
  };

  // ---- Fetch ----
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(0), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterRole]);

  useEffect(() => {
    fetchUsers(0);
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async (page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, size: pageSize, sortBy: "userId", sortDir: "asc" });
      if (searchTerm) params.append("keyword", searchTerm);
      if (filterRole && filterRole !== "all") params.append("role", filterRole);
      const data = await apiFetch(`/api/admin/users?${params}`);
      if (data) {
        setUsers(data.users || []);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (e) { handleApiError(e); }
    finally { setLoading(false); }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiFetch("/api/admin/users/statistics");
      setStatistics(stats || {});
      const rolesData = await apiFetch("/api/admin/users/roles/list");
      setRoles(rolesData || []);
    } catch (e) { console.error("Failed to fetch stats/roles", e); }
  };

  const handleRefresh = () => { fetchUsers(currentPage); fetchStatistics(); };
  const handlePageChange = (p) => { if (p >= 0 && p < totalPages) fetchUsers(p); };

  // ---- Edit ----
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({ firstName: user.firstName || "", middleName: user.middleName || "", lastName: user.lastName || "", mobilePhone: user.mobilePhone || "", birthday: user.birthday || "" });
    setEditModalOpen(true);
  };
  const closeEditModal = () => { setEditModalOpen(false); setEditingUser(null); };
  const saveUserEdits = async () => {
    if (!editingUser) return;
    try {
      markBusy(editingUser.userId, true);
      await apiFetch(`/api/admin/users/${editingUser.userId}`, {
        method: "PUT",
        body: JSON.stringify({ firstName: editForm.firstName.trim(), middleName: editForm.middleName.trim() || null, lastName: editForm.lastName.trim(), mobilePhone: editForm.mobilePhone.trim() || null, birthday: editForm.birthday || null }),
      });
      handleRefresh(); closeEditModal();
      showModal({ variant: "success", title: "Thành công", message: "Đã cập nhật thông tin user." });
    } catch (e) { handleApiError(e); }
    finally { markBusy(editingUser.userId, false); }
  };

  // ---- Create user ----
  const openCreateModal = () => {
    setCreateForm({ ...EMPTY_CREATE_FORM, roleId: roles[0]?.roleId ?? "" });
    setCreateErrors({});
    setCreateModalOpen(true);
  };
  const closeCreateModal = () => { setCreateModalOpen(false); setCreateErrors({}); };

  const validateCreate = () => {
    const errs = {};
    if (!createForm.firstName.trim()) errs.firstName = "Bắt buộc";
    if (!createForm.lastName.trim()) errs.lastName = "Bắt buộc";
    if (!createForm.email.trim()) errs.email = "Bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errs.email = "Email không hợp lệ";
    if (!createForm.password) errs.password = "Bắt buộc";
    else if (createForm.password.length < 6) errs.password = "Tối thiểu 6 ký tự";
    if (createForm.password !== createForm.confirmPassword) errs.confirmPassword = "Mật khẩu không khớp";
    if (createForm.mobilePhone && !/^[0-9]{10,20}$/.test(createForm.mobilePhone)) errs.mobilePhone = "10-20 chữ số";
    if (!createForm.roleId) errs.roleId = "Bắt buộc";
    return errs;
  };

  const handleCreateUser = async () => {
    const errs = validateCreate();
    if (Object.keys(errs).length > 0) { setCreateErrors(errs); return; }
    try {
      setCreateLoading(true);
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          firstName: createForm.firstName.trim(),
          middleName: createForm.middleName.trim() || null,
          lastName: createForm.lastName.trim(),
          email: createForm.email.trim().toLowerCase(),
          password: createForm.password,
          mobilePhone: createForm.mobilePhone.trim() || null,
          birthday: createForm.birthday || null,
          roleId: Number(createForm.roleId),
          isActive: createForm.isActive,
        }),
      });
      closeCreateModal();
      handleRefresh();
      showModal({ variant: "success", title: "Tạo tài khoản thành công", message: `Đã tạo tài khoản cho ${createForm.email}.` });
    } catch (e) {
      if (e.message?.toLowerCase().includes("email")) setCreateErrors({ email: e.message });
      else if (e.message?.toLowerCase().includes("phone")) setCreateErrors({ mobilePhone: e.message });
      else handleApiError(e);
    } finally { setCreateLoading(false); }
  };

  // ---- Other actions ----
  const handleToggleActive = async (user) => {
    const isMe = user.userId === currentUserId || (currentEmail && user.email === currentEmail);
    if (isMe) { showModal({ variant: "warning", title: "Không thể", message: "Bạn không thể tự deactivate tài khoản của mình." }); return; }
    showModal({
      variant: "warning", title: `Xác nhận ${user.isActive ? "Deactivate" : "Activate"}`,
      message: `Bạn chắc chắn muốn ${user.isActive ? "deactivate" : "activate"} user: ${user.email}?`,
      onOk: async () => {
        try { markBusy(user.userId, true); await apiFetch(`/api/admin/users/${user.userId}/toggle-active`, { method: "PATCH" }); handleRefresh(); }
        catch (e) { handleApiError(e); } finally { markBusy(user.userId, false); }
      },
    });
  };

  const handleDeleteUser = async (user) => {
    const isMe = user.userId === currentUserId || (currentEmail && user.email === currentEmail);
    if (isMe) { showModal({ variant: "warning", title: "Không thể", message: "Bạn không thể xóa tài khoản của mình." }); return; }
    showModal({
      variant: "danger", title: "Xác nhận xóa", message: `Bạn chắc chắn muốn xóa user: ${user.email}?`,
      onOk: async () => {
        try {
          markBusy(user.userId, true);
          await apiFetch(`/api/admin/users/${user.userId}`, { method: "DELETE" });
          handleRefresh();
          showModal({ variant: "success", title: "Đã xóa", message: "User đã được xóa thành công." });
        } catch (e) { handleApiError(e); } finally { markBusy(user.userId, false); }
      },
    });
  };

  const handleChangeRole = async (user, newRoleIdRaw) => {
    try {
      markBusy(user.userId, true);
      await apiFetch(`/api/admin/users/${user.userId}/role`, { method: "PATCH", body: JSON.stringify({ roleId: Number(newRoleIdRaw) }) });
      handleRefresh();
      showModal({ variant: "success", title: "Thành công", message: "Đổi role thành công." });
    } catch (e) { handleApiError(e); } finally { markBusy(user.userId, false); }
  };

  // ---- Render ----
  return (
    <div className="user-management">

      {/* Info/Confirm modal */}
      {modal.open && (
        <div className="um-modal-overlay" onClick={closeModal}>
          <div className={`um-modal um-${modal.variant}`} onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{modal.title}</h3>
              <button className="um-close" onClick={closeModal}>×</button>
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
              <h3>Chỉnh sửa thông tin user</h3>
              <button className="um-close" onClick={closeEditModal}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form">
                <div className="um-row">
                  <div className="um-field"><label>First name</label><input className="um-input" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
                  <div className="um-field"><label>Middle name</label><input className="um-input" value={editForm.middleName} onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })} /></div>
                  <div className="um-field"><label>Last name</label><input className="um-input" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
                </div>
                <div className="um-row um-row-2">
                  <div className="um-field"><label>Phone</label><input className="um-input" value={editForm.mobilePhone} onChange={(e) => setEditForm({ ...editForm, mobilePhone: e.target.value })} placeholder="10–20 digits" /></div>
                  <div className="um-field"><label>Birthday</label><input type="date" className="um-input" value={editForm.birthday} onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })} /></div>
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

      {/* ===== Create User Modal ===== */}
      {createModalOpen && (
        <div className="um-modal-overlay" onClick={closeCreateModal}>
          <div className="um-modal um-success" onClick={(e) => e.stopPropagation()} style={{ width: "min(780px, 96vw)" }}>
            <div className="um-modal-header">
              <h3>➕ Tạo tài khoản người dùng mới</h3>
              <button className="um-close" onClick={closeCreateModal}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form">

                {/* Row 1: First / Middle / Last */}
                <div className="um-row">
                  <div className="um-field">
                    <label>First name <span style={{ color: "red" }}>*</span></label>
                    <input className="um-input" value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} placeholder="Nguyễn" />
                    {createErrors.firstName && <div className="um-field-error">{createErrors.firstName}</div>}
                  </div>
                  <div className="um-field">
                    <label>Middle name</label>
                    <input className="um-input" value={createForm.middleName} onChange={(e) => setCreateForm({ ...createForm, middleName: e.target.value })} placeholder="Văn" />
                  </div>
                  <div className="um-field">
                    <label>Last name <span style={{ color: "red" }}>*</span></label>
                    <input className="um-input" value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} placeholder="An" />
                    {createErrors.lastName && <div className="um-field-error">{createErrors.lastName}</div>}
                  </div>
                </div>

                {/* Row 2: Email / Phone */}
                <div className="um-row um-row-2">
                  <div className="um-field">
                    <label>Email <span style={{ color: "red" }}>*</span></label>
                    <input type="email" className="um-input" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="example@email.com" />
                    {createErrors.email && <div className="um-field-error">{createErrors.email}</div>}
                  </div>
                  <div className="um-field">
                    <label>Phone</label>
                    <input className="um-input" value={createForm.mobilePhone} onChange={(e) => setCreateForm({ ...createForm, mobilePhone: e.target.value })} placeholder="0912345678" />
                    {createErrors.mobilePhone && <div className="um-field-error">{createErrors.mobilePhone}</div>}
                  </div>
                </div>

                {/* Row 3: Password / Confirm password */}
                <div className="um-row um-row-2">
                  <div className="um-field">
                    <label>Mật khẩu <span style={{ color: "red" }}>*</span></label>
                    <input type="password" className="um-input" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" />
                    {createErrors.password && <div className="um-field-error">{createErrors.password}</div>}
                  </div>
                  <div className="um-field">
                    <label>Xác nhận mật khẩu <span style={{ color: "red" }}>*</span></label>
                    <input type="password" className="um-input" value={createForm.confirmPassword} onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })} placeholder="Nhập lại mật khẩu" />
                    {createErrors.confirmPassword && <div className="um-field-error">{createErrors.confirmPassword}</div>}
                  </div>
                </div>

                {/* Row 4: Birthday / Role / isActive */}
                <div className="um-row">
                  <div className="um-field">
                    <label>Birthday</label>
                    <input type="date" className="um-input" value={createForm.birthday} onChange={(e) => setCreateForm({ ...createForm, birthday: e.target.value })} />
                  </div>
                  <div className="um-field">
                    <label>Role <span style={{ color: "red" }}>*</span></label>
                    <select className="um-input" value={createForm.roleId} onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}>
                      <option value="">-- Chọn role --</option>
                      {roles.map((r) => (
                        <option key={r.roleId} value={r.roleId}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                      ))}
                    </select>
                    {createErrors.roleId && <div className="um-field-error">{createErrors.roleId}</div>}
                  </div>
                  <div className="um-field" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 0, paddingBottom: 10 }}>
                      <input
                        type="checkbox"
                        checked={createForm.isActive}
                        onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      Kích hoạt ngay
                    </label>
                  </div>
                </div>

                <div className="um-hint">* Các trường bắt buộc. Mật khẩu sẽ được mã hóa (BCrypt) trước khi lưu vào database.</div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={closeCreateModal} disabled={createLoading}>Hủy</button>
              <button className="um-btn um-primary" onClick={handleCreateUser} disabled={createLoading} style={{ minWidth: 130 }}>
                {createLoading ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>User Management</h1>
        <button className="um-btn um-primary" onClick={openCreateModal} style={{ fontSize: 15, padding: "10px 20px", borderRadius: 12 }}>
          ➕ Tạo người dùng
        </button>
      </div>

      {/* Statistics */}
      <div className="statistics-grid">
        <div className="stat-card">
          <i className="fa fa-users" />
          <div className="stat-info"><h3>{statistics.totalUsers || 0}</h3><p>Total Users</p></div>
        </div>
        <div className="stat-card">
          <i className="fa fa-check-circle" />
          <div className="stat-info"><h3>{statistics.activeUsers || 0}</h3><p>Active Users</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input className="search-input" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select className="role-filter" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          {roles.map((r) => <option key={r.roleId} value={r.name}>{r.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading && <div className="loading">Loading...</div>}
        <table className="users-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th style={{ width: 160 }}>Role</th>
              <th style={{ width: 120 }}>Status</th>
              <th style={{ width: 320 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const busy = busyUserIds.has(user.userId);
              const isMe = user.userId === currentUserId || (currentEmail && user.email === currentEmail);
              return (
                <tr key={user.userId}>
                  <td>{user.userId}</td>
                  <td>{user.firstName} {user.middleName} {user.lastName}{isMe && <span className="um-pill">You</span>}</td>
                  <td>{user.email}</td>
                  <td>{user.mobilePhone || "N/A"}</td>
                  <td>
                    <select value={user.roleId} onChange={(e) => handleChangeRole(user, e.target.value)} className="role-select" disabled={busy || isMe}>
                      {roles.map((role) => <option key={role.roleId} value={role.roleId}>{role.name.charAt(0).toUpperCase() + role.name.slice(1)}</option>)}
                    </select>
                  </td>
                  <td><span className={`badge ${user.isActive ? "active" : "inactive"}`}>{user.isActive ? "Active" : "Inactive"}</span></td>
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
            {users.length === 0 && !loading && <tr><td colSpan={7} className="no-results">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-controls">
        <button disabled={currentPage === 0 || loading} onClick={() => handlePageChange(currentPage - 1)} className="um-btn">Previous</button>
        <span className="page-info">Page {currentPage + 1} of {totalPages} (Total: {totalItems})</span>
        <button disabled={currentPage >= totalPages - 1 || loading} onClick={() => handlePageChange(currentPage + 1)} className="um-btn">Next</button>
      </div>

    </div>
  );
}