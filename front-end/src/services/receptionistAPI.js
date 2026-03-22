import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:9999/api";

const api = axios.create({
    baseURL: BASE_URL,
});

// Add token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Guidelines APIs ─────────────────────────────────────
export const getGuidelines = (page = 0, size = 10) =>
    api.get(`/guidelines?page=${page}&size=${size}`).then(res => res.data);

export const createGuideline = (payload) =>
    api.post("/guidelines", payload).then(res => res.data);

export const updateGuideline = (id, payload) =>
    api.put(`/guidelines/${id}`, payload).then(res => res.data);

export const deleteGuideline = (id) =>
    api.delete(`/guidelines/${id}`).then(res => res.data);

// ─── Rules APIs ──────────────────────────────────────────
export const getRules = (page = 0, size = 10) =>
    api.get(`/rules?page=${page}&size=${size}`).then(res => res.data);

export const createRule = (payload) =>
    api.post("/rules", payload).then(res => res.data);

export const updateRule = (id, payload) =>
    api.put(`/rules/${id}`, payload).then(res => res.data);

export const deleteRule = (id) =>
    api.delete(`/rules/${id}`).then(res => res.data);

// ─── Room APIs (Receptionist) ────────────────────────────
export const getAllRooms = () => api.get("/rooms");
export const getRoomById = (id) => api.get(`/rooms/${id}`);
export const searchRooms = (params) => api.get("/rooms/search", { params });
export const getAllBooking = () => api.get("/bookings/all");
export const getAllCategories = () => api.get("/categories");
export const getCategoryById = (id) => api.get(`/categories/${id}`);

// ─── Booking APIs (Receptionist) ─────────────────────────
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const createBooking = (payload) => api.post("/bookings", payload);

export const checkInBooking = (id) => api.put(`/bookings/${id}/checkin`);
export const checkOutBooking = (id) => api.put(`/bookings/${id}/checkout`);
export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`);

/**
 * @deprecated Use checkInBooking, checkOutBooking, or cancelBooking instead.
 */
export const updateBookingStatus = (id, status) => {
    if (status === "Checked-in") return checkInBooking(id);
    if (status === "Checked-out") return checkOutBooking(id);
    if (status === "Cancelled") return cancelBooking(id);
    return api.put(`/bookings/${id}/status`, null, { params: { status } });
};

export const updateCheckoutDate = (id, payload) =>
    api.patch(`/bookings/${id}/checkout`, payload);
export const getBookingsByStatus = (status) =>
    api.get("/bookings", { params: { status } });

// ─── Customer APIs (Receptionist) ────────────────────────
export const getCustomers = (params) =>
    api.get("/receptionist/customers", { params }).then(res => res.data);
export const getCustomerBookings = (params) =>
    api.get("/receptionist/customers/bookings", { params }).then(res => res.data);

// ─── Request APIs (Maintenance/Cleaning) ────────────────
export const getMaintenanceRequests = () => api.get("/requests/maintenance").then(res => res.data);
export const createMaintenanceRequest = (payload) =>
    api.post("/requests/maintenance", payload).then(res => res.data);
export const getCleaningRequests = () => api.get("/requests/cleaning").then(res => res.data);
export const searchRequests = (params) => api.get("/requests/search", { params });
export const updateRequestStatus = (id, status) =>
    api.put(`/requests/${id}/status`, { status }).then(res => res.data);

export default api;
