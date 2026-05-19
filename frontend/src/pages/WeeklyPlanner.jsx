// WeeklyPlanner.jsx
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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const fetchPlan = async () => {
    try {
      const res = await getActivePlan();
      if (res && res.data) {
        setPlan(res.data);
        const tasksRes = await getTasks(res.data.id);
        setTasks(tasksRes.data || []);
      }
    } catch (err) {
      console.error("No active plan found", err);
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
      toast.success("AI plan loaded. Set your dates then save");
    }
    
    if (aiTasks) {
      try {
        const tasks = JSON.parse(aiTasks);
        if (tasks.length > 0) {
          toast.success(`${tasks.length} AI tasks will be added automatically`);
          sessionStorage.setItem("pending_ai_tasks", aiTasks);
        }
      } catch (error) {
        console.error("Failed to parse AI tasks", error);
      }
    }
    
    fetchPlan();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (planForm.week_start >= planForm.week_end) {
      toast.error("Week end must be after week start");
      return;
    }
    const diff = (new Date(planForm.week_end) - new Date(planForm.week_start)) / (1000 * 60 * 60 * 24);
    if (diff < 2) {
      toast.error("Plan must be at least 2 days long");
      return;
    }
    
    try {
      const res = await createPlan(planForm);
      setPlan(res.data);
      setShowNewPlan(false);
      toast.success("Weekly plan created");

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
          } catch (error) {
            console.error("Failed to create AI task", error);
          }
        }
        setTasks(createdTasks);
        sessionStorage.removeItem("pending_ai_tasks");
        toast.success(`${createdTasks.length} AI tasks added automatically`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create plan");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!plan) {
      toast.error("Please create a plan first");
      return;
    }
    try {
      const res = await createTask(plan.id, taskForm);
      setTasks([...tasks, res.data]);
      setShowNewTask(false);
      setTaskForm({ title: "", description: "", priority: "medium", due_date: "" });
      toast.success("Task added");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add task");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await updateTask(taskId, { status });
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
      toast.success("Task updated");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleSaveTaskEdit = async (taskId) => {
    try {
      const res = await updateTask(taskId, editTaskForm);
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
      setEditingTaskId(null);
      toast.success("Task updated");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleSavePlanEdit = async () => {
    try {
      await updatePlan(plan.id, { goal_summary: planForm.goal_summary });
      setPlan({ ...plan, goal_summary: planForm.goal_summary });
      setEditingPlan(false);
      toast.success("Plan updated");
    } catch (error) {
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async () => {
    if (!window.confirm("Delete this weekly plan and all its tasks?")) return;
    try {
      await deletePlan(plan.id);
      setPlan(null);
      setTasks([]);
      toast.success("Plan deleted");
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
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
      loading: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        fontSize: 16,
        marginLeft: "260px",
      },
      header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 12,
      },
      title: {
        fontSize: 24,
        fontWeight: 700,
        color: isDark ? "#ffffff" : "#000000",
        margin: 0,
      },
      planBanner: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      },
      planWeek: {
        fontWeight: 600,
        color: "#0066cc",
        marginBottom: 4,
        fontSize: 14,
      },
      planGoal: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 14,
      },
      activeBadge: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        color: "#00cc66",
        padding: "4px 12px",
        borderRadius: 4,
        fontWeight: 500,
        fontSize: 12,
      },
      editPlanBtn: {
        background: "none",
        color: "#0066cc",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 6,
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
      },
      deletePlanBtn: {
        background: "none",
        color: "#ff4444",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 6,
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
      },
      editTaskBtn: {
        background: "none",
        color: "#0066cc",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: 13,
      },
      card: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 12,
        padding: "24px",
        marginBottom: 20,
      },
      cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      },
      cardTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: isDark ? "#ffffff" : "#000000",
        margin: 0,
      },
      primaryBtn: {
        background: "#0066cc",
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 14,
      },
      secondaryBtn: {
        background: "none",
        color: isDark ? "#888888" : "#666666",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: "10px 20px",
        fontWeight: 500,
        cursor: "pointer",
        fontSize: 14,
      },
      row: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 12,
      },
      field: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
      },
      label: {
        fontSize: 13,
        fontWeight: 500,
        color: isDark ? "#888888" : "#666666",
      },
      input: {
        padding: "10px 12px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 6,
        fontSize: 14,
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      },
      textarea: {
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 6,
        fontSize: 14,
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        marginBottom: 12,
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        fontFamily: "inherit",
      },
      btnRow: {
        display: "flex",
        gap: 10,
        marginTop: 12,
        flexWrap: "wrap",
      },
      taskForm: {
        background: isDark ? "#000000" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      },
      taskList: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
      },
      taskItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: isDark ? "#000000" : "#ffffff",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        flexWrap: "wrap",
        gap: 8,
      },
      taskInfo: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        flex: 1,
        minWidth: 150,
      },
      priorityDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        flexShrink: 0,
      },
      taskTitle: {
        fontWeight: 500,
        fontSize: 14,
        color: isDark ? "#ffffff" : "#000000",
      },
      taskDesc: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 12,
        marginTop: 2,
      },
      statusSelect: {
        padding: "6px 10px",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 6,
        fontSize: 12,
        outline: "none",
        cursor: "pointer",
        background: isDark ? "#000000" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      },
      empty: {
        textAlign: "center",
        color: isDark ? "#888888" : "#666666",
        padding: "24px 0",
      },
    };
  };

  const styles = getStyles();

  if (loading) {
    return <div style={styles.loading}>Loading planner...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={toggleTheme} style={styles.themeToggle}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Weekly Planner</h1>
        {!plan && (
          <button onClick={() => setShowNewPlan(true)} style={styles.primaryBtn}>
            Create Plan
          </button>
        )}
      </div>

      {showNewPlan && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Create Weekly Plan</h3>
          <form onSubmit={handleCreatePlan}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Week Start</label>
                <input
                  style={styles.input}
                  type="date"
                  value={planForm.week_start}
                  onChange={(e) => setPlanForm({ ...planForm, week_start: e.target.value })}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Week End</label>
                <input
                  style={styles.input}
                  type="date"
                  value={planForm.week_end}
                  onChange={(e) => setPlanForm({ ...planForm, week_end: e.target.value })}
                  required
                />
              </div>
            </div>
            <textarea
              style={styles.textarea}
              placeholder="What are your goals for this week?"
              value={planForm.goal_summary}
              onChange={(e) => setPlanForm({ ...planForm, goal_summary: e.target.value })}
              rows={3}
            />
            <div style={styles.btnRow}>
              <button type="submit" style={styles.primaryBtn}>
                Create Plan
              </button>
              <button
                type="button"
                onClick={() => setShowNewPlan(false)}
                style={styles.secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {plan && (
        <>
          <div style={styles.planBanner}>
            <div style={{ flex: 1 }}>
              <div style={styles.planWeek}>
                {plan.week_start} → {plan.week_end}
              </div>
              <div style={styles.planGoal}>
                {plan.goal_summary || "No goal summary set"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={styles.activeBadge}>Active</span>
              <button
                onClick={() => {
                  setEditingPlan(true);
                  setPlanForm({ ...planForm, goal_summary: plan.goal_summary || "" });
                }}
                style={styles.editPlanBtn}
              >
                Edit
              </button>
              <button onClick={handleDeletePlan} style={styles.deletePlanBtn}>
                Delete
              </button>
            </div>
          </div>

          {editingPlan && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Edit Weekly Plan</h3>
              <textarea
                style={styles.textarea}
                placeholder="Update your goal summary"
                value={planForm.goal_summary}
                onChange={(e) => setPlanForm({ ...planForm, goal_summary: e.target.value })}
                rows={3}
              />
              <div style={styles.btnRow}>
                <button onClick={handleSavePlanEdit} style={styles.primaryBtn}>
                  Save Changes
                </button>
                <button onClick={() => setEditingPlan(false)} style={styles.secondaryBtn}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Tasks ({tasks.length})</h3>
              <button onClick={() => setShowNewTask(!showNewTask)} style={styles.primaryBtn}>
                Add Task
              </button>
            </div>

            {showNewTask && (
              <form onSubmit={handleCreateTask} style={styles.taskForm}>
                <input
                  style={styles.input}
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
                <input
                  style={styles.input}
                  placeholder="Description (optional)"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
                <div style={styles.row}>
                  <select
                    style={styles.input}
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <input
                    style={styles.input}
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>
                <div style={styles.btnRow}>
                  <button type="submit" style={styles.primaryBtn}>
                    Add Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTask(false)}
                    style={styles.secondaryBtn}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={styles.taskList}>
              {tasks.length === 0 ? (
                <div style={styles.empty}>No tasks yet. Add your first task</div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    {editingTaskId === task.id ? (
                      <div style={{ flex: 1 }}>
                        <input
                          style={{ ...styles.input, marginBottom: 8 }}
                          value={editTaskForm.title}
                          onChange={(e) =>
                            setEditTaskForm({ ...editTaskForm, title: e.target.value })
                          }
                          placeholder="Task title"
                        />
                        <input
                          style={{ ...styles.input, marginBottom: 8 }}
                          value={editTaskForm.description || ""}
                          onChange={(e) =>
                            setEditTaskForm({ ...editTaskForm, description: e.target.value })
                          }
                          placeholder="Description"
                        />
                        <select
                          style={{ ...styles.input, marginBottom: 8 }}
                          value={editTaskForm.priority}
                          onChange={(e) =>
                            setEditTaskForm({ ...editTaskForm, priority: e.target.value })
                          }
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleSaveTaskEdit(task.id)}
                            style={styles.primaryBtn}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTaskId(null)}
                            style={styles.secondaryBtn}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={styles.taskInfo}>
                          <span
                            style={{
                              ...styles.priorityDot,
                              background:
                                task.priority === "high"
                                  ? "#ff4444"
                                  : task.priority === "medium"
                                  ? "#0066cc"
                                  : "#00cc66",
                            }}
                          />
                          <div>
                            <div
                              style={{
                                ...styles.taskTitle,
                                textDecoration:
                                  task.status === "completed" ? "line-through" : "none",
                                opacity: task.status === "completed" ? 0.6 : 1,
                              }}
                            >
                              {task.title}
                            </div>
                            {task.description && (
                              <div style={styles.taskDesc}>{task.description}</div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select
                            style={styles.statusSelect}
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setEditTaskForm({
                                title: task.title,
                                description: task.description || "",
                                priority: task.priority,
                              });
                            }}
                            style={styles.editTaskBtn}
                          >
                            Edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}