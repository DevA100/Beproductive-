import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Logo Component embedded directly
const FullLogo = ({ size = "default", variant = "light" }) => {
  const dimensions = {
    small: { width: 120, height: 32 },
    default: { width: 160, height: 40 },
    large: { width: 200, height: 48 },
  };

  const dim = dimensions[size] || dimensions.default;
  const textColor = variant === "dark" ? "#1e293b" : "#f8fafc";
  const iconColor = "#3b82f6";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width={dim.height} height={dim.height} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill={iconColor} />
        <path d="M13 20L18 25L27 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="13" cy="20" r="2" fill="white"/>
        <circle cx="18" cy="25" r="2" fill="white"/>
        <circle cx="27" cy="16" r="2" fill="white"/>
        <path d="M9 31L31 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.2"/>
      </svg>
      <span style={{ 
        fontSize: dim.height * 0.6, 
        fontWeight: 700, 
        color: textColor,
        letterSpacing: "-0.5px"
      }}>
        BeProductive
      </span>
    </div>
  );
};

export default function Login() {
  const [form, setForm] = useState({ email_or_username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!form.email_or_username.trim()) {
      toast.error("Please enter your email or username");
      return;
    }
    if (!form.password) {
      toast.error("Please enter your password");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Attempting login with:", { 
        email_or_username: form.email_or_username, 
        password: "***" 
      });
      
      const res = await login(form);
      console.log("Login response:", res);
      
      // Handle both response formats
      const token = res.data?.access_token || res.access_token;
      if (!token) {
        throw new Error("No access token received");
      }
      
      loginUser(token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      console.log("=== ERROR DEBUG ===");
      console.log("Error object:", err);
      console.log("Error response:", err.response);
      console.log("Error status:", err.response?.status);
      console.log("Error data:", err.response?.data);
      console.log("Error message:", err.message);
      console.log("===================");
      
      // Detailed error handling
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          errorMessage = "Invalid email/username or password. Please try again.";
        } else if (err.response.status === 404) {
          errorMessage = "Account not found. Please check your credentials.";
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.detail || "Invalid request format.";
        } else if (err.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        // Something else happened
        errorMessage = err.message || "An unexpected error occurred.";
      }
      
      // Show error toast
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <FullLogo size="default" variant="dark" />
        </div>
        
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in to continue</p>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email or Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter your email or username"
              value={form.email_or_username}
              onChange={(e) => setForm({ ...form, email_or_username: e.target.value })}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                style={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
              cursor: loading ? "not-allowed" : "pointer"
            }} 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span style={styles.buttonContent}>
                <span style={styles.spinner}></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>New to BeProductive?</span>
          <div style={styles.dividerLine}></div>
        </div>
        
        <Link to="/signup" style={styles.signupButton}>
          Create Account
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
    textAlign: "center",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 32px 0",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "8px",
    letterSpacing: "0.3px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transition: "opacity 0.2s",
  },
  forgotRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "24px",
  },
  forgotLink: {
    fontSize: "13px",
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.2s",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
    marginBottom: "24px",
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e2e8f0",
  },
  dividerText: {
    fontSize: "12px",
    color: "#64748b",
    whiteSpace: "nowrap",
  },
  signupButton: {
    display: "block",
    width: "100%",
    padding: "12px",
    background: "transparent",
    color: "#3b82f6",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "center",
    textDecoration: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
};

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  input:focus {
    border-color: #3b82f6 !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  button:hover:not(:disabled) {
    background: #2563eb !important;
  }
  .signup-button:hover {
    border-color: #3b82f6 !important;
    background: #eff6ff !important;
  }
  .forgot-link:hover {
    color: #2563eb !important;
  }
  .eye-btn:hover {
    opacity: 1 !important;
  }
`;
document.head.appendChild(styleSheet);