import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getActivePlan, getTasks, getJournals, exportExcel } from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: [], journals: [], plan: null });
  const [loading, setLoading] = useState(true);
  const avatar = localStorage.getItem("avatar_" + user?.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, journalsRes] = await Promise.allSettled([getActivePlan(), getJournals()]);
        const plan = planRes.status === "fulfilled" ? planRes.value.data : null;
        const journals = journalsRes.status === "fulfilled" ? journalsRes.value.data : [];
        let tasks = [];
        if (plan) {
          const tasksRes = await getTasks(plan.id).catch(() => ({ data: [] }));
          tasks = tasksRes.data;
        }
        setStats({ tasks, journals, plan });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BeProductive_${user?.username}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel exported! 📊");
    } catch {
      toast.error("Export failed");
    }
  };

  const completedTasks = stats.tasks.filter((t) => t.status === "completed").length;
  const avgScore = stats.journals.length
    ? (stats.journals.reduce((sum, j) => sum + (j.productivity_score || 0), 0) / stats.journals.length).toFixed(1)
    : 0;

  const statCards = [
    { label: "Active Plan", value: stats.plan ? "✅ Active" : "❌ None", color: "#667eea" },
    { label: "Total Tasks", value: stats.tasks.length, color: "#f093fb" },
    { label: "Completed", value: completedTasks, color: "#4facfe" },
    { label: "Avg Score", value: `${avgScore}/10`, color: "#43e97b" },
  ];

  if (loading) return <div style={styles.loading}>Loading your dashboard... ⚡</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {avatar ? (
            <img src={avatar} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "3px solid #667eea" }} alt="avatar" />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 22 }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={styles.greeting}>Good day, {user?.username}! 👋</h1>
            <p style={styles.subtitle}>Here's your productivity overview</p>
          </div>
        </div>
        <button onClick={handleExport} style={styles.exportBtn}>📊 Export Excel</button>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map((card) => (
          <div key={card.label} style={{ ...styles.statCard, borderTop: `4px solid ${card.color}` }}>
            <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
            <div style={styles.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📅 Current Week Tasks</h2>
        {stats.tasks.length === 0 ? (
          <div style={styles.empty}>No tasks yet — create your weekly plan! 🚀</div>
        ) : (
          <div style={styles.taskList}>
            {stats.tasks.map((task) => (
              <div key={task.id} style={styles.taskItem}>
                <span style={{ ...styles.badge, background: task.status === "completed" ? "#43e97b20" : task.status === "in_progress" ? "#f09320" : "#66666620", color: task.status === "completed" ? "#43e97b" : task.status === "in_progress" ? "#f09320" : "#666" }}>
                  {task.status}
                </span>
                <span style={styles.taskTitle}>{task.title}</span>
                <span style={{ ...styles.priority, color: task.priority === "high" ? "#f5576c" : task.priority === "medium" ? "#f093fb" : "#667eea" }}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📝 Recent Journal Entries</h2>
        {stats.journals.length === 0 ? (
          <div style={styles.empty}>No journal entries yet — start writing! ✍️</div>
        ) : (
          <div style={styles.taskList}>
            {stats.journals.slice(0, 5).map((j) => (
              <div key={j.id} style={styles.journalItem}>
                <span style={styles.journalDate}>{j.entry_date}</span>
                <span style={styles.journalText}>{j.journal_text?.slice(0, 80) || "No text"}...</span>
                <span style={styles.score}>⭐ {j.productivity_score || 0}/10</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: 1000 },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", fontSize: 20, color: "#667eea" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  greeting: { fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: 0 },
  subtitle: { color: "#888", margin: "4px 0 0" },
  exportBtn: { background: "linear-gradient(135deg, #43e97b, #38f9d7)", color: "white", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 },
  statCard: { background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  statValue: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: "#888", fontSize: 13 },
  section: { background: "white", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginTop: 0, marginBottom: 16 },
  empty: { color: "#aaa", textAlign: "center", padding: "24px 0", fontSize: 15 },
  taskList: { display: "flex", flexDirection: "column", gap: 10 },
  taskItem: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#f8f9ff", borderRadius: 10 },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  taskTitle: { flex: 1, fontWeight: 500, color: "#333" },
  priority: { fontSize: 12, fontWeight: 700, textTransform: "uppercase" },
  journalItem: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#f8f9ff", borderRadius: 10 },
  journalDate: { color: "#667eea", fontWeight: 600, fontSize: 13, minWidth: 90 },
  journalText: { flex: 1, color: "#555", fontSize: 13 },
  score: { color: "#f093fb", fontWeight: 700, fontSize: 13 }
};