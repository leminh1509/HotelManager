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

    // Simulate Redirect
    if (['vnpay', 'momo'].includes(paymentMethod)) {
      setRedirecting(true);
      await new Promise(r => setTimeout(r, 2000));
      setRedirecting(false);
    }

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
          bankName: paymentMethod === 'transfer' ? bankInfo.bankId : null,
          bankAccount: paymentMethod === 'transfer' ? bankInfo.accountNumber : null,
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

            {/* Transfer QR Section */}
            {paymentMethod === 'transfer' && (
              <div style={{ marginTop: 30, textAlign: 'center', background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
                <h4>Quét mã để thanh toán</h4>
                <img
                  src={`https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-${bankInfo.template}.png?amount=${displayAmount}&addInfo=INV${displayId}&accountName=${encodeURIComponent(bankInfo.accountName)}`}
                  alt="VietQR"
                  style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #ddd', margin: '15px 0' }}
                />
                <p>Ngân hàng: <strong>{bankInfo.bankId}</strong></p>
                <p>STK: <strong>{bankInfo.accountNumber}</strong></p>
                <p>Chủ TK: <strong>{bankInfo.accountName}</strong></p>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="payment-right">
            <h3 className="summary-title">Tóm tắt đơn hàng</h3>
            <div className="summary-row">
              <span>Mã đặt phòng</span>
              <strong>{displayId}</strong>
            </div>

            <div className="summary-row">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {room?.imgUrl && <img src={room.imgUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                <div>
                  <div style={{ fontWeight: 600, color: '#333' }}>{displayRoomName}</div>
                  <div style={{ fontSize: 12, color: '#777' }}>x {displayNights} đêm</div>
                </div>
              </div>
              <span>{formatPrice(displayAmount)} đ</span>
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
              {redirecting ? `Đang chuyển hướng...` : (isProcessing ? 'Đang xử lý...' : 'Tiếp tục thanh toán')}
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
