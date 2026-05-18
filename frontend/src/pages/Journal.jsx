import { useState, useEffect } from "react";
import { getJournals, createJournal, updateJournal } from "../services/api";
import toast from "react-hot-toast";

export default function Journal() {
  const [journals, setJournals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ entry_date: new Date().toISOString().split("T")[0], journal_text: "", productivity_score: 7, wins: "", challenges: "" });

  useEffect(() => { getJournals().then((r) => setJournals(r.data)).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createJournal(form);
      setJournals([res.data, ...journals]);
      setShowForm(false);
      toast.success("Journal entry saved! 📝");
    } catch (err) {
      if (err.response?.status === 400) toast.error("Entry already exists for this date");
      else toast.error("Failed to save entry");
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
            <div style={styles.row}>
              <div>
                <label style={styles.label}>Date</label>
                <input style={styles.input} type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} required />
              </div>
              <div>
                <label style={styles.label}>Productivity Score: {form.productivity_score}/10</label>
                <input style={styles.slider} type="range" min="1" max="10" value={form.productivity_score} onChange={(e) => setForm({ ...form, productivity_score: Number(e.target.value) })} />
              </div>
            </div>
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
            <div style={styles.btnRow}>
              <button type="submit" style={styles.primaryBtn}>Save Entry</button>
              <button type="button" onClick={() => setShowForm(false)} style={styles.secondaryBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.entriesList}>
        {journals.length === 0 ? (
          <div style={styles.empty}>No journal entries yet start writing today! ✍️</div>
        ) : (
          journals.map((j) => (
            <div key={j.id} style={styles.entryCard}>
              <div style={styles.entryHeader}>
                <span style={styles.entryDate}>📅 {j.entry_date}</span>
                <div style={{ ...styles.scoreCircle, background: j.productivity_score >= 7 ? "#43e97b" : j.productivity_score >= 4 ? "#f093fb" : "#f5576c" }}>
                  {j.productivity_score}/10
                </div>
              </div>
              {j.journal_text && <p style={styles.entryText}>{j.journal_text}</p>}
              <div style={styles.entryFooter}>
                {j.wins && <span style={styles.winTag}>🏆 {j.wins}</span>}
                {j.challenges && <span style={styles.challengeTag}>⚡ {j.challenges}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: 900 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: 0 },
  card: { background: "white", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginTop: 0, marginBottom: 16 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 },
  input: { width: "100%", padding: "12px 14px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" },
  slider: { width: "100%", marginTop: 8 },
  textarea: { width: "100%", padding: "12px 14px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 12 },
  btnRow: { display: "flex", gap: 10, marginTop: 12 },
  primaryBtn: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  secondaryBtn: { background: "#f0f0f0", color: "#666", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  entriesList: { display: "flex", flexDirection: "column", gap: 16 },
  empty: { textAlign: "center", color: "#aaa", padding: "48px 0", fontSize: 16 },
  entryCard: { background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  entryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  entryDate: { fontWeight: 700, color: "#667eea", fontSize: 15 },
  scoreCircle: { color: "white", fontWeight: 800, fontSize: 13, padding: "4px 12px", borderRadius: 20 },
  entryText: { color: "#444", lineHeight: 1.6, fontSize: 14, marginBottom: 12 },
  entryFooter: { display: "flex", gap: 10, flexWrap: "wrap" },
  winTag: { background: "#43e97b20", color: "#43e97b", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 },
  challengeTag: { background: "#f093fb20", color: "#f093fb", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }
};