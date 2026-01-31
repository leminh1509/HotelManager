import React, { useState } from 'react';
import './PaymentPage.css';

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default to Cash as per image
  const [amountTendered, setAmountTendered] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Mock Invoice Data
  const totalAmount = 1250.00;

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 2000);
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
            className={`method-option ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            <span className="method-icon">💳</span>
            <span className="method-name">Credit Card</span>
          </div>
          <div
            className={`method-option ${paymentMethod === 'ewallet' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('ewallet')}
          >
            <span className="method-icon">包</span>
            <span className="method-name">E-Wallet</span>
          </div>
        </div>

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
            {isProcessing ? 'Processing...' : 'Process Payment'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default PaymentPage;
