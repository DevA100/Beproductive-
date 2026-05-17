import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email_or_username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.access_token);
      toast.success("Welcome back! 🎉");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡ BeProductive</div>
        <h2 style={styles.title}>Welcome Back!</h2>
        <p style={styles.subtitle}>Sign in to continue your productive journey</p>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="Email or Username"
            value={form.email_or_username}
            onChange={(e) => setForm({ ...form, email_or_username: e.target.value })}
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
          <div style={styles.forgotRow}>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In 🚀"}
          </button>
        </form>
        <p style={styles.link}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.linkText}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { background: "white", borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  logo: { fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" },
  subtitle: { color: "#666", marginBottom: 24, fontSize: 14 },
  input: { width: "100%", padding: "14px 16px", marginBottom: 16, border: "2px solid #eee", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box" },
  passwordWrapper: { position: "relative", marginBottom: 8 },
  passwordInput: { width: "100%", padding: "14px 48px 14px 16px", border: "2px solid #eee", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box" },
  eyeBtn: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 },
  forgotRow: { display: "flex", justifyContent: "flex-end", marginBottom: 16 },
  forgotLink: { color: "#667eea", fontSize: 13, fontWeight: 600, textDecoration: "none" },
  button: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" },
  link: { textAlign: "center", marginTop: 20, color: "#666", fontSize: 14 },
  linkText: { color: "#667eea", fontWeight: 600, textDecoration: "none" }
};