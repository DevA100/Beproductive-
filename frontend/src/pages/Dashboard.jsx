import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getActivePlan, getTasks, getJournals, exportExcel } from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: [], journals: [], plan: null });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const [xpPoints, setXpPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
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
        loadGamificationData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const loadGamificationData = () => {
    const savedXP = localStorage.getItem("user_xp");
    const savedLevel = localStorage.getItem("user_level");
    const savedStreak = localStorage.getItem("user_streak");
    const savedAchievements = localStorage.getItem("user_achievements");
    
    if (savedXP) setXpPoints(parseInt(savedXP));
    if (savedLevel) setLevel(parseInt(savedLevel));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

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
  const inProgressTasks = stats.tasks.filter((t) => t.status === "in_progress").length;
  const pendingTasks = stats.tasks.filter((t) => t.status === "pending").length;
  const completionRate = stats.tasks.length ? ((completedTasks / stats.tasks.length) * 100).toFixed(0) : 0;
  const avgScore = stats.journals.length
    ? (stats.journals.reduce((sum, j) => sum + (j.productivity_score || 0), 0) / stats.journals.length).toFixed(1)
    : 0;

  const getLevelProgress = () => {
    const xpInCurrentLevel = xpPoints % 100;
    return (xpInCurrentLevel / 100) * 100;
  };

  const getStyles = () => {
    const isDark = theme === "dark";
    
    return {
      container: {
        minHeight: "100vh",
        background: isDark ? "#000000" : "#ffffff",
        padding: "20px 24px",
        marginLeft: "260px",
        transition: "all 0.3s ease",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      },
      topBar: {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginBottom: 24,
        gap: 16
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
        transition: "all 0.2s ease"
      },
      exportBtn: {
        background: "#0066cc",
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        padding: "8px 20px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 14,
        transition: "opacity 0.2s ease"
      },
      levelCard: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        borderRadius: 12,
        padding: "20px",
        marginBottom: 24,
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
      },
      levelHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        flexWrap: "wrap",
        gap: 12
      },
      levelBadge: {
        fontSize: 18,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000"
      },
      xpText: {
        fontSize: 14,
        color: isDark ? "#888888" : "#666666"
      },
      progressBarContainer: {
        width: "100%",
        height: 8,
        background: isDark ? "#333333" : "#e0e0e0",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8
      },
      progressBar: {
        width: `${getLevelProgress()}%`,
        height: "100%",
        background: "#0066cc",
        borderRadius: 4,
        transition: "width 0.3s ease"
      },
      statsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 24
      },
      statBox: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        borderRadius: 12,
        padding: "16px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
      },
      statLabel: {
        fontSize: 13,
        color: isDark ? "#888888" : "#666666",
        marginBottom: 8
      },
      statValue: {
        fontSize: 28,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000"
      },
      welcomeSection: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32,
        flexWrap: "wrap",
        gap: 16
      },
      userSection: {
        display: "flex",
        alignItems: "center",
        gap: 16
      },
      avatar: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        objectFit: "cover",
        border: `2px solid #0066cc`
      },
      avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#0066cc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontWeight: 700,
        fontSize: 24
      },
      greeting: {
        fontSize: 24,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000",
        margin: 0
      },
      subtitle: {
        color: isDark ? "#888888" : "#666666",
        margin: "4px 0 0",
        fontSize: 14
      },
      statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 20,
        marginBottom: 32
      },
      statCard: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        borderRadius: 12,
        padding: "20px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
      },
      statCardLabel: {
        fontSize: 14,
        color: isDark ? "#888888" : "#666666",
        marginBottom: 8
      },
      statCardValue: {
        fontSize: 32,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000"
      },
      progressSection: {
        display: "flex",
        gap: 24,
        marginBottom: 32,
        flexWrap: "wrap"
      },
      progressCircle: {
        flex: 1,
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        borderRadius: 12,
        padding: "24px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        textAlign: "center"
      },
      circleContainer: {
        position: "relative",
        width: 160,
        height: 160,
        margin: "0 auto 16px"
      },
      circleSvg: {
        transform: "rotate(-90deg)"
      },
      circleBg: {
        stroke: isDark ? "#333333" : "#e0e0e0"
      },
      circleProgress: {
        stroke: "#0066cc",
        strokeLinecap: "round",
        transition: "stroke-dashoffset 0.3s ease"
      },
      circleText: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center"
      },
      circlePercent: {
        fontSize: 28,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000"
      },
      circleLabel: {
        fontSize: 12,
        color: isDark ? "#888888" : "#666666",
        marginTop: 4
      },
      taskStats: {
        flex: 1,
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        borderRadius: 12,
        padding: "24px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
      },
      taskStatItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
      },
      taskStatLabel: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: isDark ? "#888888" : "#666666",
        fontSize: 14
      },
      taskStatDot: {
        width: 8,
        height: 8,
        borderRadius: "50%"
      },
      taskStatNumber: {
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000",
        fontSize: 16
      },
      section: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        borderRadius: 12,
        padding: "24px",
        marginBottom: 24,
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
      },
      sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 12
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: isDark ? "#ffffff" : "#000000",
        margin: 0
      },
      taskList: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      },
      taskItem: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px",
        background: isDark ? "#000000" : "#ffffff",
        borderRadius: 8,
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
      },
      taskStatus: {
        width: 8,
        height: 8,
        borderRadius: "50%"
      },
      taskContent: {
        flex: 1
      },
      taskTitle: {
        fontWeight: 500,
        color: isDark ? "#ffffff" : "#000000",
        fontSize: 14
      },
      taskDesc: {
        fontSize: 12,
        color: isDark ? "#888888" : "#666666",
        marginTop: 4
      },
      taskPriority: {
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 8px",
        borderRadius: 4,
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        color: isDark ? "#ffffff" : "#000000"
      },
      empty: {
        textAlign: "center",
        padding: "48px 20px",
        color: isDark ? "#888888" : "#666666"
      },
      journalList: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      },
      journalItem: {
        padding: "12px",
        background: isDark ? "#000000" : "#ffffff",
        borderRadius: 8,
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
      },
      journalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        flexWrap: "wrap",
        gap: 8
      },
      journalDate: {
        fontSize: 12,
        fontWeight: 600,
        color: "#0066cc"
      },
      journalScore: {
        fontSize: 12,
        color: isDark ? "#888888" : "#666666"
      },
      journalText: {
        fontSize: 14,
        color: isDark ? "#ffffff" : "#000000",
        lineHeight: 1.5
      },
      achievementsList: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8
      },
      achievementBadge: {
        background: isDark ? "#000000" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        padding: "6px 12px",
        borderRadius: 6,
        fontSize: 13,
        color: isDark ? "#ffffff" : "#000000"
      },
      rowSection: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        marginBottom: 24
      },
      viewAllBtn: {
        background: "none",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        color: "#0066cc",
        padding: "6px 12px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500
      },
      quickActions: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 8
      },
      actionBtn: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        color: isDark ? "#ffffff" : "#000000",
        padding: "10px 20px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        transition: "all 0.2s ease"
      },
      loadingContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: isDark ? "#000000" : "#ffffff"
      },
      loadingSpinner: {
        width: 40,
        height: 40,
        border: `3px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderTop: "3px solid #0066cc",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }
    };
  };

  if (loading) {
    const styles = getStyles();
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
      </div>
    );
  }

  const styles = getStyles();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - completionRate / 100);

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={toggleTheme} style={styles.themeToggle}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        <button onClick={handleExport} style={styles.exportBtn}>
          Export Report
        </button>
      </div>

      <div style={styles.levelCard}>
        <div style={styles.levelHeader}>
          <span style={styles.levelBadge}>Level {level}</span>
          <span style={styles.xpText}>{xpPoints % 100} / 100 XP to next level</span>
        </div>
        <div style={styles.progressBarContainer}>
          <div style={styles.progressBar}></div>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Day Streak</div>
          <div style={styles.statValue}>{streak}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Achievements</div>
          <div style={styles.statValue}>{achievements.length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Total XP</div>
          <div style={styles.statValue}>{xpPoints}</div>
        </div>
      </div>

      <div style={styles.welcomeSection}>
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
            <p style={styles.subtitle}>Ready to crush your goals today</p>
          </div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statCardLabel}>Active Quest</div>
          <div style={styles.statCardValue}>
            {stats.plan ? "Active" : "No Quest"}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardLabel}>Total Quests</div>
          <div style={styles.statCardValue}>{stats.tasks.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardLabel}>Completed</div>
          <div style={styles.statCardValue}>{completedTasks}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardLabel}>Productivity Score</div>
          <div style={styles.statCardValue}>{avgScore}/10</div>
        </div>
      </div>

      <div style={styles.progressSection}>
        <div style={styles.progressCircle}>
          <div style={styles.circleContainer}>
            <svg width="160" height="160" style={styles.circleSvg}>
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={styles.circleBg.stroke}
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#0066cc"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={styles.circleProgress}
              />
            </svg>
            <div style={styles.circleText}>
              <div style={styles.circlePercent}>{completionRate}%</div>
              <div style={styles.circleLabel}>Complete</div>
            </div>
          </div>
        </div>

        <div style={styles.taskStats}>
          <div style={styles.taskStatItem}>
            <div style={styles.taskStatLabel}>
              <span style={{ ...styles.taskStatDot, background: "#0066cc" }}></span>
              <span>In Progress</span>
            </div>
            <span style={styles.taskStatNumber}>{inProgressTasks}</span>
          </div>
          <div style={styles.taskStatItem}>
            <div style={styles.taskStatLabel}>
              <span style={{ ...styles.taskStatDot, background: "#00cc66" }}></span>
              <span>Completed</span>
            </div>
            <span style={styles.taskStatNumber}>{completedTasks}</span>
          </div>
          <div style={styles.taskStatItem}>
            <div style={styles.taskStatLabel}>
              <span style={{ ...styles.taskStatDot, background: "#888888" }}></span>
              <span>Pending</span>
            </div>
            <span style={styles.taskStatNumber}>{pendingTasks}</span>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Current Week Quests</h2>
          {stats.tasks.length > 0 && (
            <span style={styles.viewAllBtn}>Total: {stats.tasks.length}</span>
          )}
        </div>
        {stats.tasks.length === 0 ? (
          <div style={styles.empty}>
            No active quests yet — create your weekly plan to start
          </div>
        ) : (
          <div style={styles.taskList}>
            {stats.tasks.slice(0, 5).map((task) => (
              <div key={task.id} style={styles.taskItem}>
                <div style={{
                  ...styles.taskStatus,
                  background: task.status === "completed" ? "#00cc66" :
                             task.status === "in_progress" ? "#0066cc" : "#888888"
                }}></div>
                <div style={styles.taskContent}>
                  <div style={styles.taskTitle}>{task.title}</div>
                  {task.description && (
                    <div style={styles.taskDesc}>{task.description.slice(0, 60)}</div>
                  )}
                </div>
                <div style={styles.taskPriority}>{task.priority}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.rowSection}>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Journal Entries</h2>
          </div>
          {stats.journals.length === 0 ? (
            <div style={styles.empty}>No journal entries yet — start writing</div>
          ) : (
            <div style={styles.journalList}>
              {stats.journals.slice(0, 3).map((j) => (
                <div key={j.id} style={styles.journalItem}>
                  <div style={styles.journalHeader}>
                    <span style={styles.journalDate}>{j.entry_date}</span>
                    <span style={styles.journalScore}>Score: {j.productivity_score || 0}/10</span>
                  </div>
                  <div style={styles.journalText}>
                    {j.journal_text?.slice(0, 100) || "No text"}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Achievements</h2>
          </div>
          {achievements.length === 0 ? (
            <div style={styles.empty}>Complete tasks to unlock achievements</div>
          ) : (
            <div style={styles.achievementsList}>
              {achievements.map((achievement, index) => (
                <div key={index} style={styles.achievementBadge}>
                  {achievement}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.quickActions}>
        <button style={styles.actionBtn}>Weekly Planner</button>
        <button style={styles.actionBtn}>Journal Entry</button>
        <button style={styles.actionBtn}>AI Coach</button>
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