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
  <div className="room-page">

    {/* HERO SEARCH */}
    <div className="room-hero">
      <div className="room-hero-inner">
        <h1>Tìm phòng khách sạn</h1>

        <div className="room-search-bar">
          <div className="search-group">
            <label>Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          <div className="search-group">
            <label>Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <button className="search-btn">
            Tìm phòng
          </button>
        </div>
      </div>
    </div>

    <div className="room-container">

      {/* FILTERS */}
      <div className="room-filters">

        <div className="filter-group">
          <label>Loại phòng</label>
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="single">Phòng đơn</option>
            <option value="double">Phòng đôi</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Hạng phòng</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="standard">Standard</option>
            <option value="deluxe">Deluxe</option>
            <option value="president">President</option>
          </select>
        </div>

      </div>

      {/* ROOM LIST */}
      {filtered.length === 0 ? (
        <div className="room-empty">
          <h3>Không tìm thấy phòng</h3>
          <p>Hãy thử thay đổi ngày hoặc bộ lọc</p>
        </div>
      ) : (
        <div className="room-grid">
          {filtered.map((r) => (
            <div key={r.roomId} className="room-card">

              {/* ROOM IMAGE */}
              <div className="room-image">
                <img
                  // src={`https://picsum.photos/600/400?random=${r.roomId}`}
                  alt="room"
                />

                <span className={`room-badge ${r.available ? "available" : "booked"}`}>
                  {r.available ? "Còn trống" : "Đã đặt"}
                </span>
              </div>

              {/* ROOM INFO */}
              <div className="room-info">

                <div className="room-header">
                  <h3>Phòng {r.roomNumber}</h3>
                  <span className="room-category">
                    {r.categoryName}
                  </span>
                </div>

                <div className="room-specs">

                  <span>🏢 Tầng {r.floor}</span>
                  <span>📏 {r.sizem2} m²</span>
                  <span>👤 {r.capacity} khách</span>
                  <span>🛏 {r.bedConfiguration}</span>

                </div>

                <div className="room-footer">

                  <div className="room-price">
                    {formatPrice(r.price)}đ
                    <span>/đêm</span>
                  </div>

                  <div className="room-actions">

                    <Link
                      to={`/rooms/${r.roomId}`}
                      className="btn-outline"
                    >
                      Chi tiết
                    </Link>

                    {r.available && checkIn && checkOut && (
                      <Link
                        to={`/booking/new/${r.roomId}?checkIn=${checkIn}&checkOut=${checkOut}`}
                        className="btn-primary"
                      >
                        Đặt phòng
                      </Link>
                    )}

                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  </div>
);
}