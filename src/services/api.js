import axios from "axios";

export const TOKEN_STORAGE_KEY = "dream_squad_fc_token";
export const UNAUTHORIZED_EVENT = "dreamsquadfc:unauthorized";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getErrorMessage(error, fallbackMessage = "Something went wrong.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;
