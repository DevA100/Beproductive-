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
      toast.success("OTP sent! Check your email 📧");
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
                {loading ? "Sending OTP..." : "Send OTP 📧"}
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
            <div style={styles.emailBadge}>📧 OTP sent to {email}</div>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password 🔐"}
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
  container: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { background: "white", borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  logo: { fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #4facfe, #00f2fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" },
  subtitle: { color: "#666", marginBottom: 24, fontSize: 14 },
  emailBadge: { background: "#4facfe20", color: "#4facfe", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: "center" },
  input: { width: "100%", padding: "14px 16px", marginBottom: 16, border: "2px solid #eee", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box" },
  passwordWrapper: { position: "relative", marginBottom: 16 },
  passwordInput: { width: "100%", padding: "14px 48px 14px 16px", border: "2px solid #eee", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box" },
  eyeBtn: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
  button: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 },
  link: { textAlign: "center", marginTop: 20, color: "#666", fontSize: 14 },
  linkText: { color: "#4facfe", fontWeight: 600, textDecoration: "none" },
  backLink: { background: "none", border: "none", color: "#4facfe", cursor: "pointer", fontSize: 14, fontWeight: 600, width: "100%", textAlign: "center", marginTop: 8 }
};