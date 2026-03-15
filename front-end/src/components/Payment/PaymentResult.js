import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import './Payment.css'; // Re-use styling

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('processing'); // processing, success, failed

    useEffect(() => {
        const verifyPayment = async () => {
            const code = searchParams.get('code');
            const cancel = searchParams.get('cancel');
            const payosStatus = searchParams.get('status');

            if (location.pathname.includes('payos-cancel') || cancel === 'true' || payosStatus === 'CANCELLED') {
                setStatus('failed');
            } else if (location.pathname.includes('payos-return') && (code === '00' || payosStatus === 'PAID')) {
                setStatus('success');
            } else {
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [searchParams, location.pathname]);

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
                    <h2 className="success-title">Thanh toán thành công!</h2>
                    <p className="success-desc">
                        Giao dịch PayOS của bạn đã được xác nhận thành công.
                    </p>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px' }}
                        onClick={() => navigate('/my-bookings')}
                    >
                        Đến danh sách đặt phòng
                    </button>
                </div>
            )}

            {status === 'failed' && (
                <div className="success-view">
                    <div className="success-icon-wrapper" style={{ backgroundColor: '#fef2f2' }}>
                        <span className="success-icon" style={{ color: '#ef4444' }}>✕</span>
                    </div>
                    <h2 className="success-title">Thanh toán thất bại</h2>
                    <p className="success-desc">
                        Giao dịch đã bị hủy hoặc không thể hoàn thành.
                    </p>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px' }}
                        onClick={() => navigate(-2)}
                    >
                        Quay lại
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentResult;
