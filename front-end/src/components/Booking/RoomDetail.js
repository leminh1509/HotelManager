import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { getRoomById } from "../../services/bookingAPI";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./RoomDetail.css";

// ─── Constants ────────────────
const DEFAULT_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200"
];

const AMENITY_ICONS = {
  WiFi: "📶",
  Breakfast: "☕",
  Pool: "🏊",
  Gym: "🏋️",
  Spa: "💆",
  Restaurant: "🍽️",
  Bar: "🍸",
  Parking: "🅿️",
};

export default function RoomDetail({ user, role, onLogout }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { setSelectedRoom, updateBookingData } = useBooking();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch room data
  useEffect(() => {
    let cancelled = false;

    async function fetchRoom() {
      try {
        setLoading(true);
        const res = await getRoomById(roomId);

        let roomData = res.data;

        // Cập nhật logic xử lý ảnh: Nếu URL không hợp lệ hoặc chứa placeholder, dùng fallback
        if (!roomData.imgUrl || roomData.imgUrl.startsWith('url_') || roomData.imgUrl === 'https://example.com/std-single.jpg' || roomData.imgUrl.includes('example.com')) {
          roomData.imgUrl = DEFAULT_FALLBACK_IMAGES[roomData.roomId % DEFAULT_FALLBACK_IMAGES.length];
        }

        // Mock rating nếu thiếu
        if (!roomData.rating) roomData.rating = (4.5 + Math.random() * 0.5).toFixed(1);
        if (!roomData.reviewCount) roomData.reviewCount = Math.floor(Math.random() * 200) + 50;

        // Mock amenities nếu thiếu
        if (!roomData.amenities) roomData.amenities = ["WiFi", "Breakfast", "Pool", "Gym", "Restaurant"];

        if (!cancelled) setRoom(roomData);
      } catch (err) {
        console.error("Fetch room error:", err);
        if (!cancelled) setError("Không thể tải thông tin phòng. Vui lòng thử lại sau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRoom();
    return () => (cancelled = true);
  }, [roomId]);

  // Khi click "Book Now"
  const handleBook = () => {
    setSelectedRoom(room);
    // Set default dates (user có thể đã chọn từ search page)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    updateBookingData({
      checkinDate: today.toISOString().split("T")[0],
      checkoutDate: tomorrow.toISOString().split("T")[0],
      guestCount: 1,
    });

    navigate(`/booking/new/${roomId}`);
  };

  // ─── Render states ───
  if (loading)
    return (
      <div className="rd-loading">
        <div className="rd-spinner" />
        <p>Đang chuẩn bị không gian của bạn...</p>
      </div>
    );

  if (error || !room)
    return (
      <div className="rd-error">
        <p>{error || "Rất tiếc, phòng này hiện không khả dụng"}</p>
        <Link to="/home" className="rd-back-link">
          ← Trở về trang chủ
        </Link>
      </div>
    );

  const formatPrice = (n) => new Intl.NumberFormat("vi-VN").format(n);

  return (
    <>
      <Header user={user} role={role} onLogout={onLogout} />
      <div className="rd-page">
        <div className="rd-container">
          {/* Breadcrumb */}
          <nav className="rd-breadcrumb">
            <Link to="/home">Khách sạn</Link>
            <span>/</span>
            <Link to="/rooms">Phòng nghỉ</Link>
            <span>/</span>
            <span>{room.name || room.categoryName}</span>
          </nav>

          {/* Hero image */}
          <div className="rd-hero">
            <img src={room.imgUrl} alt={room.name} />
            <div className="rd-rating-badge">
              <span className="rd-star">★</span>
              <span>{room.rating}</span>
              <span className="rd-review-count">({room.reviewCount} lượt đánh giá)</span>
            </div>
          </div>

          <div className="rd-body">
            {/* Left: room info */}
            <div className="rd-info">
              <h1>{room.name || `Phòng ${room.categoryName}`}</h1>
              <p className="rd-category">{room.categoryName} Signature</p>

              {/* Specs grid */}
              <div className="rd-specs">
                <div className="rd-spec">
                  <span className="rd-spec-icon">👥</span>
                  <span>Phù hợp {room.capacity} khách</span>
                </div>
                <div className="rd-spec">
                  <span className="rd-spec-icon">📐</span>
                  <span>Diện tích {room.sizem2} m²</span>
                </div>
                <div className="rd-spec">
                  <span className="rd-spec-icon">🛏️</span>
                  <span>{room.bedConfiguration || "Lường đôi cỡ lớn"}</span>
                </div>
                <div className="rd-spec">
                  <span className="rd-spec-icon">🏢</span>
                  <span>Vị trí Tầng {room.floor}</span>
                </div>
              </div>

              {/* Description */}
              <div className="rd-section">
                <h3>Về không gian này</h3>
                <p>{room.description || "Tận hưởng không gian nghỉ ngơi đẳng cấp với đầy đủ tiện nghi, được thiết kế tinh tế nhằm mang lại sự thoải mái tối đa cho quý khách. Mỗi chi tiết đều được chăm chút kỹ lưỡng để tạo nên một trải nghiệm đáng nhớ."}</p>
              </div>

              {/* Amenities */}
              <div className="rd-section">
                <h3>Tiện ích trang bị</h3>
                <div className="rd-amenities">
                  {room.amenities?.map((a) => (
                    <div key={a} className="rd-amenity">
                      <span>{AMENITY_ICONS[a] || "✨"}</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation policy */}
              <div className="rd-section">
                <h3>Chính sách linh hoạt</h3>
                <p className="rd-policy">
                  {room.cancellationPolicy || "Hủy phòng miễn phí trước 24 giờ kể từ thời điểm check-in."}
                </p>
              </div>
            </div>

            {/* Right: pricing card */}
            <aside className="rd-price-card">
              <div className="rd-price-main">
                <span className="rd-price-amount">
                  {formatPrice(room.price)}
                </span>
                <span className="rd-price-unit">VNĐ / đêm</span>
              </div>

              <button onClick={handleBook} className="rd-book-btn">
                Đặt phòng ngay
              </button>

              <p className="rd-price-note">
                Thanh toán an toàn, bảo mật.<br />
                Không phát sinh phụ phí ẩn.
              </p>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}