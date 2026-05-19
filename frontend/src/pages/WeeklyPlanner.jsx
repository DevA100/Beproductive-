import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getActivePlan, createPlan, getTasks, createTask, updateTask, updatePlan, deletePlan } from "../services/api";

export default function WeeklyPlanner() {
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [planForm, setPlanForm] = useState({ week_start: "", week_end: "", goal_summary: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", due_date: "" });
  const [editingPlan, setEditingPlan] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({});
  const [searchParams] = useSearchParams();
  const [xpPoints, setXpPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);

  const fetchPlan = async () => {
    try {
      const res = await getActivePlan();
      if (res.data) {
        setPlan(res.data);
        const tasksRes = await getTasks(res.data.id);
        setTasks(tasksRes.data || []);
      }
    } catch (err) {
      console.error("No active plan", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const aiPlan = searchParams.get("ai_plan");
    const aiTasks = searchParams.get("ai_tasks");
    
    if (aiPlan) {
      setShowNewPlan(true);
      setPlanForm(prev => ({ ...prev, goal_summary: aiPlan }));
      toast.success("AI plan loaded! Set your dates then save 📅");
    }
    
    if (aiTasks) {
      try {
        const tasks = JSON.parse(aiTasks);
        if (tasks.length > 0) {
          toast.success(`${tasks.length} AI tasks will be added automatically!`);
          sessionStorage.setItem("pending_ai_tasks", aiTasks);
        }
      } catch {}
    }
    
    fetchPlan();
    loadGamificationData();
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

  const addXP = (amount) => {
    const newXP = xpPoints + amount;
    const xpNeeded = level * 100;
    
    if (newXP >= xpNeeded) {
      const newLevel = level + 1;
      setLevel(newLevel);
      setXpPoints(newXP - xpNeeded);
      localStorage.setItem("user_level", newLevel);
      toast.success(`🎉 LEVEL UP! You're now level ${newLevel}! 🎉`);
    } else {
      setXpPoints(newXP);
    }
    localStorage.setItem("user_xp", newXP);
  };

  const updateStreak = () => {
    const lastActive = localStorage.getItem("last_active");
    const today = new Date().toDateString();
    
    if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActive === yesterday.toDateString()) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem("user_streak", newStreak);
        
        if (newStreak === 7) {
          unlockAchievement("Weekly Warrior");
          addXP(100);
        } else if (newStreak === 30) {
          unlockAchievement("Monthly Master");
          addXP(500);
        }
      } else if (lastActive !== today) {
        setStreak(1);
        localStorage.setItem("user_streak", 1);
      }
      localStorage.setItem("last_active", today);
    }
  };

  const unlockAchievement = (name) => {
    if (!achievements.includes(name)) {
      const newAchievements = [...achievements, name];
      setAchievements(newAchievements);
      localStorage.setItem("user_achievements", JSON.stringify(newAchievements));
      toast.success(`🏆 Achievement Unlocked: ${name}! 🏆`);
      addXP(50);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (planForm.week_start >= planForm.week_end) return toast.error("Week end must be after week start! 📅");
    const diff = (new Date(planForm.week_end) - new Date(planForm.week_start)) / (1000 * 60 * 60 * 24);
    if (diff < 2) return toast.error("Plan must be at least 2 days long!");
    
    try {
      const res = await createPlan(planForm);
      setPlan(res.data);
      setShowNewPlan(false);
      toast.success("Weekly plan created! 🎉");
      addXP(20);
      updateStreak();

      const pendingTasks = sessionStorage.getItem("pending_ai_tasks");
      if (pendingTasks) {
        const aiTasks = JSON.parse(pendingTasks);
        const createdTasks = [];
        for (const task of aiTasks) {
          try {
            const taskRes = await createTask(res.data.id, {
              title: task.title,
              description: task.description,
              priority: "medium"
            });
            createdTasks.push(taskRes.data);
          } catch {}
        }
        setTasks(createdTasks);
        sessionStorage.removeItem("pending_ai_tasks");
        toast.success(`${createdTasks.length} AI tasks added automatically! 🤖`);
        addXP(createdTasks.length * 5);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create plan");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await createTask(plan.id, taskForm);
      setTasks([...tasks, res.data]);
      setShowNewTask(false);
      setTaskForm({ title: "", description: "", priority: "medium", due_date: "" });
      toast.success("Task added! ✅");
      addXP(10);
      updateStreak();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add task");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await updateTask(taskId, { status });
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
      
      if (status === "completed") {
        addXP(15);
        const completedTasks = tasks.filter(t => t.status === "completed").length + 1;
        if (completedTasks === 10) unlockAchievement("Task Master");
        if (completedTasks === 50) unlockAchievement("Productivity Legend");
      }
      
      toast.success("Task updated! +15 XP");
      updateStreak();
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleSaveTaskEdit = async (taskId) => {
    try {
      const res = await updateTask(taskId, editTaskForm);
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
      setEditingTaskId(null);
      toast.success("Task updated! ✅");
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleSavePlanEdit = async () => {
    try {
      await updatePlan(plan.id, { goal_summary: planForm.goal_summary });
      setPlan({ ...plan, goal_summary: planForm.goal_summary });
      setEditingPlan(false);
      toast.success("Plan updated! ✅");
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async () => {
    if (!window.confirm("Delete this weekly plan and all its tasks?")) return;
    try {
      await deletePlan(plan.id);
      setPlan(null);
      setTasks([]);
      toast.success("Plan deleted!");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner}></div>
      <div style={styles.loadingText}>Loading your productivity realm... 🎮</div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Gamification Header */}
      <div style={styles.gamificationBar}>
        <div style={styles.statsContainer}>
          <div style={styles.stat}>
            <span style={styles.statIcon}>⭐</span>
            <span style={styles.statValue}>Lv.{level}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statIcon}>✨</span>
            <span style={styles.statValue}>{xpPoints} XP</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statIcon}>🔥</span>
            <span style={styles.statValue}>{streak} day streak</span>
          </div>
        </div>
        <div style={styles.xpBarContainer}>
          <div style={{ ...styles.xpBar, width: `${(xpPoints % 100) / 100 * 100}%` }}></div>
        </div>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleGlow}>📅 Weekly Planner</span>
        </h1>
        {!plan && <button onClick={() => setShowNewPlan(true)} style={styles.primaryBtn}>✨ Create New Plan +20 XP</button>}
      </div>

      {showNewPlan && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Create Weekly Plan</h3>
          <form onSubmit={handleCreatePlan}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Week Start</label>
                <input style={styles.input} type="date" value={planForm.week_start} onChange={(e) => setPlanForm({ ...planForm, week_start: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Week End</label>
                <input style={styles.input} type="date" value={planForm.week_end} onChange={(e) => setPlanForm({ ...planForm, week_end: e.target.value })} required />
              </div>
            </div>
            <textarea style={styles.textarea} placeholder="What are your epic goals for this week?" value={planForm.goal_summary} onChange={(e) => setPlanForm({ ...planForm, goal_summary: e.target.value })} rows={3} />
            <div style={styles.btnRow}>
              <button type="submit" style={styles.primaryBtn}>Create Plan</button>
              <button type="button" onClick={() => setShowNewPlan(false)} style={styles.secondaryBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {plan && (
        <>
          <div style={styles.planBanner}>
            <div style={{ flex: 1 }}>
              <div style={styles.planWeek}>📅 {plan.week_start} → {plan.week_end}</div>
              <div style={styles.planGoal}>{plan.goal_summary || "No goal summary set"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={styles.activeBadge}>🟢 Active Quest</span>
              <button onClick={() => { setEditingPlan(true); setPlanForm({ ...planForm, goal_summary: plan.goal_summary || "" }); }} style={styles.editPlanBtn}>✏️ Edit</button>
              <button onClick={handleDeletePlan} style={styles.deleteBtn}>🗑️ Delete</button>
            </div>
          </div>

          {editingPlan && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Edit Weekly Plan</h3>
              <textarea style={styles.textarea} placeholder="Update your goal summary" value={planForm.goal_summary} onChange={(e) => setPlanForm({ ...planForm, goal_summary: e.target.value })} rows={3} />
              <div style={styles.btnRow}>
                <button onClick={handleSavePlanEdit} style={styles.primaryBtn}>Save Changes</button>
                <button onClick={() => setEditingPlan(false)} style={styles.secondaryBtn}>Cancel</button>
              </div>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                📋 Active Quests ({tasks.filter(t => t.status !== "completed").length}/{tasks.length})
              </h3>
              <button onClick={() => setShowNewTask(!showNewTask)} style={styles.primaryBtn}>+ Add Quest +10 XP</button>
            </div>

            {showNewTask && (
              <form onSubmit={handleCreateTask} style={styles.taskForm}>
                <input style={styles.input} placeholder="Quest title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
                <input style={styles.input} placeholder="Description (optional)" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                <div style={styles.row}>
                  <select style={styles.input} value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">🟢 Low Priority (5 XP)</option>
                    <option value="medium">🟡 Medium Priority (10 XP)</option>
                    <option value="high">🔴 High Priority (15 XP)</option>
                  </select>
                  <input style={styles.input} type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
                <div style={styles.btnRow}>
                  <button type="submit" style={styles.primaryBtn}>Add Quest</button>
                  <button type="button" onClick={() => setShowNewTask(false)} style={styles.secondaryBtn}>Cancel</button>
                </div>
              </form>
            )}

            <div style={styles.taskList}>
              {tasks.length === 0 ? (
                <div style={styles.empty}>No quests yet — create your first adventure! 🎯</div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    {editingTaskId === task.id ? (
                      <div style={{ flex: 1 }}>
                        <input style={{ ...styles.input, marginBottom: 8 }} value={editTaskForm.title} onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })} placeholder="Quest title" />
                        <input style={{ ...styles.input, marginBottom: 8 }} value={editTaskForm.description || ""} onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })} placeholder="Description" />
                        <select style={{ ...styles.input, marginBottom: 8 }} value={editTaskForm.priority} onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}>
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleSaveTaskEdit(task.id)} style={styles.primaryBtn}>Save</button>
                          <button onClick={() => setEditingTaskId(null)} style={styles.secondaryBtn}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={styles.taskInfo}>
                          <span style={{ ...styles.priorityDot, background: task.priority === "high" ? "#ff6b6b" : task.priority === "medium" ? "#feca57" : "#48dbfb" }} />
                          <div>
                            <div style={{ ...styles.taskTitle, textDecoration: task.status === "completed" ? "line-through" : "none", opacity: task.status === "completed" ? 0.6 : 1 }}>{task.title}</div>
                            {task.description && <div style={styles.taskDesc}>{task.description}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select style={styles.statusSelect} value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
                            <option value="pending">⚪ Not Started</option>
                            <option value="in_progress">🟡 In Progress</option>
                            <option value="completed">✅ Completed +15 XP</option>
                          </select>
                          <button onClick={() => { setEditingTaskId(task.id); setEditTaskForm({ title: task.title, description: task.description || "", priority: task.priority }); }} style={styles.editTaskBtn}>✏️</button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Achievements Section */}
          {achievements.length > 0 && (
            <div style={styles.achievementsSection}>
              <h3 style={styles.sectionTitle}>🏆 Achievements Unlocked</h3>
              <div style={styles.achievementsList}>
                {achievements.map((achievement, index) => (
                  <div key={index} style={styles.achievementBadge}>
                    {achievement}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
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
    border: "1px solid rgba(0,210,255,0.2)"
  },
  
  statsContainer: {
    display: "flex",
    gap: 24,
    marginBottom: 12,
    flexWrap: "wrap"
  },
  
  stat: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 700,
    color: "#e2e8f0"
  },
  
  statIcon: {
    fontSize: 20
  },
  
  statValue: {
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  
  xpBarContainer: {
    width: "100%",
    height: 8,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden"
  },
  
  xpBar: {
    height: "100%",
    background: "linear-gradient(90deg, #00d2ff, #7b2ff7)",
    borderRadius: 4,
    transition: "width 0.3s ease"
  },
  
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 24, 
    flexWrap: "wrap", 
    gap: 12 
  },
  
  title: { 
    fontSize: 32, 
    fontWeight: 800, 
    margin: 0 
  },
  
  titleGlow: {
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 30px rgba(0,210,255,0.3)"
  },
  
  planBanner: { 
    background: "linear-gradient(135deg, rgba(0,210,255,0.1), rgba(123,47,247,0.1))", 
    border: "1px solid rgba(0,210,255,0.3)", 
    borderRadius: 16, 
    padding: "20px 24px", 
    marginBottom: 24, 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    flexWrap: "wrap", 
    gap: 12,
    backdropFilter: "blur(10px)"
  },
  
  planWeek: { 
    fontWeight: 700, 
    color: "#00d2ff", 
    marginBottom: 4,
    fontSize: 14
  },
  
  planGoal: { 
    color: "#94a3b8", 
    fontSize: 16,
    fontWeight: 600
  },
  
  activeBadge: { 
    background: "rgba(67,233,123,0.15)", 
    color: "#43e97b", 
    padding: "6px 14px", 
    borderRadius: 20, 
    fontWeight: 600, 
    fontSize: 13, 
    border: "1px solid rgba(67,233,123,0.3)",
    backdropFilter: "blur(5px)"
  },
  
  editPlanBtn: { 
    background: "rgba(0,210,255,0.1)", 
    color: "#00d2ff", 
    border: "1px solid rgba(0,210,255,0.3)", 
    borderRadius: 8, 
    padding: "6px 12px", 
    cursor: "pointer", 
    fontSize: 13, 
    fontWeight: 600,
    transition: "all 0.2s ease"
  },
  
  deleteBtn: { 
    background: "rgba(255,100,100,0.1)", 
    color: "#ff6b6b", 
    border: "1px solid rgba(255,100,100,0.3)", 
    borderRadius: 8, 
    padding: "6px 12px", 
    cursor: "pointer", 
    fontSize: 13, 
    fontWeight: 600,
    transition: "all 0.2s ease"
  },
  
  editTaskBtn: { 
    background: "rgba(0,210,255,0.1)", 
    color: "#00d2ff", 
    border: "1px solid rgba(0,210,255,0.3)", 
    borderRadius: 8, 
    padding: "6px 10px", 
    cursor: "pointer", 
    fontSize: 14,
    transition: "all 0.2s ease"
  },
  
  card: { 
    background: "rgba(255,255,255,0.03)", 
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0,210,255,0.15)", 
    borderRadius: 16, 
    padding: "24px", 
    marginBottom: 20,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ":hover": {
      boxShadow: "0 8px 32px rgba(0,210,255,0.1)"
    }
  },
  
  cardHeader: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20 
  },
  
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 700, 
    color: "#e2e8f0", 
    margin: 0 
  },
  
  primaryBtn: { 
    background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", 
    color: "white", 
    border: "none", 
    borderRadius: 10, 
    padding: "10px 20px", 
    fontWeight: 700, 
    cursor: "pointer", 
    fontSize: 14,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 5px 20px rgba(0,210,255,0.4)"
    }
  },
  
  secondaryBtn: { 
    background: "rgba(255,255,255,0.05)", 
    color: "#94a3b8", 
    border: "1px solid rgba(255,255,255,0.1)", 
    borderRadius: 10, 
    padding: "10px 20px", 
    fontWeight: 600, 
    cursor: "pointer", 
    fontSize: 14,
    transition: "all 0.2s ease"
  },
  
  row: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: 12, 
    marginBottom: 12 
  },
  
  field: { 
    display: "flex", 
    flexDirection: "column", 
    gap: 6 
  },
  
  label: { 
    fontSize: 13, 
    fontWeight: 600, 
    color: "#94a3b8" 
  },
  
  input: { 
    padding: "12px 14px", 
    border: "1px solid rgba(0,210,255,0.2)", 
    borderRadius: 10, 
    fontSize: 14, 
    outline: "none", 
    width: "100%", 
    boxSizing: "border-box", 
    background: "rgba(255,255,255,0.05)", 
    color: "#e2e8f0",
    transition: "border-color 0.2s ease",
    ":focus": {
      borderColor: "#00d2ff"
    }
  },
  
  textarea: { 
    width: "100%", 
    padding: "12px 14px", 
    border: "1px solid rgba(0,210,255,0.2)", 
    borderRadius: 10, 
    fontSize: 14, 
    outline: "none", 
    resize: "vertical", 
    boxSizing: "border-box", 
    marginBottom: 12, 
    background: "rgba(255,255,255,0.05)", 
    color: "#e2e8f0",
    fontFamily: "inherit"
  },
  
  btnRow: { 
    display: "flex", 
    gap: 10, 
    marginTop: 12, 
    flexWrap: "wrap" 
  },
  
  taskForm: { 
    background: "rgba(0,210,255,0.03)", 
    border: "1px solid rgba(0,210,255,0.15)", 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    display: "flex", 
    flexDirection: "column", 
    gap: 10 
  },
  
  taskList: { 
    display: "flex", 
    flexDirection: "column", 
    gap: 10 
  },
  
  taskItem: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: "14px 16px", 
    background: "rgba(0,210,255,0.03)", 
    border: "1px solid rgba(0,210,255,0.08)", 
    borderRadius: 12, 
    flexWrap: "wrap", 
    gap: 8,
    transition: "all 0.2s ease",
    ":hover": {
      background: "rgba(0,210,255,0.06)",
      transform: "translateX(4px)"
    }
  },
  
  taskInfo: { 
    display: "flex", 
    alignItems: "center", 
    gap: 12, 
    flex: 1, 
    minWidth: 150 
  },
  
  priorityDot: { 
    width: 10, 
    height: 10, 
    borderRadius: "50%", 
    flexShrink: 0,
    animation: "pulse 2s infinite"
  },
  
  taskTitle: { 
    fontWeight: 600, 
    fontSize: 15, 
    color: "#e2e8f0" 
  },
  
  taskDesc: { 
    color: "#64748b", 
    fontSize: 13, 
    marginTop: 2 
  },
  
  statusSelect: { 
    padding: "8px 12px", 
    border: "1px solid rgba(0,210,255,0.2)", 
    borderRadius: 8, 
    fontSize: 13, 
    outline: "none", 
    cursor: "pointer", 
    background: "rgba(255,255,255,0.05)", 
    color: "#e2e8f0" 
  },
  
  empty: { 
    textAlign: "center", 
    color: "#64748b", 
    padding: "24px 0",
    fontSize: 14
  },
  
  achievementsSection: {
    marginTop: 20,
    padding: "20px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    border: "1px solid rgba(0,210,255,0.15)"
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#e2e8f0",
    marginBottom: 12
  },
  
  achievementsList: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },
  
  achievementBadge: {
    background: "linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1))",
    border: "1px solid rgba(255,215,0,0.3)",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: "#ffd700"
  }
};

// Add keyframes animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }
`;
document.head.appendChild(styleSheet);