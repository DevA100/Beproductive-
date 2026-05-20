import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getActivePlan,
  createPlan,
  getTasks,
  createTask,
  updateTask,
  updatePlan,
  deletePlan,
  deleteTask,
} from "../services/api";

export default function WeeklyPlanner() {
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [searchParams] = useSearchParams();

  const [planForm, setPlanForm] = useState({
    week_start: "",
    week_end: "",
    goal_summary: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
  });

  const [editTaskForm, setEditTaskForm] = useState({});

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const planRes = await getActivePlan().catch(() => ({ data: null }));
      const activePlan = planRes.data;
      setPlan(activePlan);

      if (activePlan) {
        const tasksRes = await getTasks(activePlan.id);
        setTasks(tasksRes.data || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to load weekly planner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const aiPlan = searchParams.get("ai_plan");
    const aiTasks = searchParams.get("ai_tasks");

    if (aiPlan) {
      setShowNewPlan(true);
      setPlanForm((prev) => ({
        ...prev,
        goal_summary: aiPlan,
      }));
    }

    if (aiTasks) {
      sessionStorage.setItem("pending_ai_tasks", aiTasks);
    }

    fetchPlan();
  }, [searchParams]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await createPlan(planForm);
      setPlan(res.data);
      toast.success("Weekly plan created");
      setShowNewPlan(false);
      setEditingPlan(false);

      const pending = sessionStorage.getItem("pending_ai_tasks");
      if (pending) {
        const aiTasks = JSON.parse(pending);
        const created = [];
        for (const task of aiTasks) {
          try {
            const t = await createTask(res.data.id, {
              title: task.title,
              description: task.description,
              priority: "medium",
              due_date: new Date().toISOString().split('T')[0],
            });
            created.push(t.data);
          } catch {}
        }
        setTasks(created);
        sessionStorage.removeItem("pending_ai_tasks");
      }
    } catch {
      toast.error("Unable to create plan");
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await updatePlan(plan.id, planForm);
      setPlan(res.data);
      toast.success("Plan updated successfully");
      setEditingPlan(false);
    } catch {
      toast.error("Unable to update plan");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!taskForm.due_date) {
      toast.error("Please select a due date");
      return;
    }
    
    try {
      const res = await createTask(plan.id, {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        due_date: taskForm.due_date,
      });
      setTasks([...tasks, res.data]);
      setShowNewTask(false);
      setTaskForm({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
      });
      toast.success("Task added");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail?.[0]?.msg || "Unable to add task");
    }
  };

  const handleUpdateTask = async (taskId) => {
    try {
      const res = await updateTask(taskId, editTaskForm);
      setTasks(tasks.map((t) => (t.id === taskId ? res.data : t)));
      setEditingTaskId(null);
      setEditTaskForm({});
      toast.success("Task updated");
    } catch {
      toast.error("Unable to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } catch {
      toast.error("Unable to delete task");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateTask(id, { status });
      setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDeletePlan = async () => {
    if (!window.confirm("Delete this plan? All tasks will be deleted.")) return;
    try {
      await deletePlan(plan.id);
      setPlan(null);
      setTasks([]);
      toast.success("Plan deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const startEditPlan = () => {
    setPlanForm({
      week_start: plan.week_start || "",
      week_end: plan.week_end || "",
      goal_summary: plan.goal_summary || "",
    });
    setEditingPlan(true);
  };

  const startEditTask = (task) => {
    setEditTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date || "",
    });
    setEditingTaskId(task.id);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading planner...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Weekly Planner</h1>
          <p style={styles.subtitle}>Plan your week and track your progress</p>
        </div>
        {!plan && (
          <button style={styles.primaryBtn} onClick={() => setShowNewPlan(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Plan
          </button>
        )}
      </div>

      {showNewPlan && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Create New Plan</h3>
          <form onSubmit={handleCreatePlan}>
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Week Start</label>
                <input
                  type="date"
                  style={styles.input}
                  value={planForm.week_start}
                  onChange={(e) => setPlanForm({ ...planForm, week_start: e.target.value })}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Week End</label>
                <input
                  type="date"
                  style={styles.input}
                  value={planForm.week_end}
                  onChange={(e) => setPlanForm({ ...planForm, week_end: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Weekly Goals</label>
              <textarea
                rows={4}
                style={styles.textarea}
                placeholder="What do you want to achieve this week?"
                value={planForm.goal_summary}
                onChange={(e) => setPlanForm({ ...planForm, goal_summary: e.target.value })}
                required
              />
            </div>
            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.primaryBtn}>Save Plan</button>
              <button type="button" style={styles.secondaryBtn} onClick={() => setShowNewPlan(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {plan && (
        <>
          <div style={styles.planCard}>
            <div style={styles.planContent}>
              {editingPlan ? (
                <form onSubmit={handleUpdatePlan} style={styles.editPlanForm}>
                  <div style={styles.row}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Week Start</label>
                      <input
                        type="date"
                        style={styles.input}
                        value={planForm.week_start}
                        onChange={(e) => setPlanForm({ ...planForm, week_start: e.target.value })}
                        required
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Week End</label>
                      <input
                        type="date"
                        style={styles.input}
                        value={planForm.week_end}
                        onChange={(e) => setPlanForm({ ...planForm, week_end: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Weekly Goals</label>
                    <textarea
                      rows={3}
                      style={styles.textarea}
                      value={planForm.goal_summary}
                      onChange={(e) => setPlanForm({ ...planForm, goal_summary: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.buttonGroup}>
                    <button type="submit" style={styles.primaryBtn}>Save</button>
                    <button type="button" style={styles.secondaryBtn} onClick={() => setEditingPlan(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div style={styles.planDate}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {plan.week_start} — {plan.week_end}
                    </div>
                    <div style={styles.planGoal}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      {plan.goal_summary}
                    </div>
                  </div>
                  <div style={styles.planActions}>
                    <button onClick={startEditPlan} style={styles.editBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                        <path d="M4 20h16" />
                      </svg>
                      Edit
                    </button>
                    <button onClick={handleDeletePlan} style={styles.deleteBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Tasks</h2>
              <button style={styles.primaryBtn} onClick={() => setShowNewTask(!showNewTask)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Task
              </button>
            </div>

            {showNewTask && (
              <form onSubmit={handleCreateTask} style={styles.newTaskForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Task Title</label>
                  <input
                    style={styles.input}
                    placeholder="Enter task title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Description (Optional)</label>
                  <textarea
                    style={styles.textarea}
                    placeholder="Add details about this task"
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  />
                </div>
                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Priority</label>
                    <select
                      style={styles.select}
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Due Date</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={styles.buttonGroup}>
                  <button type="submit" style={styles.primaryBtn}>Save Task</button>
                  <button type="button" style={styles.secondaryBtn} onClick={() => setShowNewTask(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div style={styles.taskList}>
              {tasks.length === 0 && (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>No tasks yet</p>
                  <p style={styles.emptySubtext}>Click "Add Task" to create your first task</p>
                </div>
              )}
              {tasks.map((task) => (
                <div key={task.id} style={styles.taskItem}>
                  {editingTaskId === task.id ? (
                    <div style={styles.editTaskForm}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Title</label>
                        <input
                          style={styles.input}
                          value={editTaskForm.title}
                          onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea
                          style={styles.textarea}
                          rows={2}
                          value={editTaskForm.description}
                          onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                        />
                      </div>
                      <div style={styles.row}>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Priority</label>
                          <select
                            style={styles.select}
                            value={editTaskForm.priority}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Due Date</label>
                          <input
                            type="date"
                            style={styles.input}
                            value={editTaskForm.due_date}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, due_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div style={styles.buttonGroup}>
                        <button onClick={() => handleUpdateTask(task.id)} style={styles.primaryBtn}>Save</button>
                        <button onClick={() => setEditingTaskId(null)} style={styles.secondaryBtn}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={styles.taskContent}>
                        <div style={styles.taskHeader}>
                          <span style={{
                            ...styles.priorityBadge,
                            backgroundColor: task.priority === "high" ? "#fef2f2" : task.priority === "medium" ? "#fffbeb" : "#eff6ff",
                            color: task.priority === "high" ? "#dc2626" : task.priority === "medium" ? "#d97706" : "#3b82f6"
                          }}>
                            {task.priority || "medium"}
                          </span>
                          <span style={styles.taskTitle}>{task.title}</span>
                          {task.due_date && (
                            <span style={styles.dueDate}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {task.due_date}
                            </span>
                          )}
                        </div>
                        {task.description && <div style={styles.taskDesc}>{task.description}</div>}
                      </div>
                      <div style={styles.taskActions}>
                        <select
                          style={styles.statusSelect}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button onClick={() => startEditTask(task)} style={styles.iconBtn}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                            <path d="M4 20h16" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} style={styles.iconDeleteBtn}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
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
  title: {
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
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 20px 0",
  },
  planCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  planContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },
  planDate: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#3b82f6",
    fontWeight: "500",
    marginBottom: "12px",
  },
  planGoal: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.5",
  },
  planActions: {
    display: "flex",
    gap: "8px",
  },
  editPlanForm: {
    width: "100%",
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
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "8px",
    letterSpacing: "0.3px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "vertical",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    cursor: "pointer",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "#ffffff",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  editBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "#ffffff",
    color: "#3b82f6",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  deleteBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "#ffffff",
    color: "#dc2626",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  newTaskForm: {
    marginBottom: "24px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  taskItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    transition: "border-color 0.2s",
    flexWrap: "wrap",
    gap: "12px",
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
    flexWrap: "wrap",
  },
  priorityBadge: {
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  taskTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  dueDate: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: "#64748b",
    padding: "2px 6px",
    background: "#f1f5f9",
    borderRadius: "4px",
  },
  taskDesc: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  taskActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusSelect: {
    padding: "6px 10px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  iconBtn: {
    padding: "6px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "#3b82f6",
  },
  iconDeleteBtn: {
    padding: "6px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "#dc2626",
  },
  editTaskForm: {
    width: "100%",
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
    margin: "0",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  input:focus, textarea:focus, select:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  button:hover {
    opacity: 0.9;
  }
  .primary-btn:hover {
    background: #2563eb !important;
  }
  .task-item:hover {
    border-color: #3b82f6;
  }
`;
document.head.appendChild(styleSheet);