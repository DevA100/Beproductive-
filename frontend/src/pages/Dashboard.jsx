// Dashboard.jsx - Simplified version without streaks
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
      toast.success("Excel exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const completedTasks = stats.tasks.filter((t) => t.status === "completed").length;
  const avgScore = stats.journals.length
    ? (stats.journals.reduce((sum, j) => sum + (j.productivity_score || 0), 0) / stats.journals.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.userSection}>
          {avatar ? (
            <img src={avatar} style={styles.avatar} alt="avatar" />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={styles.greeting}>Welcome back, {user?.username}</h1>
            <p style={styles.subtitle}>Here's your productivity overview</p>
          </div>
        </div>
        <button onClick={handleExport} style={styles.exportBtn}>
          Export Report
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Active Plan</div>
          <div style={styles.statValue}>{stats.plan ? "Active" : "None"}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Tasks</div>
          <div style={styles.statValue}>{stats.tasks.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Completed</div>
          <div style={styles.statValue}>{completedTasks}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Avg Productivity</div>
          <div style={styles.statValue}>{avgScore}/10</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Current Tasks</h2>
        {stats.tasks.length === 0 ? (
          <div style={styles.empty}>No tasks yet. Create a weekly plan to get started</div>
        ) : (
          <div style={styles.taskList}>
            {stats.tasks.slice(0, 5).map((task) => (
              <div key={task.id} style={styles.taskItem}>
                <div style={{
                  ...styles.taskStatus,
                  background: task.status === "completed" ? "#00cc66" :
                             task.status === "in_progress" ? "#0066cc" : "#999999"
                }}></div>
                <div style={styles.taskContent}>
                  <div style={styles.taskTitle}>{task.title}</div>
                  {task.description && <div style={styles.taskDesc}>{task.description}</div>}
                </div>
                <div style={styles.taskPriority}>{task.priority}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Journal Entries</h2>
        {stats.journals.length === 0 ? (
          <div style={styles.empty}>No journal entries yet</div>
        ) : (
          <div style={styles.journalList}>
            {stats.journals.slice(0, 3).map((j) => (
              <div key={j.id} style={styles.journalItem}>
                <div style={styles.journalHeader}>
                  <span style={styles.journalDate}>{j.entry_date}</span>
                  <span style={styles.journalScore}>Score: {j.productivity_score || 0}/10</span>
                </div>
                <div style={styles.journalText}>
                  {j.journal_text?.slice(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "20px 24px",
    marginLeft: "260px",
  },
  loadingContainer: {
    minHeight: "100vh",
    background: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "260px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #0066cc",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#0066cc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 600,
    color: "#000000",
    margin: 0,
  },
  subtitle: {
    color: "#666666",
    fontSize: 14,
    marginTop: 4,
  },
  exportBtn: {
    background: "#0066cc",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 13,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "20px",
  },
  statLabel: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 600,
    color: "#000000",
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "20px",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#000000",
    margin: "0 0 16px 0",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  taskItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px",
    background: "#f9f9f9",
    borderRadius: 8,
    border: "1px solid #e0e0e0",
  },
  taskStatus: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: 500,
    color: "#000000",
    fontSize: 14,
  },
  taskDesc: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  taskPriority: {
    fontSize: 11,
    fontWeight: 500,
    padding: "4px 8px",
    borderRadius: 4,
    background: "#f0f0f0",
    color: "#000000",
  },
  journalList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  journalItem: {
    padding: "12px",
    background: "#f9f9f9",
    borderRadius: 8,
    border: "1px solid #e0e0e0",
  },
  journalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 12,
    fontWeight: 500,
    color: "#0066cc",
  },
  journalScore: {
    fontSize: 12,
    color: "#666666",
  },
  journalText: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 1.5,
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#666666",
    fontSize: 14,
  },
};