import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../../services/bookingAPI";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import FeedbackForm from "./FeedbackForm";
import { showToast } from "../Common/Toast";
import "./MyBookings.css";

// ─── Mock data fallback ───────────────────────────────────
const MOCK_BOOKINGS = [
  {
    bookingId: "BK-001",
    roomId: 1,
    roomName: "Deluxe Ocean View",
    categoryName: "Deluxe Room",
    checkinTime: "2026-04-10T14:00:00",
    checkoutTime: "2026-04-12T11:00:00",
    guestName: "Nguyễn Văn A",
    guestCount: 2,
    totalPrice: 6000000,
    status: "Confirmed",
    createdAt: "2026-01-25T10:00:00",
    roomNumber: "302",
  },
  {
    bookingId: "BK-002",
    roomId: 3,
    roomName: "Executive Suite",
    categoryName: "Suite",
    checkinTime: "2026-05-01T14:00:00",
    checkoutTime: "2026-05-03T11:00:00",
    guestName: "Nguyễn Văn A",
    guestCount: 3,
    totalPrice: 10800000,
    status: "Pending",
    createdAt: "2026-01-28T14:30:00",
    roomNumber: "501",
  },
  {
    bookingId: "BK-003",
    roomId: 2,
    roomName: "Luxury Garden View",
    categoryName: "Deluxe Room",
    checkinTime: "2026-01-15T14:00:00",
    checkoutTime: "2026-01-17T11:00:00",
    guestName: "Nguyễn Văn A",
    guestCount: 1,
    totalPrice: 6720000,
    status: "Checked-out",
    createdAt: "2026-01-10T09:00:00",
    roomNumber: "215",
  },
  {
    bookingId: "BK-004",
    roomId: 1,
    roomName: "Deluxe Ocean View",
    categoryName: "Deluxe Room",
    checkinTime: "2026-01-05T14:00:00",
    checkoutTime: "2026-01-06T11:00:00",
    guestName: "Nguyễn Văn A",
    guestCount: 2,
    totalPrice: 3000000,
    status: "Cancelled",
    createdAt: "2026-01-03T11:00:00",
    roomNumber: "101",
  },
];

// ─── Helpers ──────────────────────────────────────────────
const STATUS_META = {
  Pending: { label: "Chờ xác nhận", cls: "pending", icon: "🕐" },
  Confirmed: { label: "Đã xác nhận", cls: "confirmed", icon: "✅" },
  "Checked-in": { label: "Đã check-in", cls: "checkedin", icon: "🏨" },
  "Checked-out": { label: "Đã check-out", cls: "checkedout", icon: "🏁" },
  Cancelled: { label: "Đã hủy", cls: "cancelled", icon: "❌" },
};

const ROOM_GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
];

function getGradient(id) {
  return ROOM_GRADIENTS[Number(id) % ROOM_GRADIENTS.length];
}

