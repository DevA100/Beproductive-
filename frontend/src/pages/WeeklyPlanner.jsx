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
} from "../services/api";

export default function WeeklyPlanner() {
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);

  const [editingPlan, setEditingPlan] = useState(false);

  const [editingTaskId, setEditingTaskId] =
    useState(null);

  const [editTaskForm, setEditTaskForm] =
    useState({});

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

  const fetchPlan = async () => {
    try {
      setLoading(true);

      const planRes =
        await getActivePlan().catch(() => ({
          data: null,
        }));

      const activePlan = planRes.data;

      setPlan(activePlan);

      if (activePlan) {
        const tasksRes = await getTasks(
          activePlan.id
        );

        setTasks(tasksRes.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        "Unable to load weekly planner"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const aiPlan =
      searchParams.get("ai_plan");

    const aiTasks =
      searchParams.get("ai_tasks");

    if (aiPlan) {
      setShowNewPlan(true);

      setPlanForm((prev) => ({
        ...prev,
        goal_summary: aiPlan,
      }));
    }

    if (aiTasks) {
      sessionStorage.setItem(
        "pending_ai_tasks",
        aiTasks
      );
    }

    fetchPlan();
  }, [searchParams]);

  const handleCreatePlan = async (
    e
  ) => {
    e.preventDefault();

    try {
      const res =
        await createPlan(planForm);

      setPlan(res.data);

      toast.success(
        "Weekly plan created"
      );

      setShowNewPlan(false);

      const pending =
        sessionStorage.getItem(
          "pending_ai_tasks"
        );

      if (pending) {
        const aiTasks =
          JSON.parse(pending);

        const created = [];

        for (const task of aiTasks) {
          try {
            const t =
              await createTask(
                res.data.id,
                {
                  title: task.title,
                  description:
                    task.description,
                  priority:
                    "medium",
                }
              );

            created.push(t.data);

          } catch {}
        }

        setTasks(created);

        sessionStorage.removeItem(
          "pending_ai_tasks"
        );
      }

    } catch {
      toast.error(
        "Unable to create plan"
      );
    }
  };

  const handleCreateTask =
    async (e) => {
      e.preventDefault();

      try {
        const res =
          await createTask(
            plan.id,
            taskForm
          );

        setTasks([
          ...tasks,
          res.data,
        ]);

        setShowNewTask(false);

        setTaskForm({
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
        });

        toast.success(
          "Task added"
        );

      } catch {
        toast.error(
          "Unable to add task"
        );
      }
    };

  const handleStatusChange =
    async (id, status) => {

      try {

        await updateTask(
          id,
          { status }
        );

        setTasks(
          tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                }
              : t
          )
        );

      } catch {

        toast.error(
          "Update failed"
        );

      }
    };

  const handleDeletePlan =
    async () => {

      if (
        !window.confirm(
          "Delete plan?"
        )
      )
        return;

      try {

        await deletePlan(
          plan.id
        );

        setPlan(null);

        setTasks([]);

      } catch {

        toast.error(
          "Delete failed"
        );

      }
    };

  if (loading)
    return (
      <div style={styles.loading}>
        Loading planner...
      </div>
    );

  return (
    <div className="page-container">

      <div style={styles.header}>

        <h1 style={styles.title}>
          Weekly Planner
        </h1>

        {!plan && (
          <button
            style={styles.primaryBtn}
            onClick={() =>
              setShowNewPlan(
                true
              )
            }
          >
            Create Plan
          </button>
        )}

      </div>

      {showNewPlan && (
        <div style={styles.card}>

          <form
            onSubmit={
              handleCreatePlan
            }
          >

            <div style={styles.row}>

              <input
                type="date"
                value={
                  planForm.week_start
                }
                onChange={(e)=>
                setPlanForm({
                  ...planForm,
                  week_start:
                    e.target.value
                })
              }
              />

              <input
                type="date"
                value={
                  planForm.week_end
                }
                onChange={(e)=>
                setPlanForm({
                  ...planForm,
                  week_end:
                    e.target.value
                })
              }
              />

            </div>

            <textarea
              rows={4}
              placeholder="Weekly goals"
              value={
                planForm.goal_summary
              }
              onChange={(e)=>
              setPlanForm({
                ...planForm,
                goal_summary:
                  e.target.value
              })
            }
            />

            <button
              type="submit"
              style={
                styles.primaryBtn
              }
            >
              Save Plan
            </button>

          </form>

        </div>
      )}

      {plan && (
        <>
          <div
            style={
              styles.planCard
            }
          >

            <div>

              <div
                style={
                  styles.planDate
                }
              >
                {plan.week_start}
                {" — "}
                {plan.week_end}
              </div>

              <div
                style={
                  styles.goal
                }
              >
                {
                  plan.goal_summary
                }
              </div>

            </div>

            <button
              onClick={
                handleDeletePlan
              }
              style={
                styles.deleteBtn
              }
            >
              Delete
            </button>

          </div>

          <div style={styles.card}>

            <div
              style={
                styles.header
              }
            >
              <h2>
                Tasks
              </h2>

              <button
                style={
                  styles.primaryBtn
                }
                onClick={()=>
                setShowNewTask(
                  !showNewTask
                )
              }
              >
                Add Task
              </button>

            </div>

            {showNewTask && (

              <form
                onSubmit={
                  handleCreateTask
                }
              >

                <input
                  placeholder="Title"
                  value={
                    taskForm.title
                  }
                  onChange={(e)=>
                  setTaskForm({
                    ...taskForm,
                    title:
                    e.target.value
                  })
                }
                />

                <textarea
                  placeholder="Description"
                  value={
                    taskForm.description
                  }
                  onChange={(e)=>
                  setTaskForm({
                    ...taskForm,
                    description:
                    e.target.value
                  })
                }
                />

                <button
                  style={
                    styles.primaryBtn
                  }
                >
                  Save
                </button>

              </form>

            )}

            <div
              style={
                styles.taskList
              }
            >

              {tasks.map(
                (task)=>(
                <div
                  key={
                    task.id
                  }
                  style={
                    styles.task
                  }
                >

                  <div>

                    <div
                    style={
                      styles.taskTitle
                    }
                    >
                    {task.title}
                    </div>

                    <div
                    style={
                      styles.taskDesc
                    }
                    >
                    {
                    task.description
                    }
                    </div>

                  </div>

                  <select
                    value={
                      task.status
                    }
                    onChange={(
                      e
                    )=>
                    handleStatusChange(
                    task.id,
                    e.target.value
                    )
                  }
                  >

                    <option value="pending">
                      Pending
                    </option>

                    <option value="in_progress">
                      In Progress
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                  </select>

                </div>
              ))}

            </div>

          </div>
        </>
      )}
    </div>
  );
}

