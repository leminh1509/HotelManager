import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllBooking } from "../../services/bookingAPI";
import { getAllRooms } from "../../services/roomAPI";
import "./BookingList.css";

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
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | available | booked | unavailable
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all"); 
// all | single | double

const [categoryFilter, setCategoryFilter] = useState("all"); 
// all | standard | deluxe | president
  

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

  useEffect(() => {
  async function fetchBookings() {
    try {
      const res = await getAllBooking();

    //   console.log("===== BOOKING LIST FROM API =====");
    //   console.table(res.data);   // xem dạng bảng rất dễ
    //   console.log("Total bookings:", res.data.length);

      setBookings(res.data);
    } catch (err) {
      console.error("Lỗi load booking:", err);
    } finally {
      setLoading(false);
    }
  }
  fetchBookings();
}, []);
// ─── Filter logic ──
const roomsWithAvailability = rooms.map((r) => ({
  ...r,
  available: isRoomAvailable(
    r.roomId,
    checkIn,
    checkOut,
    bookings
  ),
}));
// console.log("===== ROOMS WITH AVAILABILITY =====");
// console.table(
//   roomsWithAvailability.map(r => ({
//     room: r.roomNumber,
//     available: r.available
//   }))
// );
 const filtered = roomsWithAvailability.filter((r) => {

  // filter trạng thái availability
  if (filter === "available" && !r.available) return false;
  if (filter === "booked" && r.available) return false;
  if (filter === "unavailable" && r.available) return false;

  // ─── filter loại phòng (Single / Double)
  if (roomTypeFilter !== "all") {
    const capacity = r.capacity;
    console.log('capacity',capacity);
    

    if (roomTypeFilter === "single" && capacity !== 1)
      return false;

    if (roomTypeFilter === "double" && capacity !== 2)
      return false;
  }

  // ─── filter hạng phòng
  if (categoryFilter !== "all") {
    const category = (r.categoryName || "").toLowerCase();

    if (!category.includes(categoryFilter))
      return false;
  }

  return true;
});

  // ─── Check overlab ──
  function isRoomAvailable(roomId, checkIn, checkOut, bookings) {
  if (!checkIn || !checkOut) return true;

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const roomBookings = bookings.filter(
    (b) => b.roomId === roomId && b.status !== "Cancelled"
  );

//   console.log(`\n--- Checking room ${roomId} ---`);
//   console.log("Search range:", checkIn, "→", checkOut);
//   console.log("Bookings of room:", roomBookings);

  for (const b of roomBookings) {
    const bStart = new Date(b.checkinTime);
    const bEnd = new Date(b.checkoutTime);
    // console.log('Check type of booking', b);
    // console.log(
    //   `Compare with booking`,
    //   b.bookingId,
    //   "|",
    //   b.checkinTime,
    //   "→",
    //   b.checkoutTime
    // );

    // overlap condition
    if (start < bEnd && end > bStart) {
      console.warn(
        `❌ Room ${roomId} NOT available (overlap booking ${b.bookingId})`
      );
      return false;
    }
  }

  console.log(`✅ Room ${roomId} available`);
  return true;
}
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
      {/* ===== DATE FILTER ===== */}
<div className="mb-date-filter">
  <div className="mb-date-group">
    <label>Ngày đến</label>
    <div className="mb-date-input">
      <i className="fa fa-calendar" />
      <input
        type="date"
        value={checkIn}
        onChange={(e) => setCheckIn(e.target.value)}
      />
    </div>
  </div>

  <div className="mb-date-group">
    <label>Ngày đi</label>
    <div className="mb-date-input">
      <i className="fa fa-calendar" />
      <input
        type="date"
        value={checkOut}
        onChange={(e) => setCheckOut(e.target.value)}
      />
    </div>
  </div>
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
                    // console.log('status: room: ',r.roomNumber,': ',r.statusName);
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

        {/* ===== Room Type Filter ===== */}
<div className="mb-filters">
  <span className="mb-filter-label">Loại phòng</span>

  {[
    { key: "all", label: "Tất cả" },
    { key: "single", label: "Phòng đơn" },
    { key: "double", label: "Phòng đôi" },
  ].map((t) => (
    <button
      key={t.key}
      className={`mb-filter-btn ${
        roomTypeFilter === t.key ? "active" : ""
      }`}
      onClick={() => setRoomTypeFilter(t.key)}
    >
      {t.label}
    </button>
  ))}
</div>

{/* ===== Category Filter ===== */}
<div className="mb-filters">
  <span className="mb-filter-label">Hạng phòng</span>

  {[
    { key: "all", label: "Tất cả" },
    { key: "standard", label: "Standard" },
    { key: "deluxe", label: "Deluxe" },
    { key: "president", label: "President" },
  ].map((c) => (
    <button
      key={c.key}
      className={`mb-filter-btn ${
        categoryFilter === c.key ? "active" : ""
      }`}
      onClick={() => setCategoryFilter(c.key)}
    >
      {c.label}
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
        <span className={`mb-status ${r.available ? "available" : "booked"}`}>
  {r.available ? "Còn trống" : "Đã được đặt"}
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
       {r.available && checkIn && checkOut && (
  <Link
    to={`/booking/new/${r.roomId}?checkIn=${checkIn}&checkOut=${checkOut}`}
    className="mb-btn mb-btn-book"
  >
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