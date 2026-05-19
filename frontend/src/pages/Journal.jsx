// Journal.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getJournals, createJournal, updateJournal, deleteJournal } from "../services/api";

export default function Journal() {
  const [journals, setJournals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, avgScore: 0 });
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    journal_text: "",
    wins: "",
    challenges: "",
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [journals]);

  const fetchJournals = async () => {
    try {
      const res = await getJournals();
      setJournals(res.data || []);
    } catch (err) {
      console.error("Failed to fetch journals", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = journals.length;
    const avgScore = total > 0 
      ? (journals.reduce((sum, j) => sum + (j.productivity_score || 0), 0) / total).toFixed(1)
      : 0;
    
    setStats({ total, avgScore });
  };

  const calculateProductivityScore = (formData) => {
    const hasWins = formData.wins && formData.wins.length > 0;
    const hasChallenges = formData.challenges && formData.challenges.length > 0;
    const textLength = formData.journal_text.length;
    let score = 5;
    
    if (hasWins && !hasChallenges) score = 8;
    if (hasWins && hasChallenges) score = 6;
    if (!hasWins && hasChallenges) score = 4;
    if (textLength > 200) score = Math.min(score + 1, 10);
    
    return score;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const score = calculateProductivityScore(form);
    
    try {
      const res = await createJournal({ ...form, productivity_score: score });
      setJournals([res.data, ...journals]);
      setShowForm(false);
      setForm({ 
        entry_date: new Date().toISOString().split("T")[0], 
        journal_text: "", 
        wins: "", 
        challenges: "",
      });
      
      toast.success(`Journal saved. Score: ${score}/10`);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error("Entry exists for today. Use edit instead");
      } else {
        toast.error("Failed to save journal");
      }
    }
  };

  const handleEdit = (journal) => {
    setEditingId(journal.id);
    setEditForm({ 
      journal_text: journal.journal_text || "", 
      wins: journal.wins || "", 
      challenges: journal.challenges || "" 
    });
  };

  const handleSaveEdit = async (entryDate) => {
    const score = calculateProductivityScore(editForm);
    try {
      const res = await updateJournal(entryDate, { ...editForm, productivity_score: score });
      setJournals(journals.map(j => j.entry_date === entryDate ? res.data : j));
      setEditingId(null);
      toast.success(`Journal updated. New score: ${score}/10`);
    } catch (error) {
      toast.error("Failed to update journal");
    }
  };

  const handleDelete = async (entryDate) => {
    if (!window.confirm("Delete this journal entry? This action cannot be undone.")) return;
    try {
      await deleteJournal(entryDate);
      setJournals(journals.filter(j => j.entry_date !== entryDate));
      toast.success("Journal entry deleted");
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "#00cc66";
    if (score >= 6) return "#0066cc";
    if (score >= 4) return "#888888";
    return "#ff4444";
  };

  const filteredJournals = filter === "all" 
    ? journals 
    : journals.filter(j => {
        if (filter === "high") return j.productivity_score >= 7;
        if (filter === "medium") return j.productivity_score >= 4 && j.productivity_score < 7;
        if (filter === "low") return j.productivity_score < 4;
        return true;
      });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const getStyles = () => {
    const isDark = theme === "dark";
    
    return {
      container: { 
        minHeight: "100vh", 
        background: isDark ? "#000000" : "#ffffff", 
        padding: "20px 24px", 
        marginLeft: "260px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        transition: "all 0.3s ease",
      },
      topBar: {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 24,
      },
      themeToggle: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: "8px 16px",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: isDark ? "#ffffff" : "#000000",
      },
      loadingContainer: { 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh", 
        background: isDark ? "#000000" : "#ffffff",
        marginLeft: "260px",
        gap: 20,
      },
      loadingSpinner: { 
        width: 40, 
        height: 40, 
        border: `3px solid ${isDark ? "#333333" : "#e0e0e0"}`, 
        borderTop: "3px solid #0066cc", 
        borderRadius: "50%", 
        animation: "spin 1s linear infinite" 
      },
      loadingText: { 
        fontSize: 16, 
        color: isDark ? "#ffffff" : "#000000",
      },
      statsBar: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 16,
        marginBottom: 24,
      },
      statCard: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 12,
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      },
      statValue: {
        fontSize: 24,
        fontWeight: 700,
        color: "#0066cc",
      },
      statLabel: {
        fontSize: 12,
        color: isDark ? "#888888" : "#666666",
        marginTop: 4,
      },
      header: { 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 24, 
        flexWrap: "wrap", 
        gap: 16,
      },
      title: { 
        fontSize: 24, 
        fontWeight: 700, 
        margin: 0,
        color: isDark ? "#ffffff" : "#000000",
      },
      subtitle: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
        marginTop: 4,
      },
      filterBar: {
        display: "flex",
        gap: 12,
        marginBottom: 24,
        flexWrap: "wrap",
      },
      filterBtn: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        color: isDark ? "#888888" : "#666666",
        padding: "6px 16px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
      },
      filterBtnActive: {
        background: "#0066cc",
        color: "#ffffff",
        borderColor: "#0066cc",
      },
      primaryBtn: { 
        background: "#0066cc", 
        color: "#ffffff", 
        border: "none", 
        borderRadius: 8, 
        padding: "10px 20px", 
        fontWeight: 600, 
        cursor: "pointer", 
        fontSize: 14,
      },
      secondaryBtn: { 
        background: "none", 
        color: isDark ? "#888888" : "#666666", 
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`, 
        borderRadius: 8, 
        padding: "10px 20px", 
        fontWeight: 500, 
        cursor: "pointer", 
        fontSize: 14,
      },
      card: { 
        background: isDark ? "#1a1a1a" : "#f5f5f5", 
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`, 
        borderRadius: 12, 
        padding: "24px", 
        marginBottom: 24,
      },
      cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      },
      cardTitle: { 
        fontSize: 18, 
        fontWeight: 600, 
        margin: 0,
        color: isDark ? "#ffffff" : "#000000",
      },
      cardBadge: {
        background: isDark ? "#000000" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        color: "#0066cc",
        padding: "4px 12px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
      },
      row: { 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: 16, 
        marginBottom: 16,
      },
      field: { 
        display: "flex", 
        flexDirection: "column", 
        gap: 6,
      },
      label: { 
        fontSize: 13, 
        fontWeight: 500, 
        color: isDark ? "#888888" : "#666666",
      },
      input: { 
        padding: "10px 12px", 
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`, 
        borderRadius: 6, 
        fontSize: 14, 
        outline: "none", 
        width: "100%", 
        boxSizing: "border-box", 
        background: isDark ? "#000000" : "#ffffff", 
        color: isDark ? "#ffffff" : "#000000",
      },
      textarea: { 
        width: "100%", 
        padding: "10px 12px", 
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`, 
        borderRadius: 6, 
        fontSize: 14, 
        outline: "none", 
        resize: "vertical", 
        boxSizing: "border-box", 
        marginBottom: 16, 
        background: isDark ? "#000000" : "#ffffff", 
        color: isDark ? "#ffffff" : "#000000",
        fontFamily: "inherit",
      },
      scorePreview: {
        background: isDark ? "#000000" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        padding: "10px",
        borderRadius: 6,
        marginBottom: 16,
        fontSize: 13,
        color: isDark ? "#888888" : "#666666",
        textAlign: "center",
      },
      btnRow: { 
        display: "flex", 
        gap: 10, 
        marginTop: 8,
      },
      entriesList: { 
        display: "flex", 
        flexDirection: "column", 
        gap: 16,
      },
      empty: { 
        textAlign: "center", 
        padding: "60px 20px",
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        borderRadius: 12,
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
      },
      emptyText: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
        marginBottom: 20,
      },
      emptyBtn: {
        background: "#0066cc",
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        fontWeight: 500,
        cursor: "pointer",
      },
      entryCard: { 
        background: isDark ? "#1a1a1a" : "#f5f5f5", 
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`, 
        borderRadius: 12, 
        padding: "20px 24px",
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
        fontWeight: 600, 
        color: "#0066cc", 
        fontSize: 14,
      },
      entryActions: {
        display: "flex",
        gap: 8,
        alignItems: "center",
      },
      scoreBadge: { 
        color: "#ffffff", 
        fontWeight: 600, 
        fontSize: 12, 
        padding: "4px 12px", 
        borderRadius: 6,
      },
      entryText: { 
        color: isDark ? "#ffffff" : "#000000", 
        lineHeight: 1.6, 
        fontSize: 14, 
        marginBottom: 16,
        padding: "0 8px",
      },
      entryFooter: { 
        display: "flex", 
        gap: 12, 
        flexWrap: "wrap",
        marginTop: 8,
      },
      winBox: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(0,102,204,0.1)",
        border: "1px solid rgba(0,102,204,0.2)",
        padding: "8px 12px",
        borderRadius: 8,
        flex: 1,
      },
      winText: {
        color: "#0066cc",
        fontSize: 13,
        fontWeight: 500,
      },
      challengeBox: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: isDark ? "#000000" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        padding: "8px 12px",
        borderRadius: 8,
        flex: 1,
      },
      challengeText: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 13,
        fontWeight: 500,
      },
      editBtn: { 
        background: "none", 
        color: "#0066cc", 
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`, 
        borderRadius: 6, 
        padding: "4px 10px", 
        cursor: "pointer", 
        fontSize: 12, 
        fontWeight: 500,
      },
      editForm: { 
        marginTop: 16,
      },
      deleteBtn: { 
        background: "none", 
        color: "#ff4444", 
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`, 
        borderRadius: 6, 
        padding: "4px 10px", 
        cursor: "pointer", 
        fontSize: 12, 
        fontWeight: 500,
      },
      quoteCard: {
        marginTop: 24,
        padding: "20px",
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 12,
        textAlign: "center",
      },
      quoteText: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
        fontStyle: "italic",
      },
    };
  };

  const styles = getStyles();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading journal...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={toggleTheme} style={styles.themeToggle}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>

      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Entries</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div>
            <div style={styles.statValue}>{stats.avgScore}</div>
            <div style={styles.statLabel}>Average Score</div>
          </div>
        </div>
      </div>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Journal</h1>
          <p style={styles.subtitle}>Track your journey, celebrate wins, learn from challenges</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.primaryBtn}>
          {showForm ? "Cancel" : "New Entry"}
        </button>
      </div>

      <div style={styles.filterBar}>
        <button 
          onClick={() => setFilter("all")} 
          style={{ ...styles.filterBtn, ...(filter === "all" && styles.filterBtnActive) }}
        >
          All Entries
        </button>
        <button 
          onClick={() => setFilter("high")} 
          style={{ ...styles.filterBtn, ...(filter === "high" && styles.filterBtnActive) }}
        >
          High Score (7-10)
        </button>
        <button 
          onClick={() => setFilter("medium")} 
          style={{ ...styles.filterBtn, ...(filter === "medium" && styles.filterBtnActive) }}
        >
          Medium Score (4-6)
        </button>
        <button 
          onClick={() => setFilter("low")} 
          style={{ ...styles.filterBtn, ...(filter === "low" && styles.filterBtnActive) }}
        >
          Low Score (1-3)
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>New Journal Entry</h3>
            <span style={styles.cardBadge}>Auto-scored</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Date</label>
                <input 
                  style={styles.input} 
                  type="date" 
                  value={form.entry_date} 
                  onChange={(e) => setForm({ ...form, entry_date: e.target.value })} 
                  required 
                />
              </div>
            </div>
            
            <label style={styles.label}>Journal Entry</label>
            <textarea 
              style={styles.textarea} 
              placeholder="How was your day? What did you accomplish? What are you grateful for?" 
              value={form.journal_text} 
              onChange={(e) => setForm({ ...form, journal_text: e.target.value })} 
              rows={5} 
            />
            
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Wins (What went well?)</label>
                <input 
                  style={styles.input} 
                  placeholder="Completed project, Exercised, Learned something new" 
                  value={form.wins} 
                  onChange={(e) => setForm({ ...form, wins: e.target.value })} 
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Challenges (What was hard?)</label>
                <input 
                  style={styles.input} 
                  placeholder="Missed deadline, Felt tired, Technical issues" 
                  value={form.challenges} 
                  onChange={(e) => setForm({ ...form, challenges: e.target.value })} 
                />
              </div>
            </div>
            
            <div style={styles.scorePreview}>
              Estimated Productivity Score: <strong>{calculateProductivityScore(form)}/10</strong>
            </div>
            
            <div style={styles.btnRow}>
              <button type="submit" style={styles.primaryBtn}>Save Entry</button>
              <button type="button" onClick={() => setShowForm(false)} style={styles.secondaryBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.entriesList}>
        {filteredJournals.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyText}>No journal entries yet. Start your reflection journey today</div>
            <button onClick={() => setShowForm(true)} style={styles.emptyBtn}>Write First Entry</button>
          </div>
        ) : (
          filteredJournals.map((j, index) => (
            <div key={j.id} style={styles.entryCard}>
              <div style={styles.entryHeader}>
                <span style={styles.entryDate}>{j.entry_date}</span>
                <div style={styles.entryActions}>
                  <div style={{ ...styles.scoreBadge, background: getScoreColor(j.productivity_score) }}>
                    Score: {j.productivity_score}/10
                  </div>
                  <button onClick={() => editingId === j.id ? setEditingId(null) : handleEdit(j)} style={styles.editBtn}>
                    {editingId === j.id ? "Cancel" : "Edit"}
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
                  <div style={styles.row}>
                    <input 
                      style={styles.input} 
                      value={editForm.wins || ""} 
                      onChange={(e) => setEditForm({ ...editForm, wins: e.target.value })} 
                      placeholder="Wins" 
                    />
                    <input 
                      style={styles.input} 
                      value={editForm.challenges || ""} 
                      onChange={(e) => setEditForm({ ...editForm, challenges: e.target.value })} 
                      placeholder="Challenges" 
                    />
                  </div>
                  <div style={styles.scorePreview}>
                    Updated Score: <strong>{calculateProductivityScore(editForm)}/10</strong>
                  </div>
                  <div style={styles.btnRow}>
                    <button onClick={() => handleSaveEdit(j.entry_date)} style={styles.primaryBtn}>Save Changes</button>
                    <button onClick={() => setEditingId(null)} style={styles.secondaryBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {j.journal_text && (
                    <div style={styles.entryText}>
                      {j.journal_text}
                    </div>
                  )}
                  <div style={styles.entryFooter}>
                    {j.wins && (
                      <div style={styles.winBox}>
                        <span style={styles.winText}>Win: {j.wins}</span>
                      </div>
                    )}
                    {j.challenges && (
                      <div style={styles.challengeBox}>
                        <span style={styles.challengeText}>Challenge: {j.challenges}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.quoteCard}>
        <div style={styles.quoteText}>
          "The journey of a thousand miles begins with a single step. Every journal entry is a step toward self-discovery."
        </div>
      </div>
    </div>
  );
}