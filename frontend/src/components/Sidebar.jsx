import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, updateUserProfile } from "../services/api";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone_number: "",
  });
  const [notifications, setNotifications] = useState({
    email_reminders: true,
    whatsapp_reminders: false,
  });

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile(profile);
      updateUser(profile);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>Manage your account preferences</p>
      </div>

      <div style={styles.content}>
        {/* Profile Settings */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Profile Information</h2>
          <form onSubmit={handleProfileUpdate} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number (for WhatsApp)</label>
              <input
                type="tel"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleChange}
                placeholder="e.g., 2347043955397"
                style={styles.input}
              />
              <small style={styles.helperText}>
                Enter in international format (e.g., 2347043955397)
              </small>
            </div>
            <button type="submit" disabled={loading} style={styles.saveBtn}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Notification Preferences</h2>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={notifications.email_reminders}
                onChange={(e) => setNotifications({ ...notifications, email_reminders: e.target.checked })}
                style={styles.checkbox}
              />
              <span>Email Reminders</span>
            </label>
            <p style={styles.checkboxHint}>Receive daily task reminders via email</p>
          </div>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={notifications.whatsapp_reminders}
                onChange={(e) => setNotifications({ ...notifications, whatsapp_reminders: e.target.checked })}
                style={styles.checkbox}
              />
              <span>WhatsApp Reminders</span>
            </label>
            <p style={styles.checkboxHint}>Receive daily task reminders via WhatsApp (requires phone number)</p>
          </div>
          <button style={styles.saveBtn} onClick={() => toast.success("Preferences saved!")}>
            Save Preferences
          </button>
        </div>

        {/* Danger Zone - Delete Account */}
        <div style={styles.dangerZone}>
          <h3 style={styles.dangerTitle}>⚠️ Danger Zone</h3>
          <div style={styles.dangerItem}>
            <div style={styles.dangerInfo}>
              <strong>Delete Account</strong>
              <p style={styles.dangerText}>
                Permanently delete your account and all your data. This action cannot be undone.
                All your tasks, journals, and plans will be lost forever.
              </p>
            </div>
            <Link to="/settings/delete-account" style={styles.deleteLink}>
              Delete Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px",
    maxWidth: 800,
    margin: "0 auto",
    minHeight: "100vh",
    background: "#f0f9ff",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  section: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 20px 0",
    paddingBottom: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
  },
  helperText: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "4px",
  },
  saveBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  checkboxGroup: {
    marginBottom: "16px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  checkboxHint: {
    fontSize: "12px",
    color: "#64748b",
    margin: "4px 0 0 28px",
  },
  dangerZone: {
    marginTop: "24px",
    padding: "20px",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    background: "#fef2f2",
  },
  dangerTitle: {
    color: "#dc2626",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 16px 0",
  },
  dangerItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  dangerInfo: {
    flex: 1,
  },
  dangerText: {
    fontSize: "13px",
    color: "#991b1b",
    marginTop: "4px",
  },
  deleteLink: {
    background: "#dc2626",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "background 0.2s",
  },
};

// Add input focus styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  input:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  .delete-link:hover {
    background: #b91c1c !important;
  }
`;
document.head.appendChild(styleSheet);