import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getActivePlan, getTasks, getJournals, exportExcel } from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: [], journals: [], plan: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const avatar = localStorage.getItem("avatar_" + user?.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        
        let plan = null;
        try {
          const planRes = await getActivePlan();
          plan = planRes.data;
          console.log("Active plan fetched:", plan);
        } catch (err) {
          console.log("No active plan found");
        }

        let journals = [];
        try {
          const journalsRes = await getJournals();
          journals = journalsRes.data || [];
        } catch (err) {
          console.error("Error fetching journals:", err);
        }

        let tasks = [];
        if (plan && plan.id) {
          try {
            const tasksRes = await getTasks(plan.id);
            tasks = tasksRes.data || [];
          } catch (err) {
            console.error("Error fetching tasks:", err);
          }
        }

        setStats({ tasks, journals, plan });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleExport = async () => {
    try {
      const res = await exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BeProductive_${user?.username || "user"}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export failed");
    }
  };

  const handleNavigateToPlanner = () => {
    window.location.href = "/planner";
  };

  const completedTasks = stats.tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = stats.tasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = stats.tasks.filter((t) => t.status === "in_progress").length;
  const completionRate = stats.tasks.length ? Math.round((completedTasks / stats.tasks.length) * 100) : 0;
  const avgScore = stats.journals.length
    ? (stats.journals.reduce((sum, j) => sum + (j.productivity_score || 0), 0) / stats.journals.length).toFixed(1)
    : 0;

  const statCards = [
    { 
      label: "Active Plan", 
      value: stats.plan ? "Active" : "No Plan",
      subtitle: stats.plan ? stats.plan.title || "Weekly Plan" : "Create a plan",
      color: stats.plan ? "#10b981" : "#94a3b8", 
      bgColor: stats.plan ? "#ecfdf5" : "#f1f5f9",
      showAction: !stats.plan
    },
    { 
      label: "Pending Tasks", 
      value: pendingTasks, 
      subtitle: "Need attention",
      color: "#f59e0b", 
      bgColor: "#fffbeb" 
    },
    { 
      label: "In Progress", 
      value: inProgressTasks, 
      subtitle: "Working on",
      color: "#3b82f6", 
      bgColor: "#eef2ff" 
    },
    { 
      label: "Completed", 
      value: completedTasks, 
      subtitle: `${completionRate}% of total`,
      color: "#10b981", 
      bgColor: "#ecfdf5" 
    },
  ];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h3 style={styles.errorTitle}>Unable to Load Dashboard</h3>
        <p style={styles.errorMessage}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.userInfo}>
          <div style={styles.avatarContainer}>
            {avatar ? (
              <img src={avatar} style={styles.avatar} alt="avatar" />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div>
            <h1 style={styles.greeting}>Welcome back, {user?.username || "User"}</h1>
            <p style={styles.subtitle}>Track your productivity and achieve your goals</p>
          </div>
        </div>
        <button onClick={handleExport} style={styles.exportBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Data
        </button>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <div 
            key={index} 
            style={{ ...styles.statCard, backgroundColor: card.bgColor, borderBottom: `3px solid ${card.color}` }}
            onClick={card.showAction ? handleNavigateToPlanner : undefined}
          >
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>{card.label}</span>
            </div>
            <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
            <div style={styles.statSubtitle}>{card.subtitle}</div>
            {card.showAction && (
              <div style={styles.statAction}>Click to create plan</div>
            )}
          </div>
        ))}
      </div>

      {stats.tasks.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Task List</h2>
            <button onClick={handleNavigateToPlanner} style={styles.viewAllBtn}>
              Manage Tasks
            </button>
          </div>
          <div style={styles.taskList}>
            {stats.tasks.map((task, idx) => (
              <div key={task.id || idx} style={styles.taskItem}>
                <div style={styles.taskStatus}>
                  <div style={{
                    ...styles.statusDot,
                    backgroundColor: task.status === "completed" ? "#10b981" : task.status === "in_progress" ? "#3b82f6" : "#f59e0b"
                  }}></div>
                </div>
                <div style={styles.taskContent}>
                  <div style={styles.taskTitle}>{task.title}</div>
                  {task.description && <div style={styles.taskDescription}>{task.description}</div>}
                </div>
                <div style={styles.taskMeta}>
                  <span style={{
                    ...styles.priorityBadge,
                    backgroundColor: task.priority === "high" ? "#fef2f2" : task.priority === "medium" ? "#fffbeb" : "#eff6ff",
                    color: task.priority === "high" ? "#dc2626" : task.priority === "medium" ? "#d97706" : "#2563eb"
                  }}>
                    {task.priority || "medium"}
                  </span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: task.status === "completed" ? "#ecfdf5" : task.status === "in_progress" ? "#eef2ff" : "#fffbeb",
                    color: task.status === "completed" ? "#10b981" : task.status === "in_progress" ? "#3b82f6" : "#f59e0b"
                  }}>
                    {task.status || "pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.tasks.length === 0 && stats.plan && (
        <div style={styles.section}>
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No tasks yet</p>
            <p style={styles.emptySubtext}>Add tasks to your weekly plan to get started</p>
            <button onClick={handleNavigateToPlanner} style={styles.createPlanBtn}>
              Add Tasks
            </button>
          </div>
        </div>
      )}

      {!stats.plan && (
        <div style={styles.section}>
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No active plan</p>
            <p style={styles.emptySubtext}>Create a weekly plan to start tracking your tasks</p>
            <button onClick={handleNavigateToPlanner} style={styles.createPlanBtn}>
              Create Weekly Plan
            </button>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Journal Entries</h2>
          {/* {stats.journals.length > 0 && (
            <span style={styles.journalScoreSummary}>
              Avg Score: {avgScore}/10
            </span>
          )} */}
        </div>
        {stats.journals.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No journal entries yet</p>
            <p style={styles.emptySubtext}>Start documenting your journey</p>
            <button onClick={() => window.location.href = "/journal"} style={styles.createPlanBtn}>
              Write Journal Entry
            </button>
          </div>
        ) : (
          <div style={styles.journalList}>
            {stats.journals.slice(0, 3).map((journal, idx) => (
              <div key={journal.id || idx} style={styles.journalItem}>
                <div style={styles.journalHeader}>
                  <span style={styles.journalDate}>{journal.entry_date}</span>
                  {/* <div style={styles.journalScore}>
                    <span style={styles.scoreValue}>{journal.productivity_score || 0}</span>
                    <span style={styles.scoreLabel}>/10</span>
                  </div> */}
                </div>
                <p style={styles.journalText}>
                  {journal.journal_text?.slice(0, 100) || "No content"}
                  {journal.journal_text?.length > 100 && "..."}
                </p>
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
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
    minHeight: "100vh",
    background: "#f8fafc",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#f8fafc",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px",
  },
  errorTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  errorMessage: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "24px",
  },
  retryButton: {
    padding: "10px 24px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: "1px solid #e2e8f0",
    flexWrap: "wrap",
    gap: "16px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  avatarContainer: {
    width: "56px",
    height: "56px",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #3b82f6",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "600",
    color: "#3b82f6",
    border: "2px solid #3b82f6",
  },
  greeting: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "#ffffff",
    color: "#1e293b",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  statCard: {
    padding: "20px",
    borderRadius: "12px",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  statHeader: {
    marginBottom: "8px",
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "36px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  statSubtitle: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  statAction: {
    fontSize: "11px",
    color: "#3b82f6",
    marginTop: "8px",
    fontWeight: "500",
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  viewAllBtn: {
    padding: "6px 12px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#3b82f6",
    cursor: "pointer",
  },
  journalScoreSummary: {
    padding: "4px 12px",
    background: "#f1f5f9",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#64748b",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  taskItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    transition: "border-color 0.2s",
  },
  taskStatus: {
    width: "8px",
    height: "8px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: "4px",
  },
  taskDescription: {
    fontSize: "12px",
    color: "#64748b",
  },
  taskMeta: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  priorityBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  journalList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  journalItem: {
    padding: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    transition: "border-color 0.2s",
  },
  journalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  journalDate: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#3b82f6",
  },
  journalScore: {
    display: "flex",
    alignItems: "baseline",
    gap: "2px",
  },
  scoreValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f59e0b",
  },
  scoreLabel: {
    fontSize: "11px",
    color: "#64748b",
  },
  journalText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.5",
    margin: "0",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 20px",
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  emptySubtext: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 16px 0",
  },
  createPlanBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  button:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
  }
  .create-plan-btn:hover {
    background: #2563eb !important;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  }
  .task-item:hover {
    border-color: #3b82f6;
  }
  .journal-item:hover {
    border-color: #3b82f6;
  }
`;
document.head.appendChild(styleSheet);