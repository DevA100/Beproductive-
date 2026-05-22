import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function DeleteAccount() {
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmationText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      await deleteAccount({ password, confirmation_text: confirmationText });
      toast.success("Account permanently deleted");
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete account");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 32 }}>
        <h2 style={{ color: "#dc2626" }}>Delete Account</h2>
        <p style={{ background: "#fef2f2", padding: 16, borderRadius: 10 }}>
          ⚠️ This action is permanent and irreversible.
        </p>
        <button 
          onClick={() => setShowConfirmModal(true)}
          style={{ background: "#dc2626", color: "white", padding: 14, borderRadius: 10, width: "100%", cursor: "pointer" }}
        >
          Delete My Account
        </button>
      </div>
      {showConfirmModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 20, padding: 32, maxWidth: 500 }}>
            <h3>Confirm Deletion</h3>
            <input type="text" placeholder='Type "DELETE"' onChange={(e) => setConfirmationText(e.target.value)} style={{ width: "100%", padding: 12, margin: "10px 0" }} />
            <input type="password" placeholder="Your password" onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 12, margin: "10px 0" }} />
            <button onClick={handleDeleteAccount} disabled={loading} style={{ background: "#dc2626", color: "white", padding: 12, borderRadius: 10, width: "100%" }}>Delete</button>
            <button onClick={() => setShowConfirmModal(false)} style={{ marginTop: 10, width: "100%", padding: 12 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}