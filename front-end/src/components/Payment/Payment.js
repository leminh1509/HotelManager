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
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, transfer, vnpay, momo
  const [isProcessing, setIsProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fallbacks
  const displayId = bookingId || 'BK-TEST';
  const displayAmount = totalAmount || 0;
  const displayRoomName = room?.name || 'Phòng mẫu';
  const displayNights = nights || 1;

  // Bank Info for Transfer
  const bankInfo = {
    bankId: 'VCB',
    accountNumber: '123456789000',
    accountName: 'HOTEL 36',
    template: 'qr_only'
  };

  const mapMethodToBackend = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'transfer': return 'BankTransfer';
      case 'vnpay': return 'VNPay';
      case 'momo': return 'MoMo';
      default: return 'Cash';
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('http://localhost:9999/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          invoiceId: displayId,
          amount: parseFloat(displayAmount),
          method: mapMethodToBackend(paymentMethod),
          bankName: ['transfer'].includes(paymentMethod) ? bankInfo.bankId : null,
          bankAccount: ['transfer'].includes(paymentMethod) ? bankInfo.accountNumber : null,
        }),
      });

      if (!response.ok) throw new Error('Thanh toán thất bại.');
      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (n) => new Intl.NumberFormat("vi-VN").format(n);

  const getQrTitle = () => {
    if (paymentMethod === 'vnpay') return 'Quét mã VNPay để thanh toán';
    if (paymentMethod === 'momo') return 'Quét mã MoMo để thanh toán';
    return 'Quét mã ngân hàng để thanh toán';
  };

  const getQrContent = () => {
    if (paymentMethod === 'vnpay') return `VNPAY ${displayId}`;
    if (paymentMethod === 'momo') return `MOMO ${displayId}`;
    return `INV ${displayId}`;
  };

  const getQrNote = () => {
    if (paymentMethod === 'vnpay') return 'Mở ứng dụng Ví VNPAY hoặc App Ngân hàng';
    if (paymentMethod === 'momo') return 'Mở ứng dụng MoMo';
    return 'Mở App Ngân hàng';
  };

  // Helper to render QR
  const renderQrCode = () => {
    // 1. Bank Transfer -> Use VietQR (renders Bank template + Logo)
    if (paymentMethod === 'transfer') {
      const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-${bankInfo.template}.png?amount=${displayAmount}&addInfo=${getQrContent()}&accountName=${encodeURIComponent(bankInfo.accountName)}`;
      return <img src={qrUrl} alt="Bank QR" style={{ width: '200px', height: 'auto' }} />;
    }

    // 2. VNPay / MoMo -> Use Generic QR to avoid VCB branding
    // Use quickchart or api.qrserver
    const qrData = encodeURIComponent(`AMOUNT:${displayAmount}|MSG:${getQrContent()}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    // We can overlay a logo if we want to be fancy, but simple is better to fix the bug
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img src={qrUrl} alt={`${paymentMethod} QR`} style={{ width: '200px', height: '200px' }} />
        {/* Optional central logo overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          padding: 4,
          borderRadius: 4
        }}>
          <img
            src={paymentMethod === 'momo'
              ? "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
              : "https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg"}
            alt="Logo"
            style={{ width: 30, height: 30, objectFit: 'contain', display: 'block' }}
          />
        </div>
      </div>
    );
  };

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
        <div className="payment-container">

          {/* LEFT COLUMN: Payment Methods */}
          <div className="payment-left">
            <h2 className="payment-title">Bạn muốn thanh toán bằng cách nào?</h2>

            <div className="methods-grid">
              {/* VNPay */}
              <div
                className={`method-card ${paymentMethod === 'vnpay' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('vnpay')}
              >
                <img src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" alt="VNPay" className="method-logo" />
                <span className="method-name">VNPay</span>
              </div>

              {/* MoMo */}
              <div
                className={`method-card ${paymentMethod === 'momo' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('momo')}
              >
                <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="method-logo" />
                <span className="method-name">MoMo</span>
              </div>

              {/* Bank Transfer */}
              <div
                className={`method-card ${paymentMethod === 'transfer' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('transfer')}
              >
                <span className="method-icon" style={{ fontSize: 24 }}>🏦</span>
                <span className="method-name">Chuyển khoản</span>
              </div>

              {/* Cash */}
              <div
                className={`method-card ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <span className="method-icon" style={{ fontSize: 24 }}>💵</span>
                <span className="method-name">Tiền mặt</span>
              </div>
            </div>

            {/* QR Section (Shared for Transfer, VNPay, MoMo) */}
            {['transfer', 'vnpay', 'momo'].includes(paymentMethod) && (
              <div style={{ marginTop: 30, textAlign: 'center', background: '#f9f9f9', padding: 20, borderRadius: 8, border: '1px dashed #ccc' }}>
                <h4 style={{ marginBottom: 15, color: '#333' }}>
                  {getQrTitle()}
                </h4>

                <div className="qr-box" style={{ background: '#fff', padding: 10, display: 'inline-block', borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  {renderQrCode()}
                </div>

                <div style={{ marginTop: 15 }}>
                  <p style={{ margin: '5px 0' }}>Tổng tiền: <strong style={{ color: '#008000', fontSize: 18 }}>{formatPrice(displayAmount)} đ</strong></p>
                  <p style={{ margin: '5px 0', fontSize: 14 }}>Nội dung: <strong style={{ background: '#eee', padding: '2px 6px', borderRadius: 4 }}>{getQrContent()}</strong></p>

                  <p style={{ fontSize: 13, color: '#666', marginTop: 10, fontStyle: 'italic' }}>
                    {getQrNote()} để quét mã.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="payment-right">
            <h3 className="summary-title">Tóm tắt đơn hàng</h3>

            <div className="summary-section" style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 15 }}>
              <div style={{ fontWeight: 600, marginBottom: 5, color: '#333' }}>Thông tin phòng</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                {room?.imgUrl && <img src={room.imgUrl} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
                <div>
                  <div style={{ fontWeight: 600, color: '#007bff' }}>{displayRoomName}</div>
                  <div style={{ fontSize: 13, color: '#555' }}>{displayNights} đêm</div>
                </div>
              </div>
              {bookingData?.checkinDate && (
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                  <div>Check-in: <strong>{bookingData.checkinDate}</strong></div>
                  <div>Check-out: <strong>{bookingData.checkoutDate}</strong></div>
                </div>
              )}
            </div>

            <div className="summary-section" style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 15 }}>
              <div style={{ fontWeight: 600, marginBottom: 5, color: '#333' }}>Thông tin khách hàng</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                <div>Họ tên: <strong>{bookingData?.guestName || 'Khách'}</strong></div>
                {bookingData?.guestPhone && <div>SĐT: {bookingData.guestPhone}</div>}
                {bookingData?.guestEmail && <div>Email: {bookingData.guestEmail}</div>}
                <div>Số khách: {bookingData?.guestCount || 1} người</div>
              </div>
            </div>

            <div className="summary-row">
              <span>Mã đặt phòng</span>
              <strong>{displayId}</strong>
            </div>

            <div className="summary-total">
              <span>Tổng cộng</span>
              <span>{formatPrice(displayAmount)} đ</span>
            </div>

            {error && <div style={{ color: 'red', marginTop: 10, fontSize: 13 }}>{error}</div>}

            <button
              className="btn-pay"
              onClick={handlePayment}
              disabled={isProcessing || redirecting}
            >
              {redirecting
                ? `Đang chuyển hướng...`
                : (isProcessing
                  ? 'Đang xử lý...'
                  : (['vnpay', 'momo', 'transfer'].includes(paymentMethod) ? 'Xác nhận đã thanh toán' : 'Tiếp tục thanh toán')
                )
              }
            </button>

            <span className="cancel-link" onClick={() => navigate(-1)}>Hủy thanh toán</span>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
