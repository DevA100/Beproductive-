import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateWeeklyPlan, dailyCheckin, suggestActions, weeklySummary } from "../services/api";
import toast from "react-hot-toast";

export default function AICoach() {
  const [activeTab, setActiveTab] = useState("plan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [goals, setGoals] = useState("");
  const [checkinForm, setCheckinForm] = useState({ journal_text: "", productivity_score: 7 });
  const [actionForm, setActionForm] = useState({ todays_journal: "" });
  const navigate = useNavigate();

  const [suggestedTasks, setSuggestedTasks] = useState([]);
const [goalSummary, setGoalSummary] = useState("");

const handleGeneratePlan = async () => {
  if (!goals.trim()) return toast.error("Please enter your goals");
  setLoading(true);
  try {
    const res = await generateWeeklyPlan({ goals });
    setResult(res.data.ai_plan);
    setGeneratedPlan(res.data.ai_plan);
    setSuggestedTasks(res.data.suggested_tasks || []);
    setGoalSummary(res.data.goal_summary || goals);
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

  const renderResult = (text) => {
    return text.split('\n').map((line, i) => {
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) parts.push(<span key={lastIndex}>{line.slice(lastIndex, match.index)}</span>);
        parts.push(<a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" style={{ color: "#00d2ff", textDecoration: "underline" }}>{match[1]}</a>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) parts.push(<span key={lastIndex}>{line.slice(lastIndex)}</span>);
      return <div key={i} style={{ marginBottom: 4 }}>{parts.length > 0 ? parts : line || <br />}</div>;
    });
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
      <p style={styles.subtitle}>Your personal AI productivity coach — powered by Groq (free)</p>

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(""); setGeneratedPlan(null); }} style={{ ...styles.tab, ...(activeTab === tab.id ? styles.activeTab : {}) }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {activeTab === "plan" && (
          <div>
            <h3 style={styles.cardTitle}>Generate Your Weekly Plan</h3>
            <p style={styles.hint}>Tell the AI your goals and it will create a structured weekly plan with article recommendations</p>
            <textarea style={styles.textarea} placeholder="e.g. Learn React, exercise 3 times, finish project report, read 30 mins daily..." value={goals} onChange={(e) => setGoals(e.target.value)} rows={4} />
            <button onClick={handleGeneratePlan} disabled={loading} style={styles.aiBtn}>
              {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={styles.spinner}></span> Generating...</span> : "🚀 Generate My Plan"}
            </button>
          </div>
        )}

        {activeTab === "checkin" && (
          <div>
            <h3 style={styles.cardTitle}>Daily Check-in</h3>
            <p style={styles.hint}>Tell the AI how your day went and get personalized feedback</p>
            <label style={styles.label}>How was your day?</label>
            <textarea style={styles.textarea} placeholder="Describe what you did today..." value={checkinForm.journal_text} onChange={(e) => setCheckinForm({ ...checkinForm, journal_text: e.target.value })} rows={3} />
            <button onClick={handleCheckin} disabled={loading} style={styles.aiBtn}>
              {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={styles.spinner}></span> Analyzing...</span> : "📊 Get Feedback"}
            </button>
          </div>
        )}

        {activeTab === "suggest" && (
          <div>
            <h3 style={styles.cardTitle}>Suggest Next Actions</h3>
            <p style={styles.hint}>AI will look at your pending tasks and suggest what to do next</p>
            <label style={styles.label}>How is today going?</label>
            <textarea style={styles.textarea} placeholder="Brief update on your day so far..." value={actionForm.todays_journal} onChange={(e) => setActionForm({ ...actionForm, todays_journal: e.target.value })} rows={3} />
            <button onClick={handleSuggest} disabled={loading} style={styles.aiBtn}>
              {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={styles.spinner}></span> Thinking...</span> : "💡 Get Suggestions"}
            </button>
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            <h3 style={styles.cardTitle}>Weekly Summary</h3>
            <p style={styles.hint}>AI will analyze your entire week and give you a performance summary</p>
            <button onClick={handleSummary} disabled={loading} style={styles.aiBtn}>
              {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={styles.spinner}></span> Analyzing your week...</span> : "📊 Generate Summary"}
            </button>
          </div>
        )}

        {result && (
          <div style={styles.result}>
            <h4 style={styles.resultTitle}>🤖 AI Response:</h4>
            <div style={styles.resultText}>{renderResult(result)}</div>
          </div>
        )}

       {generatedPlan && (
  <button
    onClick={() => {
      const params = new URLSearchParams({
        ai_plan: goalSummary,
        ai_tasks: JSON.stringify(suggestedTasks)
      });
      navigate("/planner?" + params.toString());
    }}
    style={{ ...styles.aiBtn, marginTop: 12, background: "linear-gradient(135deg, #43e97b, #38f9d7)", color: "#0d1117" }}
  >
    📅 Use This Plan in Weekly Planner ({suggestedTasks.length} tasks ready)
  </button>
)}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "20px 16px", maxWidth: 800 },
  title: { fontSize: 24, fontWeight: 800, color: "#e2e8f0", margin: "0 0 8px" },
  subtitle: { color: "#64748b", marginBottom: 24, fontSize: 14 },
  tabs: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tab: { padding: "8px 14px", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 10, background: "rgba(255,255,255,0.03)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b" },
  activeTab: { background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", color: "white", border: "1px solid transparent" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,210,255,0.1)", borderRadius: 16, padding: "24px" },
  cardTitle: { fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginTop: 0 },
  hint: { color: "#64748b", fontSize: 14, marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8 },
  textarea: { width: "100%", padding: "14px", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 12, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16, background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  aiBtn: { background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", color: "white", border: "none", borderRadius: 12, padding: "14px 28px", fontWeight: 700, cursor: "pointer", fontSize: 16, width: "100%" },
  result: { marginTop: 24, background: "rgba(0,210,255,0.05)", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 12, padding: 20 },
  resultTitle: { color: "#00d2ff", fontWeight: 700, marginTop: 0 },
  resultText: { color: "#94a3b8", fontSize: 14, lineHeight: 1.8, fontFamily: "inherit" },
  spinner: { width: 18, height: 18, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
};