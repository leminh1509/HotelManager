import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import "./BookingConfirmation.css";

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const { selectedRoom, bookingData, resetBooking } = useBooking();

  // Cleanup context sau khi hiển thị confirmation
  // (không reset ngay để còn hiển thị thông tin)
  useEffect(() => {
    // Nếu muốn auto-reset sau 5 phút:
    // const timer = setTimeout(resetBooking, 300000);
    // return () => clearTimeout(timer);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calcNights = (a, b) => {
    if (!a || !b) return 1;
    const diff = (new Date(b) - new Date(a)) / 86400000;
    return diff > 0 ? diff : 1;
  };

  const nights = calcNights(bookingData.checkinDate, bookingData.checkoutDate);
  const totalPrice = selectedRoom ? selectedRoom.price * nights : 0;
  const formatPrice = (n) => new Intl.NumberFormat("vi-VN").format(n);

  return (
    <div className="bc-page">
      <div className="bc-container">
        {/* Success icon */}
        <div className="bc-icon">
          <div className="bc-checkmark">✓</div>
        </div>

        <h1>Đặt phòng thành công!</h1>
        <p className="bc-subtitle">Cảm ơn bạn đã chọn khách sạn chúng tôi</p>

        {/* Booking ID */}
        <div className="bc-booking-id">
          <span className="bc-label">Mã đặt phòng</span>
          <span className="bc-id">{bookingId}</span>
        </div>

        {/* Summary card */}
        <div className="bc-summary">
          {/* Room info */}
          {selectedRoom && (
            <div className="bc-section">
              <div className="bc-section-header">
                <span>🏨</span>
                <h3>Phòng</h3>
              </div>
              <div className="bc-row">
                <span>Tên phòng</span>
                <span>{selectedRoom.name}</span>
              </div>
              <div className="bc-row">
                <span>Loại</span>
                <span>{selectedRoom.categoryName}</span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="bc-section">
            <div className="bc-section-header">
              <span>📅</span>
              <h3>Ngày lưu trú</h3>
            </div>
            <div className="bc-row">
              <span>Check-in</span>
              <span>{formatDate(bookingData.checkinDate)}</span>
            </div>
            <div className="bc-row">
              <span>Check-out</span>
              <span>{formatDate(bookingData.checkoutDate)}</span>
            </div>
            <div className="bc-row">
              <span>Số đêm</span>
              <span>{nights} đêm</span>
            </div>
            <div className="bc-row">
              <span>Số khách</span>
              <span>{bookingData.guestCount} khách</span>
            </div>
          </div>

          {/* Guest info */}
          <div className="bc-section">
            <div className="bc-section-header">
              <span>👤</span>
              <h3>Thông tin khách</h3>
            </div>
            <div className="bc-row">
              <span>Tên</span>
              <span>{bookingData.guestName || "—"}</span>
            </div>
            {bookingData.guestPhone && (
              <div className="bc-row">
                <span>Điện thoại</span>
                <span>{bookingData.guestPhone}</span>
              </div>
            )}
            {bookingData.guestEmail && (
              <div className="bc-row">
                <span>Email</span>
                <span>{bookingData.guestEmail}</span>
              </div>
            )}
          </div>

          {/* Total */}
          {selectedRoom && (
            <div className="bc-total">
              <span>Tổng giá</span>
              <span className="bc-total-amount">{formatPrice(totalPrice)} đ</span>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="bc-note">
          <span>📧</span>
          <p>
            {bookingData.guestEmail
              ? `Xác nhận đặt phòng sẽ được gửi đến ${bookingData.guestEmail}`
              : "Vui lòng đến quầy lễ tân để nhận xác nhận đặt phòng"}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="bc-actions">
          <Link
            to="/payment"
            state={{ bookingId, totalAmount: totalPrice }}
            className="bc-btn bc-btn-primary"
          >
            Thanh toán ngay ({formatPrice(totalPrice)} đ)
          </Link>
          <button
            onClick={resetBooking}
            className="bc-btn bc-btn-secondary"
          >
            Tìm phòng mới
          </button>
        </div>
      </div>
    </div>
  );
}