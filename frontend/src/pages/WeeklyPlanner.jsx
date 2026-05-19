import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getActivePlan, createPlan, getTasks, createTask, updateTask, updatePlan, deletePlan } from "../services/api";
import toast from "react-hot-toast";

const PRIORITY_OPTIONS = ["low", "medium", "high"];
const STATUS_OPTIONS = ["pending", "in_progress", "completed"];
const PRIORITY_COLOR = { high: "#ef4444", medium: "#3b82f6", low: "#10b981" };

export default function WeeklyPlanner() {
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [planForm, setPlanForm] = useState({ week_start: "", week_end: "", goal_summary: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", due_date: "" });
  const [editTaskForm, setEditTaskForm] = useState({});
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const aiPlan = searchParams.get("ai_plan");
    const aiTasks = searchParams.get("ai_tasks");
    if (aiPlan) {
      setShowCreatePlan(true);
      setPlanForm(p => ({ ...p, goal_summary: decodeURIComponent(aiPlan) }));
      toast.success("AI plan loaded — set your dates and save");
    }
    if (aiTasks) {
      try {
        const parsed = JSON.parse(decodeURIComponent(aiTasks));
        if (parsed.length) sessionStorage.setItem("pending_ai_tasks", JSON.stringify(parsed));
      } catch {}
    }
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await getActivePlan();
      setPlan(res.data);
      const t = await getTasks(res.data.id).catch(() => ({ data: [] }));
      setTasks(t.data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (planForm.week_start >= planForm.week_end) return toast.error("End date must be after start date");
    const diff = (new Date(planForm.week_end) - new Date(planForm.week_start)) / 86400000;
    if (diff < 2) return toast.error("Plan must span at least 2 days");
    try {
      const res = await createPlan(planForm);
      setPlan(res.data);
      setShowCreatePlan(false);
      toast.success("Weekly plan created");
      const pending = sessionStorage.getItem("pending_ai_tasks");
      if (pending) {
        const aiTasks = JSON.parse(pending);
        const created = [];
        for (const t of aiTasks) {
          try {
            const r = await createTask(res.data.id, { title: t.title, description: t.description, priority: "medium" });
            created.push(r.data);
          } catch {}
        }
        setTasks(created);
        sessionStorage.removeItem("pending_ai_tasks");
        if (created.length) toast.success(`${created.length} tasks added from AI plan`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create plan");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await createTask(plan.id, taskForm);
      setTasks(prev => [...prev, res.data]);
      setShowCreateTask(false);
      setTaskForm({ title: "", description: "", priority: "medium", due_date: "" });
      toast.success("Task added");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add task");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    await updateTask(taskId, { status }).catch(() => toast.error("Update failed"));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const handleSaveTaskEdit = async (taskId) => {
    try {
      const res = await updateTask(taskId, editTaskForm);
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
      setEditingTaskId(null);
      toast.success("Task updated");
    } catch { toast.error("Update failed"); }
  };

  const handleSavePlanEdit = async () => {
    try {
      await updatePlan(plan.id, { goal_summary: planForm.goal_summary });
      setPlan(p => ({ ...p, goal_summary: planForm.goal_summary }));
      setEditingPlan(false);
      toast.success("Plan updated");
    } catch { toast.error("Update failed"); }
  };

  const handleDeletePlan = async () => {
    if (!window.confirm("Delete this plan and all its tasks? This cannot be undone.")) return;
    try {
      await deletePlan(plan.id);
      setPlan(null);
      setTasks([]);
      toast.success("Plan deleted");
    } catch { toast.error("Delete failed"); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(37,99,235,0.2)", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={s.page}>
      <header style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Weekly Planner</h1>
          <p style={s.pageSubtitle}>Plan, track, and complete your weekly goals</p>
        </div>
        {!plan && (
          <button onClick={() => setShowCreatePlan(true)} style={s.primaryBtn}>
            + New Plan
          </button>
        )}
      </header>

      {showCreatePlan && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Create Weekly Plan</h3>
          <form onSubmit={handleCreatePlan}>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Start Date</label>
                <input style={s.input} type="date" value={planForm.week_start} onChange={e => setPlanForm(p => ({ ...p, week_start: e.target.value }))} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>End Date</label>
                <input style={s.input} type="date" value={planForm.week_end} onChange={e => setPlanForm(p => ({ ...p, week_end: e.target.value }))} required />
              </div>
            </div>
            <label style={s.label}>Goal Summary</label>
            <textarea style={s.textarea} placeholder="Describe your focus and goals for this week..." value={planForm.goal_summary} onChange={e => setPlanForm(p => ({ ...p, goal_summary: e.target.value }))} rows={3} />
            <div style={s.btnRow}>
              <button type="submit" style={s.primaryBtn}>Create Plan</button>
              <button type="button" onClick={() => setShowCreatePlan(false)} style={s.ghostBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!plan && !showCreatePlan && (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <h3 style={{ color: "#64748b", fontWeight: 600, marginBottom: 6 }}>No active plan</h3>
          <p style={{ color: "#334155", fontSize: 13 }}>Create a weekly plan to start tracking your tasks and goals.</p>
        </div>
      )}

      {plan && (
        <>
          <div style={s.planBanner}>
            <div>
              <div style={s.planRange}>{plan.week_start} — {plan.week_end}</div>
              <div style={s.planGoal}>{plan.goal_summary || "No goal summary"}</div>
            </div>
            <div style={s.planActions}>
              <span style={s.activePill}>Active</span>
              <button onClick={() => { setEditingPlan(true); setPlanForm(p => ({ ...p, goal_summary: plan.goal_summary || "" })); }} style={s.iconBtn}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Edit
              </button>
              <button onClick={handleDeletePlan} style={s.dangerBtn}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                Delete
              </button>
            </div>
          </div>

          {editingPlan && (
            <div style={s.formCard}>
              <h3 style={s.formTitle}>Edit Plan</h3>
              <textarea style={s.textarea} placeholder="Update goal summary..." value={planForm.goal_summary} onChange={e => setPlanForm(p => ({ ...p, goal_summary: e.target.value }))} rows={3} />
              <div style={s.btnRow}>
                <button onClick={handleSavePlanEdit} style={s.primaryBtn}>Save</button>
                <button onClick={() => setEditingPlan(false)} style={s.ghostBtn}>Cancel</button>
              </div>
            </div>
          )}

          <div style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <h2 style={s.cardTitle}>Tasks</h2>
                <span style={s.taskCount}>{tasks.length} total · {tasks.filter(t => t.status === "completed").length} done</span>
              </div>
              <button onClick={() => setShowCreateTask(!showCreateTask)} style={s.primaryBtn}>+ Add Task</button>
            </div>

            {showCreateTask && (
              <form onSubmit={handleCreateTask} style={s.inlineForm}>
                <input style={s.input} placeholder="Task title *" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required />
                <input style={s.input} placeholder="Description (optional)" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
                <div style={s.row}>
                  <div style={s.field}>
                    <label style={s.label}>Priority</label>
                    <select style={s.select} value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                      {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Due Date</label>
                    <input style={s.input} type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                </div>
                <div style={s.btnRow}>
                  <button type="submit" style={s.primaryBtn}>Add Task</button>
                  <button type="button" onClick={() => setShowCreateTask(false)} style={s.ghostBtn}>Cancel</button>
                </div>
              </form>
            )}

            {tasks.length === 0 ? (
              <div style={s.emptyTasks}>No tasks yet. Add your first task above.</div>
            ) : (
              <div style={s.taskList}>
                {tasks.map(task => (
                  <div key={task.id} style={s.taskItem}>
                    {editingTaskId === task.id ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <input style={s.input} value={editTaskForm.title} onChange={e => setEditTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" />
                        <input style={s.input} value={editTaskForm.description || ""} onChange={e => setEditTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" />
                        <select style={s.select} value={editTaskForm.priority} onChange={e => setEditTaskForm(p => ({ ...p, priority: e.target.value }))}>
                          {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                        </select>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleSaveTaskEdit(task.id)} style={s.primaryBtn}>Save</button>
                          <button onClick={() => setEditingTaskId(null)} style={s.ghostBtn}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ ...s.priorityBar, background: PRIORITY_COLOR[task.priority] }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: task.status === "completed" ? "#475569" : "#e2e8f0", textDecoration: task.status === "completed" ? "line-through" : "none" }}>
                            {task.title}
                          </div>
                          {task.description && <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{task.description}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select style={s.statusSelect} value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}>
                            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                          </select>
                          <button onClick={() => { setEditingTaskId(task.id); setEditTaskForm({ title: task.title, description: task.description || "", priority: task.priority }); }} style={s.editTaskBtn}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  page: { padding: "28px 24px", maxWidth: 900, animation: "fadeIn 0.3s ease" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#f8fafc", margin: 0 },
  pageSubtitle: { color: "#475569", fontSize: 13, marginTop: 3 },
  planBanner: { background: "#0d1117", border: "1px solid rgba(37,99,235,0.25)", borderLeft: "3px solid #2563eb", borderRadius: 10, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  planRange: { color: "#3b82f6", fontSize: 12, fontWeight: 600, marginBottom: 4, letterSpacing: "0.02em" },
  planGoal: { color: "#94a3b8", fontSize: 13 },
  planActions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  activePill: { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 600 },
  iconBtn: { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 6, color: "#3b82f6", fontSize: 12, fontWeight: 500 },
  dangerBtn: { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, color: "#f87171", fontSize: 12, fontWeight: 500 },
  formCard: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 12, padding: "20px", marginBottom: 16 },
  formTitle: { fontSize: 15, fontWeight: 600, color: "#f8fafc", marginBottom: 16 },
  card: { background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 12, padding: "20px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "#f8fafc", margin: 0 },
  taskCount: { color: "#475569", fontSize: 11, display: "block", marginTop: 2 },
  inlineForm: { background: "#111827", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 10, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 },
  taskList: { display: "flex", flexDirection: "column", gap: 1 },
  taskItem: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(30,64,175,0.08)" },
  priorityBar: { width: 3, height: 36, borderRadius: 2, flexShrink: 0 },
  statusSelect: { padding: "5px 8px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 6, fontSize: 11, background: "#111827", color: "#94a3b8" },
  editTaskBtn: { padding: "5px 8px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 6, color: "#3b82f6", display: "flex", alignItems: "center" },
  emptyTasks: { textAlign: "center", color: "#334155", fontSize: 13, padding: "28px 0" },
  emptyState: { textAlign: "center", padding: "48px 20px", border: "1px dashed rgba(30,64,175,0.2)", borderRadius: 12 },
  emptyIcon: { width: 56, height: 56, background: "rgba(30,64,175,0.08)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { padding: "10px 12px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 13, width: "100%", boxSizing: "border-box", background: "#111827", color: "#e2e8f0" },
  select: { padding: "10px 12px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 13, background: "#111827", color: "#e2e8f0" },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 13, background: "#111827", color: "#e2e8f0", resize: "vertical", boxSizing: "border-box" },
  btnRow: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" },
  primaryBtn: { padding: "9px 18px", background: "#2563eb", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600 },
  ghostBtn: { padding: "9px 18px", background: "transparent", border: "1px solid rgba(30,64,175,0.25)", borderRadius: 8, color: "#64748b", fontSize: 13, fontWeight: 500 },
};