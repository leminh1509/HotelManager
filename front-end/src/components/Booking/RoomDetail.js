import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { getRoomById } from "../../services/bookingAPI";
import "./RoomDetail.css";

// ─── Mock fallback (xóa khi có API thật) ────────────────
const MOCK_ROOMS = {
  1: {
    roomId: 1,
    roomNumber: "101",
    name: "Deluxe Ocean View",
    categoryName: "Deluxe Room",
    capacity: 2,
    size_m2: 35,
    price: 3000000,
    floor: 1,
    bedConfiguration: "1 King Bed",
    cancellationPolicy: "Miễn phí hủy trước 24h check-in",
    description:
      "Phòng deluxe sang trọng với tầm nhìn ra biển. Được trang bị đầy đủ tiện nghi hiện đại, bao gồm balcony riêng và phòng tắm xa hoa.",
    rating: 4.8,
    reviewCount: 124,
    amenities: ["WiFi", "Breakfast", "Pool", "Gym", "Spa"],
    imgUrl:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=500&fit=crop",
  },
  2: {
    roomId: 2,
    roomNumber: "205",
    name: "Luxury Garden View",
    categoryName: "Deluxe Room",
    capacity: 3,
    size_m2: 40,
    price: 3360000,
    floor: 2,
    bedConfiguration: "1 King + 1 Single",
    cancellationPolicy: "Miễn phí hủy trước 48h check-in",
    description:
      "Phòng deluxe hướng vườn yên tĩnh với không gian nghỉ ngơi thoải mái. Tích hợp khu vực ngồi riêng và ban công nhìn ra vườn thiên nhiên.",
    rating: 4.7,
    reviewCount: 98,
    amenities: ["WiFi", "Breakfast", "Pool", "Gym", "Restaurant", "Parking"],
    imgUrl:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=500&fit=crop",
  },
  3: {
    roomId: 3,
    roomNumber: "501",
    name: "Executive Suite",
    categoryName: "Suite",
    capacity: 4,
    size_m2: 65,
    price: 5400000,
    floor: 5,
    bedConfiguration: "1 King + 1 Double",
    cancellationPolicy: "Miễn phí hủy trước 72h check-in",
    description:
      "Suite hạng sang với phòng khách riêng, phòng ngủ yên tĩnh và view toàn thành. Dịch vụ butler riêng và các tiện nghi cao-end.",
    rating: 4.9,
    reviewCount: 67,
    amenities: [
      "WiFi",
      "Breakfast",
      "Pool",
      "Gym",
      "Spa",
      "Restaurant",
      "Bar",
    ],
    imgUrl:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=500&fit=crop",
  },
};

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

export default function RoomDetail() {
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
        // Thử gọi API thật trước
        const res = await getRoomById(roomId);
        if (!cancelled) setRoom(res.data);
      } catch {
        // Fallback sang mock data nếu API chưa có
        if (!cancelled) {
          const mock = MOCK_ROOMS[roomId];
          if (mock) setRoom(mock);
          else setError("Phòng không tìm thấy");
        }
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
        <p>Đang tải thông tin phòng...</p>
      </div>
    );

  if (error || !room)
    return (
      <div className="rd-error">
        <p>{error || "Phòng không tìm thấy"}</p>
        <Link to="/home" className="rd-back-link">
          ← Quay lại tìm kiếm
        </Link>
      </div>
    );

  const formatPrice = (n) => new Intl.NumberFormat("vi-VN").format(n);

  return (
    <div className="rd-page">
      <div className="rd-container">
        {/* Breadcrumb */}
        <nav className="rd-breadcrumb">
          <Link to="/home">Tìm kiếm phòng</Link>
          <span>/</span>
          <span>{room.name}</span>
        </nav>

        {/* Hero image */}
        <div className="rd-hero">
          <img src={room.imgUrl} alt={room.name} />
          <div className="rd-rating-badge">
            <span className="rd-star">★</span>
            <span>{room.rating}</span>
            <span className="rd-review-count">({room.reviewCount} đánh giá)</span>
          </div>
        </div>

        <div className="rd-body">
          {/* Left: room info */}
          <div className="rd-info">
            <h1>{room.name}</h1>
            <p className="rd-category">{room.categoryName}</p>

            {/* Specs grid */}
            <div className="rd-specs">
              <div className="rd-spec">
                <span className="rd-spec-icon">👥</span>
                <span>Sức chứa: {room.capacity} khách</span>
              </div>
              <div className="rd-spec">
                <span className="rd-spec-icon">📐</span>
                <span>Diện tích: {room.size_m2} m²</span>
              </div>
              <div className="rd-spec">
                <span className="rd-spec-icon">🛏️</span>
                <span>{room.bedConfiguration}</span>
              </div>
              <div className="rd-spec">
                <span className="rd-spec-icon">🏢</span>
                <span>Tầng {room.floor}</span>
              </div>
            </div>

            {/* Description */}
            <div className="rd-section">
              <h3>Mô tả</h3>
              <p>{room.description}</p>
            </div>

            {/* Amenities */}
            <div className="rd-section">
              <h3>Tiện nghi</h3>
              <div className="rd-amenities">
                {room.amenities.map((a) => (
                  <div key={a} className="rd-amenity">
                    <span>{AMENITY_ICONS[a] || "✓"}</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancellation policy */}
            <div className="rd-section">
              <h3>Chính sách hủy</h3>
              <p className="rd-policy">{room.cancellationPolicy}</p>
            </div>
          </div>

          {/* Right: pricing card */}
          <aside className="rd-price-card">
            <div className="rd-price-main">
              <span className="rd-price-amount">
                {formatPrice(room.price)}
              </span>
              <span className="rd-price-unit">đ / đêm</span>
            </div>

            <div className="rd-price-meta">
              <span>★ {room.rating}</span>
              <span>·</span>
              <span>{room.reviewCount} đánh giá</span>
            </div>

            <button onClick={handleBook} className="rd-book-btn">
              Đặt phòng ngay
            </button>

            <p className="rd-price-note">Bạn sẽ được nhập ngày và chi tiết ở bước tiếp theo</p>
          </aside>
        </div>
      </div>
    </div>
  );
}