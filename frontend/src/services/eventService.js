import { api } from "./api.js";

export const eventService = {
  createEvent: async (payload) => {
    const response = await api.post("/events", payload);
    return response.data;
  },
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
  getEventById: async (id, config = {}) => {
    const response = await api.get(`/events/${id}`, config);
    return response.data;
  },
  getEvents: async (params = {}) => {
    const response = await api.get("/events", { params });
    return response.data;
  },
  getAdminEvents: async (params = {}) => {
    const response = await api.get("/events/admin/all", { params });
    return response.data;
  },
  updateEvent: async (id, payload) => {
    const response = await api.put(`/events/${id}`, payload);
    return response.data;
  },
};
