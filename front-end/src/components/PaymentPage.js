import React, { useState } from 'react';
import './PaymentPage.css';

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Mock Invoice Data
  const invoiceData = {
    id: 'INV-' + Math.floor(Math.random() * 1000000),
    date: new Date().toLocaleDateString(),
    guest: 'Mr. John Doe',
    room: 'Deluxe Suite - 304',
    items: [
      { id: 1, name: 'Room Charge (3 Nights)', price: 450.00 },
      { id: 2, name: 'Room Service - Dinner', price: 45.50 },
      { id: 3, name: 'Spa Service', price: 80.00 },
      { id: 4, name: 'Mini Bar', price: 24.50 },
    ]
  };

  const calculateTotal = () => {
    return invoiceData.items.reduce((total, item) => total + item.price, 0).toFixed(2);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (paymentSuccess) {
    return (
      <div className="payment-page">
        <div className="payment-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <h2>Payment Successful!</h2>
            <p>Invoice {invoiceData.id} has been paid.</p>
            <button className="print-button" onClick={handlePrint}>
              <span>🖨️</span> Print Receipt
            </button>
            <button className="pay-button" onClick={() => setPaymentSuccess(false)} style={{ marginTop: '1rem' }}>
              Back to Invoice
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        
        {/* Payment Methods Section */}
        <div className="payment-methods-section">
          <h2 className="section-title">Select Payment Method</h2>
          
          <div className="methods-grid">
            <div 
              className={`method-card ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <span className="method-icon">💳</span>
              <span>Credit Card</span>
            </div>
            <div 
              className={`method-card ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <span className="method-icon">💵</span>
              <span>Cash</span>
            </div>
            <div 
              className={`method-card ${paymentMethod === 'transfer' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('transfer')}
            >
              <span className="method-icon">🏦</span>
              <span>Bank Transfer</span>
            </div>
          </div>

          <form className="payment-form" onSubmit={handlePayment}>
            {paymentMethod === 'card' && (
              <>
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input type="text" className="form-input" placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input type="text" className="form-input" placeholder="0000 0000 0000 0000" required />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Expiry Date</label>
                    <input type="text" className="form-input" placeholder="MM/YY" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">CVV</label>
                    <input type="text" className="form-input" placeholder="123" required />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'cash' && (
              <>
                <div className="form-group">
                  <label className="form-label">Amount Received ($)</label>
                  <input type="number" className="form-input" placeholder="0.00" required step="0.01" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" placeholder="Optional notes..."></textarea>
                </div>
              </>
            )}

            {paymentMethod === 'transfer' && (
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Transfer to Bank Account</p>
                <p style={{ color: '#4f46e5', fontSize: '1.25rem', fontWeight: 700 }}>1234-5678-9012</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Bank Name: Global Bank</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ref: {invoiceData.id}</p>
                <div className="form-group" style={{ marginTop: '1rem', textAlign: 'left' }}>
                    <label className="form-label">Upload Receipt / Transaction ID</label>
                    <input type="text" className="form-input" placeholder="Transaction ID" required />
                </div>
              </div>
            )}

            <button type="submit" className="pay-button" disabled={isProcessing}>
              {isProcessing ? 'Processing...' : `Pay $${calculateTotal()}`}
            </button>
          </form>
        </div>

        {/* Invoice Section */}
        <div className="invoice-section">
          <div className="invoice-header">
            <div className="invoice-logo">HOTEL LUXE</div>
            <p>Invoice #{invoiceData.id}</p>
          </div>
          
          <div className="invoice-details">
            <div>
              <p><strong>Bill To:</strong></p>
              <p>{invoiceData.guest}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><strong>Date:</strong></p>
              <p>{invoiceData.date}</p>
            </div>
          </div>

          <div className="invoice-items">
            {invoiceData.items.map((item) => (
              <div key={item.id} className="invoice-item">
                <span className="item-name">{item.name}</span>
                <span className="item-price">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="invoice-total">
            <span>Total</span>
            <span>${calculateTotal()}</span>
          </div>

          <button className="print-button" onClick={handlePrint}>
            <span>🖨️</span> Print Invoice
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
