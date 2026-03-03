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
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, transfer, vnpay, vnpay_atm, vnpay_intl, vnpay_merchant
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

  const vnpayMerchantInfo = {
    bankId: 'VCB', // Example bank for VNPAY Merchant
    accountNumber: '0987654321', // Example merchant account
    accountName: 'VNPAY MERCHANT - HOTEL 36',
    template: 'qr_only'
  };

  const mapMethodToBackend = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'transfer':
      case 'vnpay_merchant': return 'BankTransfer';
      case 'vnpay':
      case 'vnpay_atm':
      case 'vnpay_intl': return 'PaymentGateway';
      default: return 'Cash';
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    if (['vnpay', 'vnpay_atm', 'vnpay_intl'].includes(paymentMethod)) {
      try {
        const orderInfo = `VNPAY BK-${displayId}`;
        const amount = Math.round(displayAmount);
        let bankCode = '';
        if (paymentMethod === 'vnpay') bankCode = 'VNPAYQR';
        else if (paymentMethod === 'vnpay_atm') bankCode = 'VNBANK';
        else if (paymentMethod === 'vnpay_intl') bankCode = 'INTCARD';

        const url = `http://localhost:9999/api/payments/vnpay-payment?amount=${amount}&orderInfo=${encodeURIComponent(orderInfo)}&bankCode=${bankCode}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('Không thể khởi tạo thanh toán VNPay.');
        const paymentUrl = await response.text();

        setRedirecting(true);
        window.location.href = paymentUrl;
        return;
      } catch (err) {
        console.error(err);
        setError('Lỗi kết nối VNPay. Vui lòng thử lại.');
        setIsProcessing(false);
        return;
      }
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
          bankName: ['transfer', 'vnpay_merchant'].includes(paymentMethod)
            ? (paymentMethod === 'vnpay_merchant' ? vnpayMerchantInfo.bankId : bankInfo.bankId)
            : null,
          bankAccount: ['transfer', 'vnpay_merchant'].includes(paymentMethod)
            ? (paymentMethod === 'vnpay_merchant' ? vnpayMerchantInfo.accountNumber : bankInfo.accountNumber)
            : null,
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
    if (paymentMethod === 'vnpay_merchant') return 'Chuyển khoản VNPAY Merchant';
    return 'Quét mã ngân hàng để thanh toán';
  };

  const getQrContent = () => {
    if (paymentMethod === 'vnpay') return `VNPAY ${displayId}`;
    if (paymentMethod === 'vnpay_merchant') return `VNPAY MERCHANT ${displayId}`;
    return `INV ${displayId}`;
  };

  const getQrNote = () => {
    if (paymentMethod === 'vnpay') return 'Mở ứng dụng Ví VNPAY hoặc App Ngân hàng';
    return 'Mở App Ngân hàng';
  };

  // Helper to render QR
  const renderQrCode = () => {
    // 1. Bank Transfer -> Use VietQR (renders Bank template + Logo)
    if (paymentMethod === 'transfer' || paymentMethod === 'vnpay_merchant') {
      const info = paymentMethod === 'vnpay_merchant' ? vnpayMerchantInfo : bankInfo;
      const qrUrl = `https://img.vietqr.io/image/${info.bankId}-${info.accountNumber}-${info.template}.png?amount=${displayAmount}&addInfo=${getQrContent()}&accountName=${encodeURIComponent(info.accountName)}`;
      return <img src={qrUrl} alt="Bank QR" style={{ width: '200px', height: 'auto' }} />;
    }

    // 2. VNPay -> Use Generic QR to avoid VCB branding
    // Use quickchart or api.qrserver
    const qrData = encodeURIComponent(`AMOUNT:${displayAmount}|MSG:${getQrContent()}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img src={qrUrl} alt={`${paymentMethod} QR`} style={{ width: '200px', height: '200px' }} />
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
            src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg"
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
                <span className="method-name">VNPay QR</span>
              </div>

              {/* VNPay ATM */}
              <div
                className={`method-card ${paymentMethod === 'vnpay_atm' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('vnpay_atm')}
              >
                <span className="method-icon" style={{ fontSize: 24 }}>💳</span>
                <span className="method-name">Thẻ ATM / Tài khoản</span>
              </div>

              {/* VNPay International */}
              <div
                className={`method-card ${paymentMethod === 'vnpay_intl' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('vnpay_intl')}
              >
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                  <img src="https://vnpay.vn/wp-content/uploads/2020/07/visa-mastercard-jcb.png" alt="Visa/Master" style={{ height: 20, objectFit: 'contain' }} />
                </div>
                <span className="method-name">Thẻ Quốc tế</span>
              </div>


              {/* Error Message */}
              <div
                className={`method-card ${paymentMethod === 'vnpay_merchant' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('vnpay_merchant')}
              >
                <img src="https://vnpay.vn/wp-content/uploads/2020/07/vnpay-logo.png" alt="VNPay Merchant" className="method-logo" />
                <span className="method-name">VNPAY Merchant</span>
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

            {/* Manual Bank Details section */}
            {['transfer', 'vnpay_merchant'].includes(paymentMethod) && (
              <div style={{ marginTop: 25, padding: 25, background: '#fff', borderRadius: 12, border: '1px solid #e0e0e0', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
                <h5 style={{ color: '#007bff', marginBottom: 20, borderBottom: '2px solid #f0f0f0', paddingBottom: 10, display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 10 }}>🏦</span> Thông tin chuyển khoản qua Số tài khoản
                </h5>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Ngân hàng:</span>
                    <strong style={{ fontSize: '16px' }}>{paymentMethod === 'vnpay_merchant' ? vnpayMerchantInfo.bankId : bankInfo.bankId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #eaedf0' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Số tài khoản:</span>
                    <strong style={{ fontSize: '22px', color: '#007bff', letterSpacing: '1px', fontFamily: 'monospace' }}>
                      {paymentMethod === 'vnpay_merchant' ? vnpayMerchantInfo.accountNumber : bankInfo.accountNumber}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Chủ tài khoản:</span>
                    <strong style={{ fontSize: '16px' }}>{paymentMethod === 'vnpay_merchant' ? vnpayMerchantInfo.accountName : bankInfo.accountName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Nội dung chuyển khoản:</span>
                    <strong style={{ fontSize: '17px', background: '#fff3cd', padding: '4px 10px', borderRadius: '4px', border: '1px solid #ffeeba', color: '#856404' }}>{getQrContent()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Số tiền:</span>
                    <strong style={{ fontSize: '18px', color: '#28a745' }}>{formatPrice(displayAmount)} đ</strong>
                  </div>
                </div>
                <div style={{ marginTop: 20, padding: '12px', background: '#e7f3ff', borderRadius: 8, fontSize: '13px', color: '#0056b3', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span>💡</span>
                  <span><strong>Gợi ý:</strong> Bạn có thể sao chép số tài khoản và nội dung ở trên để thực hiện chuyển khoản trong App Ngân hàng của mình.</span>
                </div>
              </div>
            )}

            {/* QR Section (Only for Automated VNPay Gateway) */}
            {['vnpay'].includes(paymentMethod) && (
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
                    {paymentMethod === 'vnpay_merchant' ? "Dùng App Ngân hàng quét mã để chuyển khoản Merchant" : `${getQrNote()} để quét mã.`}
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
                  : (['vnpay', 'vnpay_atm', 'vnpay_intl'].includes(paymentMethod) ? 'Thanh toán với VNPAY' : (['transfer', 'vnpay_merchant'].includes(paymentMethod) ? 'Xác nhận đã thanh toán' : 'Tiếp tục thanh toán'))
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
