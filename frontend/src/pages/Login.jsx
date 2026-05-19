import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({
    email_or_username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await login(form);

      const token = res?.data?.access_token;

      if (!token) {
        toast.error("Invalid login response");
        return;
      }

      loginUser(token);

      toast.success("Login successful");

      navigate("/dashboard");
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="Email or Username"
            value={form.email_or_username}
            onChange={(e) =>
              setForm({
                ...form,
                email_or_username: e.target.value,
              })
            }
          />

          <div style={styles.passwordWrapper}>
            <input
              style={styles.input}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              style={styles.eyeBtn}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p style={styles.link}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.linkText}>
            Sign Up
          </Link>
        </p>

        <p style={styles.link}>
          <Link to="/forgot-password" style={styles.linkText}>
            Forgot password?
          </Link>
        </p>
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
    width: 380,
    padding: 24,
    border: "1px solid #333",
    borderRadius: 12,
    background: "#111",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    color: "#e2e8f0",
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#0d1117",
    color: "#fff",
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#00d2ff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
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
  link: {
    marginTop: 12,
    fontSize: 13,
    textAlign: "center",
    color: "#aaa",
  },
  linkText: {
    color: "#00d2ff",
    textDecoration: "none",
  },
};