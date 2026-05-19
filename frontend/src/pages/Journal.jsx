import { useState, useEffect } from "react";
import { getJournals, createJournal, updateJournal } from "../services/api";
import toast from "react-hot-toast";
import { getJournals, createJournal, updateJournal, deleteJournal } from "../services/api";
export default function Journal() {
  const [journals, setJournals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    journal_text: "",
    wins: "",
    challenges: ""
  });

  useEffect(() => {
    getJournals().then((r) => setJournals(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasWins = form.wins.length > 0;
    const hasChallenges = form.challenges.length > 0;
    const textLength = form.journal_text.length;
    let autoScore = 5;
    if (hasWins && !hasChallenges) autoScore = 8;
    if (hasWins && hasChallenges) autoScore = 6;
    if (!hasWins && hasChallenges) autoScore = 4;
    if (textLength > 200) autoScore = Math.min(autoScore + 1, 10);

    try {
      const res = await createJournal({ ...form, productivity_score: autoScore });
      setJournals([res.data, ...journals]);
      setShowForm(false);
      setForm({ entry_date: new Date().toISOString().split("T")[0], journal_text: "", wins: "", challenges: "" });
      toast.success(`Journal saved! Auto score: ${autoScore}/10 ⭐`);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error("Entry exists for today — use edit instead");
      } else {
        toast.error("Failed to save");
      }
    }
  };

  const handleEdit = (journal) => {
    setEditingId(journal.id);
    setEditForm({ journal_text: journal.journal_text || "", wins: journal.wins || "", challenges: journal.challenges || "" });
  };

  const handleSaveEdit = async (entryDate) => {
    try {
      const res = await updateJournal(entryDate, editForm);
      setJournals(journals.map(j => j.entry_date === entryDate ? res.data : j));
      setEditingId(null);
      toast.success("Journal updated! ✅");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (entryDate) => {
  if (!window.confirm("Delete this journal entry?")) return;
  try {
    await deleteJournal(entryDate);
    setJournals(journals.filter(j => j.entry_date !== entryDate));
    toast.success("Entry deleted!");
  } catch {
    toast.error("Failed to delete");
  }
};


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📝 Journal</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.primaryBtn}>+ New Entry</button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>New Journal Entry</h3>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Date</label>
            <input style={styles.input} type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} required />
            <label style={styles.label}>Journal Entry</label>
            <textarea style={styles.textarea} placeholder="How was your day? What did you accomplish?" value={form.journal_text} onChange={(e) => setForm({ ...form, journal_text: e.target.value })} rows={4} />
            <div style={styles.row}>
              <div>
                <label style={styles.label}>🏆 Wins</label>
                <input style={styles.input} placeholder="What went well?" value={form.wins} onChange={(e) => setForm({ ...form, wins: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>⚡ Challenges</label>
                <input style={styles.input} placeholder="What was hard?" value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
              </div>
            </div>
            <p style={{ color: "#888", fontSize: 12, margin: "8px 0" }}>⭐ Productivity score is calculated automatically based on your entry</p>
            <div style={styles.btnRow}>
              <button type="submit" style={styles.primaryBtn}>Save Entry</button>
              <button type="button" onClick={() => setShowForm(false)} style={styles.secondaryBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.entriesList}>
        {journals.length === 0 ? (
          <div style={styles.empty}>No journal entries yet — start writing today! ✍️</div>
        ) : (
          journals.map((j) => (
            <div key={j.id} style={styles.entryCard}>
              <div style={styles.entryHeader}>
                <span style={styles.entryDate}>📅 {j.entry_date}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ ...styles.scoreCircle, background: j.productivity_score >= 7 ? "#43e97b" : j.productivity_score >= 4 ? "#a78bfa" : "#f5576c" }}>
                    ⭐ {j.productivity_score}/10
                  </div>
                  <button onClick={() => editingId === j.id ? setEditingId(null) : handleEdit(j)} style={styles.editBtn}>
                    {editingId === j.id ? "✕ Close" : "✏️ Edit"}
                  </button>
                  <button onClick={() => handleDelete(j.entry_date)} style={styles.deleteBtn}>🗑️</button>
                </div>
              </div>

              {editingId === j.id ? (
                <div style={styles.editForm}>
                  <textarea style={styles.textarea} value={editForm.journal_text} onChange={(e) => setEditForm({ ...editForm, journal_text: e.target.value })} rows={3} placeholder="Journal text" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <input style={styles.input} value={editForm.wins} onChange={(e) => setEditForm({ ...editForm, wins: e.target.value })} placeholder="🏆 Wins" />
                    <input style={styles.input} value={editForm.challenges} onChange={(e) => setEditForm({ ...editForm, challenges: e.target.value })} placeholder="⚡ Challenges" />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleSaveEdit(j.entry_date)} style={styles.primaryBtn}>Save</button>
                    <button onClick={() => setEditingId(null)} style={styles.secondaryBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {j.journal_text && <p style={styles.entryText}>{j.journal_text}</p>}
                  <div style={styles.entryFooter}>
                    {j.wins && <span style={styles.winTag}>🏆 {j.wins}</span>}
                    {j.challenges && <span style={styles.challengeTag}>⚡ {j.challenges}</span>}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "20px 16px", maxWidth: 900 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 800, color: "#e2e8f0", margin: 0 },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,210,255,0.1)", borderRadius: 16, padding: "24px", marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginTop: 0, marginBottom: 16 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 },
  input: { width: "100%", padding: "12px 14px", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12, background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  textarea: { width: "100%", padding: "12px 14px", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 12, background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  btnRow: { display: "flex", gap: 10, marginTop: 8 },
  primaryBtn: { background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  secondaryBtn: { background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  entriesList: { display: "flex", flexDirection: "column", gap: 16 },
  empty: { textAlign: "center", color: "#64748b", padding: "48px 0", fontSize: 16 },
  entryCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,210,255,0.1)", borderRadius: 16, padding: "20px 24px" },
  entryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 },
  entryDate: { fontWeight: 700, color: "#00d2ff", fontSize: 15 },
  scoreCircle: { color: "white", fontWeight: 800, fontSize: 13, padding: "4px 12px", borderRadius: 20 },
  entryText: { color: "#94a3b8", lineHeight: 1.6, fontSize: 14, marginBottom: 12 },
  entryFooter: { display: "flex", gap: 10, flexWrap: "wrap" },
  winTag: { background: "rgba(67,233,123,0.1)", color: "#43e97b", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid rgba(67,233,123,0.2)" },
  challengeTag: { background: "rgba(167,139,250,0.1)", color: "#a78bfa", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid rgba(167,139,250,0.2)" },
  editBtn: { background: "rgba(0,210,255,0.1)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  editForm: { marginTop: 12 },
  deleteBtn: { background: "rgba(255,100,100,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
};