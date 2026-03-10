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
export default function RoomList({ user, role, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Pagination and Sort states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);
  const [sortOrder, setSortOrder] = useState("price,asc");
  const itemsPerPage = 6;

  // Initial load
  useEffect(() => {
    fetchRooms(currentPage);
  }, [filterStatus, currentPage, sortOrder]);

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
          size: itemsPerPage,
          sort: sortOrder
        };
        const res = await searchRoomsPaginated(params);
        if (res.data && res.data.content) {
          setRooms(res.data.content);
          setTotalPages(res.data.totalPages);
          setTotalRooms(res.data.totalElements || 0);
        } else {
          setRooms([]);
          setTotalRooms(0);
        }
      } else {
        // Fallback to all rooms
        const params = {
          status: filterStatus === "all" ? "" : filterStatus,
          page: page - 1,
          size: itemsPerPage,
          sort: sortOrder
        };
        const res = await getAllRoomsPaginated(params);
        if (res.data && res.data.content) {
          setRooms(res.data.content);
          setTotalPages(res.data.totalPages);
          setTotalRooms(res.data.totalElements || 0);
        } else {
          setRooms([]);
          setTotalRooms(0);
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
      <div className="rl-pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => paginate(currentPage - 1)}
          className="rl-pagination-btn"
          aria-label="Previous Page"
        >
          <i className="fa fa-chevron-left" />
        </button>

        {start > 1 && (
          <>
            <button onClick={() => paginate(1)} className="rl-pagination-btn">1</button>
            {start > 2 && <span className="rl-pagination-ellipsis">...</span>}
          </>
        )}

        {pages.map(i => (
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`rl-pagination-btn ${currentPage === i ? "active" : ""}`}
          >
            {i}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="rl-pagination-ellipsis">...</span>}
            <button onClick={() => paginate(totalPages)} className="rl-pagination-btn">{totalPages}</button>
          </>
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => paginate(currentPage + 1)}
          className="rl-pagination-btn"
          aria-label="Next Page"
        >
          <i className="fa fa-chevron-right" />
        </button>
      </div>
    );
  };

  return (
    <>
      <Header user={user} role={role} onLogout={onLogout} />

      <div className="rl-page">
        <div className="rl-container">
          {/* Breadcrumbs */}
          <div className="rl-breadcrumbs">
            <Link to="/home">Trang chủ</Link>
            <i className="fa fa-angle-right"></i>
            <span>Kết quả tìm kiếm</span>
          </div>

          <div className="rl-layout">
            {/* SIDEBAR */}
            <aside className="rl-sidebar">
              <div className="rl-search-card">
                <h3>Tìm kiếm</h3>
                <form onSubmit={handleSearch}>
                  <div className="rl-input-group">
                    <label><i className="fa fa-calendar"></i> Ngày nhận phòng</label>
                    <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} />
                  </div>
                  <div className="rl-input-group">
                    <label><i className="fa fa-calendar"></i> Ngày trả phòng</label>
                    <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} />
                  </div>
                  <div className="rl-input-group">
                    <label><i className="fa fa-user"></i> Số khách</label>
                    <input type="number" min="1" placeholder="Số người" value={guestCount} onChange={e => setGuestCount(e.target.value)} />
                  </div>
                  <div className="rl-input-group">
                    <label><i className="fa fa-money"></i> Giá tối thiểu (VNĐ)</label>
                    <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                  </div>
                  <div className="rl-input-group">
                    <label><i className="fa fa-money"></i> Giá tối đa (VNĐ)</label>
                    <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                  </div>
                  <button type="submit" className="rl-search-submit">Tìm kiếm</button>
                </form>
              </div>

              <div className="rl-filter-section">
                <h4>Trạng thái phòng</h4>
                <div className="rl-filter-options">
                  {["all", "available", "booked", "unavailable"].map((f) => (
                    <label key={f} className="rl-checkbox-container">
                      <input
                        type="radio"
                        name="status"
                        checked={filterStatus === f}
                        onChange={() => { setFilterStatus(f); setCurrentPage(1); }}
                      />
                      <span className="rl-checkmark"></span>
                      {f === "all" && "Tất cả"}
                      {f === "available" && "Còn Trống"}
                      {f === "booked" && "Đã Đặt"}
                      {f === "unavailable" && "Khác"}
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="rl-main">
              <div className="rl-results-header">
                <h2>Tìm thấy {totalRooms} phòng cho bạn</h2>
                <div className="rl-sort-bar">
                  <span>Sắp xếp theo:</span>
                  <button
                    className={sortOrder === "price,asc" ? "active" : ""}
                    onClick={() => setSortOrder("price,asc")}
                  >
                    Giá thấp nhất
                  </button>
                  <button
                    className={sortOrder === "price,desc" ? "active" : ""}
                    onClick={() => setSortOrder("price,desc")}
                  >
                    Giá cao nhất
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="rl-loading">
                  <div className="rl-spinner" />
                  <p>Đang tải ưu đãi tốt nhất...</p>
                </div>
              ) : (
                <div className="rl-list">
                  {rooms.length === 0 ? (
                    <div className="rl-empty">
                      <i className="fa fa-search"></i>
                      <p>Rất tiếc, không tìm thấy phòng nào phù hợp.</p>
                      <button onClick={() => { setCheckin(""); setCheckout(""); fetchRooms(); }}>Xóa tất cả bộ lọc</button>
                    </div>
                  ) : (
                    rooms.map((r, idx) => (
                      <div key={r.roomId} className="rl-card">
                        <div className="rl-card-img">
                          <img src={`/hms/img/room/room-${(idx % 6) + 1}.jpg`} alt={`Phòng ${r.roomNumber}`} />
                          <button className="rl-heart-btn"><i className="fa fa-heart-o"></i></button>
                        </div>
                        <div className="rl-card-info">
                          <div className="rl-card-main-info">
                            <div className="rl-card-header">
                              <div className="rl-card-title-row">
                                <Link to={`/rooms/${r.roomId}`}><h3>Phòng {r.roomNumber} - {r.categoryName}</h3></Link>
                                <div className="rl-stars">
                                  <i className="fa fa-star"></i>
                                  <i className="fa fa-star"></i>
                                  <i className="fa fa-star"></i>
                                  <i className="fa fa-star"></i>
                                  <i className="fa fa-thumbs-up"></i>
                                </div>
                              </div>
                              <div className="rl-card-location">
                                <i className="fa fa-map-marker"></i> Tầng {r.floor}, 37 Hotel
                              </div>
                            </div>

                            <div className="rl-card-features">
                              <div className="rl-feature-tag">Miễn phí hủy phòng</div>
                              <div className="rl-feature-tag">Không cần thanh toán trước</div>
                              <p className="rl-room-desc">
                                <span>{r.bedConfiguration}</span> • <span>{r.capacity} người lớn</span> • <span>{r.sizem2} m²</span>
                              </p>
                              <p className="rl-room-status-text">
                                <i className="fa fa-check"></i> {STATUS_LABELS[r.statusName] || r.statusName}
                              </p>
                            </div>
                          </div>

                          <div className="rl-card-pricing">
                            <div className="rl-rating-box">
                              <div className="rl-rating-text">
                                <span>Tuyệt vời</span>
                                <small>456 đánh giá</small>
                              </div>
                              <div className="rl-rating-score">8.9</div>
                            </div>

                            <div className="rl-price-container">
                              <div className="rl-price-label">Giá 1 đêm</div>
                              <div className="rl-price-value">{formatPrice(r.price)} đ</div>
                              <div className="rl-price-tax">+65.000 đ thuế và phí</div>
                              <Link to={`/rooms/${r.roomId}`} className="rl-btn-primary">
                                Xem phòng trống <i className="fa fa-angle-right"></i>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {renderPagination()}
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}