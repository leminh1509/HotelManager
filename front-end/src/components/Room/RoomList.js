import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllRooms, searchRooms, searchRoomsPaginated, getAllRoomsPaginated } from "../../services/roomAPI";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./RoomList.css";

// ─── Helpers ─────────────────────────────────────────────
const STATUS_LABELS = {
  Available: "Còn trống",
  Occupied: "Đang có khách",
  Cleaning: "Đang dọn dẹp",
  Maintenance: "Bảo trì",
};

const STATUS_COLORS = {
  Available: "available",
  Occupied: "occupied",
  Cleaning: "cleaning",
  Maintenance: "maintenance",
};

function formatPrice(n) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

// ─── Main Component ──────────────────────────────────────
export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  // Initial load
  useEffect(() => {
    fetchRooms(currentPage);
  }, [filterStatus, currentPage]);

  const fetchRooms = async (page = 1) => {
    setLoading(true);
    try {
      if (checkin && checkout) {
        // Search API if dates are provided
        const params = {
          checkin,
          checkout,
          guests: guestCount || 1,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          page: page - 1,
          size: itemsPerPage
        };
        const res = await searchRoomsPaginated(params);
        if (res.data && res.data.content) {
          setRooms(res.data.content);
          setTotalPages(res.data.totalPages);
        } else {
          setRooms([]);
        }
      } else {
        // Fallback to all rooms
        const params = {
          status: filterStatus === "all" ? "" : filterStatus,
          page: page - 1,
          size: itemsPerPage
        };
        const res = await getAllRoomsPaginated(params);
        if (res.data && res.data.content) {
          setRooms(res.data.content);
          setTotalPages(res.data.totalPages);
        } else {
          setRooms([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRooms(1);
  };

  const currentItems = rooms;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let start = Math.max(currentPage - 2, 1);
    let end = Math.min(start + 4, totalPages);
    if (end - start < 4) {
      start = Math.max(end - 4, 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="pagination-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "30px", gap: "5px" }}>
        <button
          disabled={currentPage === 1}
          onClick={() => paginate(currentPage - 1)}
          style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
        >
          Trước
        </button>

        {start > 1 && (
          <>
            <button onClick={() => paginate(1)} style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "#fff", cursor: "pointer" }}>1</button>
            {start > 2 && <span style={{ padding: "8px 4px" }}>...</span>}
          </>
        )}

        {pages.map(i => (
          <button
            key={i}
            onClick={() => paginate(i)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: currentPage === i ? "#ff385c" : "#fff", color: currentPage === i ? "#fff" : "#333", cursor: "pointer" }}
          >
            {i}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={{ padding: "8px 4px" }}>...</span>}
            <button onClick={() => paginate(totalPages)} style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "#fff", cursor: "pointer" }}>{totalPages}</button>
          </>
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => paginate(currentPage + 1)}
          style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: currentPage === totalPages ? "#f5f5f5" : "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
        >
          Tiếp
        </button>
      </div>
    );
  };

  return (
    <>
      <Header user={null} role="guest" />

      <div className="mb-page" style={{ paddingTop: "80px", minHeight: "80vh" }}>
        <div className="mb-container">

          <div className="mb-header">
            <h1>Danh sách phòng</h1>
            <p>Tìm và đặt phòng tốt nhất cho kỳ nghỉ của bạn</p>
          </div>

          {/* Search Form */}
          <form className="room-search-form" onSubmit={handleSearch}>
            <div className="search-inputs">
              <div className="input-group">
                <label>Check-in</label>
                <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Check-out</label>
                <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Số người</label>
                <input type="number" min="1" placeholder="Khách" value={guestCount} onChange={e => setGuestCount(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Giá từ (VNĐ)</label>
                <input type="number" placeholder="Tối thiểu" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Đến (VNĐ)</label>
                <input type="number" placeholder="Tối đa" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
              <button type="submit" className="mb-btn mb-btn-book search-btn">Tìm phòng</button>
            </div>
          </form>

          {/* Filter tabs */}
          <div className="mb-filters">
            {["all", "available", "booked", "unavailable"].map((f) => (
              <button
                key={f}
                className={`mb-filter-btn ${filterStatus === f ? "active" : ""}`}
                onClick={() => { setFilterStatus(f); setCurrentPage(1); }}
              >
                {f === "all" && "Tất cả"}
                {f === "available" && "Còn Trống"}
                {f === "booked" && "Đã Đặt"}
                {f === "unavailable" && "Khác"}
              </button>
            ))}
          </div>

          {/* Loading handling */}
          {loading ? (
            <div className="mb-loading" style={{ margin: "50px auto", textAlign: "center" }}>
              <div className="mb-spinner" style={{ display: "inline-block", border: "4px solid rgba(0,0,0,0.1)", borderLeftColor: "#ff385c", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }} />
              <p>Đang tải danh sách phòng...</p>
            </div>
          ) : (
            <>
              {/* Rooms list */}
              {currentItems.length === 0 ? (
                <div className="mb-empty">
                  <p>Không tìm thấy phòng nào phù hợp.</p>
                  <button onClick={() => { setCheckin(""); setCheckout(""); fetchRooms(); }} className="mb-empty-link btn-link" style={{ background: "none", border: "none", cursor: "pointer", color: "#ff385c" }}>Xóa bộ lọc tìm kiếm →</button>
                </div>
              ) : (
                <div className="mb-list">
                  {currentItems.map((r) => (
                    <div key={r.roomId} className="mb-card">
                      <div className="mb-card-body">
                        <div className="mb-card-top">
                          <div>
                            <h3>Phòng {r.roomNumber}</h3>
                            <span className="mb-category">{r.categoryName}</span>
                          </div>
                          <span className={`mb-status ${STATUS_COLORS[r.statusName] || ""}`}>
                            {STATUS_LABELS[r.statusName] || r.statusName}
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

                      <div className="mb-card-aside">
                        <div className="mb-price">{formatPrice(r.price)} đ/đêm</div>
                        <div style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '4px', textAlign: 'center', fontWeight: '500' }}>
                          *Giá linh động (Cuối tuần / Lễ)
                        </div>
                        <div className="mb-card-actions" style={{ marginTop: '12px' }}>
                          <Link to={`/rooms/${r.roomId}`} className="mb-btn mb-btn-view">
                            Xem chi tiết
                          </Link>
                          {r.statusName === "Available" && (
                            <Link to={`/booking/${r.roomId}`} className="mb-btn mb-btn-book">
                              Đặt phòng
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}