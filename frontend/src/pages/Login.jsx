// Login.jsx
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
      toast.success("Welcome back");
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
        <div style={styles.logo}>BeProductive</div>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Sign in to continue</p>
        
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
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          
          <div style={styles.forgotRow}>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>
          
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <p style={styles.link}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.linkText}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "40px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0066cc",
    marginBottom: 24,
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: "#000000",
    margin: "0 0 8px 0",
    textAlign: "center",
  },
  subtitle: {
    color: "#666666",
    marginBottom: 24,
    fontSize: 14,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 16,
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#000000",
  },
  passwordWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  passwordInput: {
    width: "100%",
    padding: "12px 48px 12px 14px",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#000000",
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
    padding: 0,
    color: "#666666",
  },
  forgotRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  forgotLink: {
    color: "#0066cc",
    fontSize: 13,
    textDecoration: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#0066cc",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  link: {
    textAlign: "center",
    marginTop: 24,
    color: "#666666",
    fontSize: 14,
  },
  linkText: {
    color: "#0066cc",
    fontWeight: 600,
    textDecoration: "none",
  },
};