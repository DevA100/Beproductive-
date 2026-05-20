import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { resetPassword, forgotPassword } from "../services/api";
import toast from "react-hot-toast";
import { updatePhone } from "../services/api";

export default function Settings() {
  const { user } = useAuth();
  const [step, setStep] = useState("idle"); // idle, otp_sent, resetting
  const [otpForm, setOtpForm] = useState({ otp: "", new_password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(() => localStorage.getItem("avatar_" + user?.id) || null);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      await forgotPassword(user.email);
      setStep("otp_sent");
      toast.success("OTP sent to your email");
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otpForm.new_password.length < 6) return toast.error("Password must be at least 6 characters");
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
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB");
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setAvatar(base64);
      localStorage.setItem("avatar_" + user?.id, base64);
      toast.success("Profile picture updated");
    };
    reader.readAsDataURL(file);
  };

  const [phone, setPhone] = useState(user?.phone_number || "");
  const [editingPhone, setEditingPhone] = useState(false);

  const handleSavePhone = async () => {
    try {
      await updatePhone(phone);
      toast.success("Phone number saved");
      setEditingPhone(false);
    } catch {
      toast.error("Failed to save phone");
    }
  };
  
  return (
    <div style={styles.container}>
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
            <label style={styles.uploadBtn} htmlFor="avatar-upload">📷</label>
            <input id="avatar-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>
          <div style={styles.profileInfo}>
            <div style={styles.name}>{user?.username}</div>
            <div style={styles.email}>{user?.email}</div>
            {user?.phone_number && <div style={styles.phone}>Phone: {user?.phone_number}</div>}
            <div style={styles.activeBadge}>Active Account</div>
          </div>
        </div>
      </div>

      {/* Reset Password Card */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Reset Password</h3>
        <p style={styles.hint}>We'll send a 6-digit OTP to your email <strong>{user?.email}</strong></p>

        {step === "idle" && (
          <button onClick={handleSendOTP} disabled={loading} style={styles.otpBtn}>
            {loading ? "Sending..." : "Send OTP to Email"}
          </button>
        )}

        {step === "otp_sent" && (
          <form onSubmit={handleResetPassword}>
            <div style={styles.otpSentBadge}>OTP sent! Check your inbox</div>
            <input
              style={{ ...styles.input, ...styles.otpInput }}
              placeholder="000000"
              value={otpForm.otp}
              onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              maxLength={6}
              required
            />
            <div style={styles.passwordWrapper}>
              <input
                style={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                placeholder="New Password (min. 6 characters)"
                value={otpForm.new_password}
                onChange={(e) => setOtpForm({ ...otpForm, new_password: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
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
            <span style={styles.infoKey}>WhatsApp Phone</span>
            {editingPhone ? (
              <div style={styles.editPhoneContainer}>
                <input
                  style={styles.editPhoneInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2348012345678"
                />
                <button onClick={handleSavePhone} style={styles.saveBtn}>Save</button>
                <button onClick={() => setEditingPhone(false)} style={styles.cancelBtn}>Cancel</button>
              </div>
            ) : (
              <div style={styles.phoneDisplay}>
                <span style={styles.infoVal}>{user?.phone_number || "Not set"}</span>
                <button onClick={() => setEditingPhone(true)} style={styles.editBtn}>
                  {user?.phone_number ? "Edit" : "Add"}
                </button>
              </div>
            )}
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Version</span>
            <span style={styles.infoVal}>1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px 24px",
    maxWidth: 800,
    margin: "0 auto",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 32px 0",
    letterSpacing: "-0.5px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "28px",
    marginBottom: 24,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    marginTop: 0,
    marginBottom: 20,
  },
  hint: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 20,
  },
  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },
  avatarWrapper: {
    position: "relative",
    flexShrink: 0,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 800,
    fontSize: 32,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #bfdbfe",
  },
  uploadBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "50%",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 14,
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 4,
  },
  email: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 4,
  },
  phone: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 8,
  },
  activeBadge: {
    background: "#f0fdf4",
    color: "#10b981",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-block",
    border: "1px solid #d1fae5",
  },
  otpBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "12px 24px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    transition: "background 0.2s",
  },
  otpSentBadge: {
    background: "#f0fdf4",
    color: "#10b981",
    padding: "12px",
    borderRadius: 10,
    textAlign: "center",
    fontWeight: 600,
    marginBottom: 20,
    fontSize: 14,
    border: "1px solid #d1fae5",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 16,
    border: "1px solid #bae6fd",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#f0f9ff",
    color: "#1e293b",
  },
  otpInput: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 8,
  },
  passwordWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  passwordInput: {
    width: "100%",
    padding: "12px 48px 12px 14px",
    border: "1px solid #bae6fd",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#f0f9ff",
    color: "#1e293b",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },
  btnRow: {
    display: "flex",
    gap: 12,
  },
  primaryBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    transition: "background 0.2s",
  },
  secondaryBtn: {
    background: "#ffffff",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s",
  },
  editBtn: {
    background: "#eff6ff",
    color: "#3b82f6",
    border: "1px solid #bfdbfe",
    borderRadius: 8,
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    marginLeft: 12,
    transition: "all 0.2s",
  },
  saveBtn: {
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "background 0.2s",
  },
  cancelBtn: {
    background: "#ffffff",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  infoList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  infoKey: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: 500,
  },
  infoVal: {
    fontWeight: 600,
    color: "#1e293b",
    fontSize: 14,
  },
  editPhoneContainer: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  editPhoneInput: {
    padding: "6px 10px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: 8,
    fontSize: 13,
    width: 180,
    outline: "none",
  },
  phoneDisplay: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
};

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  input:focus {
    border-color: #3b82f6 !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  .otp-btn:hover:not(:disabled) {
    background: #2563eb !important;
  }
  .primary-btn:hover:not(:disabled) {
    background: #2563eb !important;
  }
  .save-btn:hover:not(:disabled) {
    background: #059669 !important;
  }
  .secondary-btn:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
  }
  .edit-btn:hover {
    background: #dbeafe !important;
  }
`;
document.head.appendChild(styleSheet);