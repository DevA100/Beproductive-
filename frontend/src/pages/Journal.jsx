import { useState, useEffect } from "react";
import { getJournals, createJournal, updateJournal, deleteJournal } from "../services/api";
import toast from "react-hot-toast";

function scoreEntry(wins, challenges, textLength) {
  let score = 5;
  if (wins && !challenges) score = 8;
  else if (wins && challenges) score = 6;
  else if (!wins && challenges) score = 4;
  if (textLength > 200) score = Math.min(score + 1, 10);
  return score;
}

export default function Journal() {
  const [journals, setJournals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({ entry_date: new Date().toISOString().split("T")[0], journal_text: "", wins: "", challenges: "" });

  useEffect(() => { getJournals().then(r => setJournals(r.data)).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const score = scoreEntry(form.wins, form.challenges, form.journal_text.length);
    try {
      const res = await createJournal({ ...form, productivity_score: score });
      setJournals(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm({ entry_date: new Date().toISOString().split("T")[0], journal_text: "", wins: "", challenges: "" });
      toast.success(`Entry saved — score: ${score}/10`);
    } catch (err) {
      if (err.response?.status === 400) toast.error("Entry already exists for this date");
      else toast.error("Failed to save entry");
    }
  };

  const handleSaveEdit = async (entryDate) => {
    try {
      const res = await updateJournal(entryDate, editForm);
      setJournals(prev => prev.map(j => j.entry_date === entryDate ? res.data : j));
      setEditingId(null);
      toast.success("Entry updated");
    } catch { toast.error("Update failed"); }
  };

  const handleDelete = async (entryDate) => {
    if (!window.confirm("Delete this journal entry?")) return;
    try {
      await deleteJournal(entryDate);
      setJournals(prev => prev.filter(j => j.entry_date !== entryDate));
      toast.success("Entry deleted");
    } catch { toast.error("Delete failed"); }
  };

  const scoreColor = (s) => s >= 7 ? "#10b981" : s >= 4 ? "#3b82f6" : "#f87171";

  return (
    <div style={st.page}>
      <header style={st.pageHeader}>
        <div>
          <h1 style={st.pageTitle}>Journal</h1>
          <p style={st.pageSubtitle}>Reflect on your day, track wins and challenges</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} style={st.primaryBtn}>
          {showForm ? "Cancel" : "+ New Entry"}
        </button>
      </header>

      {showForm && (
        <div style={st.formCard}>
          <h3 style={st.formTitle}>New Journal Entry</h3>
          <form onSubmit={handleSubmit}>
            <label style={st.label}>Date</label>
            <input style={st.input} type="date" value={form.entry_date} onChange={e => setForm(p => ({ ...p, entry_date: e.target.value }))} required />
            <label style={st.label}>Reflection</label>
            <textarea style={st.textarea} placeholder="What happened today? What did you accomplish?" value={form.journal_text} onChange={e => setForm(p => ({ ...p, journal_text: e.target.value }))} rows={4} />
            <div style={st.row}>
              <div>
                <label style={st.label}>Wins</label>
                <input style={st.input} placeholder="What went well today?" value={form.wins} onChange={e => setForm(p => ({ ...p, wins: e.target.value }))} />
              </div>
              <div>
                <label style={st.label}>Challenges</label>
                <input style={st.input} placeholder="What was difficult?" value={form.challenges} onChange={e => setForm(p => ({ ...p, challenges: e.target.value }))} />
              </div>
            </div>
            <p style={st.note}>Productivity score is calculated automatically from your entry.</p>
            <div style={st.btnRow}>
              <button type="submit" style={st.primaryBtn}>Save Entry</button>
              <button type="button" onClick={() => setShowForm(false)} style={st.ghostBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {journals.length === 0 ? (
        <div style={st.emptyState}>
          <h3 style={{ color: "#64748b", marginBottom: 6, fontWeight: 600 }}>No entries yet</h3>
          <p style={{ color: "#334155", fontSize: 13 }}>Start journaling to track your daily progress and build self-awareness.</p>
        </div>
      ) : (
        <div style={st.list}>
          {journals.map(j => (
            <div key={j.id} style={st.entryCard}>
              <div style={st.entryHeader}>
                <div style={st.entryMeta}>
                  <span style={st.entryDate}>{j.entry_date}</span>
                  <div style={{ ...st.scorePill, background: `${scoreColor(j.productivity_score)}18`, color: scoreColor(j.productivity_score), borderColor: `${scoreColor(j.productivity_score)}30` }}>
                    {j.productivity_score}/10
                  </div>
                </div>
                <div style={st.entryActions}>
                  <button onClick={() => editingId === j.id ? setEditingId(null) : setEditingId(j.id) || setEditForm({ journal_text: j.journal_text || "", wins: j.wins || "", challenges: j.challenges || "" })} style={st.actionBtn}>
                    {editingId === j.id ? "Close" : "Edit"}
                  </button>
                  <button onClick={() => handleDelete(j.entry_date)} style={st.deleteBtn}>Delete</button>
                </div>
              </div>

              {editingId === j.id ? (
                <div style={st.editForm}>
                  <textarea style={st.textarea} value={editForm.journal_text} onChange={e => setEditForm(p => ({ ...p, journal_text: e.target.value }))} rows={3} placeholder="Reflection..." />
                  <div style={st.row}>
                    <input style={st.input} value={editForm.wins} onChange={e => setEditForm(p => ({ ...p, wins: e.target.value }))} placeholder="Wins" />
                    <input style={st.input} value={editForm.challenges} onChange={e => setEditForm(p => ({ ...p, challenges: e.target.value }))} placeholder="Challenges" />
                  </div>
                  <div style={st.btnRow}>
                    <button onClick={() => handleSaveEdit(j.entry_date)} style={st.primaryBtn}>Save</button>
                    <button onClick={() => setEditingId(null)} style={st.ghostBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {j.journal_text && <p style={st.entryText}>{j.journal_text}</p>}
                  {(j.wins || j.challenges) && (
                    <div style={st.tagsRow}>
                      {j.wins && <span style={st.winTag}>W: {j.wins}</span>}
                      {j.challenges && <span style={st.challengeTag}>C: {j.challenges}</span>}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const st = {
  page: { padding: "28px 24px", maxWidth: 860, animation: "fadeIn 0.3s ease" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#f8fafc", margin: 0 },
  pageSubtitle: { color: "#475569", fontSize: 13, marginTop: 3 },
  formCard: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 12, padding: "20px", marginBottom: 20 },
  formTitle: { fontSize: 15, fontWeight: 600, color: "#f8fafc", marginBottom: 14 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  entryCard: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 12, padding: "16px 20px" },
  entryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 },
  entryMeta: { display: "flex", alignItems: "center", gap: 10 },
  entryDate: { color: "#3b82f6", fontSize: 12, fontWeight: 600, letterSpacing: "0.02em" },
  scorePill: { fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 4, border: "1px solid" },
  entryActions: { display: "flex", gap: 6 },
  actionBtn: { padding: "4px 12px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 6, color: "#3b82f6", fontSize: 12, fontWeight: 500 },
  deleteBtn: { padding: "4px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 6, color: "#f87171", fontSize: 12, fontWeight: 500 },
  entryText: { color: "#94a3b8", fontSize: 13, lineHeight: 1.7, marginBottom: 10 },
  tagsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  winTag: { fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", padding: "3px 10px", borderRadius: 4 },
  challengeTag: { fontSize: 11, color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", padding: "3px 10px", borderRadius: 4 },
  editForm: { marginTop: 10 },
  emptyState: { textAlign: "center", padding: "48px 20px", border: "1px dashed rgba(30,64,175,0.2)", borderRadius: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 },
  label: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, marginTop: 10 },
  input: { padding: "10px 12px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 13, width: "100%", boxSizing: "border-box", background: "#111827", color: "#e2e8f0" },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 13, background: "#111827", color: "#e2e8f0", resize: "vertical", boxSizing: "border-box", marginTop: 4 },
  note: { color: "#334155", fontSize: 11, marginTop: 8 },
  btnRow: { display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" },
  primaryBtn: { padding: "9px 18px", background: "#2563eb", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600 },
  ghostBtn: { padding: "9px 18px", background: "transparent", border: "1px solid rgba(30,64,175,0.25)", borderRadius: 8, color: "#64748b", fontSize: 13, fontWeight: 500 },
};