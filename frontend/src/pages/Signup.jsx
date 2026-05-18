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
          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <div style={styles.passwordWrapper}>
            <input
              style={styles.passwordInput}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <input
            style={styles.input}
            placeholder="Phone Number (e.g. +2348012345678)"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Get Started 🚀"}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account?{" "}
          <Link to="/login" style={styles.linkText}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { background: "white", borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  logo: { fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #f093fb, #f5576c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" },
  subtitle: { color: "#666", marginBottom: 24, fontSize: 14 },
  input: { width: "100%", padding: "14px 16px", marginBottom: 16, border: "2px solid #eee", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box" },
  button: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" },
  link: { textAlign: "center", marginTop: 20, color: "#666", fontSize: 14 },
  linkText: { color: "#f5576c", fontWeight: 600, textDecoration: "none" },
  passwordWrapper: { position: "relative", marginBottom: 16 },
  passwordInput: { width: "100%", padding: "14px 48px 14px 16px", border: "2px solid #eee", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box" },
  eyeBtn: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
};