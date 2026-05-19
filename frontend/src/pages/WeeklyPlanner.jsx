import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getActivePlan, createPlan, getTasks, createTask, updateTask, updatePlan } from "../services/api";
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

  // Add to useEffect
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
        // Store for after plan creation
        sessionStorage.setItem("pending_ai_tasks", aiTasks);
      }
    } catch {}
  }
  
  fetchPlan();
}, []);

// Update handleCreatePlan to also create AI tasks
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

    // Auto-create AI tasks if available
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
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add task");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await updateTask(taskId, { status });
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
      toast.success("Task updated!");
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

  if (loading) return <div style={styles.loading}>Loading planner... 📅</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📅 Weekly Planner</h1>
        {!plan && <button onClick={() => setShowNewPlan(true)} style={styles.primaryBtn}>+ Create This Week's Plan</button>}
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
            <textarea style={styles.textarea} placeholder="What are your goals for this week?" value={planForm.goal_summary} onChange={(e) => setPlanForm({ ...planForm, goal_summary: e.target.value })} rows={3} />
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
              <span style={styles.activeBadge}>🟢 Active</span>
              <button onClick={() => { setEditingPlan(true); setPlanForm({ ...planForm, goal_summary: plan.goal_summary || "" }); }} style={styles.editPlanBtn}>✏️ Edit</button>
              <button onClick={handleDeletePlan} style={{ background: "rgba(255,100,100,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
  🗑️ Delete Plan
</button>
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
              <h3 style={styles.cardTitle}>Tasks ({tasks.length})</h3>
              <button onClick={() => setShowNewTask(!showNewTask)} style={styles.primaryBtn}>+ Add Task</button>
            </div>

            {showNewTask && (
              <form onSubmit={handleCreateTask} style={styles.taskForm}>
                <input style={styles.input} placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
                <input style={styles.input} placeholder="Description (optional)" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                <div style={styles.row}>
                  <select style={styles.input} value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <input style={styles.input} type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
                <div style={styles.btnRow}>
                  <button type="submit" style={styles.primaryBtn}>Add Task</button>
                  <button type="button" onClick={() => setShowNewTask(false)} style={styles.secondaryBtn}>Cancel</button>
                </div>
              </form>
            )}

            <div style={styles.taskList}>
              {tasks.length === 0 ? (
                <div style={styles.empty}>No tasks yet — add your first task! 🎯</div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    {editingTaskId === task.id ? (
                      <div style={{ flex: 1 }}>
                        <input style={{ ...styles.input, marginBottom: 8 }} value={editTaskForm.title} onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })} placeholder="Task title" />
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
                          <span style={{ ...styles.priorityDot, background: task.priority === "high" ? "#f5576c" : task.priority === "medium" ? "#a78bfa" : "#00d2ff" }} />
                          <div>
                            <div style={{ ...styles.taskTitle, textDecoration: task.status === "completed" ? "line-through" : "none", color: task.status === "completed" ? "#aaa" : "#333" }}>{task.title}</div>
                            {task.description && <div style={styles.taskDesc}>{task.description}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select style={styles.statusSelect} value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
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
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "20px 16px", maxWidth: 900 },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", fontSize: 20, color: "#00d2ff" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  title: { fontSize: 24, fontWeight: 800, color: "#e2e8f0", margin: 0 },
  planBanner: { background: "rgba(0,210,255,0.05)", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  planWeek: { fontWeight: 700, color: "#00d2ff", marginBottom: 4 },
  planGoal: { color: "#94a3b8", fontSize: 14 },
  activeBadge: { background: "rgba(67,233,123,0.1)", color: "#43e97b", padding: "6px 14px", borderRadius: 20, fontWeight: 600, fontSize: 13, border: "1px solid rgba(67,233,123,0.2)" },
  editPlanBtn: { background: "rgba(0,210,255,0.1)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  editTaskBtn: { background: "rgba(0,210,255,0.1)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,210,255,0.1)", borderRadius: 16, padding: "24px", marginBottom: 20 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 },
  primaryBtn: { background: "linear-gradient(135deg, #00d2ff, #7b2ff7)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  secondaryBtn: { background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#94a3b8" },
  input: { padding: "12px 14px", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 10, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  textarea: { width: "100%", padding: "12px 14px", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 12, background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  btnRow: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  taskForm: { background: "rgba(0,210,255,0.03)", border: "1px solid rgba(0,210,255,0.1)", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 },
  taskList: { display: "flex", flexDirection: "column", gap: 10 },
  taskItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(0,210,255,0.03)", border: "1px solid rgba(0,210,255,0.08)", borderRadius: 12, flexWrap: "wrap", gap: 8 },
  taskInfo: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 150 },
  priorityDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  taskTitle: { fontWeight: 600, fontSize: 15, color: "#e2e8f0" },
  taskDesc: { color: "#64748b", fontSize: 13, marginTop: 2 },
  statusSelect: { padding: "8px 12px", border: "1px solid rgba(0,210,255,0.2)", borderRadius: 8, fontSize: 13, outline: "none", cursor: "pointer", background: "rgba(255,255,255,0.05)", color: "#e2e8f0" },
  empty: { textAlign: "center", color: "#64748b", padding: "24px 0" },
};