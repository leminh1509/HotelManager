import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Payment.css'; // Re-use styling

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // processing, success, failed

    useEffect(() => {
        const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
        // 00 is success
        if (vnp_ResponseCode === '00') {
            setStatus('success');
        } else {
            setStatus('failed');
        }
    }, [searchParams]);

    return (
        <div className="payment-page">
            <div className="payment-card">
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
        </div>
    );
};

export default PaymentResult;
