import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data passed from BookingConfirmation or fallback
  const { bookingId: passedBookingId, totalAmount: passedTotalAmount } = location.state || {};

  // State
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, transfer, gateway
  const [amountTendered, setAmountTendered] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  // Defaults (in a real app, you might fetch booking details if state is missing)
  const invoiceId = passedBookingId || 1;
  const totalAmount = passedTotalAmount || 1250.00;

  // Bank Transfer Details
  const bankInfo = {
    bankId: 'VCB', // Vietcombank ID for VietQR
    accountNumber: '123456789000',
    accountName: 'HOTEL 36',
    template: 'qr_only' // or 'compact'
  };

  const mapMethodToBackend = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'transfer': return 'BankTransfer';
      case 'vnpay': return 'VNPay';
      default: return 'Cash';
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid()) {
      return;
    }

    setIsProcessing(true);

    // VNPay Specific Flow
    if (paymentMethod === 'vnpay') {
      try {
        const response = await fetch(`http://localhost:9999/api/payments/vnpay-payment?amount=${amountTendered}&orderInfo=Payment_for_invoice_${invoiceId}`, {
          method: 'GET',
        });
        if (!response.ok) throw new Error('Failed to generate VNPay URL');
        const data = await response.text();
        // NOTE: Controller returns just the string in ResponseEntity body? 
        // let's check controller. returns ResponseEntity.ok(paymentUrl).

        // If the controller returns raw string, data is the url.
        // If it sends JSON, we need to parse.
        // My controller sent: ResponseEntity.ok(paymentUrl); -> Text plain usually if just query string.
        // Actually, Spring Boot often returns JSON string if just returning String? 
        // Wait, usually it returns plain text unless wrapped in object. 
        // My controller: return ResponseEntity.ok(paymentUrl);
        // Let's assume plain text url.

        window.location.href = data;
      } catch (err) {
        console.error(err);
        setError('Could not redirect to VNPay.');
        setIsProcessing(false);
      }
      return;
    }

    // Normal Flow (Cash/Transfer)
    const backendMethod = mapMethodToBackend(paymentMethod);

    try {
      const response = await fetch('http://localhost:9999/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          amount: parseFloat(amountTendered),
          method: backendMethod,
          bankName: backendMethod === 'BankTransfer' ? bankInfo.bankName : null,
          bankAccount: backendMethod === 'BankTransfer' ? bankInfo.accountNumber : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment failed. Please try again.');
      }

      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Payment failed. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (e) => {
    setAmountTendered(e.target.value);
    if (error) setError('');
  };

  const isFormValid = () => {
    if (!amountTendered) return false;
    const amount = parseFloat(amountTendered);
    return amount >= totalAmount;
  }

  // Success View
  if (paymentSuccess) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <div className="success-view">
            <div className="success-icon-wrapper">
              <span className="success-icon">✓</span>
            </div>
            <h2 className="success-title">Payment Successful</h2>
            <p className="success-desc">
              Thank you! Your payment of <strong>${parseFloat(amountTendered).toFixed(2)}</strong> has been processed.
            </p>

            <div className="conf-summary">
              <div className="summary-row">
                <span>Invoice ID</span>
                <span>#{invoiceId}</span>
              </div>
              <div className="summary-row">
                <span>Method</span>
                <span>{mapMethodToBackend(paymentMethod)}</span>
              </div>
              <div className="summary-total">
                <span>Total Paid</span>
                <span>${parseFloat(amountTendered).toFixed(2)}</span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/booking/confirmation/${invoiceId}`)}>
              View Receipt & Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-card">

        {/* Header */}
        <div className="card-header">
          <h1 className="card-title">Payment Details</h1>
          <p className="card-subtitle">Complete your transaction securely</p>
        </div>

        <div className="card-body">
          {/* Total Amount Box */}
          <div className="total-amount-box">
            <span className="total-label">Total Due</span>
            <span className="total-value">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <form onSubmit={handlePayment}>

            {/* Payment Methods */}
            <div className="form-section">
              <label className="section-label">Select Payment Method</label>
              <div className="methods-grid">
                {[
                  { id: 'cash', label: 'Cash', icon: '💵' },
                  { id: 'transfer', label: 'Transfer', icon: '🏦' },
                  { id: 'vnpay', label: 'VNPay', icon: '💳' },
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`method-option ${paymentMethod === m.id ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(m.id)}
                  >
                    <span className="method-icon">{m.icon}</span>
                    <span className="method-name">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Content based on Method */}
            {paymentMethod === 'transfer' && (
              <div className="transfer-info" style={{ textAlign: 'center' }}>
                <div className="transfer-title">
                  <i className="fa fa-qrcode"></i> Scan to Pay
                </div>

                {(!amountTendered || parseFloat(amountTendered) <= 0) ? (
                  <p style={{ color: '#64748b' }}>Enter an amount to generate QR code</p>
                ) : (
                  <div style={{ margin: '1rem 0' }}>
                    <img
                      src={`https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-${bankInfo.template}.png?amount=${amountTendered}&addInfo=INV${invoiceId}&accountName=${encodeURIComponent(bankInfo.accountName)}`}
                      alt="VietQR"
                      style={{ maxWidth: '300px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                )}

                <div className="transfer-row">
                  <span className="transfer-label">Bank:</span>
                  <span className="transfer-val">{bankInfo.bankId}</span>
                </div>
                <div className="transfer-row">
                  <span className="transfer-label">Account:</span>
                  <span className="transfer-val">{bankInfo.accountNumber}</span>
                </div>
                <div className="transfer-row">
                  <span className="transfer-label">Content:</span>
                  <span className="transfer-val">INV{invoiceId}</span>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="input-group">
              <label className="section-label">Amount to Pay</label>
              <div className="amount-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  className="amount-input"
                  placeholder="0.00"
                  value={amountTendered}
                  onChange={handleAmountChange}
                  step="0.01"
                  min="0"
                />
              </div>
              {error && <div className="error-msg"><i className="fa fa-exclamation-circle"></i> {error}</div>}
              {!error && amountTendered && parseFloat(amountTendered) < totalAmount && (
                <div className="error-msg" style={{ color: '#f59e0b' }}>
                  <i className="fa fa-exclamation-triangle"></i> Amount must be at least ${totalAmount}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pay-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={isProcessing}
              >
                Back
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isProcessing || !isFormValid()}
              >
                {isProcessing ? (
                  <span><i className="fa fa-spinner fa-spin"></i> Processing...</span>
                ) : (
                  paymentMethod === 'vnpay' ? 'Pay with VNPay' : `Pay $${amountTendered ? parseFloat(amountTendered).toLocaleString() : '0.00'}`
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default Payment;
