import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { resetPassword, forgotPassword, updatePhone } from "../services/api";
import toast from "react-hot-toast";

export default function Settings() {
  const { user } = useAuth();
  const [passwordStep, setPasswordStep] = useState("idle");
  const [otpForm, setOtpForm] = useState({ otp: "", new_password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [avatar, setAvatar] = useState(() => localStorage.getItem("avatar_" + user?.id) || null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2097152) return toast.error("Image must be under 2MB");
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result;
      setAvatar(b64);
      localStorage.setItem("avatar_" + user?.id, b64);
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  const handleSendOTP = async () => {
    setPwdLoading(true);
    try {
      await forgotPassword(user.email);
      setPasswordStep("otp_sent");
      toast.success("OTP sent to your email");
    } catch { toast.error("Failed to send OTP"); }
    finally { setPwdLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otpForm.new_password.length < 6) return toast.error("Password must be at least 6 characters");
    setPwdLoading(true);
    try {
      await resetPassword({ email: user.email, otp: otpForm.otp, new_password: otpForm.new_password });
      toast.success("Password changed successfully");
      setPasswordStep("idle");
      setOtpForm({ otp: "", new_password: "" });
    } catch (err) { toast.error(err.response?.data?.detail || "Invalid OTP"); }
    finally { setPwdLoading(false); }
  };

  const handleSavePhone = async () => {
    setPhoneLoading(true);
    try {
      await updatePhone(phone);
      toast.success("Phone number updated");
      setEditingPhone(false);
    } catch { toast.error("Failed to update phone"); }
    finally { setPhoneLoading(false); }
  };

  return (
    <div style={s.page}>
      <h1 style={s.pageTitle}>Settings</h1>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Profile</h2>
        <div style={s.profileRow}>
          <div style={s.avatarBlock}>
            {avatar ? (
              <img src={avatar} alt={user?.username} style={s.avatarImg} />
            ) : (
              <div style={s.avatarFallback}>{user?.username?.[0]?.toUpperCase()}</div>
            )}
            <label htmlFor="avatar-upload" style={s.photoBtn}>Change Photo</label>
            <input id="avatar-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>
          <div style={s.profileInfo}>
            <div style={s.profileName}>{user?.username}</div>
            <div style={s.profileEmail}>{user?.email}</div>
            <span style={s.activeBadge}>Active</span>
          </div>
        </div>
      </section>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Change Password</h2>
        <p style={s.hint}>A one-time code will be sent to {user?.email}</p>
        {passwordStep === "idle" && (
          <button onClick={handleSendOTP} disabled={pwdLoading} style={s.primaryBtn}>
            {pwdLoading ? "Sending..." : "Send OTP"}
          </button>
        )}
        {passwordStep === "otp_sent" && (
          <form onSubmit={handleResetPassword}>
            <div style={s.otpBanner}>OTP sent — check your inbox</div>
            <label style={s.label}>Enter 6-digit OTP</label>
            <input
              style={{ ...s.input, textAlign: "center", fontSize: 20, fontWeight: 700, letterSpacing: 10 }}
              placeholder="000000"
              value={otpForm.otp}
              onChange={e => setOtpForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              maxLength={6}
              required
            />
            <label style={s.label}>New Password</label>
            <div style={s.pwdWrapper}>
              <input
                style={s.pwdInput}
                type={showPwd ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={otpForm.new_password}
                onChange={e => setOtpForm(p => ({ ...p, new_password: e.target.value }))}
                required
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={s.eyeBtn}>
                {showPwd ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            <div style={s.btnRow}>
              <button type="submit" disabled={pwdLoading} style={s.primaryBtn}>{pwdLoading ? "Updating..." : "Update Password"}</button>
              <button type="button" onClick={() => setPasswordStep("idle")} style={s.ghostBtn}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Account Details</h2>
        <div style={s.detailList}>
          {[
            { key: "Username", val: user?.username },
            { key: "Email", val: user?.email },
          ].map(({ key, val }) => (
            <div key={key} style={s.detailRow}>
              <span style={s.detailKey}>{key}</span>
              <span style={s.detailVal}>{val}</span>
            </div>
          ))}
          <div style={s.detailRow}>
            <span style={s.detailKey}>WhatsApp / Phone</span>
            {editingPhone ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  style={{ ...s.input, marginBottom: 0, width: 180, padding: "7px 10px" }}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+2348012345678"
                />
                <button onClick={handleSavePhone} disabled={phoneLoading} style={s.primaryBtn}>{phoneLoading ? "..." : "Save"}</button>
                <button onClick={() => setEditingPhone(false)} style={s.ghostBtn}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={s.detailVal}>{user?.phone_number || "Not set"}</span>
                <button onClick={() => setEditingPhone(true)} style={s.inlineEditBtn}>
                  {user?.phone_number ? "Edit" : "Add"}
                </button>
              </div>
            )}
          </div>
          <div style={s.detailRow}>
            <span style={s.detailKey}>Version</span>
            <span style={s.detailVal}>1.0.0</span>
          </div>
        </div>
      </section>

      <section style={{ ...s.card, border: "1px solid rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.03)" }}>
        <h2 style={{ ...s.cardTitle, color: "#10b981" }}>Support the Project</h2>
        <p style={s.hint}>If BeProductive is helping you stay focused and productive, consider supporting its development.</p>
        <a href="https://buymeacoffee.com/yourname" target="_blank" rel="noopener noreferrer" style={s.supportLink}>
          Buy me a coffee
        </a>
      </section>
    </div>
  );
}

const s = {
  page: { padding: "28px 24px", maxWidth: 720, animation: "fadeIn 0.3s ease" },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#f8fafc", marginBottom: 24 },
  card: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 12, padding: "20px 24px", marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" },
  hint: { color: "#475569", fontSize: 13, marginBottom: 14, lineHeight: 1.6 },
  profileRow: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" },
  avatarBlock: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  avatarFallback: { width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 26 },
  avatarImg: { width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(37,99,235,0.3)" },
  photoBtn: { fontSize: 11, color: "#3b82f6", cursor: "pointer", fontWeight: 500 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 700, color: "#f8fafc", marginBottom: 3 },
  profileEmail: { color: "#64748b", fontSize: 13, marginBottom: 8 },
  activeBadge: { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, padding: "2px 10px", fontSize: 11, fontWeight: 600 },
  otpBanner: { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "10px 14px", color: "#10b981", fontSize: 13, fontWeight: 500, marginBottom: 14 },
  label: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, marginTop: 12 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 14, background: "#111827", color: "#e2e8f0", boxSizing: "border-box", marginBottom: 4 },
  pwdWrapper: { position: "relative", marginBottom: 4 },
  pwdInput: { width: "100%", padding: "10px 40px 10px 12px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 14, background: "#111827", color: "#e2e8f0", boxSizing: "border-box" },
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", display: "flex", alignItems: "center" },
  btnRow: { display: "flex", gap: 8, marginTop: 14 },
  primaryBtn: { padding: "9px 18px", background: "#2563eb", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600 },
  ghostBtn: { padding: "9px 18px", background: "transparent", border: "1px solid rgba(30,64,175,0.25)", borderRadius: 8, color: "#64748b", fontSize: 13 },
  inlineEditBtn: { padding: "4px 12px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 6, color: "#3b82f6", fontSize: 12, fontWeight: 500 },
  detailList: { display: "flex", flexDirection: "column" },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(30,64,175,0.08)", flexWrap: "wrap", gap: 8 },
  detailKey: { color: "#64748b", fontSize: 13 },
  detailVal: { color: "#e2e8f0", fontSize: 13, fontWeight: 500 },
  supportLink: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, color: "#10b981", fontSize: 13, fontWeight: 600, textDecoration: "none" },
};