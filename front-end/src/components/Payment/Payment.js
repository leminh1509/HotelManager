import React, { useState } from 'react';
import './Payment.css';

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, transfer, gateway
  const [amountTendered, setAmountTendered] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  // Bank Transfer Details
  const [bankInfo, setBankInfo] = useState({
    bankName: 'VCB',
    accountNumber: '1234567890',
    accountName: 'HOTEL 36'
  });

  // Mock Invoice Data
  const invoiceId = 1; // Assuming we are paying for invoice #1
  const totalAmount = 1250.00;

  const mapMethodToBackend = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'transfer': return 'BankTransfer';
      case 'gateway': return 'PaymentGateway'; // Mapped 'card'/'ewallet' to generic gateway or specific enums if needed
      case 'card': return 'CreditCard';
      case 'ewallet': return 'EWallet';
      default: return 'Cash';
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    const backendMethod = mapMethodToBackend(paymentMethod);

    try {
      const response = await fetch('http://localhost:9999/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Uncomment if secured
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
        throw new Error('Payment failed');
      }

      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (e) => {
    setAmountTendered(e.target.value);
  };

  const isFormValid = () => {
    if (!amountTendered) return false;
    return parseFloat(amountTendered) >= totalAmount;
  }

  if (paymentSuccess) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <div className="success-container">
            <span className="success-icon-large">🎉</span>
            <h2 className="success-title">Payment Successful!</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Transaction completed successfully.</p>
            <button className="pay-button ready" onClick={() => window.location.reload()}>
              Return to Dashboard
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
          <h1 className="card-title">Payment Processing</h1>
          <p className="card-subtitle">Select payment method and enter details</p>
        </div>

        {/* Total Amount Box */}
        <div className="total-amount-box">
          <span className="total-label">Total Amount</span>
          <span className="total-value">${totalAmount.toFixed(2)}</span>
        </div>

        {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

        {/* Payment Methods Grid */}
        <label className="section-label">Payment Method</label>
        <div className="methods-grid">
          <div
            className={`method-option ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            <span className="method-icon">💵</span>
            <span className="method-name">Cash</span>
          </div>
          <div
            className={`method-option ${paymentMethod === 'transfer' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('transfer')}
          >
            <span className="method-icon">🏦</span>
            <span className="method-name">Bank Transfer</span>
          </div>
          <div
            className={`method-option ${paymentMethod === 'gateway' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('gateway')}
          >
            <span className="method-icon">🌐</span>
            <span className="method-name">Payment Gateway</span>
          </div>
        </div>

        {/* Dynamic Content based on Method */}
        {paymentMethod === 'transfer' && (
          <div className="transfer-info" style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 20 }}>
            <h4 style={{ marginTop: 0 }}>Transfer Details</h4>
            <p><strong>Bank:</strong> {bankInfo.bankName}</p>
            <p><strong>Account:</strong> {bankInfo.accountNumber}</p>
            <p><strong>Name:</strong> {bankInfo.accountName}</p>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handlePayment}>
          <div className="input-group">
            <label className="section-label">Amount Tendered</label>
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

          <button
            type="submit"
            className={`pay-button ${isFormValid() ? 'ready' : ''}`}
            disabled={isProcessing || !isFormValid()}
          >
            {isProcessing ? 'Processing...' : (paymentMethod === 'gateway' ? 'Proceed to Gateway' : 'Process Payment')}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Payment;
