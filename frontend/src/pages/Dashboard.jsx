import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getActivePlan, getTasks, getJournals, exportExcel } from "../services/api";
import toast from "react-hot-toast";

const PRIORITY_COLOR = { high: "#ef4444", medium: "#3b82f6", low: "#10b981" };
const STATUS_CONFIG = {
  completed: { color: "#10b981", bg: "rgba(16,185,129,0.08)", label: "Completed" },
  in_progress: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", label: "In Progress" },
  pending: { color: "#64748b", bg: "rgba(100,116,139,0.08)", label: "Pending" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: [], journals: [], plan: null });
  const [loading, setLoading] = useState(true);
  const avatar = localStorage.getItem("avatar_" + user?.id);

  useEffect(() => {
    const fetchData = async () => {
      const [planRes, journalsRes] = await Promise.allSettled([getActivePlan(), getJournals()]);
      const plan = planRes.status === "fulfilled" ? planRes.value.data : null;
      const journals = journalsRes.status === "fulfilled" ? journalsRes.value.data : [];
      let tasks = [];
      if (plan) {
        const tasksRes = await getTasks(plan.id).catch(() => ({ data: [] }));
        tasks = tasksRes.data;
      }
      setStats({ tasks, journals, plan });
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `BeProductive_${user?.username}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Export complete");
    } catch {
      toast.error("Export failed");
    }
  };

  const completed = stats.tasks.filter(t => t.status === "completed").length;
  const total = stats.tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgScore = stats.journals.length
    ? (stats.journals.reduce((s, j) => s + (j.productivity_score || 0), 0) / stats.journals.length).toFixed(1)
    : "—";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(37,99,235,0.2)", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#475569", fontSize: 14 }}>Loading your workspace...</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          {avatar ? (
            <img src={avatar} alt={user?.username} style={s.avatar} />
          ) : (
            <div style={s.avatarFallback}>{user?.username?.[0]?.toUpperCase()}</div>
          )}
          <div>
            <h1 style={s.greeting}>Good day, {user?.username}</h1>
            <p style={{ color: "#475569", fontSize: 13, marginTop: 2 }}>Here is your productivity overview</p>
          </div>
        </div>
        <button onClick={handleExport} style={s.exportBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export
        </button>
      </header>

      <div style={s.statsRow}>
        {[
          { label: "Active Plan", value: stats.plan ? "Active" : "None", accent: stats.plan ? "#10b981" : "#475569", sub: stats.plan ? `${stats.plan.week_start} — ${stats.plan.week_end}` : "No plan this week" },
          { label: "Tasks", value: `${completed}/${total}`, accent: "#2563eb", sub: `${progress}% complete` },
          { label: "Avg Score", value: avgScore !== "—" ? `${avgScore}/10` : "—", accent: "#8b5cf6", sub: `${stats.journals.length} entries` },
          { label: "This Week", value: stats.journals.length, accent: "#0891b2", sub: "journal entries" },
        ].map(card => (
          <div key={card.label} style={s.statCard}>
            <div style={{ ...s.statValue, color: card.accent }}>{card.value}</div>
            <div style={s.statLabel}>{card.label}</div>
            <div style={s.statSub}>{card.sub}</div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div style={s.progressCard}>
          <div style={s.progressHeader}>
            <span style={s.sectionTitle}>Weekly Progress</span>
            <span style={{ color: "#2563eb", fontWeight: 600, fontSize: 13 }}>{progress}%</span>
          </div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ color: "#475569", fontSize: 12 }}>{completed} completed</span>
            <span style={{ color: "#475569", fontSize: 12 }}>{total - completed} remaining</span>
          </div>
        </div>
      )}

      <div style={s.grid}>
        <section style={s.card}>
          <h2 style={s.sectionTitle}>Current Tasks</h2>
          {stats.tasks.length === 0 ? (
            <div style={s.emptyState}>
              <p style={{ color: "#334155", fontSize: 13 }}>No tasks yet. Create your weekly plan to get started.</p>
            </div>
          ) : (
            <div style={s.list}>
              {stats.tasks.map(task => {
                const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                return (
                  <div key={task.id} style={s.taskRow}>
                    <div style={{ ...s.statusBadge, color: sc.color, background: sc.bg }}>{sc.label}</div>
                    <span style={{ flex: 1, fontSize: 13, color: task.status === "completed" ? "#475569" : "#e2e8f0", textDecoration: task.status === "completed" ? "line-through" : "none" }}>{task.title}</span>
                    <div style={{ ...s.priorityDot, background: PRIORITY_COLOR[task.priority] }} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={s.card}>
          <h2 style={s.sectionTitle}>Recent Journal</h2>
          {stats.journals.length === 0 ? (
            <div style={s.emptyState}>
              <p style={{ color: "#334155", fontSize: 13 }}>No entries yet. Start journaling to track your progress.</p>
            </div>
          ) : (
            <div style={s.list}>
              {stats.journals.slice(0, 5).map(j => (
                <div key={j.id} style={s.journalRow}>
                  <div style={s.journalDate}>{j.entry_date}</div>
                  <div style={{ flex: 1, fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {j.journal_text?.slice(0, 60) || "No entry text"}
                  </div>
                  <div style={{ ...s.scoreBadge, background: j.productivity_score >= 7 ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)", color: j.productivity_score >= 7 ? "#10b981" : "#3b82f6" }}>
                    {j.productivity_score}/10
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const s = {
  page: { padding: "28px 24px", maxWidth: 1100, animation: "fadeIn 0.3s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(37,99,235,0.3)" },
  avatarFallback: { width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 },
  greeting: { fontSize: 20, fontWeight: 700, color: "#f8fafc", margin: 0 },
  exportBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 8, color: "#3b82f6", fontSize: 13, fontWeight: 500 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 },
  statCard: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 12, padding: "18px 20px" },
  statValue: { fontSize: 26, fontWeight: 800, lineHeight: 1, marginBottom: 4 },
  statLabel: { color: "#f8fafc", fontSize: 13, fontWeight: 600, marginBottom: 2 },
  statSub: { color: "#475569", fontSize: 11 },
  progressCard: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 12, padding: "18px 20px", marginBottom: 20 },
  progressHeader: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  progressTrack: { height: 6, background: "rgba(30,64,175,0.15)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #1d4ed8, #3b82f6)", borderRadius: 3, transition: "width 0.6s ease" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  card: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 12, padding: "18px 20px" },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14, display: "block" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  taskRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(30,64,175,0.08)" },
  statusBadge: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" },
  priorityDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  journalRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(30,64,175,0.08)" },
  journalDate: { color: "#2563eb", fontSize: 11, fontWeight: 600, minWidth: 80 },
  scoreBadge: { fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 },
  emptyState: { padding: "20px 0", borderRadius: 8, textAlign: "center" },
};