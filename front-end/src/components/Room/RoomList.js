import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { getMyBookings, cancelBooking } from "../../services/bookingAPI";
import { getAllRooms } from "../../services/roomAPI";
import "./RoomList.css";

// ─── Mock data fallback ──────────────────────────────────


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
export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | available | booked | unavailable
  

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await getAllRooms();
        setRooms(res.data);
      } catch {
        // Fallback mock
        
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);
// ─── Filter logic ──

  const filtered = rooms.filter((r) => {
    if (filter === "all") return true;
    const sId = r.statusName;
    if (filter === "available") return sId === "Available";
    if (filter === "booked") return  sId === "Occupied";
    if (filter === "unavailable") return sId !== "Available" && sId !== "Occupied";
    return true;
  });
  
  // ─── Render ──
  if (loading)
    return (
      <div className="mb-loading">
        <div className="mb-spinner" />
        <p>Đang tải danh sách phòng...</p>
      </div>
    );

  return (
    <div className="mb-page">
      <div className="mb-container">
        {/* Header */}
        <div className="mb-header">
          <h1>Danh sách phòng</h1>
          
        </div>
        {/* Filter tabs */}
        <div className="mb-filters">
          {["all", "available", "booked", "unavailable"].map((f) => (
            <button
              key={f}
              className={`mb-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" && "Tất cả"}
              {f === "available" && "Còn Trống"}
              {f === "booked" && "Đã Đặt"}
              {f === "unavailable" && "Không Hoạt động"}
              <span className="mb-filter-count">
                {rooms.filter((r) => {
                    console.log('status: room: ',r.roomNumber,': ',r.statusName);
                if (f === "all") return true;   
                const sId = r.statusName;
                if (f === "available") return sId === "Available";
                if (f === "booked") return  sId === "Occupied";
                if (f === "unavailable") return sId !== "Available" && sId !== "Occupied";
                  return true;
                }).length}
              </span>
            </button>
          ))}
        </div>
       

        {/* Rooms list */}
        {filtered.length === 0 ? (
          <div className="mb-empty">
            <p>Không có đặt phòng nào trong mục này.</p>
            <Link to="/home" className="mb-empty-link">Tìm phòng ngay →</Link>
          </div>
        ) : (
          <div className="mb-list">
            {filtered.map((r) => {
             
              return (
  <div key={r.roomId} className="mb-card">
    {/* Left: info */}
    <div className="mb-card-body">
      <div className="mb-card-top">
        <div>
          <h3>Phòng {r.roomNumber}</h3>
          <span className="mb-category">{r.categoryName}</span>
        </div>
        <span className={`mb-status ${STATUS_COLORS[r.status] || ""}`}>
          {STATUS_LABELS[r.status] || r.status}
        </span>
      </div>

      <div className="mb-card-details">
        <div className="mb-detail">
          <span className="mb-detail-label">Tầng</span>
          <span className="mb-detail-value">Tầng {r.floor}</span>
        </div>
        <div className="mb-detail">
          <span className="mb-detail-label">Diện tích</span>
          <span className="mb-detail-value">{r.sizem2} m²</span>
        </div>
        <div className="mb-detail">
          <span className="mb-detail-label">Sức chứa</span>
          <span className="mb-detail-value">{r.capacity} khách</span>
        </div>
        <div className="mb-detail">
          <span className="mb-detail-label">Giường</span>
          <span className="mb-detail-value">{r.bedConfiguration}</span>
        </div>
      </div>
    </div>

    {/* Right: price + actions */}
    <div className="mb-card-aside">
      <div className="mb-price">{formatPrice(r.price)} đ/đêm</div>

      <div className="mb-card-actions">
        <Link to={`/rooms/${r.roomId}`} className="mb-btn mb-btn-view">
          Xem chi tiết
        </Link>
        {r.status === "Available" && (
          <Link to={`/booking/${r.roomId}`} className="mb-btn mb-btn-book">
            Đặt phòng
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
  );
}