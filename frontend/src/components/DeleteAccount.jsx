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
  const [deleted, setDeleted] = useState(false);
  const { logoutUser } = useAuth(); // ✅ FIXED: was "logout", correct name is "logoutUser"
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

      // ── SUCCESS PATH ──────────────────────────────────────────
      setDeleted(true);           // lock UI, show redirect screen
      setShowConfirmModal(false);

      logoutUser();               // clears token + user state from context
      localStorage.clear();       // safety net for any other stored data
      sessionStorage.clear();

      toast.success("Account permanently deleted");

      // Hard replace — wipes entire history so back button is dead
      setTimeout(() => {
        window.location.replace("/login");
      }, 1500);

    } catch (err) {
      // ── ERROR PATH ONLY ───────────────────────────────────────
      // NO finally block — that was causing the dual toast bug
      toast.error(err?.response?.data?.detail || "Failed to delete account");
      setLoading(false);
    }
  };

  // Blank screen shown after success, while redirect countdown runs
  if (deleted) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #dc2626",
          borderTopColor: "transparent", borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <p style={{ color: "white", fontSize: 16, margin: 0 }}>
          Account deleted. Redirecting...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 32 }}>
        <h2 style={{ color: "#dc2626" }}>Delete Account</h2>
        <p style={{ background: "#fef2f2", padding: 16, borderRadius: 10, color: "#dc2626" }}>
          ⚠️ This action is permanent and irreversible.
        </p>
        <button
          onClick={() => setShowConfirmModal(true)}
          style={{
            background: "#dc2626", color: "white", padding: 14, border: "none",
            borderRadius: 10, width: "100%", cursor: "pointer", fontSize: 16,
          }}
        >
          Delete My Account
        </button>
      </div>

      {showConfirmModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
        }}>
          <div style={{
            background: "white", borderRadius: 20, padding: 32,
            width: "90%", maxWidth: 460,
          }}>
            <h3 style={{ marginTop: 0 }}>Confirm Account Deletion</h3>
            <p style={{ color: "#666", fontSize: 14 }}>
              Type <strong>DELETE</strong> and enter your password to confirm.
            </p>

            <input
              type="text"
              placeholder='Type "DELETE"'
              value={confirmationText}
              disabled={loading}
              onChange={(e) => setConfirmationText(e.target.value)}
              style={{
                width: "100%", padding: 12, margin: "8px 0", fontSize: 15,
                borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box",
              }}
            />
            <input
              type="password"
              placeholder="Your password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%", padding: 12, margin: "8px 0", fontSize: 15,
                borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box",
              }}
            />

            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              style={{
                background: loading ? "#f87171" : "#dc2626",
                color: "white", padding: 13, borderRadius: 10,
                width: "100%", border: "none", marginTop: 8, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading && (
                <span style={{
                  width: 16, height: 16,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "white", borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
              )}
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>

            <button
              onClick={() => { setShowConfirmModal(false); setPassword(""); setConfirmationText(""); }}
              disabled={loading}
              style={{
                marginTop: 10, width: "100%", padding: 12, fontSize: 15,
                border: "1px solid #e5e7eb", borderRadius: 10, background: "white",
                cursor: loading ? "not-allowed" : "pointer", color: "#374151",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}