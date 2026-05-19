import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateWeeklyPlan, dailyCheckin, suggestActions, weeklySummary } from "../services/api";
import toast from "react-hot-toast";

const TABS = [
  { id: "plan", label: "Weekly Plan" },
  { id: "checkin", label: "Daily Check-in" },
  { id: "suggest", label: "Next Actions" },
  { id: "summary", label: "Weekly Summary" },
];

function renderMarkdown(text) {
  return text.split("\n").map((line, i) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    const parts = [];
    let last = 0;
    let m;
    while ((m = linkRegex.exec(line)) !== null) {
      if (m.index > last) parts.push(<span key={last}>{line.slice(last, m.index)}</span>);
      parts.push(<a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>{m[1]}</a>);
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(<span key={last}>{line.slice(last)}</span>);
    return <div key={i} style={{ marginBottom: 3 }}>{parts.length > 0 ? parts : (line || <br />)}</div>;
  });
}

export default function AICoach() {
  const [activeTab, setActiveTab] = useState("plan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [goals, setGoals] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [goalSummary, setGoalSummary] = useState("");
  const [checkinText, setCheckinText] = useState("");
  const [todayNote, setTodayNote] = useState("");
  const navigate = useNavigate();

  const run = async (fn, label) => {
    setLoading(true);
    setResult("");
    try {
      const res = await fn();
      setResult(res);
      toast.success(`${label} ready`);
    } catch { toast.error("Request failed"); }
    finally { setLoading(false); }
  };

  const handleGeneratePlan = async () => {
    if (!goals.trim()) return toast.error("Please describe your goals first");
    setLoading(true);
    setResult("");
    try {
      const res = await generateWeeklyPlan({ goals });
      setResult(res.data.ai_plan);
      setGeneratedPlan(res.data.ai_plan);
      setSuggestedTasks(res.data.suggested_tasks || []);
      setGoalSummary(res.data.goal_summary || goals);
      toast.success("Plan generated");
    } catch { toast.error("Request failed"); }
    finally { setLoading(false); }
  };

  const handleCheckin = () => run(async () => {
    const res = await dailyCheckin({ journal_text: checkinText, productivity_score: 5 });
    return res.data.ai_feedback;
  }, "Feedback");

  const handleSuggest = () => run(async () => {
    const res = await suggestActions({ todays_journal: todayNote });
    return res.data.ai_suggestions;
  }, "Suggestions");

  const handleSummary = () => run(async () => {
    const res = await weeklySummary();
    return res.data.ai_summary;
  }, "Summary");

  const spinner = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
      Processing...
    </span>
  );

  return (
    <div style={s.page}>
      <header style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>AI Coach</h1>
          <p style={s.pageSubtitle}>Intelligent planning and reflection powered by Groq</p>
        </div>
      </header>

      <div style={s.tabBar}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setResult(""); setGeneratedPlan(null); }} style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.card}>
        {activeTab === "plan" && (
          <>
            <h3 style={s.cardTitle}>Generate Weekly Plan</h3>
            <p style={s.hint}>Describe your goals and the AI will create a structured plan with daily breakdown and reading recommendations.</p>
            <label style={s.label}>Your Goals This Week</label>
            <textarea style={s.textarea} placeholder="e.g. Complete the project report, exercise 4 times, learn TypeScript basics, read 20 pages daily..." value={goals} onChange={e => setGoals(e.target.value)} rows={4} />
            <button onClick={handleGeneratePlan} disabled={loading} style={s.actionBtn}>{loading ? spinner : "Generate Plan"}</button>
          </>
        )}

        {activeTab === "checkin" && (
          <>
            <h3 style={s.cardTitle}>Daily Check-in</h3>
            <p style={s.hint}>Share how your day went and receive personalized feedback on your progress.</p>
            <label style={s.label}>How was your day?</label>
            <textarea style={s.textarea} placeholder="Describe what you worked on, what you accomplished, and how you feel about the day..." value={checkinText} onChange={e => setCheckinText(e.target.value)} rows={4} />
            <button onClick={handleCheckin} disabled={loading} style={s.actionBtn}>{loading ? spinner : "Get Feedback"}</button>
          </>
        )}

        {activeTab === "suggest" && (
          <>
            <h3 style={s.cardTitle}>Suggest Next Actions</h3>
            <p style={s.hint}>The AI will review your pending tasks and suggest the highest-impact actions to take next.</p>
            <label style={s.label}>Current Situation (optional)</label>
            <textarea style={s.textarea} placeholder="How is today going so far? Any blockers or context that would help..." value={todayNote} onChange={e => setTodayNote(e.target.value)} rows={3} />
            <button onClick={handleSuggest} disabled={loading} style={s.actionBtn}>{loading ? spinner : "Get Suggestions"}</button>
          </>
        )}

        {activeTab === "summary" && (
          <>
            <h3 style={s.cardTitle}>Weekly Summary</h3>
            <p style={s.hint}>Generate an AI analysis of your week including completed tasks, journal patterns, and recommendations for next week.</p>
            <button onClick={handleSummary} disabled={loading} style={s.actionBtn}>{loading ? spinner : "Generate Summary"}</button>
          </>
        )}

        {result && (
          <div style={s.resultBox}>
            <div style={s.resultHeader}>AI Response</div>
            <div style={s.resultBody}>{renderMarkdown(result)}</div>
          </div>
        )}

        {generatedPlan && (
          <button
            onClick={() => {
              const p = new URLSearchParams({ ai_plan: encodeURIComponent(goalSummary), ai_tasks: encodeURIComponent(JSON.stringify(suggestedTasks)) });
              navigate("/planner?" + p.toString());
            }}
            style={{ ...s.actionBtn, marginTop: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}
          >
            Use This Plan — {suggestedTasks.length} tasks ready to import
          </button>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { padding: "28px 24px", maxWidth: 800, animation: "fadeIn 0.3s ease" },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#f8fafc", margin: 0 },
  pageSubtitle: { color: "#475569", fontSize: 13, marginTop: 3 },
  tabBar: { display: "flex", gap: 4, marginBottom: 16, background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 10, padding: 4, flexWrap: "wrap" },
  tab: { padding: "8px 14px", border: "none", borderRadius: 7, background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 500, flex: "1 1 auto" },
  tabActive: { background: "#111827", color: "#e2e8f0", fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" },
  card: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 12, padding: "22px" },
  cardTitle: { fontSize: 16, fontWeight: 600, color: "#f8fafc", marginBottom: 6 },
  hint: { color: "#475569", fontSize: 13, marginBottom: 16, lineHeight: 1.6 },
  label: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 },
  textarea: { width: "100%", padding: "11px 14px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 13, background: "#111827", color: "#e2e8f0", resize: "vertical", boxSizing: "border-box", marginBottom: 14, lineHeight: 1.6 },
  actionBtn: { padding: "11px 20px", background: "#2563eb", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, width: "100%" },
  resultBox: { marginTop: 20, border: "1px solid rgba(30,64,175,0.2)", borderRadius: 10, overflow: "hidden" },
  resultHeader: { background: "rgba(37,99,235,0.08)", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(30,64,175,0.15)" },
  resultBody: { padding: "16px", color: "#94a3b8", fontSize: 13, lineHeight: 1.8 },
};