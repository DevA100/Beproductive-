import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { resetPassword, forgotPassword, updatePhone } from "../services/api";
import toast from "react-hot-toast";

export default function Settings() {
  const { user } = useAuth();

  const [step, setStep] = useState("idle");
  const [otpForm, setOtpForm] = useState({ otp: "", new_password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [avatar, setAvatar] = useState(null);
  const [phone, setPhone] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setAvatar(localStorage.getItem("avatar_" + user.id));
      setPhone(user.phone_number || "");
    }
  }, [user]);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      await forgotPassword(user.email);
      setStep("otp_sent");
      toast.success("OTP sent to email");
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (otpForm.new_password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      await resetPassword({
        email: user.email,
        otp: otpForm.otp,
        new_password: otpForm.new_password,
      });

      toast.success("Password updated");
      setStep("idle");
      setOtpForm({ otp: "", new_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image must be under 2MB");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setAvatar(base64);
      localStorage.setItem("avatar_" + user.id, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhone = async () => {
    try {
      await updatePhone(phone);
      toast.success("Phone updated");
      setEditingPhone(false);
    } catch {
      toast.error("Failed to update phone");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Profile</h3>

        <div style={styles.profileRow}>
          <div style={styles.avatarWrapper}>
            {avatar ? (
              <img src={avatar} style={styles.avatarImg} />
            ) : (
              <div style={styles.avatar}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}

            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div>
            <div>{user?.username}</div>
            <div>{user?.email}</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3>Password Reset</h3>

        {step === "idle" && (
          <button onClick={handleSendOTP} disabled={loading}>
            Send OTP
          </button>
        )}

        {step === "otp_sent" && (
          <form onSubmit={handleResetPassword}>
            <input
              placeholder="OTP"
              value={otpForm.otp}
              onChange={(e) =>
                setOtpForm({ ...otpForm, otp: e.target.value })
              }
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={otpForm.new_password}
              onChange={(e) =>
                setOtpForm({
                  ...otpForm,
                  new_password: e.target.value,
                })
              }
            />

            <button type="submit">Reset Password</button>
          </form>
        )}
      </div>

      <div style={styles.card}>
        <h3>Phone</h3>

        {editingPhone ? (
          <>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button onClick={handleSavePhone}>Save</button>
          </>
        ) : (
          <>
            <div>{user?.phone_number || "Not set"}</div>
            <button onClick={() => setEditingPhone(true)}>
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20, maxWidth: 800 },
  title: { fontSize: 22, fontWeight: 700 },
  card: { padding: 20, marginBottom: 16, border: "1px solid #333" },
  cardTitle: { fontWeight: 600, marginBottom: 10 },
  profileRow: { display: "flex", gap: 12, alignItems: "center" },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#444",
  },
  avatarImg: { width: 60, height: 60, borderRadius: "50%" },
};