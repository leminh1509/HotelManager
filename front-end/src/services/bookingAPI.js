import axios from "axios";

// Đổi BASE_URL này cho phù hợp với backend của bạn
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:9999/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Tự gắn token nếu đã login
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

// PUT /bookings/:bookingId/cancel
export const cancelBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/cancel`);

// ─── Category APIs ───────────────────────────────────────
export const getCategories = () => api.get("/categories");

export default api;