import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getActivePlan,
  getTasks,
  getJournals,
} from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);

        const [planRes, journalRes] = await Promise.allSettled([
          getActivePlan(),
          getJournals(),
        ]);

        const activePlan =
          planRes.status === "fulfilled" ? planRes.value.data : null;

        const journalData =
          journalRes.status === "fulfilled" ? journalRes.value.data : [];

        let taskData = [];

        if (activePlan?.id) {
          try {
            const taskRes = await getTasks(activePlan.id);
            taskData = taskRes.data || [];
          } catch {
            taskData = [];
          }
        }

        if (active) {
          setPlan(activePlan);
          setTasks(taskData);
          setJournals(journalData);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  if (!user) {
    return (
      <div style={styles.center}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress =
    tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user.username}</p>
        </div>
      </header>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Active Plan</h3>
          <p style={styles.value}>{plan ? "Active" : "None"}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tasks</h3>
          <p style={styles.value}>
            {completed}/{tasks.length}
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Progress</h3>
          <p style={styles.value}>{progress}%</p>

          <div style={styles.bar}>
            <div style={{ ...styles.fill, width: `${progress}%` }} />
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Journals</h3>
          <p style={styles.value}>{journals.length}</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Tasks</h2>

        {tasks.length === 0 ? (
          <p style={styles.empty}>No tasks available</p>
        ) : (
          tasks.slice(0, 5).map((t) => (
            <div key={t.id} style={styles.task}>
              <span>{t.title}</span>
              <span style={styles.status}>{t.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    maxWidth: 1000,
    margin: "0 auto",
    background: "#0b0f14",
    minHeight: "100vh",
    color: "#ffffff",
    fontFamily: "system-ui",
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    margin: 0,
    color: "#ffffff",
  },

  subtitle: {
    color: "#8aa0b6",
    marginTop: 4,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },

  card: {
    background: "#111826",
    border: "1px solid #1f2a3a",
    borderRadius: 12,
    padding: 16,
  },

  cardTitle: {
    fontSize: 13,
    color: "#8aa0b6",
    marginBottom: 8,
  },

  value: {
    fontSize: 22,
    fontWeight: 600,
    color: "#ffffff",
  },

  bar: {
    height: 6,
    background: "#1f2a3a",
    borderRadius: 4,
    marginTop: 10,
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    background: "#3b82f6",
  },

  section: {
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    color: "#ffffff",
  },

  task: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #1f2a3a",
  },

  status: {
    color: "#3b82f6",
    fontSize: 12,
  },

  empty: {
    color: "#8aa0b6",
  },

  center: {
    display: "flex",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
    color: "#8aa0b6",
    background: "#0b0f14",
  },
};