import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { getRoomById, getRoomFeedbacks } from "../../services/bookingAPI";
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
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

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

  // Fetch feedbacks separately
  useEffect(() => {
    async function fetchFeedbacks() {
      try {
        setLoadingFeedbacks(true);
        const res = await getRoomFeedbacks(roomId);
        setFeedbacks(res.data);
      } catch (err) {
        console.error("Fetch feedbacks error:", err);
      } finally {
        setLoadingFeedbacks(false);
      }
    }
    fetchFeedbacks();
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

  // Calculate real rating and review count
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : room.rating; // Fallback to mock/initial if no real feedbacks

  const totalReviews = feedbacks.length > 0 ? feedbacks.length : room.reviewCount;

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
              <span>{avgRating}</span>
              <span className="rd-review-count">({totalReviews} lượt đánh giá)</span>
            </div>
          </div>

          <div className="rd-grid">
            {/* Left Column: Info & Feedbacks */}
            <div className="rd-main-col">
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
                    <span>{room.bedConfiguration || "Giường đôi cỡ lớn"}</span>
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
                <p className="rd-policy">
                  {room.cancellationPolicy || "Hủy phòng miễn phí trước 24 giờ kể từ thời điểm check-in."}
                </p>
              </div>

              {/* Feedbacks Section */}
              <div className="rd-section feedbacks-section">
                <h3>Đánh giá từ khách hàng</h3>
                {loadingFeedbacks ? (
                  <p>Đang tải đánh giá...</p>
                ) : feedbacks.length === 0 ? (
                  <div className="rd-no-feedbacks">
                    <p>Chưa có đánh giá nào cho phòng này. Hãy là người đầu tiên chia sẻ trải nghiệm!</p>
                  </div>
                ) : (
                  <div className="rd-feedbacks-list">
                    {feedbacks.map((fb) => (
                      <div key={fb.feedbackId} className="rd-feedback-card">
                        <div className="rd-fb-header">
                          <div className="rd-fb-user">
                            <div className="rd-fb-avatar">
                              {fb.userAvatarUrl ? (
                                <img src={fb.userAvatarUrl} alt={fb.userFullName} />
                              ) : (
                                <span className="rd-fb-initial">{fb.userFullName?.[0] || "?"}</span>
                              )}
                            </div>
                            <div className="rd-fb-meta">
                              <span className="rd-fb-name">{fb.userFullName || "Khách ẩn danh"}</span>
                              <span className="rd-fb-date">{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</span>
                            </div>
                          </div>
                          <div className="rd-fb-rating">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`rd-fb-star ${i < fb.rating ? "active" : ""}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="rd-fb-comment">{fb.comment || "Không có nhận xét."}</p>

                        {fb.imageUrls && fb.imageUrls.length > 0 && (
                          <div className="rd-fb-images">
                            {fb.imageUrls.map((url, idx) => (
                              <div key={idx} className="rd-fb-img-box">
                                <img src={url} alt={`feedback-${idx}`} onClick={() => window.open(url, '_blank')} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Pricing Card */}
            <aside className="rd-sidebar">
              <div className="rd-price-card">
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
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}