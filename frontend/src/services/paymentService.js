import { api } from "./api.js";

export const paymentService = {
  createXenditPayment: async (booking_id) => {
    const response = await api.post("/payments/xendit/create", {
      booking_id,
    });
    return response.data;
  },
};
