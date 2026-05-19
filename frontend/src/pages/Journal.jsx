import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getJournals, createJournal, updateJournal, deleteJournal } from "../services/api";

export default function Journal() {
  const [journals, setJournals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [moodFilter, setMoodFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, avgScore: 0, bestStreak: 0 });
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    journal_text: "",
    wins: "",
    challenges: "",
    mood: "neutral"
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
    
    // Calculate best streak
    let currentStreak = 0;
    let bestStreak = 0;
    const dates = journals.map(j => j.entry_date).sort();
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(dates[i-1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, currentStreak);
    }
    
    setStats({ total, avgScore, bestStreak });
  };

  const calculateProductivityScore = (formData) => {
    const hasWins = formData.wins.length > 0;
    const hasChallenges = formData.challenges.length > 0;
    const textLength = formData.journal_text.length;
    let score = 5;
    
    if (hasWins && !hasChallenges) score = 8;
    if (hasWins && hasChallenges) score = 6;
    if (!hasWins && hasChallenges) score = 4;
    if (textLength > 200) score = Math.min(score + 1, 10);
    
    // Mood bonus
    if (formData.mood === "excited") score = Math.min(score + 2, 10);
    if (formData.mood === "happy") score = Math.min(score + 1, 10);
    if (formData.mood === "sad") score = Math.max(score - 1, 1);
    
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
        mood: "neutral"
      });
      
      // Add XP for journal entry
      const currentXP = parseInt(localStorage.getItem("user_xp") || "0");
      const newXP = currentXP + 15;
      localStorage.setItem("user_xp", newXP);
      
      toast.success(`✨ Journal saved! Score: ${score}/10 +15 XP`);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error("📝 Entry exists for today — use edit instead");
      } else {
        toast.error("Failed to save journal");
      }
    }
  };

  const handleSaveEdit = async (entryDate) => {
    const score = calculateProductivityScore(editForm);
    try {
      const res = await updateJournal(entryDate, { ...editForm, productivity_score: score });
      setJournals(journals.map(j => j.entry_date === entryDate ? res.data : j));
      setEditingId(null);
      toast.success(`✏️ Journal updated! New score: ${score}/10`);
    } catch {
      toast.error("Failed to update journal");
    }
  };

  const handleDelete = async (entryDate) => {
    if (!window.confirm("🗑️ Delete this journal entry? This action cannot be undone.")) return;
    try {
      await deleteJournal(entryDate);
      setJournals(journals.filter(j => j.entry_date !== entryDate));
      toast.success("Journal entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const getMoodEmoji = (score) => {
    if (score >= 8) return "😊";
    if (score >= 6) return "🙂";
    if (score >= 4) return "😐";
    return "😔";
  };

  const getMoodColor = (score) => {
    if (score >= 8) return "#43e97b";
    if (score >= 6) return "#00d2ff";
    if (score >= 4) return "#feca57";
    return "#ff6b6b";
  };

  const filteredJournals = moodFilter === "all" 
    ? journals 
    : journals.filter(j => {
        if (moodFilter === "good") return j.productivity_score >= 7;
        if (moodFilter === "ok") return j.productivity_score >= 4 && j.productivity_score < 7;
        if (moodFilter === "bad") return j.productivity_score < 4;
        return true;
      });

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner}></div>
      <div style={styles.loadingText}>Loading your journal... 📖</div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📝</span>
          <div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Entries</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>⭐</span>
          <div>
            <div style={styles.statValue}>{stats.avgScore}</div>
            <div style={styles.statLabel}>Avg Score</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🔥</span>
          <div>
            <div style={styles.statValue}>{stats.bestStreak}</div>
            <div style={styles.statLabel}>Best Streak</div>
          </div>
        </div>
      </div>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📖 Reflection Journal</h1>
          <p style={styles.subtitle}>Track your journey, celebrate wins, learn from challenges</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.primaryBtn}>
          {showForm ? "✕ Cancel" : "+ New Entry +15 XP"}
        </button>
      </div>

      {/* Mood Filter */}
      <div style={styles.filterBar}>
        <button 
          onClick={() => setMoodFilter("all")} 
          style={{ ...styles.filterBtn, ...(moodFilter === "all" && styles.filterBtnActive) }}
        >
          All Entries
        </button>
        <button 
          onClick={() => setMoodFilter("good")} 
          style={{ ...styles.filterBtn, ...(moodFilter === "good" && styles.filterBtnActive) }}
        >
          😊 Good Days (7-10)
        </button>
        <button 
          onClick={() => setMoodFilter("ok")} 
          style={{ ...styles.filterBtn, ...(moodFilter === "ok" && styles.filterBtnActive) }}
        >
          🙂 OK Days (4-6)
        </button>
        <button 
          onClick={() => setMoodFilter("bad")} 
          style={{ ...styles.filterBtn, ...(moodFilter === "bad" && styles.filterBtnActive) }}
        >
          😔 Tough Days (1-3)
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>✨ New Journal Entry</h3>
            <span style={styles.cardBadge}>+15 XP</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>📅 Date</label>
                <input 
                  style={styles.input} 
                  type="date" 
                  value={form.entry_date} 
                  onChange={(e) => setForm({ ...form, entry_date: e.target.value })} 
                  required 
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>🎭 How are you feeling?</label>
                <select 
                  style={styles.input} 
                  value={form.mood} 
                  onChange={(e) => setForm({ ...form, mood: e.target.value })}
                >
                  <option value="excited">🤩 Excited</option>
                  <option value="happy">😊 Happy</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="sad">😔 Sad</option>
                  <option value="stressed">😫 Stressed</option>
                </select>
              </div>
            </div>
            
            <label style={styles.label}>📝 Journal Entry</label>
            <textarea 
              style={styles.textarea} 
              placeholder="How was your day? What did you accomplish? What are you grateful for?" 
              value={form.journal_text} 
              onChange={(e) => setForm({ ...form, journal_text: e.target.value })} 
              rows={5} 
            />
            
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>🏆 Wins (What went well?)</label>
                <input 
                  style={styles.input} 
                  placeholder="e.g., Completed project, Exercised, Learned something new" 
                  value={form.wins} 
                  onChange={(e) => setForm({ ...form, wins: e.target.value })} 
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>⚡ Challenges (What was hard?)</label>
                <input 
                  style={styles.input} 
                  placeholder="e.g., Missed deadline, Felt tired, Technical issues" 
                  value={form.challenges} 
                  onChange={(e) => setForm({ ...form, challenges: e.target.value })} 
                />
              </div>
            </div>
            
            <div style={styles.scorePreview}>
              <span>✨ Estimated Productivity Score: </span>
              <strong style={{ color: "#00d2ff" }}>{calculateProductivityScore(form)}/10</strong>
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
            <div style={styles.emptyIcon}>📖</div>
            <div style={styles.emptyText}>No journal entries yet — start your reflection journey today!</div>
            <button onClick={() => setShowForm(true)} style={styles.emptyBtn}>Write First Entry →</button>
          </div>
        ) : (
          filteredJournals.map((j, index) => (
            <div key={j.id} style={styles.entryCard}>
              <div style={styles.entryHeader}>
                <div style={styles.entryDateSection}>
                  <span style={styles.entryNumber}>#{journals.length - index}</span>
                  <span style={styles.entryDate}>📅 {j.entry_date}</span>
                </div>
                <div style={styles.entryActions}>
                  <div style={{ ...styles.scoreBadge, background: getMoodColor(j.productivity_score) }}>
                    {getMoodEmoji(j.productivity_score)} {j.productivity_score}/10
                  </div>
                  <button onClick={() => editingId === j.id ? setEditingId(null) : handleEdit(j)} style={styles.editBtn}>
                    {editingId === j.id ? "✕" : "✏️"}
                  </button>
                  <button onClick={() => handleDelete(j.entry_date)} style={styles.deleteBtn}>🗑️</button>
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
                      placeholder="🏆 Wins" 
                    />
                    <input 
                      style={styles.input} 
                      value={editForm.challenges || ""} 
                      onChange={(e) => setEditForm({ ...editForm, challenges: e.target.value })} 
                      placeholder="⚡ Challenges" 
                    />
                  </div>
                  <div style={styles.scorePreview}>
                    <span>Updated Score: </span>
                    <strong style={{ color: "#00d2ff" }}>{calculateProductivityScore(editForm)}/10</strong>
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
                      <span style={styles.quoteIcon}>"</span>
                      {j.journal_text}
                      <span style={styles.quoteIcon}>"</span>
                    </div>
                  )}
                  <div style={styles.entryFooter}>
                    {j.wins && (
                      <div style={styles.winBox}>
                        <span style={styles.winIcon}>🏆</span>
                        <span style={styles.winText}>{j.wins}</span>
                      </div>
                    )}
                    {j.challenges && (
                      <div style={styles.challengeBox}>
                        <span style={styles.challengeIcon}>⚡</span>
                        <span style={styles.challengeText}>{j.challenges}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Inspiration Quote */}
      <div style={styles.quoteCard}>
        <span style={styles.quoteEmoji}>💭</span>
        <div style={styles.quoteText}>
          "The journey of a thousand miles begins with a single step. Every journal entry is a step toward self-discovery."
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: "100vh", 
    background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)", 
    padding: "20px 16px", 
    maxWidth: 1000, 
    margin: "0 auto",
    fontFamily: "'Inter', 'Segoe UI', sans-serif"
  },
  
  loadingContainer: { 
    display: "flex", 
    flexDirection: "column",
    alignItems: "center", 
    justifyContent: "center", 
    height: "100vh", 
    background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
    gap: 20
  },
  
  loadingSpinner: { 
    width: 60, 
    height: 60, 
    border: "4px solid rgba(0,210,255,0.1)", 
    borderTop: "4px solid #00d2ff", 
    borderRadius: "50%", 
    animation: "spin 1s linear infinite" 
  },
  
  loadingText: { 
    fontSize: 18, 
    color: "#00d2ff",
    fontWeight: 600,
    textShadow: "0 0 10px rgba(0,210,255,0.5)"
  },
  
  statsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
    marginBottom: 24
  },
  
  statCard: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0,210,255,0.15)",
    borderRadius: 16,
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    transition: "transform 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)"
    }
  },
  
  statIcon: {
    fontSize: 32
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: 800,
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4
  },
  
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 24, 
    flexWrap: "wrap", 
    gap: 16 
  },
  
  title: { 
    fontSize: 28, 
    fontWeight: 800, 
    margin: 0,
    background: "linear-gradient(135deg, #e2e8f0, #00d2ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  
  subtitle: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 4
  },
  
  filterBar: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap"
  },
  
  filterBtn: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(0,210,255,0.2)",
    color: "#94a3b8",
    padding: "8px 16px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s ease"
  },
  
  filterBtnActive: {
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    color: "white",
    borderColor: "transparent"
  },
  
  primaryBtn: { 
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", 
    color: "white", 
    border: "none", 
    borderRadius: 12, 
    padding: "10px 20px", 
    fontWeight: 700, 
    cursor: "pointer", 
    fontSize: 14,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 5px 20px rgba(0,210,255,0.4)"
    }
  },
  
  secondaryBtn: { 
    background: "rgba(255,255,255,0.05)", 
    color: "#94a3b8", 
    border: "1px solid rgba(255,255,255,0.1)", 
    borderRadius: 10, 
    padding: "10px 20px", 
    fontWeight: 600, 
    cursor: "pointer", 
    fontSize: 14,
    transition: "all 0.2s ease"
  },
  
  card: { 
    background: "rgba(255,255,255,0.03)", 
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0,210,255,0.15)", 
    borderRadius: 20, 
    padding: "24px", 
    marginBottom: 24 
  },
  
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  
  cardTitle: { 
    fontSize: 20, 
    fontWeight: 700, 
    margin: 0,
    color: "#e2e8f0"
  },
  
  cardBadge: {
    background: "rgba(0,210,255,0.1)",
    color: "#00d2ff",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600
  },
  
  row: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: 16, 
    marginBottom: 16 
  },
  
  field: { 
    display: "flex", 
    flexDirection: "column", 
    gap: 6 
  },
  
  label: { 
    fontSize: 13, 
    fontWeight: 600, 
    color: "#94a3b8",
    marginBottom: 4
  },
  
  input: { 
    padding: "12px 14px", 
    border: "1px solid rgba(0,210,255,0.2)", 
    borderRadius: 10, 
    fontSize: 14, 
    outline: "none", 
    width: "100%", 
    boxSizing: "border-box", 
    background: "rgba(255,255,255,0.05)", 
    color: "#e2e8f0",
    transition: "border-color 0.2s ease",
    ":focus": {
      borderColor: "#00d2ff"
    }
  },
  
  textarea: { 
    width: "100%", 
    padding: "12px 14px", 
    border: "1px solid rgba(0,210,255,0.2)", 
    borderRadius: 10, 
    fontSize: 14, 
    outline: "none", 
    resize: "vertical", 
    boxSizing: "border-box", 
    marginBottom: 16, 
    background: "rgba(255,255,255,0.05)", 
    color: "#e2e8f0",
    fontFamily: "inherit"
  },
  
  scorePreview: {
    background: "rgba(0,210,255,0.05)",
    padding: "10px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center"
  },
  
  btnRow: { 
    display: "flex", 
    gap: 10, 
    marginTop: 8 
  },
  
  entriesList: { 
    display: "flex", 
    flexDirection: "column", 
    gap: 16 
  },
  
  empty: { 
    textAlign: "center", 
    padding: "60px 20px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    border: "1px solid rgba(0,210,255,0.1)"
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  
  emptyText: {
    color: "#64748b",
    fontSize: 16,
    marginBottom: 20
  },
  
  emptyBtn: {
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer"
  },
  
  entryCard: { 
    background: "rgba(255,255,255,0.03)", 
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0,210,255,0.15)", 
    borderRadius: 16, 
    padding: "20px 24px",
    transition: "transform 0.2s ease",
    ":hover": {
      transform: "translateX(4px)",
      boxShadow: "0 8px 32px rgba(0,210,255,0.1)"
    }
  },
  
  entryHeader: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 16, 
    flexWrap: "wrap", 
    gap: 12 
  },
  
  entryDateSection: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  
  entryNumber: {
    background: "rgba(0,210,255,0.1)",
    color: "#00d2ff",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700
  },
  
  entryDate: { 
    fontWeight: 700, 
    color: "#00d2ff", 
    fontSize: 14 
  },
  
  entryActions: {
    display: "flex",
    gap: 8,
    alignItems: "center"
  },
  
  scoreBadge: { 
    color: "white", 
    fontWeight: 800, 
    fontSize: 12, 
    padding: "4px 12px", 
    borderRadius: 20,
    background: "#00d2ff"
  },
  
  entryText: { 
    color: "#e2e8f0", 
    lineHeight: 1.6, 
    fontSize: 14, 
    marginBottom: 16,
    position: "relative",
    padding: "0 16px"
  },
  
  quoteIcon: {
    color: "#00d2ff",
    opacity: 0.5,
    fontSize: 20,
    fontFamily: "Georgia, serif"
  },
  
  entryFooter: { 
    display: "flex", 
    gap: 12, 
    flexWrap: "wrap",
    marginTop: 8
  },
  
  winBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(67,233,123,0.05)",
    border: "1px solid rgba(67,233,123,0.2)",
    padding: "8px 12px",
    borderRadius: 12,
    flex: 1
  },
  
  winIcon: {
    fontSize: 16
  },
  
  winText: {
    color: "#43e97b",
    fontSize: 13,
    fontWeight: 500
  },
  
  challengeBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(167,139,250,0.05)",
    border: "1px solid rgba(167,139,250,0.2)",
    padding: "8px 12px",
    borderRadius: 12,
    flex: 1
  },
  
  challengeIcon: {
    fontSize: 16
  },
  
  challengeText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: 500
  },
  
  editBtn: { 
    background: "rgba(0,210,255,0.1)", 
    color: "#00d2ff", 
    border: "1px solid rgba(0,210,255,0.2)", 
    borderRadius: 8, 
    padding: "6px 12px", 
    cursor: "pointer", 
    fontSize: 12, 
    fontWeight: 600,
    transition: "all 0.2s ease"
  },
  
  editForm: { 
    marginTop: 16 
  },
  
  deleteBtn: { 
    background: "rgba(255,100,100,0.1)", 
    color: "#ff6b6b", 
    border: "1px solid rgba(255,100,100,0.2)", 
    borderRadius: 8, 
    padding: "6px 12px", 
    cursor: "pointer", 
    fontSize: 12, 
    fontWeight: 600,
    transition: "all 0.2s ease"
  },
  
  quoteCard: {
    marginTop: 24,
    padding: "20px",
    background: "linear-gradient(135deg, rgba(0,210,255,0.05), rgba(123,47,247,0.05))",
    borderRadius: 16,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap"
  },
  
  quoteEmoji: {
    fontSize: 32
  },
  
  quoteText: {
    color: "#94a3b8",
    fontSize: 14,
    fontStyle: "italic",
    maxWidth: "80%"
  }
};

// Add keyframes animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);