import { useState } from "react";
import { generateWeeklyPlan, dailyCheckin, suggestActions, weeklySummary } from "../services/api";
import toast from "react-hot-toast";

export default function AICoach() {
  const [activeTab, setActiveTab] = useState("plan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [goals, setGoals] = useState("");
  const [checkinForm, setCheckinForm] = useState({ journal_text: "", productivity_score: 7 });
  const [actionForm, setActionForm] = useState({ todays_journal: "" });

  const handleGeneratePlan = async () => {
    if (!goals.trim()) return toast.error("Please enter your goals");
    setLoading(true);
    try {
      const res = await generateWeeklyPlan({ goals });
      setResult(res.data.ai_plan);
      toast.success("Plan generated! 🤖");
    } catch { toast.error("AI service failed"); }
    finally { setLoading(false); }
  };

  const handleCheckin = async () => {
    setLoading(true);
    try {
      const res = await dailyCheckin(checkinForm);
      setResult(res.data.ai_feedback);
      toast.success("Check-in complete! 🎯");
    } catch { toast.error("AI service failed"); }
    finally { setLoading(false); }
  };

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await suggestActions(actionForm);
      setResult(res.data.ai_suggestions);
      toast.success("Suggestions ready! 💡");
    } catch { toast.error("AI service failed"); }
    finally { setLoading(false); }
  };

  const handleSummary = async () => {
    setLoading(true);
    try {
      const res = await weeklySummary();
      setResult(res.data.ai_summary);
      toast.success("Summary ready! 📊");
    } catch { toast.error("AI service failed"); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: "plan", label: "📅 Weekly Plan" },
    { id: "checkin", label: "🎯 Daily Check-in" },
    { id: "suggest", label: "💡 Next Actions" },
    { id: "summary", label: "📊 Weekly Summary" },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🤖 AI Coach</h1>
      <p style={styles.subtitle}>Your personal AI productivity coach</p>

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(""); }} style={{ ...styles.tab, ...(activeTab === tab.id ? styles.activeTab : {}) }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {activeTab === "plan" && (
          <div>
            <h3 style={styles.cardTitle}>Generate Your Weekly Plan</h3>
            <p style={styles.hint}>Tell the AI your goals and it will create a structured plan for you</p>
            <textarea style={styles.textarea} placeholder="e.g. Learn React, exercise 3 times, finish project report, read 30 mins daily..." value={goals} onChange={(e) => setGoals(e.target.value)} rows={4} />
            <button onClick={handleGeneratePlan} disabled={loading} style={styles.aiBtn}>{loading ? "🤖 Generating..." : "🚀 Generate My Plan"}</button>
          </div>
        )}

        {activeTab === "checkin" && (
          <div>
            <h3 style={styles.cardTitle}>Daily Check-in</h3>
            <p style={styles.hint}>Tell the AI how your day went and get personalized feedback</p>
            <label style={styles.label}>How was your day?</label>
            <textarea style={styles.textarea} placeholder="Describe what you did today..." value={checkinForm.journal_text} onChange={(e) => setCheckinForm({ ...checkinForm, journal_text: e.target.value })} rows={3} />
            <label style={styles.label}>Productivity Score: {checkinForm.productivity_score}/10</label>
            <input style={styles.slider} type="range" min="1" max="10" value={checkinForm.productivity_score} onChange={(e) => setCheckinForm({ ...checkinForm, productivity_score: Number(e.target.value) })} />
            <button onClick={handleCheckin} disabled={loading} style={styles.aiBtn}>{loading ? "🤖 Analyzing..." : "📊 Get Feedback"}</button>
          </div>
        )}

        {activeTab === "suggest" && (
          <div>
            <h3 style={styles.cardTitle}>Suggest Next Actions</h3>
            <p style={styles.hint}>AI will look at your pending tasks and suggest what to do next</p>
            <label style={styles.label}>How is today going?</label>
            <textarea style={styles.textarea} placeholder="Brief update on your day so far..." value={actionForm.todays_journal} onChange={(e) => setActionForm({ ...actionForm, todays_journal: e.target.value })} rows={3} />
            <button onClick={handleSuggest} disabled={loading} style={styles.aiBtn}>{loading ? "🤖 Thinking..." : "💡 Get Suggestions"}</button>
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            <h3 style={styles.cardTitle}>Weekly Summary</h3>
            <p style={styles.hint}>AI will analyze your entire week and give you a performance summary</p>
            <button onClick={handleSummary} disabled={loading} style={styles.aiBtn}>{loading ? "🤖 Analyzing your week..." : "📊 Generate Summary"}</button>
          </div>
        )}

        {result && (
          <div style={styles.result}>
            <h4 style={styles.resultTitle}>🤖 AI Response:</h4>
            <pre style={styles.resultText}>{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "20px 16px", maxWidth: 800 },
  title: { fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: "0 0 8px" },
  subtitle: { color: "#888", marginBottom: 24, fontSize: 14 },
  tabs: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tab: { padding: "8px 12px", border: "2px solid #eee", borderRadius: 10, background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#888" },
  activeTab: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", border: "2px solid transparent" },
  card: { background: "white", borderRadius: 16, padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  cardTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginTop: 0 },
  hint: { color: "#888", fontSize: 14, marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 },
  textarea: { width: "100%", padding: "14px", border: "2px solid #eee", borderRadius: 12, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16 },
  slider: { width: "100%", marginBottom: 20 },
  aiBtn: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", border: "none", borderRadius: 12, padding: "14px 28px", fontWeight: 700, cursor: "pointer", fontSize: 16, width: "100%" },
  result: { marginTop: 24, background: "linear-gradient(135deg, #667eea10, #764ba210)", border: "2px solid #667eea30", borderRadius: 12, padding: 20 },
  resultTitle: { color: "#667eea", fontWeight: 700, marginTop: 0 },
  resultText: { whiteSpace: "pre-wrap", color: "#333", fontSize: 14, lineHeight: 1.7, margin: 0, fontFamily: "inherit" }
};