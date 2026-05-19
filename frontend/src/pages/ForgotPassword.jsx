// ForgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
      toast.success("OTP sent. Check your email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Email not found");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, otp, new_password: newPassword });
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired OTP");
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
      emailBadge: {
        background: "rgba(0,102,204,0.1)",
        border: `1px solid rgba(0,102,204,0.2)`,
        borderRadius: 8,
        padding: "10px",
        textAlign: "center",
        marginBottom: 20,
        fontSize: 13,
        color: "#0066cc",
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
      otpInput: {
        width: "100%",
        padding: "12px 14px",
        marginBottom: 16,
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 8,
        textAlign: "center",
        outline: "none",
        boxSizing: "border-box",
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      },
      passwordWrapper: {
        position: "relative",
        marginBottom: 16,
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
        marginBottom: 16,
      },
      backLink: {
        background: "none",
        border: "none",
        color: "#0066cc",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "none",
        display: "block",
        textAlign: "center",
        width: "100%",
        marginTop: 8,
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

        {step === 1 && (
          <>
            <h2 style={styles.title}>Forgot Password?</h2>
            <p style={styles.subtitle}>
              Enter your email and we'll send you a 6-digit OTP
            </p>
            <form onSubmit={handleSendOTP}>
              <input
                style={styles.input}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? (
                  <div style={styles.buttonContent}>
                    <div style={styles.spinner}></div>
                    Sending OTP...
                  </div>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
            <p style={styles.link}>
              Remember your password?{" "}
              <Link to="/login" style={styles.linkText}>
                Sign In
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div style={styles.emailBadge}>OTP sent to {email}</div>
            <h2 style={styles.title}>Enter OTP</h2>
            <p style={styles.subtitle}>
              Check your email for the 6-digit code and set a new password
            </p>
            <form onSubmit={handleResetPassword}>
              <input
                style={styles.otpInput}
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                required
              />
              <div style={styles.passwordWrapper}>
                <input
                  style={styles.passwordInput}
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? (
                  <div style={styles.buttonContent}>
                    <div style={styles.spinner}></div>
                    Resetting...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
            <button onClick={() => setStep(1)} style={styles.backLink}>
              Use different email
            </button>
          </>
        )}
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