import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../services/api";
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

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
      toast.success("OTP sent! Check your email");
    } catch (err) {
      console.error("Forgot password error:", err.response?.data);
      let errorMessage = err.response?.data?.detail || "Email not found";
      
      if (err.response?.status === 404) {
        errorMessage = "No account found with this email address";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      await resetPassword({ email, otp, new_password: newPassword });
      toast.success("Password reset successfully! Please login with your new password");
      navigate("/login");
    } catch (err) {
      console.error("Reset password error:", err.response?.data);
      let errorMessage = err.response?.data?.detail || "Invalid or expired OTP";
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.detail || "Invalid OTP code";
      } else if (err.response?.status === 404) {
        errorMessage = "User not found. Please request a new OTP";
      }
      
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

        {step === 1 && (
          <>
            <h2 style={styles.title}>Forgot Password?</h2>
            <p style={styles.subtitle}>Enter your email and we'll send you a 6-digit OTP</p>
            <form onSubmit={handleSendOTP}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? (
                  <span style={styles.buttonContent}>
                    <span style={styles.spinner}></span>
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
            <div style={styles.divider}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerText}>Remember your password?</span>
              <div style={styles.dividerLine}></div>
            </div>
            <Link to="/login" style={styles.signinButton}>
              Back to Sign In
            </Link>
          </>
        )}

        {step === 2 && (
          <>
            <div style={styles.emailBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              OTP sent to {email}
            </div>
            <h2 style={styles.title}>Enter OTP</h2>
            <p style={styles.subtitle}>Check your email for the 6-digit code and set a new password</p>
            <form onSubmit={handleResetPassword}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>OTP Code</label>
                <input
                  style={styles.otpInput}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password</label>
                <div style={styles.passwordWrapper}>
                  <input
                    style={styles.input}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? (
                  <span style={styles.buttonContent}>
                    <span style={styles.spinner}></span>
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
            <button onClick={() => setStep(1)} style={styles.backLink}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Use different email
            </button>
          </>
        )}
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
  emailBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    background: "#eff6ff",
    borderRadius: "10px",
    marginBottom: "24px",
    fontSize: "13px",
    color: "#3b82f6",
    fontWeight: "500",
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
    background: "#f0f9ff", // Light blue background
    border: "1px solid #bae6fd",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  otpInput: {
    width: "100%",
    padding: "12px 14px",
    background: "#f0f9ff", // Light blue background
    border: "1px solid #bae6fd",
    borderRadius: "10px",
    fontSize: "24px",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: "8px",
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
    marginTop: "8px",
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
    margin: "24px 0 20px",
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
  signinButton: {
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
  backLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    width: "100%",
    marginTop: "20px",
    padding: "10px",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "color 0.2s",
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
  .signin-button:hover {
    border-color: #3b82f6 !important;
    background: #eff6ff !important;
  }
  .eye-btn:hover {
    opacity: 1 !important;
  }
  .back-link:hover {
    color: #3b82f6 !important;
  }
`;
document.head.appendChild(styleSheet);