const styles={

loading:{
height:"100vh",
display:"flex",
alignItems:"center",
justifyContent:"center"
},

header:{
display:"flex",
justifyContent:"space-between",
marginBottom:30
},

title:{
fontSize:32,
fontWeight:700
},

card:{
background:"#0f172a",
padding:24,
borderRadius:16,
border:"1px solid #1e293b",
marginBottom:24
},

planCard:{
background:"#111827",
padding:24,
borderRadius:16,
marginBottom:24,
display:"flex",
justifyContent:"space-between"
},

planDate:{
color:"#3b82f6",
marginBottom:8
},

goal:{
color:"#94a3b8"
},

primaryBtn:{
background:"#2563eb",
border:"none",
padding:"12px 20px",
borderRadius:10,
color:"#fff"
},

deleteBtn:{
background:"transparent",
color:"#ef4444",
border:"1px solid #ef4444",
padding:"10px 16px",
borderRadius:10
},

row:{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:12,
marginBottom:12
},

taskList:{
display:"flex",
flexDirection:"column",
gap:12,
marginTop:20
},

task:{
display:"flex",
justifyContent:"space-between",
padding:18,
borderRadius:12,
background:"#131b2e"
},

taskTitle:{
fontWeight:600
},

taskDesc:{
color:"#94a3b8",
fontSize:13
}

};