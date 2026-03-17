import React, { useState, useRef } from "react";
import { submitFeedback, uploadFeedbackImages } from "../../services/bookingAPI";
import "./FeedbackForm.css";

export default function FeedbackForm({ booking, onClose, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length + images.length > 5) {
            setError("Bạn chỉ có thể chọn tối đa 5 ảnh.");
            return;
        }

        setImages((prev) => [...prev, ...selectedFiles]);

        const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
        setPreviews((prev) => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            let uploadedUrls = [];
            if (images.length > 0) {
                const formData = new FormData();
                images.forEach((img) => formData.append("files", img));
                const uploadRes = await uploadFeedbackImages(formData);
                uploadedUrls = uploadRes.data.imageUrls;
            }

            await submitFeedback({
                bookingId: booking.bookingId,
                rating,
                comment,
                imageUrls: uploadedUrls,
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
                            rows={4}
                        />
                    </div>

                    <div className="ff-image-section">
                        <label>Thêm ảnh (tối đa 5 ảnh)</label>
                        <div className="ff-image-grid">
                            {previews.map((src, idx) => (
                                <div key={idx} className="ff-image-preview">
                                    <img src={src} alt={`preview-${idx}`} />
                                    <button type="button" className="ff-remove-img" onClick={() => removeImage(idx)}>
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {previews.length < 5 && (
                                <button
                                    type="button"
                                    className="ff-add-img-btn"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <span>+</span>
                                    <p>Thêm ảnh</p>
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
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
