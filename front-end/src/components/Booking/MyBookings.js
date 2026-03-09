import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../../services/bookingAPI";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./MyBookings.css";

// ─── Mock data fallback ──────────────────────────────────
const MOCK_BOOKINGS = [
  {
    bookingId: "BK-001",
    roomId: 1,
    roomName: "Deluxe Ocean View",
    categoryName: "Deluxe Room",
    checkinTime: "2026-02-10T14:00:00",
    checkoutTime: "2026-02-12T11:00:00",
    guestName: "Nguyễn Văn A",
    guestCount: 2,
    totalPrice: 6000000,
    status: "Confirmed",
    createdAt: "2026-01-25T10:00:00",
  },
  {
    bookingId: "BK-002",
    roomId: 3,
    roomName: "Executive Suite",
    categoryName: "Suite",
    checkinTime: "2026-03-01T14:00:00",
    checkoutTime: "2026-03-03T11:00:00",
    guestName: "Nguyễn Văn A",
    guestCount: 3,
    totalPrice: 10800000,
    status: "Pending",
    createdAt: "2026-01-28T14:30:00",
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
  },
];

// ─── Helpers ─────────────────────────────────────────────
const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  "Checked-in": "Đã check-in",
  "Checked-out": "Đã check-out",
  Cancelled: "Đã hủy",
};

const STATUS_COLORS = {
  Pending: "pending",
  Confirmed: "confirmed",
  "Checked-in": "checkedin",
  "Checked-out": "checkedout",
  Cancelled: "cancelled",
};

function formatDate(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(n) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

// ─── Main Component ──────────────────────────────────────
export default function MyBookings({ user, role, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | upcoming | past | cancelled
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await getMyBookings();
        setBookings(res.data);
      } catch {
        // Fallback mock
        setBookings(MOCK_BOOKINGS);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  // ─── Filter logic ──
  const now = new Date();
  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    const checkin = new Date(b.checkinTime);
    if (filter === "upcoming") return checkin >= now && b.status !== "Cancelled";
    if (filter === "past") return checkin < now || b.status === "Checked-out";
    if (filter === "cancelled") return b.status === "Cancelled";
    return true;
  });

  // ─── Cancel handler ──
  const handleCancel = async (bookingId) => {
    if (!window.confirm("Bạn có muốn hủy đặt phòng này không?")) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
    } catch {
      // Mock: update locally
    }
    // Update state
    setBookings((prev) =>
      prev.map((b) => (b.bookingId === bookingId ? { ...b, status: "Cancelled" } : b))
    );
    setCancellingId(null);
  };

  // ─── Render ──
  if (loading)
    return (
      <div className="mb-loading">
        <div className="mb-spinner" />
        <p>Đang tải danh sách đặt phòng...</p>
      </div>
    );

  return (
    <>
      <Header user={user} role={role} onLogout={onLogout} />
      <div className="mb-page">
        <div className="mb-container">
          {/* Header */}
          <div className="mb-header">
            <h1>Đặt phòng của tôi</h1>
            <Link to="/home" className="mb-new-btn">+ Đặt phòng mới</Link>
          </div>

          {/* Filter tabs */}
          <div className="mb-filters">
            {["all", "upcoming", "past", "cancelled"].map((f) => (
              <button
                key={f}
                className={`mb-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" && "Tất cả"}
                {f === "upcoming" && "Sắp tới"}
                {f === "past" && "Đã qua"}
                {f === "cancelled" && "Đã hủy"}
                <span className="mb-filter-count">
                  {bookings.filter((b) => {
                    if (f === "all") return true;
                    const ci = new Date(b.checkinTime);
                    if (f === "upcoming") return ci >= now && b.status !== "Cancelled";
                    if (f === "past") return ci < now || b.status === "Checked-out";
                    if (f === "cancelled") return b.status === "Cancelled";
                    return true;
                  }).length}
                </span>
              </button>
            ))}

          </div>
          {selectedBooking && (
            <div className="mb-modal-overlay" onClick={() => setSelectedBooking(null)}>

              <div
                className="mb-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Chi tiết đặt phòng</h2>

                <div className="mb-modal-content">
                  <p><b>Mã booking:</b> {selectedBooking.bookingId}</p>
                  <p><b>Phòng:</b> {selectedBooking.roomName}</p>
                  <p><b>Số phòng:</b> {selectedBooking.roomNumber}</p>
                  <p><b>Khách:</b> {selectedBooking.guestName}</p>
                  <p><b>Số người:</b> {selectedBooking.guestCount}</p>
                  <p><b>Check-in:</b> {formatDate(selectedBooking.checkinTime)}</p>
                  <p><b>Check-out:</b> {formatDate(selectedBooking.checkoutTime)}</p>
                  <p><b>Tổng tiền:</b> {formatPrice(selectedBooking.totalPrice)} đ</p>
                  <p>
                    <b>Trạng thái:</b>{" "}
                    {STATUS_LABELS[selectedBooking.status]}
                  </p>
                  <p><b>Ngày tạo:</b> {formatDate(selectedBooking.createdAt)}</p>
                </div>

                <button
                  className="mb-btn"
                  onClick={() => setSelectedBooking(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* Booking list */}
          {filtered.length === 0 ? (
            <div className="mb-empty">
              <p>Không có đặt phòng nào trong mục này.</p>
              <Link to="/home" className="mb-empty-link">Tìm phòng ngay →</Link>
            </div>
          ) : (
            <div className="mb-list">
              {filtered.map((b) => {
                const canCancel =
                  b.status === "Pending" || b.status === "Confirmed";
                const checkinDate = new Date(b.checkinTime);
                const isUpcoming = checkinDate >= now;

                return (
                  <div
                    key={b.bookingId}
                    className="mb-card"
                    onClick={() => setSelectedBooking(b)}
                  >
                    {/* Left: info */}
                    <div className="mb-card-body">
                      <div className="mb-card-top">
                        <div>
                          <h3>{b.roomName}</h3>
                          <span className="mb-category">{b.categoryName}</span>
                        </div>
                        <span className={`mb-status ${STATUS_COLORS[b.status] || ""}`}>
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
                      </div>

                      <div className="mb-card-details">
                        <div className="mb-detail">
                          <span className="mb-detail-label">Mã đặt phòng</span>
                          <span className="mb-detail-value mb-booking-id">{b.bookingId}</span>
                        </div>
                        <div className="mb-detail">
                          <span className="mb-detail-label">Check-in</span>
                          <span className="mb-detail-value">{formatDate(b.checkinTime)}</span>
                        </div>
                        <div className="mb-detail">
                          <span className="mb-detail-label">Check-out</span>
                          <span className="mb-detail-value">{formatDate(b.checkoutTime)}</span>
                        </div>
                        <div className="mb-detail">
                          <span className="mb-detail-label">Số khách</span>
                          <span className="mb-detail-value">{b.guestCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: price + actions */}
                    <div className="mb-card-aside">
                      <div className="mb-price">{formatPrice(b.totalPrice)} đ</div>

                      <div className="mb-card-actions">
                        {canCancel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(b.bookingId)
                            }}
                            disabled={cancellingId === b.bookingId}
                            className="mb-btn mb-btn-cancel"
                          >
                            {cancellingId === b.bookingId ? "Đang hủy..." : "Hủy"}
                          </button>
                        )}
                        {b.status === "Checked-out" && (
                          <Link to={`/rooms/${b.roomId}`} className="mb-btn mb-btn-rebook">
                            Đặt lại
                          </Link>
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
      <Footer />
    </>
  );
}