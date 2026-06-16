import { api } from "./api.js";

export const healthService = {
  check: async () => {
    const response = await api.get("/health");
    return response.data;
  },
};
