// Settings.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { resetPassword, forgotPassword } from "../services/api";
import toast from "react-hot-toast";
import { updatePhone } from "../services/api";

export default function Settings() {
  const { user } = useAuth();
  const [step, setStep] = useState("idle");
  const [otpForm, setOtpForm] = useState({ otp: "", new_password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(() => localStorage.getItem("avatar_" + user?.id) || null);
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [editingPhone, setEditingPhone] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      await forgotPassword(user.email);
      setStep("otp_sent");
      toast.success("OTP sent to your email");
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otpForm.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email: user.email, otp: otpForm.otp, new_password: otpForm.new_password });
      toast.success("Password changed successfully");
      setStep("idle");
      setOtpForm({ otp: "", new_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setAvatar(base64);
      localStorage.setItem("avatar_" + user?.id, base64);
      toast.success("Profile picture updated");
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhone = async () => {
    try {
      await updatePhone(phone);
      toast.success("Phone number saved");
      setEditingPhone(false);
    } catch (error) {
      toast.error("Failed to save phone");
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
        background: isDark ? "#000000" : "#ffffff",
        padding: "20px 24px",
        marginLeft: "260px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        transition: "all 0.3s ease",
      },
      topBar: {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 24,
      },
      themeToggle: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: "8px 16px",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: isDark ? "#ffffff" : "#000000",
      },
      title: {
        fontSize: 24,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000",
        margin: "0 0 24px 0",
      },
      card: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 12,
        padding: "24px",
        marginBottom: 20,
      },
      cardTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: isDark ? "#ffffff" : "#000000",
        marginTop: 0,
        marginBottom: 16,
      },
      hint: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
        marginBottom: 16,
      },
      profileRow: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      },
      avatarWrapper: {
        position: "relative",
        flexShrink: 0,
      },
      avatar: {
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "#0066cc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontWeight: 700,
        fontSize: 28,
      },
      avatarImg: {
        width: 72,
        height: 72,
        borderRadius: "50%",
        objectFit: "cover",
        border: `2px solid #0066cc`,
      },
      uploadBtn: {
        position: "absolute",
        bottom: 0,
        right: 0,
        background: isDark ? "#000000" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: "50%",
        width: 26,
        height: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 12,
        color: "#0066cc",
      },
      profileInfo: {
        flex: 1,
      },
      name: {
        fontSize: 20,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000",
        marginBottom: 4,
      },
      email: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
        marginBottom: 4,
      },
      phone: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
        marginBottom: 8,
      },
      activeBadge: {
        background: "rgba(0,102,204,0.1)",
        color: "#0066cc",
        padding: "4px 12px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        display: "inline-block",
        border: "1px solid rgba(0,102,204,0.2)",
      },
      otpBtn: {
        background: "#0066cc",
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        padding: "12px 24px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 14,
      },
      otpSentBadge: {
        background: "rgba(0,102,204,0.1)",
        color: "#0066cc",
        padding: "10px",
        borderRadius: 8,
        textAlign: "center",
        fontWeight: 500,
        marginBottom: 16,
        fontSize: 14,
        border: "1px solid rgba(0,102,204,0.2)",
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
        fontSize: 16,
        padding: 0,
        color: isDark ? "#888888" : "#666666",
      },
      btnRow: {
        display: "flex",
        gap: 10,
      },
      primaryBtn: {
        background: "#0066cc",
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        padding: "12px 20px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 14,
      },
      secondaryBtn: {
        background: "none",
        color: isDark ? "#888888" : "#666666",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: "12px 20px",
        fontWeight: 500,
        cursor: "pointer",
        fontSize: 14,
      },
      editBtn: {
        background: "none",
        color: "#0066cc",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 6,
        padding: "4px 10px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 500,
      },
      infoList: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
      },
      infoRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
      },
      infoKey: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
      },
      infoVal: {
        fontWeight: 500,
        color: isDark ? "#ffffff" : "#000000",
        fontSize: 14,
      },
      phoneEditContainer: {
        display: "flex",
        gap: 8,
        alignItems: "center",
      },
      phoneInput: {
        padding: "8px 12px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 6,
        fontSize: 14,
        outline: "none",
        width: 180,
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      },
    };
  };

  const styles = getStyles();

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={toggleTheme} style={styles.themeToggle}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>

      <h1 style={styles.title}>Settings</h1>

      {/* Profile Card */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Your Profile</h3>
        <div style={styles.profileRow}>
          <div style={styles.avatarWrapper}>
            {avatar ? (
              <img src={avatar} alt="avatar" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
            )}
            <label style={styles.uploadBtn} htmlFor="avatar-upload">
              📷
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>
          <div style={styles.profileInfo}>
            <div style={styles.name}>{user?.username}</div>
            <div style={styles.email}>{user?.email}</div>
            {user?.phone_number && <div style={styles.phone}>{user?.phone_number}</div>}
            <div style={styles.activeBadge}>Active Account</div>
          </div>
        </div>
      </div>

      {/* Reset Password Card */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Reset Password</h3>
        <p style={styles.hint}>
          We'll send a 6-digit OTP to your email <strong>{user?.email}</strong>
        </p>

        {step === "idle" && (
          <button onClick={handleSendOTP} disabled={loading} style={styles.otpBtn}>
            {loading ? "Sending..." : "Send OTP to Email"}
          </button>
        )}

        {step === "otp_sent" && (
          <form onSubmit={handleResetPassword}>
            <div style={styles.otpSentBadge}>OTP sent. Check your inbox</div>
            <input
              style={styles.otpInput}
              placeholder="000000"
              value={otpForm.otp}
              onChange={(e) =>
                setOtpForm({ ...otpForm, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })
              }
              maxLength={6}
              required
            />
            <div style={styles.passwordWrapper}>
              <input
                style={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={otpForm.new_password}
                onChange={(e) => setOtpForm({ ...otpForm, new_password: e.target.value })}
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
            <div style={styles.btnRow}>
              <button type="submit" disabled={loading} style={styles.primaryBtn}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <button type="button" onClick={() => setStep("idle")} style={styles.secondaryBtn}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Account Information</h3>
        <div style={styles.infoList}>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Username</span>
            <span style={styles.infoVal}>{user?.username}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Email</span>
            <span style={styles.infoVal}>{user?.email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Version</span>
            <span style={styles.infoVal}>1.0.0</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Phone Number</span>
            {editingPhone ? (
              <div style={styles.phoneEditContainer}>
                <input
                  style={styles.phoneInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                />
                <button onClick={handleSavePhone} style={styles.primaryBtn}>
                  Save
                </button>
                <button onClick={() => setEditingPhone(false)} style={styles.secondaryBtn}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={styles.phoneEditContainer}>
                <span style={styles.infoVal}>{user?.phone_number || "Not set"}</span>
                <button onClick={() => setEditingPhone(true)} style={styles.editBtn}>
                  {user?.phone_number ? "Edit" : "Add"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}