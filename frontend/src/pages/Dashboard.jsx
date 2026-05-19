import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getActivePlan, getTasks, getJournals, exportExcel } from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: [], journals: [], plan: null });
  const [loading, setLoading] = useState(true);
  const [xpPoints, setXpPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
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
        loadRecentActivity();
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

  const loadRecentActivity = () => {
    const activity = localStorage.getItem("recent_activity");
    if (activity) setRecentActivity(JSON.parse(activity));
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
      toast.success("Excel exported! 📊 +10 XP");
      
      // Add XP for export
      const newXP = xpPoints + 10;
      if (newXP >= level * 100) {
        setLevel(level + 1);
        setXpPoints(newXP - (level * 100));
        toast.success(`🎉 Level Up! You're now level ${level + 1}! 🎉`);
      } else {
        setXpPoints(newXP);
      }
      localStorage.setItem("user_xp", newXP);
      localStorage.setItem("user_level", level + (newXP >= level * 100 ? 1 : 0));
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

  const statCards = [
    { label: "Active Quest", value: stats.plan ? "⚔️ Active" : "❌ No Quest", color: "#00d2ff", icon: "🎯", gradient: "linear-gradient(135deg, #00d2ff, #7b2ff7)" },
    { label: "Total Quests", value: stats.tasks.length, color: "#f093fb", icon: "📋", gradient: "linear-gradient(135deg, #f093fb, #f5576c)" },
    { label: "Completed", value: `${completedTasks}/${stats.tasks.length}`, color: "#43e97b", icon: "✅", gradient: "linear-gradient(135deg, #43e97b, #38f9d7)" },
    { label: "Productivity Score", value: `${avgScore}/10`, color: "#ffd700", icon: "⭐", gradient: "linear-gradient(135deg, #ffd700, #ff8c00)" },
  ];

  const getLevelProgress = () => {
    const xpInCurrentLevel = xpPoints % 100;
    return (xpInCurrentLevel / 100) * 100;
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner}></div>
      <div style={styles.loadingText}>Loading your command center... 🎮</div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Gamification Header */}
      <div style={styles.gamificationBar}>
        <div style={styles.levelCard}>
          <div style={styles.levelIcon}>🎮</div>
          <div>
            <div style={styles.levelText}>Level {level}</div>
            <div style={styles.xpBarContainer}>
              <div style={{ ...styles.xpBar, width: `${getLevelProgress()}%` }}></div>
            </div>
            <div style={styles.xpText}>{xpPoints % 100}/100 XP to next level</div>
          </div>
        </div>
        <div style={styles.statsContainer}>
          <div style={styles.stat}>
            <span style={styles.statIcon}>🔥</span>
            <span style={styles.statValue}>{streak}</span>
            <span style={styles.statLabel}>Day Streak</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statIcon}>🏆</span>
            <span style={styles.statValue}>{achievements.length}</span>
            <span style={styles.statLabel}>Achievements</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statIcon}>⚡</span>
            <span style={styles.statValue}>{xpPoints}</span>
            <span style={styles.statLabel}>Total XP</span>
          </div>
        </div>
      </div>

      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {avatar ? (
            <img src={avatar} style={styles.avatar} alt="avatar" />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={styles.greeting}>
              Welcome back, {user?.username}! 👋
              <span style={styles.welcomeEmoji}>⚡</span>
            </h1>
            <p style={styles.subtitle}>Ready to crush your goals today?</p>
          </div>
        </div>
        <button onClick={handleExport} style={styles.exportBtn}>
          📊 Export Report +10 XP
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {statCards.map((card) => (
          <div key={card.label} style={{ ...styles.statCard, borderTop: `4px solid ${card.color}` }}>
            <div style={styles.statCardHeader}>
              <span style={styles.statIconLarge}>{card.icon}</span>
              <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
            </div>
            <div style={styles.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Ring Section */}
      <div style={styles.progressSection}>
        <div style={styles.progressRing}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
            <circle 
              cx="60" 
              cy="60" 
              r="54" 
              fill="none" 
              stroke="url(#gradient)" 
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - completionRate / 100)}`}
              transform="rotate(-90 60 60)"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2ff"/>
                <stop offset="100%" stopColor="#7b2ff7"/>
              </linearGradient>
            </defs>
            <text x="60" y="70" textAnchor="middle" fill="#e2e8f0" fontSize="24" fontWeight="800">{completionRate}%</text>
            <text x="60" y="85" textAnchor="middle" fill="#64748b" fontSize="10">Complete</text>
          </svg>
        </div>
        <div style={styles.taskStats}>
          <div style={styles.taskStatItem}>
            <span style={styles.taskStatDot}></span>
            <span>In Progress</span>
            <span style={styles.taskStatNumber}>{inProgressTasks}</span>
          </div>
          <div style={styles.taskStatItem}>
            <span style={{ ...styles.taskStatDot, background: "#43e97b" }}></span>
            <span>Completed</span>
            <span style={styles.taskStatNumber}>{completedTasks}</span>
          </div>
          <div style={styles.taskStatItem}>
            <span style={{ ...styles.taskStatDot, background: "#64748b" }}></span>
            <span>Pending</span>
            <span style={styles.taskStatNumber}>{pendingTasks}</span>
          </div>
        </div>
      </div>

      {/* Current Week Quests */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>⚔️</span>
            Active Quests
          </h2>
          {stats.tasks.length > 0 && (
            <span style={styles.sectionBadge}>{stats.tasks.length} total</span>
          )}
        </div>
        {stats.tasks.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🎯</div>
            <div>No active quests yet — create your weekly plan to start your adventure!</div>
            <button style={styles.emptyBtn} onClick={() => window.location.href = "/weekly-planner"}>
              Create Plan →
            </button>
          </div>
        ) : (
          <div style={styles.taskList}>
            {stats.tasks.slice(0, 5).map((task, index) => (
              <div key={task.id} style={styles.taskItem}>
                <div style={styles.taskNumber}>{index + 1}</div>
                <div style={styles.taskContent}>
                  <div style={styles.taskTitle}>{task.title}</div>
                  {task.description && <div style={styles.taskDesc}>{task.description.slice(0, 50)}</div>}
                </div>
                <div style={styles.taskMeta}>
                  <span style={{ ...styles.badge, 
                    background: task.status === "completed" ? "rgba(67,233,123,0.15)" : 
                               task.status === "in_progress" ? "rgba(240,147,32,0.15)" : 
                               "rgba(100,116,139,0.15)",
                    color: task.status === "completed" ? "#43e97b" : 
                           task.status === "in_progress" ? "#f09320" : 
                           "#94a3b8"
                  }}>
                    {task.status === "completed" ? "✅" : task.status === "in_progress" ? "🟡" : "⚪"} {task.status}
                  </span>
                  <span style={{ ...styles.priority, 
                    color: task.priority === "high" ? "#ff6b6b" : 
                           task.priority === "medium" ? "#feca57" : 
                           "#48dbfb"
                  }}>
                    {task.priority === "high" ? "🔴" : task.priority === "medium" ? "🟡" : "🟢"} {task.priority}
                  </span>
                </div>
              </div>
            ))}
            {stats.tasks.length > 5 && (
              <div style={styles.viewAll}>
                <button style={styles.viewAllBtn} onClick={() => window.location.href = "/weekly-planner"}>
                  View all {stats.tasks.length} quests →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Journal & Achievements Row */}
      <div style={styles.rowSection}>
        {/* Journal Entries */}
        <div style={{ ...styles.section, flex: 2 }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📝</span>
              Recent Reflections
            </h2>
            <button style={styles.journalBtn} onClick={() => window.location.href = "/journal"}>
              Write New →
            </button>
          </div>
          {stats.journals.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>✍️</div>
              <div>No journal entries yet — start tracking your journey!</div>
            </div>
          ) : (
            <div style={styles.journalList}>
              {stats.journals.slice(0, 3).map((j) => (
                <div key={j.id} style={styles.journalItem}>
                  <div style={styles.journalHeader}>
                    <span style={styles.journalDate}>📅 {j.entry_date}</span>
                    <span style={styles.journalScore}>
                      {Array(parseInt(j.productivity_score || 0)).fill('⭐').map((star, i) => (
                        <span key={i} style={{ color: "#ffd700" }}>★</span>
                      ))}
                      {Array(10 - parseInt(j.productivity_score || 0)).fill('☆').map((star, i) => (
                        <span key={i} style={{ color: "#64748b" }}>☆</span>
                      ))}
                    </span>
                  </div>
                  <div style={styles.journalText}>
                    "{j.journal_text?.slice(0, 100) || "No text"}..."
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div style={{ ...styles.section, flex: 1 }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>🏆</span>
              Achievements
            </h2>
          </div>
          {achievements.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>🎯</div>
              <div>Complete tasks to unlock achievements!</div>
            </div>
          ) : (
            <div style={styles.achievementsList}>
              {achievements.map((achievement, index) => (
                <div key={index} style={styles.achievementItem}>
                  <span style={styles.achievementIcon}>🏆</span>
                  <span style={styles.achievementName}>{achievement}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>⚡</span>
              Recent Activity
            </h2>
          </div>
          <div style={styles.activityList}>
            {recentActivity.slice(0, 3).map((activity, index) => (
              <div key={index} style={styles.activityItem}>
                <span style={styles.activityIcon}>{activity.icon}</span>
                <span style={styles.activityText}>{activity.text}</span>
                <span style={styles.activityTime}>{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <button style={styles.actionBtn} onClick={() => window.location.href = "/weekly-planner"}>
          <span>📅</span> Weekly Planner
        </button>
        <button style={styles.actionBtn} onClick={() => window.location.href = "/journal"}>
          <span>📝</span> Journal Entry
        </button>
        <button style={styles.actionBtn} onClick={handleExport}>
          <span>📊</span> Export Data
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: "100vh", 
    background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)", 
    padding: "20px 16px", 
    maxWidth: 1200, 
    margin: "0 auto",
    fontFamily: "'Inter', 'Segoe UI', sans-serif"
  },
  
  loadingContainer: { 
    display: "flex", 
    flexDirection: "column",
    alignItems: "center", 
    justifyContent: "center", 
    height: "100vh", 
    background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
    gap: 20
  },
  
  loadingSpinner: { 
    width: 60, 
    height: 60, 
    border: "4px solid rgba(0,210,255,0.1)", 
    borderTop: "4px solid #00d2ff", 
    borderRadius: "50%", 
    animation: "spin 1s linear infinite" 
  },
  
  loadingText: { 
    fontSize: 18, 
    color: "#00d2ff",
    fontWeight: 600,
    textShadow: "0 0 10px rgba(0,210,255,0.5)"
  },
  
  gamificationBar: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: "16px 20px",
    marginBottom: 24,
    border: "1px solid rgba(0,210,255,0.2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16
  },
  
  levelCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  
  levelIcon: {
    fontSize: 32
  },
  
  levelText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#00d2ff",
    marginBottom: 4
  },
  
  xpBarContainer: {
    width: 150,
    height: 6,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4
  },
  
  xpBar: {
    height: "100%",
    background: "linear-gradient(90deg, #00d2ff, #7b2ff7)",
    borderRadius: 3,
    transition: "width 0.3s ease"
  },
  
  xpText: {
    fontSize: 10,
    color: "#64748b"
  },
  
  statsContainer: {
    display: "flex",
    gap: 24
  },
  
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4
  },
  
  statIcon: {
    fontSize: 20
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: 800,
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  
  statLabel: {
    fontSize: 11,
    color: "#64748b"
  },
  
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 24, 
    flexWrap: "wrap", 
    gap: 16 
  },
  
  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #00d2ff",
    boxShadow: "0 0 20px rgba(0,210,255,0.3)"
  },
  
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 800,
    fontSize: 22,
    boxShadow: "0 0 20px rgba(0,210,255,0.3)"
  },
  
  greeting: { 
    fontSize: 24, 
    fontWeight: 800, 
    margin: 0,
    background: "linear-gradient(135deg, #e2e8f0, #00d2ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  
  welcomeEmoji: {
    marginLeft: 8
  },
  
  subtitle: { 
    color: "#64748b", 
    margin: "4px 0 0", 
    fontSize: 14 
  },
  
  exportBtn: { 
    background: "linear-gradient(135deg, #43e97b, #38f9d7)", 
    color: "#0a0e27", 
    border: "none", 
    borderRadius: 12, 
    padding: "10px 20px", 
    fontWeight: 700, 
    cursor: "pointer", 
    fontSize: 13,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 5px 20px rgba(67,233,123,0.4)"
    }
  },
  
  statsGrid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
    gap: 16, 
    marginBottom: 24 
  },
  
  statCard: { 
    background: "rgba(255,255,255,0.03)", 
    border: "1px solid rgba(0,210,255,0.15)", 
    borderRadius: 16, 
    padding: "20px",
    backdropFilter: "blur(10px)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 32px rgba(0,210,255,0.1)"
    }
  },
  
  statCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  
  statIconLarge: {
    fontSize: 24
  },
  
  statValue: { 
    fontSize: 28, 
    fontWeight: 800 
  },
  
  progressSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(0,210,255,0.15)",
    borderRadius: 16,
    padding: "24px",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 24
  },
  
  progressRing: {
    position: "relative"
  },
  
  taskStats: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  
  taskStatItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#94a3b8",
    fontSize: 14
  },
  
  taskStatDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#f09320"
  },
  
  taskStatNumber: {
    fontWeight: 700,
    color: "#e2e8f0",
    marginLeft: "auto"
  },
  
  section: { 
    background: "rgba(255,255,255,0.03)", 
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0,210,255,0.15)", 
    borderRadius: 16, 
    padding: "20px", 
    marginBottom: 20,
    transition: "transform 0.2s ease",
    ":hover": {
      boxShadow: "0 8px 32px rgba(0,210,255,0.1)"
    }
  },
  
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 700, 
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#e2e8f0"
  },
  
  sectionIcon: {
    fontSize: 20
  },
  
  sectionBadge: {
    background: "rgba(0,210,255,0.1)",
    color: "#00d2ff",
    padding: "4px 8px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600
  },
  
  empty: { 
    color: "#64748b", 
    textAlign: "center", 
    padding: "40px 20px", 
    fontSize: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12
  },
  
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  
  emptyBtn: {
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
    marginTop: 8
  },
  
  taskList: { 
    display: "flex", 
    flexDirection: "column", 
    gap: 10 
  },
  
  taskItem: { 
    display: "flex", 
    alignItems: "center", 
    gap: 12, 
    padding: "12px 16px", 
    background: "rgba(0,210,255,0.03)", 
    border: "1px solid rgba(0,210,255,0.08)", 
    borderRadius: 12, 
    transition: "all 0.2s ease",
    ":hover": {
      background: "rgba(0,210,255,0.06)",
      transform: "translateX(4px)"
    }
  },
  
  taskNumber: {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,210,255,0.1)",
    borderRadius: "50%",
    fontSize: 12,
    fontWeight: 700,
    color: "#00d2ff"
  },
  
  taskContent: {
    flex: 1
  },
  
  taskTitle: { 
    fontWeight: 600, 
    color: "#e2e8f0", 
    fontSize: 14 
  },
  
  taskDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2
  },
  
  taskMeta: {
    display: "flex",
    gap: 8,
    alignItems: "center"
  },
  
  badge: { 
    padding: "4px 10px", 
    borderRadius: 20, 
    fontSize: 11, 
    fontWeight: 600 
  },
  
  priority: { 
    fontSize: 11, 
    fontWeight: 700, 
    textTransform: "uppercase" 
  },
  
  viewAll: {
    textAlign: "center",
    marginTop: 12
  },
  
  viewAllBtn: {
    background: "none",
    border: "1px solid rgba(0,210,255,0.3)",
    color: "#00d2ff",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s ease",
    ":hover": {
      background: "rgba(0,210,255,0.1)"
    }
  },
  
  rowSection: {
    display: "flex",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap"
  },
  
  journalList: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  
  journalItem: {
    padding: "12px",
    background: "rgba(0,210,255,0.03)",
    border: "1px solid rgba(0,210,255,0.08)",
    borderRadius: 12
  },
  
  journalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  
  journalDate: {
    fontSize: 12,
    fontWeight: 600,
    color: "#00d2ff"
  },
  
  journalScore: {
    fontSize: 12,
    letterSpacing: 2
  },
  
  journalText: {
    fontSize: 13,
    color: "#94a3b8",
    fontStyle: "italic"
  },
  
  journalBtn: {
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  
  achievementsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  
  achievementItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px",
    background: "rgba(255,215,0,0.05)",
    border: "1px solid rgba(255,215,0,0.15)",
    borderRadius: 8
  },
  
  achievementIcon: {
    fontSize: 16
  },
  
  achievementName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#ffd700"
  },
  
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: 8
  },
  
  activityIcon: {
    fontSize: 16
  },
  
  activityText: {
    flex: 1,
    fontSize: 13,
    color: "#94a3b8"
  },
  
  activityTime: {
    fontSize: 11,
    color: "#64748b"
  },
  
  quickActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8
  },
  
  actionBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(0,210,255,0.2)",
    color: "#e2e8f0",
    padding: "10px 20px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s ease",
    ":hover": {
      background: "rgba(0,210,255,0.1)",
      transform: "translateY(-2px)"
    }
  }
};

// Add keyframes animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);