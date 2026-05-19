import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = email, 2 = otp/reset

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      return toast.error("Enter your email");
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
      toast.success("OTP sent to email");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      return toast.error("Enter valid 6-digit OTP");
    }

    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      await resetPassword({
        email,
        otp,
        new_password: newPassword,
      });

      toast.success("Password reset successful");

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
        <h2 style={styles.title}>Forgot Password</h2>

        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <input
              style={styles.input}
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button disabled={loading} style={styles.button}>
              {loading ? "Sending..." : "Send OTP"}
            </button>

            <p style={styles.link}>
              Back to{" "}
              <Link to="/login" style={styles.linkText}>
                Login
              </Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <input
              style={{ ...styles.input, textAlign: "center", letterSpacing: 6 }}
              placeholder="OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
            />

            <div style={styles.passwordWrapper}>
              <input
                style={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button disabled={loading} style={styles.button}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={styles.secondary}
            >
              Change Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0d1117",
  },
  card: {
    width: 400,
    padding: 24,
    border: "1px solid #333",
    borderRadius: 12,
  },
  title: {
    marginBottom: 20,
    fontSize: 20,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#111",
    color: "#fff",
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#00d2ff",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    marginBottom: 10,
  },
  secondary: {
    width: "100%",
    padding: 10,
    background: "transparent",
    border: "1px solid #333",
    color: "#aaa",
    cursor: "pointer",
  },
  link: {
    marginTop: 12,
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
  },
  linkText: {
    color: "#00d2ff",
    textDecoration: "none",
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    background: "transparent",
    border: "none",
    color: "#00d2ff",
    cursor: "pointer",
  },
};