// Signup.jsx
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
      toast.success("Account created. Please login");
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
        <div style={styles.logo}>BeProductive</div>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Start your productivity journey</p>
        
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
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            style={styles.input}
            placeholder="Phone Number (optional)"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        
        <p style={styles.link}>
          Already have an account?{" "}
          <Link to="/login" style={styles.linkText}>
            Sign In
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