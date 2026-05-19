import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpassword
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
      toast.success("OTP sent! Check your email ");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Email not found");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await resetPassword({ email, otp, new_password: newPassword });
      toast.success("Password reset successfully! 🎉");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ BeProductive</div>

        {step === 1 && (
          <>
            <h2 style={styles.title}>Forgot Password?</h2>
            <p style={styles.subtitle}>Enter your email and we'll send you a 6-digit OTP</p>
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
                {loading ? "Sending OTP..." : "Send OTP "}
              </button>
            </form>
            <p style={styles.link}>
              Remember your password?{" "}
              <Link to="/login" style={styles.linkText}>Sign In</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div style={styles.emailBadge}> OTP sent to {email}</div>
            <h2 style={styles.title}>Enter OTP</h2>
            <p style={styles.subtitle}>Check your email for the 6-digit code and set a new password</p>
            <form onSubmit={handleResetPassword}>
              <input
                style={{ ...styles.input, textAlign: "center", fontSize: 24, fontWeight: 700, letterSpacing: 8 }}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
                
{showPassword ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
)}
              </div>
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password "}
              </button>
            </form>
            <button onClick={() => setStep(1)} style={styles.backLink}>
              ← Use different email
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
  background: "linear-gradient(135deg, #0a0a0a 0%, #0d1117 50%, #0a0f1e 100%)", 
  display: "flex", alignItems: "center", justifyContent: "center",
  position: "relative",
  overflow: "hidden"
},
card: { 
  background: "rgba(13,17,23,0.95)", 
  border: "1px solid rgba(99,179,237,0.2)",
  borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, 
  boxShadow: "0 0 40px rgba(99,179,237,0.1), 0 20px 60px rgba(0,0,0,0.5)",
  backdropFilter: "blur(20px)"
},
logo: { fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 },
title: { fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" },
subtitle: { color: "#64748b", marginBottom: 24, fontSize: 14 },
input: { width: "100%", padding: "14px 16px", marginBottom: 16, border: "1px solid rgba(99,179,237,0.2)", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", transition: "border 0.2s" },
button: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #00d2ff 0%, #7b2ff7 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" },
link: { textAlign: "center", marginTop: 20, color: "#64748b", fontSize: 14 },
linkText: { color: "#00d2ff", fontWeight: 600, textDecoration: "none" },
passwordWrapper: { position: "relative", marginBottom: 8 },
passwordInput: { width: "100%", padding: "14px 48px 14px 16px", border: "1px solid rgba(99,179,237,0.2)", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
eyeBtn: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
forgotRow: { display: "flex", justifyContent: "flex-end", marginBottom: 16 },
forgotLink: { color: "#00d2ff", fontSize: 13, fontWeight: 600, textDecoration: "none" },
divider: { display: "flex", alignItems: "center", margin: "20px 0", gap: 10 },
dividerText: { color: "#64748b", fontSize: 13, whiteSpace: "nowrap", padding: "0 10px" },
socialRow: { display: "flex", gap: 12, marginBottom: 8 },
socialBtn: { flex: 1, padding: "12px", border: "1px solid rgba(99,179,237,0.2)", borderRadius: 12, background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
spinner: { width: 18, height: 18, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
};