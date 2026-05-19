// Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email_or_username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.access_token);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.className = newTheme === "dark" ? "dark" : "";
  };

  const getStyles = () => {
    const isDark = theme === "dark";
    
    return {
      container: {
        minHeight: "100vh",
        background: isDark ? "#000000" : "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      themeToggle: {
        position: "absolute",
        top: 20,
        right: 20,
        background: isDark ? "#1a1a1a" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: "8px 16px",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: isDark ? "#ffffff" : "#000000",
        zIndex: 10,
      },
      card: {
        background: isDark ? "#1a1a1a" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 16,
        padding: "40px",
        width: "100%",
        maxWidth: 420,
        boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)",
      },
      logo: {
        fontSize: 24,
        fontWeight: 700,
        color: "#0066cc",
        marginBottom: 8,
      },
      title: {
        fontSize: 24,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000",
        margin: "0 0 8px 0",
      },
      subtitle: {
        color: isDark ? "#888888" : "#666666",
        marginBottom: 24,
        fontSize: 14,
      },
      input: {
        width: "100%",
        padding: "12px 14px",
        marginBottom: 16,
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        transition: "border 0.2s ease",
      },
      passwordWrapper: {
        position: "relative",
        marginBottom: 8,
      },
      passwordInput: {
        width: "100%",
        padding: "12px 48px 12px 14px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      },
      eyeBtn: {
        position: "absolute",
        right: 14,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 14,
        padding: 0,
        color: isDark ? "#888888" : "#666666",
      },
      forgotRow: {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 20,
      },
      forgotLink: {
        color: "#0066cc",
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "none",
      },
      button: {
        width: "100%",
        padding: "12px",
        background: "#0066cc",
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "opacity 0.2s ease",
      },
      link: {
        textAlign: "center",
        marginTop: 20,
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
      },
      linkText: {
        color: "#0066cc",
        fontWeight: 600,
        textDecoration: "none",
      },
      divider: {
        display: "flex",
        alignItems: "center",
        margin: "20px 0",
        gap: 10,
      },
      dividerLine: {
        flex: 1,
        height: 1,
        background: isDark ? "#333333" : "#e0e0e0",
      },
      dividerText: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 12,
        whiteSpace: "nowrap",
        padding: "0 10px",
      },
      socialRow: {
        display: "flex",
        gap: 12,
        marginBottom: 8,
      },
      socialBtn: {
        flex: 1,
        padding: "10px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        background: isDark ? "#000000" : "#ffffff",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        color: isDark ? "#ffffff" : "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "opacity 0.2s ease",
      },
      spinner: {
        width: 16,
        height: 16,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTop: "2px solid #ffffff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        display: "inline-block",
        marginRight: 8,
      },
      buttonContent: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      },
    };
  };

  const styles = getStyles();

  return (
    <div style={styles.container}>
      <button onClick={toggleTheme} style={styles.themeToggle}>
        {theme === "light" ? "Dark Mode" : "Light Mode"}
      </button>

      <div style={styles.card}>
        <div style={styles.logo}>BeProductive</div>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Sign in to continue your productive journey</p>
        
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="Email or Username"
            value={form.email_or_username}
            onChange={(e) => setForm({ ...form, email_or_username: e.target.value })}
            required
          />
          
          <div style={styles.passwordWrapper}>
            <input
              style={styles.passwordInput}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          
          <div style={styles.forgotRow}>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>
          
          <button
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div style={styles.buttonContent}>
                <div style={styles.spinner}></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>or continue with</span>
          <div style={styles.dividerLine}></div>
        </div>
        
        <div style={styles.socialRow}>
          <button
            style={styles.socialBtn}
            onClick={() => toast.error("Google sign-in coming soon")}
            type="button"
          >
            <img
              src="https://www.google.com/favicon.ico"
              width={16}
              height={16}
              alt="Google"
            />
            Google
          </button>
          <button
            style={styles.socialBtn}
            onClick={() => toast.error("Apple sign-in coming soon")}
            type="button"
          >
            Apple
          </button>
        </div>
        
        <p style={styles.link}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.linkText}>
            Sign Up
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}