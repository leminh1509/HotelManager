// src/components/Admin/UserManagement/Usermanagement.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Usermanagement.css";

const API_BASE = "http://localhost:9999";

function getToken() { return localStorage.getItem("token") || ""; }
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${getToken()}` };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { ...options, headers });
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) { try { data = await res.json(); } catch { data = null; } }
  else { try { const t = await res.text(); data = t ? { message: t } : null; } catch { data = null; } }
  if (!res.ok) { const e = new Error(data?.message || `HTTP ${res.status}`); e.status = res.status; throw e; }
  return data;
}

const ROLE_COLORS = {
  admin: { bg: "#fce8e8", color: "#9b1c1c" },
  receptionist: { bg: "#e8f0fe", color: "#1a56db" },
  customer: { bg: "#f0fdf4", color: "#166534" },
  maintenance: { bg: "#fff7ed", color: "#9a3412" },
  maintenance_manager: { bg: "#f5f3ff", color: "#6d28d9" },
};

const EMPTY_CREATE = {
  firstName: "", middleName: "", lastName: "",
  email: "", password: "", confirmPassword: "",
  mobilePhone: "", birthday: "", roleId: "", isActive: true,
};

// Avatar initials
function Avatar({ user }) {
  const initials = ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || "?";
  const colors = ["#667eea", "#764ba2", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
  const bg = colors[(user.userId || 0) % colors.length];
  return (
    <div className="um-avatar" style={{ background: bg }}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={initials} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        : initials}
    </div>
  );
}

//Role badge
function RoleBadge({ roleName }) {
  const style = ROLE_COLORS[roleName] || { bg: "#f3f4f6", color: "#374151" };
  const label = roleName?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) || "";
  return <span className="um-role-badge" style={{ background: style.bg, color: style.color }}>{label}</span>;
}

//Field component
function Field({ label, required, error, children }) {
  return (
    <div className="um-field">
      <label>{label}{required && <span className="um-required"> *</span>}</label>
      {children}
      {error && <div className="um-field-error">{error}</div>}
    </div>
  );
}

export default function UserManagement() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId ?? null;
  const currentEmail = currentUser?.email ?? null;

  // state
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");   // ← NEW
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // info/confirm modal
  const [modal, setModal] = useState({ open: false, title: "", message: "", variant: "info", onOk: null });

  // view-detail drawer
  const [detailUser, setDetailUser] = useState(null);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);

  const markBusy = (id, v) => setBusyIds(prev => { const s = new Set(prev); v ? s.add(id) : s.delete(id); return s; });

  const showModal = useCallback(({ title, message, variant = "info", onOk = null }) =>
    setModal({ open: true, title, message, variant, onOk }), []);

  const closeModal = () => setModal(m => ({ ...m, open: false, onOk: null }));

  const confirmOk = async () => {
    const cb = modal.onOk;
    setModal(m => ({ ...m, open: false, onOk: null }));
    if (typeof cb === "function") await cb();
  };

  const handleApiError = useCallback((e) => {
    if (e.status === 401) { showModal({ variant: "warning", title: "Phiên hết hạn", message: "Vui lòng đăng nhập lại.", onOk: () => { localStorage.clear(); navigate("/login"); } }); return; }
    if (e.status === 403) { showModal({ variant: "danger", title: "Không có quyền", message: "Bạn không có quyền ADMIN." }); return; }
    showModal({ variant: "danger", title: "Lỗi", message: e.message || "Request failed" });
  }, [navigate, showModal]);

  const fetchUsers = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: pageSize, sortBy: "userId", sortDir: "asc" });
      if (searchTerm.trim()) params.append("keyword", searchTerm.trim());
      if (filterRole !== "all") params.append("role", filterRole);
      const data = await apiFetch(`/api/admin/users?${params}`);
      if (data) {
        // client-side status filter since backend may not support it
        let list = data.users || [];
        if (filterStatus === "active") list = list.filter(u => u.isActive && !u.isBlackList);
        if (filterStatus === "inactive") list = list.filter(u => !u.isActive);
        if (filterStatus === "blacklist") list = list.filter(u => u.isBlackList);
        setUsers(list);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (e) { handleApiError(e); }
    finally { setLoading(false); }
  }, [searchTerm, filterRole, filterStatus, handleApiError]);

  const fetchMeta = useCallback(async () => {
    try {
      const [statsData, rolesData] = await Promise.all([
        apiFetch("/api/admin/users/statistics"),
        apiFetch("/api/admin/users/roles/list"),
      ]);
      setStats(statsData || {});
      setRoles(rolesData || []);
    } catch (e) { console.error("meta fetch failed", e); }
  }, []);

  // debounce search/filter
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(0), 400);
    return () => clearTimeout(t);
  }, [searchTerm, filterRole, filterStatus]);   // eslint-disable-line

  useEffect(() => { fetchUsers(0); fetchMeta(); }, []); // eslint-disable-line

  const refresh = () => { fetchUsers(currentPage); fetchMeta(); };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      mobilePhone: user.mobilePhone || "",
      birthday: user.birthday || "",
      roleId: user.roleId ?? "",
      isActive: user.isActive ?? true,
      isBlackList: user.isBlackList ?? false,
      avatarUrl: user.avatarUrl || "",
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const validateEdit = () => {
    const e = {};
    if (!editForm.firstName.trim()) e.firstName = "Bắt buộc";
    if (!editForm.lastName.trim()) e.lastName = "Bắt buộc";
    if (!editForm.email.trim()) e.email = "Bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) e.email = "Email không hợp lệ";
    if (editForm.mobilePhone && !/^[0-9]{10,20}$/.test(editForm.mobilePhone)) e.mobilePhone = "10–20 chữ số";
    return e;
  };

  const saveEdit = async () => {
    const errs = validateEdit();
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setEditLoading(true);
    try {
      await apiFetch(`/api/admin/users/${editUser.userId}`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          middleName: editForm.middleName.trim() || null,
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim().toLowerCase(),
          mobilePhone: editForm.mobilePhone.trim() || null,
          birthday: editForm.birthday || null,
          roleId: Number(editForm.roleId) || null,
          isActive: editForm.isActive,
          isBlackList: editForm.isBlackList,
          avatarUrl: editForm.avatarUrl.trim() || null,
        }),
      });
      setEditOpen(false);
      setEditUser(null);
      refresh();
      showModal({ variant: "success", title: "Cập nhật thành công", message: "Thông tin đã được lưu." });
    } catch (e) {
      if (e.message?.toLowerCase().includes("email")) setEditErrors({ email: e.message });
      else if (e.message?.toLowerCase().includes("phone")) setEditErrors({ mobilePhone: e.message });
      else handleApiError(e);
    } finally { setEditLoading(false); }
  };

  const openCreate = () => {
    setCreateForm({ ...EMPTY_CREATE, roleId: roles[0]?.roleId ?? "" });
    setCreateErrors({});
    setCreateOpen(true);
  };

  const validateCreate = () => {
    const e = {};
    if (!createForm.firstName.trim()) e.firstName = "Bắt buộc";
    if (!createForm.lastName.trim()) e.lastName = "Bắt buộc";
    if (!createForm.email.trim()) e.email = "Bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) e.email = "Email không hợp lệ";
    if (!createForm.password) e.password = "Bắt buộc";
    else if (createForm.password.length < 6) e.password = "Tối thiểu 6 ký tự";
    if (createForm.password !== createForm.confirmPassword) e.confirmPassword = "Không khớp";
    if (createForm.mobilePhone && !/^[0-9]{10,20}$/.test(createForm.mobilePhone)) e.mobilePhone = "10–20 chữ số";
    if (!createForm.roleId) e.roleId = "Bắt buộc";
    return e;
  };

  const handleCreate = async () => {
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreateLoading(true);
    try {
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
      setCreateOpen(false);
      refresh();
      showModal({ variant: "success", title: "Tạo thành công", message: `Đã tạo tài khoản ${createForm.email}.` });
    } catch (e) {
      if (e.message?.toLowerCase().includes("email")) setCreateErrors({ email: e.message });
      else if (e.message?.toLowerCase().includes("phone")) setCreateErrors({ mobilePhone: e.message });
      else handleApiError(e);
    } finally { setCreateLoading(false); }
  };

  const handleToggleActive = (user) => {
    if (user.userId === currentUserId) { showModal({ variant: "warning", title: "Không thể", message: "Không thể tự deactivate tài khoản của mình." }); return; }
    showModal({
      variant: "warning",
      title: `Xác nhận ${user.isActive ? "Deactivate" : "Activate"}`,
      message: `Bạn muốn ${user.isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản: ${user.email}?`,
      onOk: async () => {
        markBusy(user.userId, true);
        try { await apiFetch(`/api/admin/users/${user.userId}/toggle-active`, { method: "PATCH" }); refresh(); }
        catch (e) { handleApiError(e); } finally { markBusy(user.userId, false); }
      },
    });
  };

  const handleToggleBlacklist = (user) => {
    if (user.userId === currentUserId) { showModal({ variant: "warning", title: "Không thể", message: "Không thể tự blacklist tài khoản của mình." }); return; }
    showModal({
      variant: user.isBlackList ? "warning" : "danger",
      title: `${user.isBlackList ? "Xóa khỏi" : "Thêm vào"} Blacklist`,
      message: `Bạn muốn ${user.isBlackList ? "gỡ blacklist" : "đưa vào blacklist"} user: ${user.email}?`,
      onOk: async () => {
        markBusy(user.userId, true);
        try {
          await apiFetch(`/api/admin/users/${user.userId}`, {
            method: "PUT",
            body: JSON.stringify({ isBlackList: !user.isBlackList }),
          });
          refresh();
        } catch (e) { handleApiError(e); } finally { markBusy(user.userId, false); }
      },
    });
  };

  const handleDelete = (user) => {
    if (user.userId === currentUserId) { showModal({ variant: "warning", title: "Không thể", message: "Không thể xóa tài khoản của mình." }); return; }
    showModal({
      variant: "danger", title: "Xác nhận xóa",
      message: `Xóa vĩnh viễn user "${user.email}"? Hành động này không thể hoàn tác.`,
      onOk: async () => {
        markBusy(user.userId, true);
        try {
          await apiFetch(`/api/admin/users/${user.userId}`, { method: "DELETE" });
          refresh();
          showModal({ variant: "success", title: "Đã xóa", message: "User đã được xóa thành công." });
        } catch (e) { handleApiError(e); } finally { markBusy(user.userId, false); }
      },
    });
  };

  const handleChangeRole = async (user, newRoleId) => {
    markBusy(user.userId, true);
    try {
      await apiFetch(`/api/admin/users/${user.userId}/role`, { method: "PATCH", body: JSON.stringify({ roleId: Number(newRoleId) }) });
      refresh();
    } catch (e) { handleApiError(e); } finally { markBusy(user.userId, false); }
  };

  const handleResetPassword = (user) => {
    showModal({
      variant: "warning", title: "Reset mật khẩu",
      message: `Gửi email reset mật khẩu đến: ${user.email}?`,
      onOk: async () => {
        markBusy(user.userId, true);
        try {
          await apiFetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: user.email }) });
          showModal({ variant: "success", title: "Đã gửi", message: `Email reset đã gửi tới ${user.email}.` });
        } catch (e) { handleApiError(e); } finally { markBusy(user.userId, false); }
      },
    });
  };

  const getStatusBadge = (user) => {
    if (user.isBlackList) return <span className="um-status-badge blacklist">Blacklist</span>;
    if (!user.isActive) return <span className="um-status-badge inactive">Inactive</span>;
    return <span className="um-status-badge active">Active</span>;
  };

  // stat cards data
  const statCards = [
    { icon: "fa-users", label: "Tổng người dùng", value: stats.totalUsers || 0, color: "#667eea" },
    { icon: "fa-check-circle", label: "Đang hoạt động", value: stats.activeUsers || 0, color: "#10b981" },
    { icon: "fa-ban", label: "Blacklist", value: stats.blacklistedUsers || 0, color: "#ef4444" },
    { icon: "fa-user-plus", label: "Tổng trang hiện tại", value: users.length, color: "#f59e0b" },
  ];

  return (
    <div className="user-management">

      {/* ═══ Info / Confirm modal ═══ */}
      {modal.open && (
        <div className="um-modal-overlay" onClick={closeModal}>
          <div className={`um-modal um-${modal.variant}`} onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{modal.title}</h3>
              <button className="um-close" onClick={closeModal}>×</button>
            </div>
            <div className="um-modal-body">{modal.message}</div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={closeModal}>Đóng</button>
              {modal.onOk && <button className="um-btn um-primary" onClick={confirmOk}>Xác nhận</button>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Detail Drawer ═══ */}
      {detailUser && (
        <div className="um-modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="um-modal um-info um-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Chi tiết người dùng</h3>
              <button className="um-close" onClick={() => setDetailUser(null)}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-detail-top">
                <Avatar user={detailUser} />
                <div>
                  <div className="um-detail-name">{detailUser.firstName} {detailUser.middleName} {detailUser.lastName}</div>
                  <div className="um-detail-email">{detailUser.email}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                    <RoleBadge roleName={detailUser.roleName} />
                    {getStatusBadge(detailUser)}
                  </div>
                </div>
              </div>
              <div className="um-detail-grid">
                <div className="um-detail-item"><span>User ID</span><strong>#{detailUser.userId}</strong></div>
                <div className="um-detail-item"><span>Phone</span><strong>{detailUser.mobilePhone || "—"}</strong></div>
                <div className="um-detail-item"><span>Birthday</span><strong>{detailUser.birthday || "—"}</strong></div>
                <div className="um-detail-item"><span>Blacklist</span><strong>{detailUser.isBlackList ? "Có" : "Không"}</strong></div>
                <div className="um-detail-item"><span>Tạo lúc</span><strong>{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString("vi-VN") : "—"}</strong></div>
                <div className="um-detail-item"><span>Cập nhật</span><strong>{detailUser.updatedAt ? new Date(detailUser.updatedAt).toLocaleString("vi-VN") : "—"}</strong></div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={() => setDetailUser(null)}>Đóng</button>
              <button className="um-btn um-primary" onClick={() => { setDetailUser(null); openEdit(detailUser); }}>Chỉnh sửa</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Edit Modal ═══ */}
      {editOpen && editUser && (
        <div className="um-modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="um-modal um-info um-wide-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>✏️ Chỉnh sửa — {editUser.firstName} {editUser.lastName}</h3>
              <button className="um-close" onClick={() => setEditOpen(false)}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form">
                {/* Tên */}
                <div className="um-section-label">Thông tin cơ bản</div>
                <div className="um-row">
                  <Field label="First name" required error={editErrors.firstName}>
                    <input className={`um-input ${editErrors.firstName ? "um-input-error" : ""}`} value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
                  </Field>
                  <Field label="Middle name">
                    <input className="um-input" value={editForm.middleName} onChange={e => setEditForm(f => ({ ...f, middleName: e.target.value }))} />
                  </Field>
                  <Field label="Last name" required error={editErrors.lastName}>
                    <input className={`um-input ${editErrors.lastName ? "um-input-error" : ""}`} value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
                  </Field>
                </div>
                {/* Contact */}
                <div className="um-section-label">Liên hệ</div>
                <div className="um-row um-row-2">
                  <Field label="Email" required error={editErrors.email}>
                    <input type="email" className={`um-input ${editErrors.email ? "um-input-error" : ""}`} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  </Field>
                  <Field label="Phone" error={editErrors.mobilePhone}>
                    <input className={`um-input ${editErrors.mobilePhone ? "um-input-error" : ""}`} value={editForm.mobilePhone} onChange={e => setEditForm(f => ({ ...f, mobilePhone: e.target.value }))} placeholder="10–20 chữ số" />
                  </Field>
                </div>
                <div className="um-row um-row-2">
                  <Field label="Birthday">
                    <input type="date" className="um-input" value={editForm.birthday} onChange={e => setEditForm(f => ({ ...f, birthday: e.target.value }))} />
                  </Field>
                  <Field label="Avatar URL">
                    <input className="um-input" value={editForm.avatarUrl} onChange={e => setEditForm(f => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://..." />
                  </Field>
                </div>
                {/* Quyền & trạng thái */}
                <div className="um-section-label">Vai trò & Trạng thái</div>
                <div className="um-row">
                  <Field label="Role">
                    <select className="um-input" value={editForm.roleId} onChange={e => setEditForm(f => ({ ...f, roleId: e.target.value }))}>
                      {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.name.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </Field>
                  <div className="um-field um-toggle-field">
                    <label>Trạng thái Active</label>
                    <label className="um-toggle">
                      <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} />
                      <span className="um-toggle-slider" />
                    </label>
                    <span className="um-toggle-label">{editForm.isActive ? "Hoạt động" : "Đã khóa"}</span>
                  </div>
                  <div className="um-field um-toggle-field">
                    <label>Blacklist</label>
                    <label className="um-toggle">
                      <input type="checkbox" checked={editForm.isBlackList} onChange={e => setEditForm(f => ({ ...f, isBlackList: e.target.checked }))} />
                      <span className="um-toggle-slider um-toggle-danger" />
                    </label>
                    <span className="um-toggle-label" style={{ color: editForm.isBlackList ? "#ef4444" : "inherit" }}>{editForm.isBlackList ? "Trong blacklist" : "Bình thường"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={() => setEditOpen(false)} disabled={editLoading}>Hủy</button>
              <button className="um-btn um-primary" onClick={saveEdit} disabled={editLoading}>
                {editLoading ? <span className="um-spinner" /> : "💾 Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Create Modal ═══ */}
      {createOpen && (
        <div className="um-modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="um-modal um-success um-wide-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>➕ Tạo tài khoản mới</h3>
              <button className="um-close" onClick={() => setCreateOpen(false)}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form">
                <div className="um-section-label">Thông tin cơ bản</div>
                <div className="um-row">
                  <Field label="First name" required error={createErrors.firstName}>
                    <input className={`um-input ${createErrors.firstName ? "um-input-error" : ""}`} value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Nguyễn" />
                  </Field>
                  <Field label="Middle name">
                    <input className="um-input" value={createForm.middleName} onChange={e => setCreateForm(f => ({ ...f, middleName: e.target.value }))} placeholder="Văn" />
                  </Field>
                  <Field label="Last name" required error={createErrors.lastName}>
                    <input className={`um-input ${createErrors.lastName ? "um-input-error" : ""}`} value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} placeholder="An" />
                  </Field>
                </div>
                <div className="um-section-label">Tài khoản</div>
                <div className="um-row um-row-2">
                  <Field label="Email" required error={createErrors.email}>
                    <input type="email" className={`um-input ${createErrors.email ? "um-input-error" : ""}`} value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="example@hotel.vn" />
                  </Field>
                  <Field label="Phone" error={createErrors.mobilePhone}>
                    <input className={`um-input ${createErrors.mobilePhone ? "um-input-error" : ""}`} value={createForm.mobilePhone} onChange={e => setCreateForm(f => ({ ...f, mobilePhone: e.target.value }))} placeholder="0912345678" />
                  </Field>
                </div>
                <div className="um-row um-row-2">
                  <Field label="Mật khẩu" required error={createErrors.password}>
                    <input type="password" className={`um-input ${createErrors.password ? "um-input-error" : ""}`} value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Tối thiểu 6 ký tự" />
                  </Field>
                  <Field label="Xác nhận mật khẩu" required error={createErrors.confirmPassword}>
                    <input type="password" className={`um-input ${createErrors.confirmPassword ? "um-input-error" : ""}`} value={createForm.confirmPassword} onChange={e => setCreateForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Nhập lại" />
                  </Field>
                </div>
                <div className="um-section-label">Cài đặt tài khoản</div>
                <div className="um-row">
                  <Field label="Birthday">
                    <input type="date" className="um-input" value={createForm.birthday} onChange={e => setCreateForm(f => ({ ...f, birthday: e.target.value }))} />
                  </Field>
                  <Field label="Role" required error={createErrors.roleId}>
                    <select className={`um-input ${createErrors.roleId ? "um-input-error" : ""}`} value={createForm.roleId} onChange={e => setCreateForm(f => ({ ...f, roleId: e.target.value }))}>
                      <option value="">-- Chọn vai trò --</option>
                      {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.name.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </Field>
                  <div className="um-field um-toggle-field">
                    <label>Kích hoạt ngay</label>
                    <label className="um-toggle">
                      <input type="checkbox" checked={createForm.isActive} onChange={e => setCreateForm(f => ({ ...f, isActive: e.target.checked }))} />
                      <span className="um-toggle-slider" />
                    </label>
                    <span className="um-toggle-label">{createForm.isActive ? "Hoạt động" : "Chưa kích hoạt"}</span>
                  </div>
                </div>
                <div className="um-hint">* Mật khẩu sẽ được mã hóa BCrypt trước khi lưu.</div>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn" onClick={() => setCreateOpen(false)} disabled={createLoading}>Hủy</button>
              <button className="um-btn um-primary" onClick={handleCreate} disabled={createLoading}>
                {createLoading ? <span className="um-spinner" /> : "✅ Tạo tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Page Header ═══ */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Quản lý người dùng</h1>
          <span className="page-header-sub">Tổng cộng {totalItems} tài khoản trong hệ thống</span>
        </div>
        <div className="page-header-actions">
          <button className="um-btn um-refresh" onClick={refresh} title="Làm mới">
            <i className="fa fa-refresh" />
          </button>
          <button className="um-btn um-primary um-create-btn" onClick={openCreate}>
            <i className="fa fa-plus" /> Tạo người dùng
          </button>
        </div>
      </div>

      {/* ═══ Statistics ═══ */}
      <div className="statistics-grid">
        {statCards.map(c => (
          <div className="stat-card" key={c.label}>
            <div className="stat-icon" style={{ background: c.color + "1a", color: c.color }}>
              <i className={`fa ${c.icon}`} />
            </div>
            <div className="stat-info">
              <h3 style={{ color: c.color }}>{c.value}</h3>
              <p>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Filters ═══ */}
      <div className="filters">
        <div className="search-wrapper">
          <i className="fa fa-search search-icon" />
          <input
            className="search-input"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button className="search-clear" onClick={() => setSearchTerm("")}>×</button>}
        </div>
        <select className="role-filter" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">Tất cả vai trò</option>
          {roles.map(r => <option key={r.roleId} value={r.name}>{r.name.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <select className="role-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã khóa</option>
          <option value="blacklist">Blacklist</option>
        </select>
      </div>

      {/* ═══ Table ═══ */}
      <div className="table-container">
        {loading && <div className="um-loading-bar" />}
        <table className="users-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vai trò</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th>Blacklist</th>
              <th>Ngày tạo</th>
              <th style={{ width: 240 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const busy = busyIds.has(user.userId);
              const isMe = user.userId === currentUserId || user.email === currentEmail;
              return (
                <tr key={user.userId} className={isMe ? "um-row-me" : ""}>
                  <td style={{ color: "#9ca3af", fontSize: 13 }}>{user.userId}</td>
                  <td>
                    <div className="um-user-cell">
                      <Avatar user={user} />
                      <div>
                        <div className="um-username">
                          {user.firstName} {user.middleName} {user.lastName}
                          {isMe && <span className="um-pill">You</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="um-email-cell">{user.email}</td>
                  <td style={{ fontSize: 13, color: "#6b7280" }}>{user.mobilePhone || "—"}</td>
                  <td>
                    <select
                      className="role-select"
                      value={user.roleId}
                      onChange={e => handleChangeRole(user, e.target.value)}
                      disabled={busy || isMe}
                    >
                      {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.name.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </td>
                  <td>{getStatusBadge(user)}</td>
                  <td>
                    <span className={`um-bl-indicator ${user.isBlackList ? "yes" : "no"}`}>
                      {user.isBlackList ? "Có" : "—"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#9ca3af" }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {/* View */}
                      <button className="action-btn view" title="Xem chi tiết" onClick={() => setDetailUser(user)} disabled={busy}>
                        <i className="fa fa-eye" />
                      </button>
                      {/* Edit */}
                      <button className="action-btn edit" title="Chỉnh sửa" onClick={() => openEdit(user)} disabled={busy}>
                        <i className="fa fa-pencil" />
                      </button>
                      {/* Toggle Active */}
                      <button
                        className={`action-btn ${user.isActive ? "deactivate" : "activate"}`}
                        title={user.isActive ? "Deactivate" : "Activate"}
                        onClick={() => handleToggleActive(user)}
                        disabled={busy || isMe}
                      >
                        <i className={`fa ${user.isActive ? "fa-lock" : "fa-unlock"}`} />
                      </button>
                      {/* Blacklist toggle */}
                      <button
                        className={`action-btn ${user.isBlackList ? "un-blacklist" : "blacklist"}`}
                        title={user.isBlackList ? "Gỡ blacklist" : "Blacklist"}
                        onClick={() => handleToggleBlacklist(user)}
                        disabled={busy || isMe}
                      >
                        <i className="fa fa-ban" />
                      </button>
                      {/* Reset password */}
                      <button className="action-btn reset-pw" title="Reset mật khẩu" onClick={() => handleResetPassword(user)} disabled={busy}>
                        <i className="fa fa-key" />
                      </button>
                      {/* Delete */}
                      <button className="action-btn delete" title="Xóa" onClick={() => handleDelete(user)} disabled={busy || isMe}>
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && !loading && (
              <tr><td colSpan={9} className="no-results">
                <i className="fa fa-search" style={{ fontSize: 28, opacity: 0.3, display: "block", marginBottom: 8 }} />
                Không tìm thấy người dùng nào
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ═══ Pagination ═══ */}
      <div className="pagination-controls">
        <button className="um-btn um-page-btn" disabled={currentPage === 0 || loading} onClick={() => fetchUsers(0)}>
          <i className="fa fa-angle-double-left" />
        </button>
        <button className="um-btn um-page-btn" disabled={currentPage === 0 || loading} onClick={() => fetchUsers(currentPage - 1)}>
          <i className="fa fa-angle-left" />
        </button>
        <span className="page-info">
          Trang <strong>{currentPage + 1}</strong> / {totalPages || 1}
          <span style={{ marginLeft: 12, color: "#9ca3af" }}>({totalItems} người dùng)</span>
        </span>
        <button className="um-btn um-page-btn" disabled={currentPage >= totalPages - 1 || loading} onClick={() => fetchUsers(currentPage + 1)}>
          <i className="fa fa-angle-right" />
        </button>
        <button className="um-btn um-page-btn" disabled={currentPage >= totalPages - 1 || loading} onClick={() => fetchUsers(totalPages - 1)}>
          <i className="fa fa-angle-double-right" />
        </button>
      </div>

    </div>
  );
}