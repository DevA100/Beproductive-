import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  generateWeeklyPlan,
  dailyCheckin,
  suggestActions,
  weeklySummary,
} from "../services/api";
import toast from "react-hot-toast";

export default function AICoach() {
  const [activeTab, setActiveTab] = useState("plan");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [generatedPlan, setGeneratedPlan] = useState(null);

  const [goals, setGoals] = useState("");

  const [checkinForm, setCheckinForm] = useState({
    journal_text: "",
    productivity_score: 7,
  });

  const [actionForm, setActionForm] = useState({
    todays_journal: "",
  });

  const navigate = useNavigate();

  const resetOutput = () => {
    setResult("");
    setGeneratedPlan(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetOutput();
  };

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

      toast.success("Plan generated");
    } catch {
      toast.error("Failed to generate plan");
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
    } catch {
      toast.error("Check-in failed");
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
    } catch {
      toast.error("Suggestion failed");
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
      toast.error("Summary failed");
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (text) => {
    if (!text) return null;

    return text.split("\n").map((line, i) => {
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(
            <span key={lastIndex}>
              {line.slice(lastIndex, match.index)}
            </span>
          );
        }

        parts.push(
          <a
            key={match.index}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00d2ff" }}
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
          {parts}
        </div>
      );
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

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
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
          <>
            <textarea
              style={styles.textarea}
              placeholder="Enter your goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
            <button onClick={handleGeneratePlan} disabled={loading}>
              Generate Plan
            </button>
          </>
        )}

        {activeTab === "checkin" && (
          <>
            <textarea
              style={styles.textarea}
              value={checkinForm.journal_text}
              onChange={(e) =>
                setCheckinForm({
                  ...checkinForm,
                  journal_text: e.target.value,
                })
              }
            />
            <button onClick={handleCheckin} disabled={loading}>
              Submit
            </button>
          </>
        )}

        {activeTab === "suggest" && (
          <>
            <textarea
              style={styles.textarea}
              value={actionForm.todays_journal}
              onChange={(e) =>
                setActionForm({
                  ...actionForm,
                  todays_journal: e.target.value,
                })
              }
            />
            <button onClick={handleSuggest} disabled={loading}>
              Get Suggestions
            </button>
          </>
        )}

        {activeTab === "summary" && (
          <button onClick={handleSummary} disabled={loading}>
            Generate Summary
          </button>
        )}

        {result && (
          <div style={styles.result}>
            {renderResult(result)}
          </div>
        )}

        {generatedPlan && (
          <button
            onClick={() =>
              navigate(
                "/planner?ai_plan=" +
                  encodeURIComponent(generatedPlan)
              )
            }
          >
            Use Plan in Planner
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20, maxWidth: 800 },
  title: { fontSize: 22, fontWeight: 700 },
  tabs: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tab: {
    padding: 8,
    border: "1px solid #333",
    background: "transparent",
    cursor: "pointer",
  },
  activeTab: {
    background: "#00d2ff",
    color: "#000",
  },
  card: {
    padding: 20,
    border: "1px solid #333",
    borderRadius: 10,
  },
  textarea: {
    width: "100%",
    minHeight: 80,
    marginBottom: 12,
  },
  result: {
    marginTop: 16,
    padding: 12,
    border: "1px solid #444",
  },
};