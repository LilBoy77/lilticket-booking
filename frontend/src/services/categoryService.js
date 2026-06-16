import { api } from "./api.js";

export const categoryService = {
  createCategory: async (payload) => {
    const response = await api.post("/categories", payload);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get("/categories");
    return response.data;
  },
  updateCategory: async (id, payload) => {
    const response = await api.put(`/categories/${id}`, payload);
    return response.data;
  },
};
