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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Room APIs ───────────────────────────────────────────
// GET /rooms/search?checkin=&checkout=&guests=&categoryId=&minPrice=&maxPrice=
export const searchRooms = (params) => api.get("/rooms/search", { params });
export const getAllRooms = () => api.get("/rooms");
export const searchRoomsPaginated = (params) => api.get("/rooms/search/page", { params });
export const getAllRoomsPaginated = (params) => api.get("/rooms/page", { params });

// GET /rooms/:roomId  → trả về room + category + amenities + rating trung bình
export const getRoomById = (roomId) => api.get(`/rooms/${roomId}`);

// ─── Booking APIs ───────────────────────────────────────────
export const previewBookingPrice = (roomId, checkin, checkout) =>
  api.get("/bookings/preview-price", { params: { roomId, checkin, checkout } });



// ─── Category APIs ───────────────────────────────────────
export const getCategories = () => api.get("/categories");

export default api;