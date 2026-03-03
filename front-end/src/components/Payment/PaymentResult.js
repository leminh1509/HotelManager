import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Payment.css'; // Re-use styling

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // processing, success, failed

    useEffect(() => {
        const verifyPayment = async () => {
            const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');

            if (vnp_ResponseCode === '00') {
                // Success - Verify with backend
                try {
                    const params = Object.fromEntries(searchParams.entries());
                    const response = await fetch('http://localhost:9999/api/payments/vnpay-verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(params)
                    });

                    if (response.ok) {
                        setStatus('success');
                    } else {
                        console.error('Backend verification failed');
                        setStatus('failed');
                    }
                } catch (err) {
                    console.error('Error verifying payment:', err);
                    setStatus('failed');
                }
            } else {
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="payment-card shadow-lg p-5 text-center" style={{ maxWidth: '500px', margin: '100px auto', borderRadius: '16px' }}>
            {status === 'processing' && (
                <div className="processing-view">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h3 className="status-text">Đang xác thực thanh toán...</h3>
                    <p className="text-muted">Vui lòng không đóng trang này.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="success-view">
                    <div className="success-icon-wrapper">
                        <span className="success-icon">✓</span>
                    </div>
                    <h2 className="success-title">Payment Successful</h2>
                    <p className="success-desc">
                        Your VNPay transaction was successful.
                    </p>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => navigate('/my-bookings')}
                    >
                        Go to My Bookings
                    </button>
                </div>
            )}

            {status === 'failed' && (
                <div className="success-view">
                    <div className="success-icon-wrapper" style={{ backgroundColor: '#fef2f2' }}>
                        <span className="success-icon" style={{ color: '#ef4444' }}>✕</span>
                    </div>
                    <h2 className="success-title">Payment Failed</h2>
                    <p className="success-desc">
                        Your transaction was not completed or was cancelled.
                    </p>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                        onClick={() => navigate('/payment')}
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentResult;
