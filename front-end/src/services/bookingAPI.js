import axios from "axios";

// Đổi BASE_URL này cho phù hợp với backend của bạn
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:9999/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// Tự gắn token nếu đã login
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Room APIs ───────────────────────────────────────────
// GET /rooms/search?checkin=&checkout=&guests=&categoryId=&minPrice=&maxPrice=
export const searchRooms = (params) => api.get("/rooms/search", { params });

// GET /rooms/:roomId  → trả về room + category + amenities + rating trung bình
export const getRoomById = (roomId) => api.get(`/rooms/${roomId}`);

// ─── Booking APIs ────────────────────────────────────────
// POST /bookings
// Body: { roomId, checkinTime, checkoutTime, guestCount,
//         guestName, guestEmail, guestPhone, guestIdNumber,
//         guestNationality, guestAddress, specialRequest,
//         earlyCheckin, lateCheckout }
// Response: { bookingId, status, totalPrice, ... }
export const createBooking = (payload) => api.post("/bookings", payload);

// GET /bookings/me  → lấy tất cả booking của user đang login
export const getMyBookings = () => api.get("/bookings/me");

// GET /bookings/:bookingId  → chi tiết 1 booking
export const getBookingById = (bookingId) => api.get(`/bookings/${bookingId}`);

// GET /bookings/rooms/:roomId
export const getBookingByRoomId = (roomId) =>
  api.get(`/bookings/rooms/${roomId}`);

// Get /bookings/all
export const getAllBooking = () => api.get("/bookings/all");

// PUT /bookings/:bookingId/cancel
export const cancelBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/cancel`);

// ─── Category APIs ───────────────────────────────────────
export const getCategories = () => api.get("/categories");

// ─── Feedback APIs ───────────────────────────────────────
export const submitFeedback = (payload) => api.post("/feedbacks", payload);

export const uploadFeedbackImages = (formData) => {
  return api.post("/feedbacks/upload", formData);
};

export const getRoomFeedbacks = (roomId) => api.get(`/feedbacks/room/${roomId}`);

export default api;