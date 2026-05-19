import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getActivePlan,
  getTasks,
  getJournals,
  exportExcel,
} from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    tasks: [],
    journals: [],
    plan: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);

        const [planRes, journalRes] = await Promise.allSettled([
          getActivePlan(),
          getJournals(),
        ]);

        const plan =
          planRes.status === "fulfilled" ? planRes.value.data : null;

        const journals =
          journalRes.status === "fulfilled"
            ? journalRes.value.data
            : [];

        let tasks = [];

        if (plan?.id) {
          try {
            const taskRes = await getTasks(plan.id);
            tasks = taskRes.data || [];
          } catch (e) {
            tasks = [];
          }
        }

        if (alive) {
          setStats({ plan, journals, tasks });
        }
      } catch (err) {
        console.error("Dashboard crash:", err);
        toast.error("Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  // IMPORTANT: prevent blank screen if auth is still loading
  if (!user) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading user session...
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.username}</p>

      <div>
        <p>Tasks: {stats.tasks.length}</p>
        <p>Journals: {stats.journals.length}</p>
        <p>Plan: {stats.plan ? "Active" : "None"}</p>
      </div>
    </div>
  );
}