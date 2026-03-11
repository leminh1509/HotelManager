import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import './Payment.css';

const Payment = ({ user, role, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Get data passed from BookingForm
  const { bookingId, totalAmount, room, bookingData, nights } = location.state || {};

  // 2. State
  const [isProcessing, setIsProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fallbacks
  // If bookingId is a string like "BK-12", extract the number. If null, use 0 to avoid backend error.
  const numericBookingId = bookingId ? (typeof bookingId === 'string' ? (bookingId.match(/\d+/) ? bookingId.match(/\d+/)[0] : 0) : bookingId) : 0;
  const displayId = bookingId || 'BK-TEST';
  const displayAmount = totalAmount || 0;
  const displayRoomName = room?.name || 'Phòng mẫu';
  const displayNights = nights || 1;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const orderInfo = `PAYOS BK-${numericBookingId}`;
      const amount = Math.round(displayAmount);

      const url = `http://localhost:9999/api/payments/payos-payment?amount=${amount}&orderInfo=${encodeURIComponent(orderInfo)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Không thể khởi tạo thanh toán PayOS.');
      const paymentUrl = await response.text();

      setRedirecting(true);
      window.location.href = paymentUrl;
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối thanh toán. Vui lòng thử lại.');
      setIsProcessing(false);
    }
  };

  // UI Helpers
  const formatPrice = (n) => new Intl.NumberFormat("vi-VN").format(n);

  if (paymentSuccess) {
    return (
      <div className="page-wrapper">
        <Header user={user} role={role} onLogout={onLogout} />
        <div className="payment-page">
          <div className="payment-container" style={{ justifyContent: 'center' }}>
            <div className="payment-left" style={{ textAlign: 'center', maxWidth: 600 }}>
              <span className="success-icon-large">🎉</span>
              <h2 className="success-title">Thanh toán thành công!</h2>
              <p>Mã đặt phòng: <strong>{displayId}</strong></p>
              <button className="btn-pay" onClick={() => navigate(`/booking/confirmation/${displayId}`)}>
                Xem xác nhận đặt phòng
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header user={user} role={role} onLogout={onLogout} />

      <div className="payment-page">
        <div className="payment-container" style={{ justifyContent: 'center' }}>

          <div className="payment-right" style={{ width: '100%', maxWidth: '550px', margin: '0 auto', flex: 'none' }}>
            <h3 className="summary-title" style={{ textAlign: 'center', color: '#007bff' }}>Xác nhận đặt phòng</h3>

            <div className="summary-section" style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 15 }}>
              <div style={{ fontWeight: 600, marginBottom: 5, color: '#333' }}>Thông tin phòng</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                {room?.imgUrl && <img src={room.imgUrl} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '6px' }} />}
                <div>
                  <div style={{ fontWeight: 600, color: '#007bff', fontSize: '16px' }}>{displayRoomName}</div>
                  <div style={{ fontSize: 13, color: '#555' }}>{displayNights} đêm</div>
                </div>
              </div>
              {bookingData?.checkinDate && (
                <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6, background: '#f5f7fa', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Check-in:</span>
                    <strong>{bookingData.checkinDate} - {bookingData.checkinTime}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>Check-out:</span>
                    <strong>{bookingData.checkoutDate} - {bookingData.checkoutTime}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="summary-section" style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 15 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, color: '#333' }}>Thông tin khách hàng</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Họ tên:</span> <strong>{bookingData?.guestName || 'Khách'}</strong></div>
                {bookingData?.guestPhone && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SĐT:</span> <strong>{bookingData.guestPhone}</strong></div>}
                {bookingData?.guestEmail && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Email:</span> <strong>{bookingData.guestEmail}</strong></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Số khách:</span> <strong>{bookingData?.guestCount || 1} người</strong></div>
              </div>
            </div>

            <div className="summary-row" style={{ fontSize: '16px' }}>
              <span>Mã đặt phòng</span>
              <strong style={{ color: '#007bff' }}>{displayId}</strong>
            </div>

            <div className="summary-total" style={{ fontSize: '20px' }}>
              <span>Tổng thanh toán</span>
              <span style={{ color: '#d9534f' }}>{formatPrice(displayAmount)} đ</span>
            </div>

            {error && <div style={{ color: 'red', marginTop: 15, fontSize: 14, textAlign: 'center', background: '#f8d7da', padding: '10px', borderRadius: '4px' }}>{error}</div>}

            <button
              className="btn-pay"
              onClick={handlePayment}
              disabled={isProcessing || redirecting}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', fontSize: '16px', marginTop: '30px', background: '#007bff' }}
            >
              {redirecting
                ? `Đang chuyển hướng đến cổng thanh toán...`
                : (isProcessing
                  ? 'Đang khởi tạo...'
                  : <>Thanh toán bảo mật qua <img src="https://payos.vn/wp-content/uploads/sites/13/2023/07/logo-payos.svg" alt="PayOS" style={{ height: '22px', filter: 'brightness(0) invert(1)' }} /></>
                )
              }
            </button>

            <span className="cancel-link" onClick={() => navigate(-1)} style={{ marginTop: '20px', display: 'block', textAlign: 'center' }}>Quay lại</span>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
