import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/api";
import toast from "react-hot-toast";

export default function Signup() {
  const [form, setForm] = useState({ email: "", username: "", password: "", phone_number: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form);
      toast.success("Account created! Please login 🎉");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ BeProductive</div>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Start your productivity journey today</p>
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <div style={styles.passwordWrapper}>
            <input
              style={styles.passwordInput}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            
{showPassword ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
)}
          </div>
          <input style={styles.input} placeholder="Phone Number e.g. +2348012345678 (for WhatsApp)" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={styles.spinner}></span> Creating account...
              </span>
            ) : "Get Started "}
          </button>
        </form>
        <div style={styles.divider}>
          <span style={styles.dividerText}>or continue with</span>
        </div>
// Google button - remove emoji from Apple
<button style={styles.socialBtn} onClick={() => toast.error("Google sign-in coming soon")} type="button">
  <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="" /> Google
</button>
<button style={styles.socialBtn} onClick={() => toast.error("Apple sign-in coming soon")} type="button">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#e2e8f0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
  Apple
</button>
        <p style={styles.link}>
          Already have an account?{" "}
          <Link to="/login" style={styles.linkText}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #0d1117 50%, #0a0f1e 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  card: { background: "rgba(13,17,23,0.95)", border: "1px solid rgba(99,179,237,0.2)", borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, boxShadow: "0 0 40px rgba(99,179,237,0.1), 0 20px 60px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)" },
  logo: { fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" },
  subtitle: { color: "#64748b", marginBottom: 24, fontSize: 14 },
  input: { width: "100%", padding: "14px 16px", marginBottom: 16, border: "1px solid rgba(99,179,237,0.2)", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  button: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #00d2ff 0%, #7b2ff7 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 16 },
  link: { textAlign: "center", marginTop: 20, color: "#64748b", fontSize: 14 },
  linkText: { color: "#00d2ff", fontWeight: 600, textDecoration: "none" },
  passwordWrapper: { position: "relative", marginBottom: 16 },
  passwordInput: { width: "100%", padding: "14px 48px 14px 16px", border: "1px solid rgba(99,179,237,0.2)", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  eyeBtn: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
  divider: { display: "flex", alignItems: "center", margin: "16px 0", gap: 10 },
  dividerText: { color: "#64748b", fontSize: 13, whiteSpace: "nowrap", padding: "0 10px", flex: 1, textAlign: "center", borderTop: "1px solid rgba(99,179,237,0.1)" },
  socialRow: { display: "flex", gap: 12, marginBottom: 8 },
  socialBtn: { flex: 1, padding: "12px", border: "1px solid rgba(99,179,237,0.2)", borderRadius: 12, background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinner: { width: 18, height: 18, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
};