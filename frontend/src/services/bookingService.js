import { api } from "./api.js";

export const bookingService = {
  createBooking: async (payload) => {
    const response = await api.post("/bookings", payload);
    return response.data;
  },
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  getMyBookings: async () => {
    const response = await api.get("/bookings/my");
    return response.data;
  },
  getAdminBookings: async (params = {}) => {
    const response = await api.get("/admin/bookings", { params });
    return response.data;
  },
};
