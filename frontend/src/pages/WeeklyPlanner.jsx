import { useState, useEffect } from "react";
import { getActivePlan, createPlan, getTasks, createTask, updateTask } from "../services/api";
import toast from "react-hot-toast";

export default function WeeklyPlanner() {
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [planForm, setPlanForm] = useState({ week_start: "", week_end: "", goal_summary: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", due_date: "" });

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    try {
      const res = await getActivePlan();
      setPlan(res.data);
      const tasksRes = await getTasks(res.data.id);
      setTasks(tasksRes.data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await createPlan(planForm);
      setPlan(res.data);
      setShowNewPlan(false);
      toast.success("Weekly plan created! 🎉");
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
            <div>
              <div style={styles.planWeek}>📅 {plan.week_start} → {plan.week_end}</div>
              <div style={styles.planGoal}>{plan.goal_summary || "No goal summary set"}</div>
            </div>
            <span style={styles.activeBadge}>🟢 Active</span>
          </div>

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
                    <div style={styles.taskInfo}>
                      <span style={{ ...styles.priorityDot, background: task.priority === "high" ? "#f5576c" : task.priority === "medium" ? "#f093fb" : "#667eea" }} />
                      <div>
                        <div style={{ ...styles.taskTitle, textDecoration: task.status === "completed" ? "line-through" : "none", color: task.status === "completed" ? "#aaa" : "#333" }}>{task.title}</div>
                        {task.description && <div style={styles.taskDesc}>{task.description}</div>}
                      </div>
                    </div>
                    <select style={styles.statusSelect} value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
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
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", fontSize: 20, color: "#667eea" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: 0 },
  planBanner: { background: "linear-gradient(135deg, #667eea20, #764ba220)", border: "2px solid #667eea40", borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" },
  planWeek: { fontWeight: 700, color: "#667eea", marginBottom: 4 },
  planGoal: { color: "#555", fontSize: 14 },
  activeBadge: { background: "#43e97b20", color: "#43e97b", padding: "6px 14px", borderRadius: 20, fontWeight: 600, fontSize: 13 },
  card: { background: "white", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 20 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  primaryBtn: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  secondaryBtn: { background: "#f0f0f0", color: "#666", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
   row: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#555" },
  input: { padding: "12px 14px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "12px 14px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 12 },
  btnRow: { display: "flex", gap: 10, marginTop: 12 },
  taskForm: { background: "#f8f9ff", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 },
  taskList: { display: "flex", flexDirection: "column", gap: 10 },
  taskItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#f8f9ff", borderRadius: 12 },
  taskInfo: { display: "flex", alignItems: "center", gap: 12, flex: 1 },
  priorityDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  taskTitle: { fontWeight: 600, fontSize: 15, color: "#333" },
  taskDesc: { color: "#888", fontSize: 13, marginTop: 2 },
  statusSelect: { padding: "8px 12px", border: "2px solid #eee", borderRadius: 8, fontSize: 13, outline: "none", cursor: "pointer" },
    empty: { textAlign: "center", color: "#aaa", padding: "24px 0" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }

};