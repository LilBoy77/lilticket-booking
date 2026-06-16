import { api } from "./api.js";

export const ticketTypeService = {
  createTicketType: async (payload) => {
    const response = await api.post("/ticket-types", payload);
    return response.data;
  },
  deleteTicketType: async (id) => {
    const response = await api.delete(`/ticket-types/${id}`);
    return response.data;
  },
  getTicketTypes: async () => {
    const response = await api.get("/ticket-types");
    return response.data;
  },
  getTicketTypesByEvent: async (eventId) => {
    const response = await api.get(`/ticket-types/event/${eventId}`);
    return response.data;
  },
  updateTicketType: async (id, payload) => {
    const response = await api.put(`/ticket-types/${id}`, payload);
    return response.data;
  },
};