function formatDate(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDow(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("vi-VN", { weekday: "short" });
}

function formatPrice(n) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function nightCount(checkin, checkout) {
  const ms = new Date(checkout) - new Date(checkin);
  return Math.round(ms / 86400000) || 1;
}

// ─── Main Component ───────────────────────────────────────
export default function MyBookings({ user, role, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [feedbackBooking, setFeedbackBooking] = useState(null);

  const loadMyBookings = async () => {
    setLoading(true);
    try {
      const res = await getMyBookings();
      setBookings(res.data);
    } catch {
      setBookings(MOCK_BOOKINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
  }, []);

  const now = new Date();

  const countFor = (f) =>
    bookings.filter((b) => {
      const ci = new Date(b.checkinTime);
      if (f === "all") return true;
      if (f === "upcoming") return ci >= now && b.status !== "Cancelled";
      if (f === "past") return ci < now || b.status === "Checked-out";
      if (f === "cancelled") return b.status === "Cancelled";
      return true;
    }).length;

  const filtered = bookings.filter((b) => {
    const ci = new Date(b.checkinTime);
    if (filter === "all") return true;
    if (filter === "upcoming") return ci >= now && b.status !== "Cancelled";
    if (filter === "past") return ci < now || b.status === "Checked-out";
    if (filter === "cancelled") return b.status === "Cancelled";
    return true;
  });

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Bạn có muốn hủy đặt phòng này không?")) return;
    setCancellingId(bookingId);
    try { await cancelBooking(bookingId); } catch { }
    setBookings((prev) =>
      prev.map((b) => b.bookingId === bookingId ? { ...b, status: "Cancelled" } : b)
    );
    if (selectedBooking?.bookingId === bookingId)
      setSelectedBooking((prev) => ({ ...prev, status: "Cancelled" }));
    setCancellingId(null);
  };

  // ─── Loading ──
  if (loading)
    return (
      <>
        <Header user={user} role={role} onLogout={onLogout} />
        <div className="mb-loading-wrap">
          <div className="mb-skeleton-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-skeleton-card">
                <div className="mb-sk-img" />
                <div className="mb-sk-body">
                  <div className="mb-sk-line mb-sk-title" />
                  <div className="mb-sk-line mb-sk-sub" />
                  <div className="mb-sk-line mb-sk-short" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </>
    );

  const TABS = [
    { key: "all", label: "Tất cả" },
    { key: "upcoming", label: "Sắp tới" },
    { key: "past", label: "Đã qua" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  return (
    <>
      <Header user={user} role={role} onLogout={onLogout} />

      {/* ── Hero banner ── */}
      <div className="mb-hero">
        <div className="mb-hero-inner">
          <div className="mb-hero-text">
            <h1>Đặt phòng của tôi</h1>
            <p>Quản lý tất cả các đặt phòng của bạn tại một nơi</p>
          </div>
          <Link to="/home" className="mb-new-btn">
            <span>+</span> Đặt phòng mới
          </Link>
        </div>
      </div>

      <div className="mb-page">
        <div className="mb-container">

          {/* ── Filter tabs ── */}
          <div className="mb-tab-bar">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`mb-tab ${filter === key ? "active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="mb-tab-badge">{countFor(key)}</span>
              </button>
            ))}
          </div>

          {/* ── Booking list ── */}
          {filtered.length === 0 ? (
            <div className="mb-empty">
              <div className="mb-empty-icon">🏨</div>
              <h3>Không có đặt phòng nào</h3>
              <p>Hãy tìm và đặt phòng ngay để tận hưởng kỳ nghỉ tuyệt vời!</p>
              <Link to="/home" className="mb-empty-cta">Tìm phòng ngay</Link>
            </div>
          ) : (
            <div className="mb-list">
              {filtered.map((b) => {
                const checkOutDate = new Date(b.checkoutTime);
                // Set checkout time to 12:00 PM for comparison
                checkOutDate.setHours(12, 0, 0, 0);

                let currentStatus = b.status;
                const datePassed = now > checkOutDate;

                if (datePassed && (b.status === "Confirmed" || b.status === "Checked-in")) {
                  currentStatus = "Checked-out";
                }

                const meta = STATUS_META[currentStatus] || { label: currentStatus, cls: "", icon: "•" };
                const canCancel = b.status === "Pending" || b.status === "Confirmed";
                const nights = nightCount(b.checkinTime, b.checkoutTime);

                return (
                  <div
                    key={b.bookingId}
                    className="mb-card"
                    onClick={() => setSelectedBooking(b)}
                  >
                    {/* Room image / gradient */}
                    <div
                      className="mb-card-img"
                      style={{ background: getGradient(b.roomId) }}
                    >
                      <span className="mb-card-img-icon">🏨</span>
                      <span className={`mb-card-img-badge ${meta.cls}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>

                    {/* Main info */}
                    <div className="mb-card-body">
                      <div className="mb-card-header">
                        <div>
                          <h3 className="mb-room-name">{b.roomName}</h3>
                          <span className="mb-room-cat">{b.categoryName}</span>
                          {b.roomNumber && (
                            <span className="mb-room-num">Phòng {b.roomNumber}</span>
                          )}
                        </div>
                        <span className="mb-booking-ref">#{b.bookingId}</span>
                      </div>

                      <div className="mb-dates-row">
                        <div className="mb-date-box">
                          <span className="mb-date-label">Check-in</span>
                          <span className="mb-date-dow">{formatDow(b.checkinTime)}</span>
                          <span className="mb-date-val">{formatDate(b.checkinTime)}</span>
                          <span className="mb-date-time">từ 14:00</span>
                        </div>

                        <div className="mb-nights-pill">
                          <div className="mb-nights-line" />
                          <span>{nights} đêm</span>
                          <div className="mb-nights-line" />
                        </div>

                        <div className="mb-date-box">
                          <span className="mb-date-label">Check-out</span>
                          <span className="mb-date-dow">{formatDow(b.checkoutTime)}</span>
                          <span className="mb-date-val">{formatDate(b.checkoutTime)}</span>
                          <span className="mb-date-time">trước 11:00</span>
                        </div>

                        <div className="mb-guests-box">
                          <span className="mb-date-label">Khách</span>
                          <span className="mb-guests-icon">👤</span>
                          <span className="mb-date-val">{b.guestCount} khách</span>
                        </div>
                      </div>
                    </div>

                    {/* Price + actions */}
                    <div className="mb-card-aside">
                      <div className="mb-price-block">
                        <span className="mb-price-nights">{nights} đêm</span>
                        <span className="mb-price">{formatPrice(b.totalPrice)}<small>đ</small></span>
                        <span className="mb-price-note">Đã bao gồm thuế & phí</span>
                      </div>
                      <div className="mb-actions">
                        <button
                          className="mb-btn-detail"
                          onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); }}
                        >
                          Xem chi tiết
                        </button>
                        {canCancel && (
                          <button
                            className="mb-btn-cancel"
                            onClick={(e) => { e.stopPropagation(); handleCancel(b.bookingId); }}
                            disabled={cancellingId === b.bookingId}
                          >
                            {cancellingId === b.bookingId ? "Đang hủy..." : "Hủy đặt phòng"}
                          </button>
                        )}
                        {b.status === "Checked-out" && (
                          <>
                            <Link
                              to={`/rooms/${b.roomId}`}
                              className="mb-btn-rebook"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Đặt lại
                            </Link>
                            <button
                              className="mb-btn-feedback"
                              style={{
                                marginTop: "8px",
                                background: "#fbbf24",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontWeight: "600",
                                cursor: "pointer",
                                width: "100%"
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFeedbackBooking(b);
                              }}
                            >
                              Gửi đánh giá
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail modal ── */}
      {selectedBooking && (
        <div className="mb-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="mb-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div
              className="mb-modal-hero"
              style={{ background: getGradient(selectedBooking.roomId) }}
            >
              <button className="mb-modal-close" onClick={() => setSelectedBooking(null)}>✕</button>
              <div className="mb-modal-hero-content">
                <span className="mb-modal-hero-icon">🏨</span>
                {(() => {
                  const checkOutDateModal = new Date(selectedBooking.checkoutTime);
                  checkOutDateModal.setHours(12, 0, 0, 0);
                  const isOverdue = now > checkOutDateModal;
                  let modalStatus = selectedBooking.status;
                  if (isOverdue && (modalStatus === "Confirmed" || modalStatus === "Checked-in")) {
                    modalStatus = "Checked-out";
                  }
                  const modalMeta = STATUS_META[modalStatus] || { label: modalStatus, cls: "", icon: "•" };
                  return (
                    <div>
                      <h2>{selectedBooking.roomName}</h2>
                      <span className={`mb-modal-status-badge ${modalMeta.cls}`}>
                        {modalMeta.icon} {modalMeta.label}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal body */}
            <div className="mb-modal-body">
              <div className="mb-modal-ref">
                Mã đặt phòng: <strong>#{selectedBooking.bookingId}</strong>
                <span className="mb-modal-created">
                  Đặt ngày {formatDate(selectedBooking.createdAt)}
                </span>
              </div>

              <div className="mb-modal-section">
                <h4>📅 Thông tin lưu trú</h4>
                <div className="mb-modal-dates">
                  <div className="mb-modal-date-col">
                    <span className="mb-modal-date-label">Check-in</span>
                    <span className="mb-modal-date-val">{formatDate(selectedBooking.checkinTime)}</span>
                    <span className="mb-modal-date-sub">từ 14:00</span>
                  </div>
                  <div className="mb-modal-nights">
                    {nightCount(selectedBooking.checkinTime, selectedBooking.checkoutTime)} đêm
                  </div>
                  <div className="mb-modal-date-col">
                    <span className="mb-modal-date-label">Check-out</span>
                    <span className="mb-modal-date-val">{formatDate(selectedBooking.checkoutTime)}</span>
                    <span className="mb-modal-date-sub">trước 11:00</span>
                  </div>
                </div>
              </div>

              <div className="mb-modal-section">
                <h4>🏷️ Thông tin phòng & khách</h4>
                <div className="mb-modal-grid">
                  <div className="mb-modal-field">
                    <label>Loại phòng</label>
                    <p>{selectedBooking.categoryName}</p>
                  </div>
                  {selectedBooking.roomNumber && (
                    <div className="mb-modal-field">
                      <label>Số phòng</label>
                      <p>{selectedBooking.roomNumber}</p>
                    </div>
                  )}
                  <div className="mb-modal-field">
                    <label>Khách hàng</label>
                    <p>{selectedBooking.guestName}</p>
                  </div>
                  <div className="mb-modal-field">
                    <label>Số khách</label>
                    <p>{selectedBooking.guestCount} người</p>
                  </div>
                </div>
              </div>

              <div className="mb-modal-price-section">
                <span>Tổng cộng</span>
                <span className="mb-modal-total">{formatPrice(selectedBooking.totalPrice)} đ</span>
              </div>

              <div className="mb-modal-footer">
                {(selectedBooking.status === "Pending" || selectedBooking.status === "Confirmed") && (
                  <button
                    className="mb-modal-cancel-btn"
                    onClick={() => handleCancel(selectedBooking.bookingId)}
                    disabled={cancellingId === selectedBooking.bookingId}
                  >
                    {cancellingId === selectedBooking.bookingId ? "Đang hủy..." : "Hủy đặt phòng"}
                  </button>
                )}
                <button className="mb-modal-close-btn" onClick={() => setSelectedBooking(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {feedbackBooking && (
        <FeedbackForm
          booking={feedbackBooking}
          onClose={() => setFeedbackBooking(null)}
          onSuccess={() => {
            setFeedbackBooking(null);
            showToast("Cảm ơn bạn đã gửi đánh giá!", "success");
            loadMyBookings();
          }}
        />
      )}

      <Footer />
    </>
  );
}