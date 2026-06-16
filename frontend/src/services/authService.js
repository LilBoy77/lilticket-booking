import { api } from "./api.js";

export const authService = {
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  login: async (payload) => {
    const response = await api.post("/auth/login", payload);
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
  register: async (payload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },
};
