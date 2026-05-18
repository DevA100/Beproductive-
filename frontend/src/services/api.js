import axios from "axios";

const API = axios.create({
  baseURL: "https://beproductive-8s2l.onrender.com",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const signup = (data) => API.post("/auth/signup", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/users/me");
export const forgotPassword = (email) =>
  API.post("/auth/forgot-password", { email });
export const resetPassword = (data) => API.post("/auth/reset-password", data);

// Weekly Plans
export const createPlan = (data) => API.post("/plans/", data);
export const getMyPlans = () => API.get("/plans/");
export const getActivePlan = () => API.get("/plans/active");
export const archivePlan = (id) => API.patch(`/plans/${id}/archive`);

// Tasks
export const createTask = (planId, data) => API.post(`/tasks/${planId}`, data);
export const getTasks = (planId) => API.get(`/tasks/${planId}`);
export const updateTask = (taskId, data) => API.patch(`/tasks/${taskId}`, data);

// Journal
export const createJournal = (data) => API.post("/journal/", data);
export const getJournals = () => API.get("/journal/");
export const getJournalByDate = (date) => API.get(`/journal/${date}`);
export const updateJournal = (date, data) =>
  API.patch(`/journal/${date}`, data);

// AI Coach
export const generateWeeklyPlan = (data) =>
  API.post("/ai-coach/generate-weekly-plan", data);
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
