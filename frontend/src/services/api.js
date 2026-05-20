import axios from "axios";

const API = axios.create({ baseURL: "https://beproductive-8s2l.onrender.com" });

// Request interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip redirect for login endpoint
    const isLoginEndpoint = error.config?.url?.includes("/auth/login");

    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth
export const signup = (data) => API.post("/auth/signup", data);
export const login = async (data) => {
  try {
    const response = await API.post("/auth/login", data);
    return response;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};
export const getMe = () => API.get("/users/me");
export const forgotPassword = (email) =>
  API.post("/auth/forgot-password", { email });
export const resetPassword = (data) => API.post("/auth/reset-password", data);

// Weekly Plans
export const createPlan = (data) => API.post("/plans", data);
export const getMyPlans = () => API.get("/plans");
export const getActivePlan = () => API.get("/plans/active");
export const archivePlan = (id) => API.patch(`/plans/${id}/archive`);
export const updatePlan = (id, data) => API.patch(`/plans/${id}`, data);
export const deletePlan = (id) => API.delete(`/plans/${id}`);

// Tasks
export const createTask = (planId, data) => API.post(`/tasks/${planId}`, data);
export const getTasks = (planId) => API.get(`/tasks/${planId}`);
export const updateTask = (taskId, data) => API.patch(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => API.delete(`/tasks/${taskId}`);

// Journal
export const createJournal = (data) => API.post("/journal", data);
export const getJournals = () => API.get("/journal");
export const getJournalByDate = (date) => API.get(`/journal/${date}`);
export const updateJournal = (date, data) =>
  API.patch(`/journal/${date}`, data);
export const deleteJournal = (date) => API.delete(`/journal/${date}`);

// AI Coach
export const generateWeeklyPlan = (data) =>
  API.post("/ai-coach/generate-weekly-plan", data);
export const createPlanFromAI = (data) =>
  API.post("/ai-coach/create-plan-from-ai", data);
export const dailyCheckin = (data) => API.post("/ai-coach/daily-checkin", data);
export const suggestActions = (data) =>
  API.post("/ai-coach/suggest-next-actions", data);
export const weeklySummary = () => API.get("/ai-coach/weekly-summary");

// Notifications
export const sendDailyReminder = () =>
  API.post("/notifications/send-daily-reminder");
export const sendWeeklySummary = () =>
  API.post("/notifications/send-weekly-summary");

// Export
export const exportExcel = () =>
  API.get("/export/excel", { responseType: "blob" });

// Users
export const updatePhone = (phone_number) =>
  API.patch("/users/me/phone", { phone_number });
export const updateProfile = (data) => API.patch("/users/me", data);

export default API;
