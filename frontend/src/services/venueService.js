import { api } from "./api.js";

export const venueService = {
  createVenue: async (payload) => {
    const response = await api.post("/venues", payload);
    return response.data;
  },
  deleteVenue: async (id) => {
    const response = await api.delete(`/venues/${id}`);
    return response.data;
  },
  getVenues: async () => {
    const response = await api.get("/venues");
    return response.data;
  },
  updateVenue: async (id, payload) => {
    const response = await api.put(`/venues/${id}`, payload);
    return response.data;
  },
};
