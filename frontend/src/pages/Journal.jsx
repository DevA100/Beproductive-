import { useState, useEffect } from "react";
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
      toast.success(`Journal saved! Score: ${autoScore}/10`);
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
      toast.success("Journal updated successfully");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (entryDate) => {
    if (!window.confirm("Delete this journal entry?")) return;
    try {
      await deleteJournal(entryDate);
      setJournals(journals.filter(j => j.entry_date !== entryDate));
      toast.success("Entry deleted successfully");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Journal</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.primaryBtn}>
          {showForm ? "Cancel" : "New Entry"}
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>New Journal Entry</h3>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Date</label>
            <input 
              style={styles.input} 
              type="date" 
              value={form.entry_date} 
              onChange={(e) => setForm({ ...form, entry_date: e.target.value })} 
              required 
            />
            
            <label style={styles.label}>Journal Entry</label>
            <textarea 
              style={styles.textarea} 
              placeholder="How was your day? What did you accomplish?" 
              value={form.journal_text} 
              onChange={(e) => setForm({ ...form, journal_text: e.target.value })} 
              rows={4} 
            />
            
            <div style={styles.row}>
              <div>
                <label style={styles.label}>Wins</label>
                <input 
                  style={styles.input} 
                  placeholder="What went well?" 
                  value={form.wins} 
                  onChange={(e) => setForm({ ...form, wins: e.target.value })} 
                />
              </div>
              <div>
                <label style={styles.label}>Challenges</label>
                <input 
                  style={styles.input} 
                  placeholder="What was hard?" 
                  value={form.challenges} 
                  onChange={(e) => setForm({ ...form, challenges: e.target.value })} 
                />
              </div>
            </div>
            
            <p style={styles.helperText}>Productivity score is calculated automatically based on your entry</p>
            
            <div style={styles.btnRow}>
              <button type="submit" style={styles.primaryBtn}>Save Entry</button>
              <button type="button" onClick={() => setShowForm(false)} style={styles.secondaryBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.entriesList}>
        {journals.length === 0 ? (
          <div style={styles.empty}>No journal entries yet — start writing today</div>
        ) : (
          journals.map((j) => (
            <div key={j.id} style={styles.entryCard}>
              <div style={styles.entryHeader}>
                <span style={styles.entryDate}>{j.entry_date}</span>
                <div style={styles.actionGroup}>
                  <div style={{
                    ...styles.scoreCircle,
                    background: j.productivity_score >= 7 ? "#10b981" : j.productivity_score >= 4 ? "#8b5cf6" : "#ef4444"
                  }}>
                    Score: {j.productivity_score}/10
                  </div>
                  <button 
                    onClick={() => editingId === j.id ? setEditingId(null) : handleEdit(j)} 
                    style={styles.editBtn}
                  >
                    {editingId === j.id ? "Close" : "Edit"}
                  </button>
                  <button onClick={() => handleDelete(j.entry_date)} style={styles.deleteBtn}>
                    Delete
                  </button>
                </div>
              </div>

              {editingId === j.id ? (
                <div style={styles.editForm}>
                  <textarea 
                    style={styles.textarea} 
                    value={editForm.journal_text} 
                    onChange={(e) => setEditForm({ ...editForm, journal_text: e.target.value })} 
                    rows={3} 
                    placeholder="Journal text" 
                  />
                  <div style={styles.editRow}>
                    <input 
                      style={styles.input} 
                      value={editForm.wins} 
                      onChange={(e) => setEditForm({ ...editForm, wins: e.target.value })} 
                      placeholder="Wins" 
                    />
                    <input 
                      style={styles.input} 
                      value={editForm.challenges} 
                      onChange={(e) => setEditForm({ ...editForm, challenges: e.target.value })} 
                      placeholder="Challenges" 
                    />
                  </div>
                  <div style={styles.btnRow}>
                    <button onClick={() => handleSaveEdit(j.entry_date)} style={styles.primaryBtn}>Save</button>
                    <button onClick={() => setEditingId(null)} style={styles.secondaryBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {j.journal_text && <p style={styles.entryText}>{j.journal_text}</p>}
                  <div style={styles.entryFooter}>
                    {j.wins && <span style={styles.winTag}>Wins: {j.wins}</span>}
                    {j.challenges && <span style={styles.challengeTag}>Challenges: {j.challenges}</span>}
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
  container: {
    padding: "32px 24px",
    maxWidth: 900,
    margin: "0 auto",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "28px",
    marginBottom: 32,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    marginTop: 0,
    marginBottom: 20,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 8,
    letterSpacing: "0.3px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: 10,
    fontSize: 14,
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
    marginBottom: 12,
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: 10,
    fontSize: 14,
    color: "#1e293b",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    marginBottom: 12,
    fontFamily: "inherit",
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    margin: "8px 0",
  },
  btnRow: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    transition: "background 0.2s",
  },
  secondaryBtn: {
    background: "#ffffff",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s",
  },
  entriesList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  empty: {
    textAlign: "center",
    color: "#64748b",
    padding: "60px 20px",
    fontSize: 16,
    background: "#ffffff",
    borderRadius: 20,
    border: "1px solid #e2e8f0",
  },
  entryCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "24px",
    transition: "box-shadow 0.2s",
  },
  entryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 12,
  },
  entryDate: {
    fontWeight: 700,
    color: "#3b82f6",
    fontSize: 15,
  },
  actionGroup: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  scoreCircle: {
    color: "white",
    fontWeight: 700,
    fontSize: 12,
    padding: "4px 12px",
    borderRadius: 20,
  },
  entryText: {
    color: "#475569",
    lineHeight: 1.6,
    fontSize: 14,
    marginBottom: 16,
  },
  entryFooter: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  winTag: {
    background: "#f0fdf4",
    color: "#10b981",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid #d1fae5",
  },
  challengeTag: {
    background: "#f5f3ff",
    color: "#8b5cf6",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid #ede9fe",
  },
  editBtn: {
    background: "#eff6ff",
    color: "#3b82f6",
    border: "1px solid #bfdbfe",
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  editForm: {
    marginTop: 16,
  },
  editRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 12,
  },
  deleteBtn: {
    background: "#fef2f2",
    color: "#ef4444",
    border: "1px solid #fee2e2",
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.2s",
  },
};

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  input:focus, textarea:focus {
    border-color: #3b82f6 !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  .primary-btn:hover {
    background: #2563eb !important;
  }
  .secondary-btn:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
  }
  .edit-btn:hover {
    background: #dbeafe !important;
  }
  .delete-btn:hover {
    background: #fee2e2 !important;
  }
  .entry-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;
document.head.appendChild(styleSheet);