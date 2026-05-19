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
      toast.success("OTP sent to your email! 📧");
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
      toast.success("Password changed successfully! 🎉");
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
    toast.success("Profile picture updated! 📸");
  };
  reader.readAsDataURL(file);
};

  const [phone, setPhone] = useState(user?.phone_number || "");
const [editingPhone, setEditingPhone] = useState(false);

const handleSavePhone = async () => {
  try {
    await updatePhone(phone);
    toast.success("Phone number saved! 📱");
    setEditingPhone(false);
  } catch {
    toast.error("Failed to save phone");
  }
  };
  
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚙️ Settings</h1>

      {/* Profile Card */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>👤 Your Profile</h3>
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
            {user?.phone_number && <div style={styles.phone}>📱 {user?.phone_number}</div>}
            <div style={styles.activeBadge}>✅ Active Account</div>
          </div>
        </div>
      </div>

      {/* Reset Password Card */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🔐 Reset Password</h3>
        <p style={styles.hint}>We'll send a 6-digit OTP to your email <strong>{user?.email}</strong></p>

        {step === "idle" && (
          <button onClick={handleSendOTP} disabled={loading} style={styles.otpBtn}>
            {loading ? "Sending..." : "Send OTP to Email 📧"}
          </button>
        )}

        {step === "otp_sent" && (
          <form onSubmit={handleResetPassword}>
            <div style={styles.otpSentBadge}>📧 OTP sent! Check your inbox</div>
            <input
              style={{ ...styles.input, textAlign: "center", fontSize: 22, fontWeight: 700, letterSpacing: 8 }}
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
                placeholder="New Password"
                value={otpForm.new_password}
                onChange={(e) => setOtpForm({ ...otpForm, new_password: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div style={styles.btnRow}>
              <button type="submit" disabled={loading} style={styles.primaryBtn}>
                {loading ? "Resetting..." : "Reset Password 🔐"}
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
        <h3 style={styles.cardTitle}>ℹ️ Account Info</h3>
        <div style={styles.infoList}>
          <div style={styles.infoRow}><span style={styles.infoKey}>Username</span><span style={styles.infoVal}>{user?.username}</span></div>
          <div style={styles.infoRow}><span style={styles.infoKey}>Email</span><span style={styles.infoVal}>{user?.email}</span></div>
          <div style={styles.infoRow}><span style={styles.infoKey}>Phone</span><span style={styles.infoVal}>{user?.phone_number || "No provided phone number "}</span></div>
          <div style={styles.infoRow}><span style={styles.infoKey}>Version</span><span style={styles.infoVal}>1.0.0</span></div>
        </div>
        <div style={styles.infoRow}>
  <span style={styles.infoKey}>📱 WhatsApp</span>
  {editingPhone ? (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        style={{ ...styles.input, marginBottom: 0, padding: "8px 12px", width: 180 }}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+2348012345678"
      />
      <button onClick={handleSavePhone} style={styles.primaryBtn}>Save</button>
      <button onClick={() => setEditingPhone(false)} style={styles.secondaryBtn}>Cancel</button>
    </div>
  ) : (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={styles.infoVal}>{user?.phone_number || "Not set"}</span>
      <button onClick={() => setEditingPhone(true)} style={styles.editBtn}>
        {user?.phone_number ? "✏️ Edit" : "➕ Add"}
      </button>
    </div>
  )}
</div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "20px 16px", maxWidth: 800 },
  title: { fontSize: 24, fontWeight: 800, color: "#e2e8f0", margin: "0 0 24px" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,210,255,0.1)", borderRadius: 16, padding: "24px", marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginTop: 0, marginBottom: 16 },
  hint: { color: "#64748b", fontSize: 14, marginBottom: 16 },
  profileRow: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  avatarWrapper: { position: "relative", flexShrink: 0 },
  avatar: { width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 28 },
  avatarImg: { width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,210,255,0.3)" },
  uploadBtn: { position: "absolute", bottom: 0, right: 0, background: "#0d1117", border: "1px solid rgba(0,210,255,0.3)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 },
  email: { color: "#64748b", fontSize: 14, marginBottom: 4 },
  phone: { color: "#64748b", fontSize: 14, marginBottom: 8 },
  activeBadge: { background: "rgba(67,233,123,0.1)", color: "#43e97b", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-block", border: "1px solid rgba(67,233,123,0.2)" },
  otpBtn: { background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 700, cursor: "pointer", fontSize: 15 },
  otpSentBadge: { background: "rgba(67,233,123,0.1)", color: "#43e97b", padding: "10px", borderRadius: 10, textAlign: "center", fontWeight: 600, marginBottom: 16, fontSize: 14, border: "1px solid rgba(67,233,123,0.2)" },
  input: { width: "100%", padding: "14px 16px", marginBottom: 16, border: "1px solid rgba(0,210,255,0.2)", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  passwordWrapper: { position: "relative", marginBottom: 16 },
  passwordInput: { width: "100%", padding: "14px 48px 14px 16px", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  eyeBtn: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
  btnRow: { display: "flex", gap: 10 },
  primaryBtn: { background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", color: "white", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  secondaryBtn: { background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  editBtn: { background: "rgba(0,210,255,0.1)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  infoList: { display: "flex", flexDirection: "column", gap: 12 },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(0,210,255,0.08)" },
  infoKey: { color: "#64748b", fontSize: 14 },
  infoVal: { fontWeight: 600, color: "#e2e8f0", fontSize: 14 },
};