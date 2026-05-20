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
      toast.success("Plan generated successfully");
    } catch { 
      toast.error("AI service failed. Please try again"); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const handleCheckin = async () => {
    if (!checkinForm.journal_text.trim()) return toast.error("Please describe your day");
    setLoading(true);
    try {
      const res = await dailyCheckin(checkinForm);
      setResult(res.data.ai_feedback);
      toast.success("Check-in complete");
    } catch { 
      toast.error("AI service failed. Please try again"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSuggest = async () => {
    if (!actionForm.todays_journal.trim()) return toast.error("Please provide an update on your day");
    setLoading(true);
    try {
      const res = await suggestActions(actionForm);
      setResult(res.data.ai_suggestions);
      toast.success("Suggestions ready");
    } catch { 
      toast.error("AI service failed. Please try again"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSummary = async () => {
    setLoading(true);
    try {
      const res = await weeklySummary();
      setResult(res.data.ai_summary);
      toast.success("Summary ready");
    } catch { 
      toast.error("AI service failed. Please try again"); 
    } finally { 
      setLoading(false); 
    }
  };

  const renderResult = (text) => {
    return text.split('\n').map((line, i) => {
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) parts.push(<span key={lastIndex}>{line.slice(lastIndex, match.index)}</span>);
        parts.push(<a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>{match[1]}</a>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) parts.push(<span key={lastIndex}>{line.slice(lastIndex)}</span>);
      return <div key={i} style={{ marginBottom: 4 }}>{parts.length > 0 ? parts : line || <br />}</div>;
    });
  };

  const tabs = [
    { id: "plan", label: "Weekly Plan" },
    { id: "checkin", label: "Daily Check-in" },
    { id: "suggest", label: "Next Actions" },
    { id: "summary", label: "Weekly Summary" },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AI Coach</h1>
      <p style={styles.subtitle}>Your personal AI productivity coach</p>

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => { setActiveTab(tab.id); setResult(""); setGeneratedPlan(null); }} 
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.activeTab : {}) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {activeTab === "plan" && (
          <div>
            <h3 style={styles.cardTitle}>Generate Your Weekly Plan</h3>
            <p style={styles.hint}>Tell the AI your goals and it will create a structured weekly plan with article recommendations</p>
            <textarea 
              style={styles.textarea} 
              placeholder="Example: Learn React, exercise 3 times, finish project report, read 30 minutes daily..." 
              value={goals} 
              onChange={(e) => setGoals(e.target.value)} 
              rows={4} 
            />
            <button onClick={handleGeneratePlan} disabled={loading} style={styles.aiBtn}>
              {loading ? (
                <span style={styles.buttonContent}>
                  <span style={styles.spinner}></span> Generating...
                </span>
              ) : "Generate My Plan"}
            </button>
          </div>
        )}

        {activeTab === "checkin" && (
          <div>
            <h3 style={styles.cardTitle}>Daily Check-in</h3>
            <p style={styles.hint}>Tell the AI how your day went and get personalized feedback</p>
            <label style={styles.label}>How was your day?</label>
            <textarea 
              style={styles.textarea} 
              placeholder="Describe what you did today..." 
              value={checkinForm.journal_text} 
              onChange={(e) => setCheckinForm({ ...checkinForm, journal_text: e.target.value })} 
              rows={3} 
            />
            <button onClick={handleCheckin} disabled={loading} style={styles.aiBtn}>
              {loading ? (
                <span style={styles.buttonContent}>
                  <span style={styles.spinner}></span> Analyzing...
                </span>
              ) : "Get Feedback"}
            </button>
          </div>
        )}

        {activeTab === "suggest" && (
          <div>
            <h3 style={styles.cardTitle}>Suggest Next Actions</h3>
            <p style={styles.hint}>AI will look at your pending tasks and suggest what to do next</p>
            <label style={styles.label}>How is today going?</label>
            <textarea 
              style={styles.textarea} 
              placeholder="Brief update on your day so far..." 
              value={actionForm.todays_journal} 
              onChange={(e) => setActionForm({ ...actionForm, todays_journal: e.target.value })} 
              rows={3} 
            />
            <button onClick={handleSuggest} disabled={loading} style={styles.aiBtn}>
              {loading ? (
                <span style={styles.buttonContent}>
                  <span style={styles.spinner}></span> Thinking...
                </span>
              ) : "Get Suggestions"}
            </button>
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            <h3 style={styles.cardTitle}>Weekly Summary</h3>
            <p style={styles.hint}>AI will analyze your entire week and give you a performance summary</p>
            <button onClick={handleSummary} disabled={loading} style={styles.aiBtn}>
              {loading ? (
                <span style={styles.buttonContent}>
                  <span style={styles.spinner}></span> Analyzing your week...
                </span>
              ) : "Generate Summary"}
            </button>
          </div>
        )}

        {result && (
          <div style={styles.result}>
            <h4 style={styles.resultTitle}>AI Response:</h4>
            <div style={styles.resultText}>{renderResult(result)}</div>
          </div>
        )}

        {generatedPlan && (
          <button 
            onClick={() => navigate("/planner?ai_plan=" + encodeURIComponent(generatedPlan))} 
            style={{ ...styles.secondaryBtn, marginTop: 16 }}
          >
            Use This Plan in Weekly Planner
          </button>
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
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: 32,
    fontSize: 14,
  },
  tabs: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  tab: {
    padding: "10px 20px",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    background: "#ffffff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#64748b",
    transition: "all 0.2s",
  },
  activeTab: {
    background: "#3b82f6",
    color: "white",
    border: "1px solid #3b82f6",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "32px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e293b",
    marginTop: 0,
    marginBottom: 8,
  },
  hint: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 24,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 8,
    letterSpacing: "0.3px",
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
    marginBottom: 20,
    fontFamily: "inherit",
  },
  aiBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "12px 24px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    width: "100%",
    transition: "background 0.2s",
  },
  secondaryBtn: {
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "12px 24px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    width: "100%",
    transition: "background 0.2s",
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  result: {
    marginTop: 24,
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: 12,
    padding: 20,
  },
  resultTitle: {
    color: "#3b82f6",
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 12,
    fontSize: 16,
  },
  resultText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.8,
    fontFamily: "inherit",
  },
};

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  textarea:focus {
    border-color: #3b82f6 !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  .tab:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  .ai-btn:hover:not(:disabled) {
    background: #2563eb !important;
  }
  .secondary-btn:hover:not(:disabled) {
    background: #059669 !important;
  }
`;
document.head.appendChild(styleSheet);