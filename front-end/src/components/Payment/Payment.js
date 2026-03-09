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
  const [paymentMethod, setPaymentMethod] = useState('vnpay'); // vnpay, card
  const [isProcessing, setIsProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  // Card Details State
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    bank: ''
  });

  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();
        if (data.code === '00') {
          setBanks(data.data);
        }
      } catch (err) {
        console.error('Error fetching banks:', err);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

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

    // Both VNPay and Card will now go through VNPay Gateway for OTP
    if (paymentMethod === 'vnpay' || paymentMethod === 'card') {
      try {
        const orderInfo = `VNPAY BK-${displayId}`;
        const amount = Math.round(displayAmount);

        // If bank is selected in grid, use it. Otherwise default based on method.
        let bankCode = cardDetails.bank;
        if (!bankCode) {
          bankCode = paymentMethod === 'vnpay' ? 'VNPAYQR' : 'VNBANK';
        }

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
        setError('Lỗi kết nối thanh toán. Vui lòng thử lại.');
        setIsProcessing(false);
        return;
      }
    }

    setIsProcessing(false);
  };

  const formatPrice = (n) => new Intl.NumberFormat("vi-VN").format(n);

  const getQrTitle = () => {
    return 'Quét mã VNPay để thanh toán';
  };

  const getQrContent = () => {
    return `VNPAY ${displayId}`;
  };

  const getQrNote = () => {
    return 'Mở ứng dụng Ví VNPAY hoặc App Ngân hàng';
  };

  // Helper to render QR
  const renderQrCode = () => {
    // VNPay -> Use Generic QR to avoid VCB branding
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
              <div
                className={`method-card ${paymentMethod === 'vnpay' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('vnpay')}
              >
                <img src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" alt="VNPay" className="method-logo" />
                <span className="method-name">VNPay QR</span>
              </div>

              {/* Credit Card */}
              <div
                className={`method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <span className="method-icon" style={{ fontSize: 24 }}>💳</span>
                <span className="method-name">Thẻ ngân hàng</span>
              </div>
            </div>

            {/* Card Form Section */}
            {paymentMethod === 'card' && (
              <div className="card-form">
                <div className="card-preview">
                  <div className="card-chip"></div>
                  <div className="card-number-display">
                    {cardDetails.number.padEnd(16, '•').replace(/(.{4})/g, '$1 ')}
                  </div>
                  <div className="card-bottom">
                    <div className="card-name-section">
                      <div className="card-label">Chủ thẻ</div>
                      <div className="card-name-display">{cardDetails.name || 'FULL NAME'}</div>
                    </div>
                    <div className="card-expiry-section">
                      <div className="card-label">Hết hạn</div>
                      <div className="card-expiry-display">{cardDetails.expiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 15 }}>
                  <label>Số thẻ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="xxxx xxxx xxxx xxxx"
                    maxLength="16"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 15 }}>
                  <label>Chọn ngân hàng</label>
                  <div className="bank-search-container">
                    <input
                      type="text"
                      className="bank-search-input"
                      placeholder="Tìm kiếm ngân hàng (vcb, bidv...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {loadingBanks ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Đang tải danh sách ngân hàng...</div>
                  ) : (
                    <div className="bank-grid-scroll">
                      {banks
                        .filter(b =>
                          b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.shortName && b.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map(b => (
                          <div
                            key={b.id}
                            className={`bank-card-item ${cardDetails.bank === (b.shortName || b.name) ? 'selected' : ''}`}
                            onClick={() => setCardDetails({ ...cardDetails, bank: b.shortName || b.name })}
                          >
                            <img src={b.logo} alt={b.shortName} className="bank-logo-img" />
                            <div className="bank-short-name">{b.shortName || b.name}</div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 15 }}>
                  <label>Tên chủ thẻ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="NGUYEN VAN A"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày hết hạn</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="MM/YY"
                      maxLength="5"
                      value={cardDetails.expiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                        setCardDetails({ ...cardDetails, expiry: v });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* QR Section (Only for Automated VNPay Gateway) */}
            {paymentMethod === 'vnpay' && (
              <div className="vnpay-setup" style={{ marginTop: 20 }}>
                <div className="form-group" style={{ marginBottom: 15 }}>
                  <label>Chọn ngân hàng thanh toán qua VNPAY</label>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Chọn ngân hàng để sử dụng mã OTP (ví dụ: chọn <strong>NCB</strong> để test Sandbox)</p>

                  <div className="bank-search-container">
                    <input
                      type="text"
                      className="bank-search-input"
                      placeholder="Tìm kiếm ngân hàng (ncb, vcb, bidv...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {loadingBanks ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Đang tải danh sách ngân hàng...</div>
                  ) : (
                    <div className="bank-grid-scroll">
                      {banks
                        .filter(b =>
                          b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.shortName && b.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map(b => (
                          <div
                            key={b.id}
                            className={`bank-card-item ${cardDetails.bank === (b.shortName || b.name) ? 'selected' : ''}`}
                            onClick={() => setCardDetails({ ...cardDetails, bank: b.shortName || b.name })}
                          >
                            <img src={b.logo} alt={b.shortName} className="bank-logo-img" />
                            <div className="bank-short-name">{b.shortName || b.name}</div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

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

                    {getQrNote()} để quét mã.
                  </div>
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
                  : (paymentMethod === 'vnpay' ? 'Thanh toán với VNPAY' : 'Thanh toán qua Thẻ ngân hàng')
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
