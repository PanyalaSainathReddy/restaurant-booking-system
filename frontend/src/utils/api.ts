import axios from "axios";
import { authStorage } from "./authStorage";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Keep track of refresh promises
let userRefreshPromise: Promise<any> | null = null;
let ownerRefreshPromise: Promise<any> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const isOwnerRoute = originalRequest.url?.includes("/owner");

      try {
        await api.post(
          isOwnerRoute ? "/auth/owner/refresh" : "/auth/user/refresh"
        );
        return api(originalRequest);
      } catch (refreshError) {
        // Clear auth on refresh failure
        if (isOwnerRoute) {
          authStorage.clearAuth("owner");
        } else {
          authStorage.clearAuth("user");
        }
        throw error;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
