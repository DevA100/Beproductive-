// AICoach.jsx
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
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [goalSummary, setGoalSummary] = useState("");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const navigate = useNavigate();

  const handleGeneratePlan = async () => {
    if (!goals.trim()) {
      toast.error("Please enter your goals");
      return;
    }
    setLoading(true);
    try {
      const res = await generateWeeklyPlan({ goals });
      setResult(res.data.ai_plan);
      setGeneratedPlan(res.data.ai_plan);
      setSuggestedTasks(res.data.suggested_tasks || []);
      setGoalSummary(res.data.goal_summary || goals);
      toast.success("Plan generated");
    } catch (error) {
      toast.error("AI service failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    setLoading(true);
    try {
      const res = await dailyCheckin(checkinForm);
      setResult(res.data.ai_feedback);
      toast.success("Check-in complete");
    } catch (error) {
      toast.error("AI service failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await suggestActions(actionForm);
      setResult(res.data.ai_suggestions);
      toast.success("Suggestions ready");
    } catch (error) {
      toast.error("AI service failed");
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
    } catch (error) {
      toast.error("AI service failed");
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
        if (match.index > lastIndex) {
          parts.push(<span key={lastIndex}>{line.slice(lastIndex, match.index)}</span>);
        }
        parts.push(
          <a 
            key={match.index} 
            href={match[2]} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            {match[1]}
          </a>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        parts.push(<span key={lastIndex}>{line.slice(lastIndex)}</span>);
      }
      return (
        <div key={i} style={{ marginBottom: 4 }}>
          {parts.length > 0 ? parts : line || <br />}
        </div>
      );
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.className = newTheme === "dark" ? "dark" : "";
  };

  const tabs = [
    { id: "plan", label: "Weekly Plan" },
    { id: "checkin", label: "Daily Check-in" },
    { id: "suggest", label: "Next Actions" },
    { id: "summary", label: "Weekly Summary" },
  ];

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
      title: {
        fontSize: 24,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000",
        margin: "0 0 8px 0",
      },
      subtitle: {
        color: isDark ? "#888888" : "#666666",
        marginBottom: 24,
        fontSize: 14,
      },
      tabs: {
        display: "flex",
        gap: 8,
        marginBottom: 16,
        flexWrap: "wrap",
      },
      tab: {
        padding: "8px 16px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: isDark ? "#888888" : "#666666",
        transition: "all 0.2s ease",
      },
      activeTab: {
        background: "#0066cc",
        color: "#ffffff",
        borderColor: "#0066cc",
      },
      card: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 12,
        padding: "24px",
      },
      cardTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: isDark ? "#ffffff" : "#000000",
        marginTop: 0,
        marginBottom: 8,
      },
      hint: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
        marginBottom: 16,
      },
      label: {
        display: "block",
        fontSize: 13,
        fontWeight: 500,
        color: isDark ? "#888888" : "#666666",
        marginBottom: 8,
      },
      textarea: {
        width: "100%",
        padding: "12px 14px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        fontSize: 14,
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        marginBottom: 16,
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        fontFamily: "inherit",
      },
      aiBtn: {
        background: "#0066cc",
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        padding: "12px 24px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 14,
        width: "100%",
        transition: "opacity 0.2s ease",
      },
      usePlanBtn: {
        background: "#00cc66",
        color: "#000000",
        border: "none",
        borderRadius: 8,
        padding: "12px 24px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 14,
        width: "100%",
        marginTop: 12,
        transition: "opacity 0.2s ease",
      },
      result: {
        marginTop: 24,
        background: isDark ? "#000000" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: 20,
      },
      resultTitle: {
        color: "#0066cc",
        fontWeight: 600,
        marginTop: 0,
        marginBottom: 12,
        fontSize: 16,
      },
      resultText: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
        lineHeight: 1.6,
        fontFamily: "inherit",
      },
      spinner: {
        width: 16,
        height: 16,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTop: "2px solid #ffffff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        display: "inline-block",
        marginRight: 8,
      },
      buttonContent: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      },
    };
  };

  const styles = getStyles();

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={toggleTheme} style={styles.themeToggle}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>

      <h1 style={styles.title}>AI Coach</h1>
      <p style={styles.subtitle}>Your personal AI productivity coach</p>

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult("");
              setGeneratedPlan(null);
            }}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {activeTab === "plan" && (
          <div>
            <h3 style={styles.cardTitle}>Generate Your Weekly Plan</h3>
            <p style={styles.hint}>
              Tell the AI your goals and it will create a structured weekly plan with article recommendations
            </p>
            <textarea
              style={styles.textarea}
              placeholder="Example: Learn React, exercise 3 times, finish project report, read 30 mins daily..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={4}
            />
            <button onClick={handleGeneratePlan} disabled={loading} style={styles.aiBtn}>
              {loading ? (
                <div style={styles.buttonContent}>
                  <div style={styles.spinner}></div>
                  Generating...
                </div>
              ) : (
                "Generate My Plan"
              )}
            </button>
          </div>
        )}

        {activeTab === "checkin" && (
          <div>
            <h3 style={styles.cardTitle}>Daily Check-in</h3>
            <p style={styles.hint}>
              Tell the AI how your day went and get personalized feedback
            </p>
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
                <div style={styles.buttonContent}>
                  <div style={styles.spinner}></div>
                  Analyzing...
                </div>
              ) : (
                "Get Feedback"
              )}
            </button>
          </div>
        )}

        {activeTab === "suggest" && (
          <div>
            <h3 style={styles.cardTitle}>Suggest Next Actions</h3>
            <p style={styles.hint}>
              AI will look at your pending tasks and suggest what to do next
            </p>
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
                <div style={styles.buttonContent}>
                  <div style={styles.spinner}></div>
                  Thinking...
                </div>
              ) : (
                "Get Suggestions"
              )}
            </button>
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            <h3 style={styles.cardTitle}>Weekly Summary</h3>
            <p style={styles.hint}>
              AI will analyze your entire week and give you a performance summary
            </p>
            <button onClick={handleSummary} disabled={loading} style={styles.aiBtn}>
              {loading ? (
                <div style={styles.buttonContent}>
                  <div style={styles.spinner}></div>
                  Analyzing your week...
                </div>
              ) : (
                "Generate Summary"
              )}
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
            onClick={() => {
              const params = new URLSearchParams({
                ai_plan: goalSummary,
                ai_tasks: JSON.stringify(suggestedTasks),
              });
              navigate("/planner?" + params.toString());
            }}
            style={styles.usePlanBtn}
          >
            Use This Plan in Weekly Planner ({suggestedTasks.length} tasks ready)
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}