import React, { useState } from "react";
import { submitFeedback } from "../../services/bookingAPI";
import "./FeedbackForm.css";

export default function FeedbackForm({ booking, onClose, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await submitFeedback({
                bookingId: booking.bookingId,
                rating,
                comment,
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="ff-overlay" onClick={onClose}>
            <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ff-header">
                    <h3>Đánh giá dịch vụ</h3>
                    <button className="ff-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="ff-body">
                    <div className="ff-room-info">
                        <p>Phòng: <strong>{booking.roomNumber} - {booking.roomName}</strong></p>
                    </div>

                    <div className="ff-rating-section">
                        <label>Bạn chấm bao nhiêu sao?</label>
                        <div className="ff-stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    className={`ff-star ${rating >= s ? "active" : ""}`}
                                    onClick={() => setRating(s)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="ff-comment-section">
                        <label>Chia sẻ trải nghiệm của bạn (không bắt buộc)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Phòng có sạch sẽ không? Nhân viên phục vụ như thế nào?..."
                            rows={4}
                        />
                    </div>

                    {error && <p className="ff-error">{error}</p>}

                    <div className="ff-footer">
                        <button type="button" className="ff-btn-cancel" onClick={onClose} disabled={submitting}>
                            Hủy
                        </button>
                        <button type="submit" className="ff-btn-submit" disabled={submitting}>
                            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
