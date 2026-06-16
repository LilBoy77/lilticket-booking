import { api } from "./api.js";

export const ticketService = {
  checkInTicket: async (ticketCode) => {
    const response = await api.post("/admin/check-in", {
      ticketCode,
    });
    return response.data;
  },
  getTicketByCode: async (ticketCode) => {
    const response = await api.get(`/tickets/code/${encodeURIComponent(ticketCode)}`);
    return response.data;
  },
  getMyTickets: async () => {
    const response = await api.get("/tickets/my");
    return response.data;
  },
  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },
  getTicketsByBookingId: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/tickets`);
    return response.data;
  },
};
