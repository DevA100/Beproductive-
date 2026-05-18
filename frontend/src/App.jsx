import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import WeeklyPlanner from "./pages/WeeklyPlanner";
import Journal from "./pages/Journal";
import AICoach from "./pages/AICoach";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const isMobile = window.innerWidth <= 768;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 20, color: "#667eea" }}>
      ⚡ Loading BeProductive...
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ display: "flex", background: "#f0f2ff", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{
        marginLeft: isMobile ? 0 : 260,
        flex: 1,
        paddingTop: isMobile ? 60 : 0,
        width: isMobile ? "100%" : "calc(100% - 260px)",
        overflowX: "hidden"
      }}>
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/planner" element={<ProtectedLayout><WeeklyPlanner /></ProtectedLayout>} />
      <Route path="/journal" element={<ProtectedLayout><Journal /></ProtectedLayout>} />
      <Route path="/ai-coach" element={<ProtectedLayout><AICoach /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}