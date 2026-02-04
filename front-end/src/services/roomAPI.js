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
   console.log('tk',token);

  // if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  // } else {
  //   delete config.headers.Authorization;
  // }

  return config;
});

// ─── Room APIs ───────────────────────────────────────────
// GET /rooms/search?checkin=&checkout=&guests=&categoryId=&minPrice=&maxPrice=
export const searchRooms = (params) => api.get("/rooms/search", { params });
export const getAllRooms = () => api.get("/rooms");

// GET /rooms/:roomId  → trả về room + category + amenities + rating trung bình
export const getRoomById = (roomId) => api.get(`/rooms/${roomId}`);



// ─── Category APIs ───────────────────────────────────────
export const getCategories = () => api.get("/categories");

export default api;