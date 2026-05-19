import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/api";
import toast from "react-hot-toast";

export default function Signup() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    phone_number: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const validate = () => {
    if (!form.email.trim()) return "Email is required";
    if (!form.username.trim()) return "Username is required";
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);

    try {
      await signup(form);

      toast.success("Account created successfully");

      navigate("/login");
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />

          <div style={styles.passwordWrapper}>
            <input
              style={styles.input}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
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

          <input
            style={styles.input}
            placeholder="Phone number (optional)"
            value={form.phone_number}
            onChange={(e) =>
              setForm({
                ...form,
                phone_number: e.target.value,
              })
            }
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account?{" "}
          <Link to="/login" style={styles.linkText}>
            Login
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