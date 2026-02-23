import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation  } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { getRoomById, createBooking, getBookingByRoomId } from "../../services/bookingAPI";
import "./BookingForm.css";

// ─── Mock room fallback (xóa khi API thật sẵn sàng) ────
const MOCK_ROOMS = {
  1: { roomId: 1, name: "Deluxe Ocean View", categoryName: "Deluxe Room", capacity: 2, size_m2: 35, price: 3000000, imgUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=260&fit=crop" },
  2: { roomId: 2, name: "Luxury Garden View", categoryName: "Deluxe Room", capacity: 3, size_m2: 40, price: 3360000, imgUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=260&fit=crop" },
  3: { roomId: 3, name: "Executive Suite", categoryName: "Suite", capacity: 4, size_m2: 65, price: 5400000, imgUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=260&fit=crop" },
};

// ─── Helpers ─────────────────────────────────────────────
function calcNights(checkin, checkout) {
  if (!checkin || !checkout) return 1;
  const diff = (new Date(checkout) - new Date(checkin)) / 86400000;
  return diff > 0 ? diff : 1;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatPrice(n) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

// ─── Step Indicator ──────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Ngày & Khách", "Thông tin khách", "Xem lại & Đặt"];
  return (
    <div className="bf-stepbar">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className={`bf-step ${i < step ? "done" : i === step ? "active" : ""}`}>
            <div className="bf-step-dot">{i < step ? "✓" : i + 1}</div>
            <span>{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`bf-step-line ${i < step ? "done" : ""}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Room Summary (sidebar) ──────────────────────────────
function RoomSummary({ room, bookingData }) {
  if (!room) return null;
  const nights = calcNights(bookingData.checkinDate, bookingData.checkoutDate);
  const total = room.price * nights;

  return (
    <aside className="bf-summary">
      <img src={room.imgUrl} alt={room.name} className="bf-summary-img" />
      <h3>{room.name}</h3>
      <p className="bf-summary-cat">{room.categoryName}</p>

      <div className="bf-summary-rows">
        <div className="bf-summary-row">
          <span>Check-in</span>
          <span>{formatDate(bookingData.checkinDate)}</span>
        </div>
        <div className="bf-summary-row">
          <span>Check-out</span>
          <span>{formatDate(bookingData.checkoutDate)}</span>
        </div>
        <div className="bf-summary-row">
          <span>Số đêm</span>
          <span>{nights}</span>
        </div>
        <div className="bf-summary-row">
          <span>Số khách</span>
          <span>{bookingData.guestCount}</span>
        </div>
      </div>

      <div className="bf-summary-price">
        <span>{formatPrice(room.price)} đ × {nights} đêm</span>
        <strong>{formatPrice(total)} đ</strong>
      </div>
    </aside>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function BookingForm() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { selectedRoom, setSelectedRoom, bookingData, updateBookingData } = useBooking();

  const [room, setRoom] = useState(selectedRoom);
  const [step, setStep] = useState(0); // 0: dates, 1: guest info, 2: review
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const location = useLocation();
  const [dateConflict, setDateConflict] = useState(false);
  const [checkingDate, setCheckingDate] = useState(false);

  // Fetch room nếu chưa có trong context
  useEffect(() => {
    if (room) return;
    async function fetch() {
      try {
        const res = await getRoomById(roomId);
        setRoom(res.data);
        setSelectedRoom(res.data);
      } catch {
        const mock = MOCK_ROOMS[roomId];
        if (mock) {
          setRoom(mock);
          setSelectedRoom(mock);
        } else {
          navigate("/home");
        }
      }
    }
    fetch();
  }, [roomId, room, setSelectedRoom, navigate]);

  // ─── Auto fill date từ query params ───
useEffect(() => {
  const params = new URLSearchParams(location.search);

  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");

  // chỉ set khi bookingData chưa có (tránh overwrite khi user sửa tay)
  const updateData = {};

  if (checkIn && !bookingData.checkinDate) {
    updateData.checkinDate = checkIn;
  }

  if (checkOut && !bookingData.checkoutDate) {
    updateData.checkoutDate = checkOut;
  }

  if (Object.keys(updateData).length > 0) {
    updateBookingData(updateData);
  }
}, [location.search]);

 
// ─── Check booking conflict ───
useEffect(() => {
  async function checkConflict() {
    if (!bookingData.checkinDate || !bookingData.checkoutDate || !room)
      return;

    setCheckingDate(true);

    try {
      // giả sử API trả về list booking của room
      const res = await getBookingByRoomId(room.roomId);
      console.log('res',res.data);
      // normalize API response
let bookings = [];

if (Array.isArray(res.data)) {
  bookings = res.data;
} else if (res.data && typeof res.data === "object") {
  bookings = [res.data];
}

      let conflict = false;

      for (const b of bookings) {
        const bookedCheckin = b.checkinTime.split("T")[0];
        const bookedCheckout = b.checkoutTime.split("T")[0];

        if (
          isOverlap(
            bookingData.checkinDate,
            bookingData.checkoutDate,
            bookedCheckin,
            bookedCheckout
          )
        ) {
          conflict = true;
          break;
        }
      }

      setDateConflict(conflict);
    } catch (err) {
      console.error("Check booking conflict error:", err);
      setDateConflict(false);
    } finally {
      setCheckingDate(false);
    }
  }

  checkConflict();
}, [bookingData.checkinDate, bookingData.checkoutDate, room]);

  // ─── Validation ──
  // kiểm tra overlap date
  const isOverlap = (start1, end1, start2, end2) => {
    console.log(start1, end1, start2, end2);
    return new Date(start1) < new Date(end2) &&
           new Date(end1) > new Date(start2);
};
  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!bookingData.checkinDate) errs.checkinDate = "Chọn ngày check-in";
      if (!bookingData.checkoutDate) errs.checkoutDate = "Chọn ngày check-out";
      if (bookingData.checkinDate && bookingData.checkoutDate && bookingData.checkinDate >= bookingData.checkoutDate)
        errs.checkoutDate = "Ngày check-out phải sau check-in";
      if (!bookingData.guestCount || bookingData.guestCount < 1)
        errs.guestCount = "Số khách tối thiểu 1";
      if (room && bookingData.guestCount > room.capacity)
        errs.guestCount = `Tối đa ${room.capacity} khách`;
    }
    if (s === 1) {
      if (!bookingData.guestName?.trim()) errs.guestName = "Nhập tên khách";
      if (!bookingData.guestPhone?.trim()) errs.guestPhone = "Nhập số điện thoại";
      if (!bookingData.guestIdNumber?.trim()) errs.guestIdNumber = "Nhập số CMND/Hộ chiếu";
    }
    if (dateConflict) {
      errs.checkoutDate = "Khoảng ngày này đã có người đặt";
    }
    return errs;
  };

  const validateStep2 = () => {
  // số điện thoại VN (9–11 số)
const phoneRegex = /^[0-9]{9,11}$/;

// CMND/CCCD (9 hoặc 12 số)
const idRegex = /^[0-9]{9}$|^[0-9]{12}$/;

// email cơ bản
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errs = {};

  // tên
  if (!bookingData.guestName?.trim()) {
    errs.guestName = "Vui lòng nhập họ tên";
  }

  // email
  // if (!bookingData.guestEmail) {
  //   errs.email = "Vui lòng nhập email";
  // } else if (!emailRegex.test(bookingData.guestEmail)) {
  //   errs.email = "Email không hợp lệ";
  // }

  // số điện thoại
  if (!bookingData.guestPhone) {
    errs.guestPhone = "Vui lòng nhập số điện thoại";
  } else if (!phoneRegex.test(bookingData.guestPhone)) {
    errs.guestPhone = "Số điện thoại phải là 9–11 chữ số";
  }

  // CMND / CCCD
  if (!bookingData.guestIdNumber) {
    errs.guestIdNumber = "Vui lòng nhập CMND/CCCD";
  } else if (!idRegex.test(bookingData.guestIdNumber)) {
    errs.guestIdNumber = "CMND/CCCD phải gồm 9 hoặc 12 số";
  }

  setErrors(errs);

  return Object.keys(errs).length === 0;
};

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
     if (step === 1) {
     if (!validateStep2()) return;
    }
    setStep((s) => s + 1);
  };

  // ─── Submit booking ──
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        roomId: room.roomId,
        checkinTime: bookingData.checkinDate + "T14:00:00",
        checkoutTime: bookingData.checkoutDate + "T11:00:00",
        guestCount: bookingData.guestCount,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        guestIdNumber: bookingData.guestIdNumber,
        guestNationality: bookingData.guestNationality,
        guestAddress: bookingData.guestAddress,
        specialRequest: bookingData.specialRequest,
        earlyCheckin: bookingData.earlyCheckin,
        lateCheckout: bookingData.lateCheckout,
      };

      let bookingId;
      try {
        const res = await createBooking(payload);
        bookingId = res.data.bookingId;
      } catch {
        // Mock: sinh bookingId giả
        bookingId = "BK-" + Date.now().toString().slice(-6);
      }

      // Calculate nights for passing
      const start = new Date(bookingData.checkinDate);
      const end = new Date(bookingData.checkoutDate);
      const diff = end - start;
      const nights = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 1;

      navigate(`/booking/confirmation/${bookingId}`, {
        state: {
          bookingId,
          totalAmount: totalPrice,
          room,
          bookingData,
          nights
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!room) return <div className="bf-loading"><div className="bf-spinner" /><p>Đang tải...</p></div>;

  const nights = calcNights(bookingData.checkinDate, bookingData.checkoutDate);
  const totalPrice = room.price * nights;

  return (
    <div className="bf-page">
      <div className="bf-container">
        {/* Back */}
        <Link to={`/rooms/${roomId}`} className="bf-back">← Quay lại phòng</Link>

        <StepBar step={step} />

        <div className="bf-layout">
          {/* ─── Main form area ─── */}
          <div className="bf-main">

            {/* ========== STEP 0: Dates & Guests ========== */}
            {step === 0 && (
              <div className="bf-card">
                <h2>Chọn ngày và số khách</h2>

                <div className="bf-form-row">
                  <div className="bf-field">
                    <label>Ngày Check-in <span className="bf-req">*</span></label>
                    <input
                      type="date"
                      value={bookingData.checkinDate || ""}
                      onChange={(e) => updateBookingData({ checkinDate: e.target.value })}
                      className={errors.checkinDate ? "bf-input error" : "bf-input"}
                    />
                    {errors.checkinDate && <span className="bf-error">{errors.checkinDate}</span>}
                  </div>
                  <div className="bf-field">
                    <label>Ngày Check-out <span className="bf-req">*</span></label>
                    <input
                      type="date"
                      value={bookingData.checkoutDate || ""}
                      min={bookingData.checkinDate || undefined}
                      onChange={(e) => updateBookingData({ checkoutDate: e.target.value })}
                      className={errors.checkoutDate ? "bf-input error" : "bf-input"}
                    />
                    {errors.checkoutDate && <span className="bf-error">{errors.checkoutDate}</span>}
                  </div>
                </div>
                {dateConflict && (
                    <div className="bf-error" style={{marginTop: "10px"}}>
                        ❌ Khoảng thời gian này phòng đã được đặt. Vui lòng chọn ngày khác.
                    </div>
)}

                <div className="bf-field">
                  <label>Số khách <span className="bf-req">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max={room.capacity}
                    value={bookingData.guestCount}
                    onChange={(e) => updateBookingData({ guestCount: parseInt(e.target.value) || 1 })}
                    className={errors.guestCount ? "bf-input error" : "bf-input"}
                  />
                  <span className="bf-hint">Tối đa {room.capacity} khách cho phòng này</span>
                  {errors.guestCount && <span className="bf-error">{errors.guestCount}</span>}
                </div>

                <div className="bf-actions">
                 <button
                    onClick={handleNext}
                    disabled={dateConflict || checkingDate}
                    className="bf-btn-next"
                >
                  {checkingDate ? "Đang kiểm tra..." : "Tiếp tục →"}
                </button>
                </div>
              </div>
            )}

            {/* ========== STEP 1: Guest Info ========== */}
            {step === 1 && (
              <div className="bf-card">
                <h2>Thông tin khách</h2>

                <div className="bf-form-row">
                  <div className="bf-field">
                    <label>Tên khách <span className="bf-req">*</span></label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={bookingData.guestName}
                      onChange={(e) => updateBookingData({ guestName: e.target.value })}
                      className={errors.guestName ? "bf-input error" : "bf-input"}
                    />
                    {errors.guestName && <span className="bf-error">{errors.guestName}</span>}
                  </div>
                  <div className="bf-field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={bookingData.guestEmail}
                      onChange={(e) => updateBookingData({ guestEmail: e.target.value })}
                      className="bf-input"
                    />
                  </div>
                </div>

                <div className="bf-form-row">
                  <div className="bf-field">
                    <label>Số điện thoại <span className="bf-req">*</span></label>
                    <input
                      type="tel"
                      pattern="[0-9]{10}" 
                      title="Vui lòng nhập đúng 10 chữ số"
                      placeholder="0xx xxx xxxx"
                      value={bookingData.guestPhone}
                      onChange={(e) => updateBookingData({ guestPhone: e.target.value })}
                      className={errors.guestPhone ? "bf-input error" : "bf-input"}
                    />
                    {errors.guestPhone && <span className="bf-error">{errors.guestPhone}</span>}
                  </div>
                  <div className="bf-field">
                    <label>CMND / Hộ chiếu <span className="bf-req">*</span></label>
                    <input
                      type="text"
                      pattern="[0-9]{12}"
                      placeholder="12 chữ số CMND hoặc số hộ chiếu"
                      value={bookingData.guestIdNumber}
                      onChange={(e) => updateBookingData({ guestIdNumber: e.target.value })}
                      className={errors.guestIdNumber ? "bf-input error" : "bf-input"}
                    />
                    {errors.guestIdNumber && <span className="bf-error">{errors.guestIdNumber}</span>}
                  </div>
                </div>

                <div className="bf-form-row">
                  <div className="bf-field">
                    <label>Quốc tịch</label>
                    <input
                      type="text"
                      placeholder="Việt Nam"
                      value={bookingData.guestNationality}
                      onChange={(e) => updateBookingData({ guestNationality: e.target.value })}
                      className="bf-input"
                    />
                  </div>
                  <div className="bf-field">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      placeholder="Đđịa chỉ của bạn"
                      value={bookingData.guestAddress}
                      onChange={(e) => updateBookingData({ guestAddress: e.target.value })}
                      className="bf-input"
                    />
                  </div>
                </div>

                <div className="bf-field">
                  <label>Yêu cầu đặc biệt</label>
                  <textarea
                    placeholder="Ví dụ: cần thêm gối, baby cot, ..."
                    value={bookingData.specialRequest}
                    onChange={(e) => updateBookingData({ specialRequest: e.target.value })}
                    className="bf-input bf-textarea"
                    rows={3}
                  />
                </div>

                <div className="bf-checkboxes">
                  <label className="bf-checkbox">
                    <input
                      type="checkbox"
                      checked={bookingData.earlyCheckin}
                      onChange={(e) => updateBookingData({ earlyCheckin: e.target.checked })}
                    />
                    <span>Yêu cầu check-in sớm</span>
                  </label>
                  <label className="bf-checkbox">
                    <input
                      type="checkbox"
                      checked={bookingData.lateCheckout}
                      onChange={(e) => updateBookingData({ lateCheckout: e.target.checked })}
                    />
                    <span>Yêu cầu check-out muộn</span>
                  </label>
                </div>

                <div className="bf-actions">
                  <button onClick={() => { setErrors({}); setStep(0); }} className="bf-btn-back">← Quay lại</button>
                  <button onClick={handleNext} className="bf-btn-next">Xem lại đặt phòng →</button>
                </div>
              </div>
            )}

            {/* ========== STEP 2: Review & Confirm ========== */}
            {step === 2 && (
              <div className="bf-card">
                <h2>Xem lại đặt phòng</h2>
                {/* Room info */}
                <div className="bf-review-section">
                  <h4>Phòng</h4>
                  <div className="bf-review-row"><span>Tên phòng</span><span>{room.name}</span></div>
                  <div className="bf-review-row"><span>Loại</span><span>{room.categoryName}</span></div>
                  <div className="bf-review-row"><span>Check-in</span><span>{formatDate(bookingData.checkinDate)}</span></div>
                  <div className="bf-review-row"><span>Check-out</span><span>{formatDate(bookingData.checkoutDate)}</span></div>
                  <div className="bf-review-row"><span>Số đêm</span><span>{nights}</span></div>
                  <div className="bf-review-row"><span>Số khách</span><span>{bookingData.guestCount}</span></div>
                </div>

                {/* Guest info */}
                <div className="bf-review-section">
                  <h4>Thông tin khách</h4>
                  <div className="bf-review-row"><span>Tên</span><span>{bookingData.guestName}</span></div>
                  {bookingData.guestEmail && <div className="bf-review-row"><span>Email</span><span>{bookingData.guestEmail}</span></div>}
                  <div className="bf-review-row"><span>Điện thoại</span><span>{bookingData.guestPhone}</span></div>
                  <div className="bf-review-row"><span>CMND/Hộ chiếu</span><span>{bookingData.guestIdNumber}</span></div>
                  {bookingData.guestNationality && <div className="bf-review-row"><span>Quốc tịch</span><span>{bookingData.guestNationality}</span></div>}
                  {bookingData.specialRequest && <div className="bf-review-row"><span>Yêu cầu đặc biệt</span><span>{bookingData.specialRequest}</span></div>}
                  {(bookingData.earlyCheckin || bookingData.lateCheckout) && (
                    <div className="bf-review-row">
                      <span>Tùy chọng</span>
                      <span>
                        {bookingData.earlyCheckin && "Check-in sớm"}
                        {bookingData.earlyCheckin && bookingData.lateCheckout && " · "}
                        {bookingData.lateCheckout && "Check-out muộn"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price breakdown */}
                <div className="bf-review-section bf-price-breakdown">
                  <h4>Tổng giá</h4>
                  <div className="bf-review-row"><span>{formatPrice(room.price)} đ × {nights} đêm</span><span>{formatPrice(totalPrice)} đ</span></div>
                  <div className="bf-review-row bf-total"><span>Tổng</span><span>{formatPrice(totalPrice)} </span></div>
                </div>

                <div className="bf-actions">
                  <button onClick={() => { setErrors({}); setStep(1); }} className="bf-btn-back">← Quay lại</button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bf-btn-confirm"
                  >
                    {submitting ? "Đang xử lý..." : "✓ Xác nhận đặt phòng"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Sidebar summary ─── */}
          <RoomSummary room={room} bookingData={bookingData} />
        </div>
      </div>
    </div>
  );
}