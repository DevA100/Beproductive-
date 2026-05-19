import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getActivePlan, getTasks, getJournals, exportExcel } from "../services/api";
import toast from "react-hot-toast";

const PRIORITY_COLOR = { high: "#ef4444", medium: "#3b82f6", low: "#10b981" };

const STATUS_CONFIG = {
  completed: { color: "#10b981", bg: "rgba(16,185,129,0.08)", label: "Completed" },
  in_progress: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", label: "In Progress" },
  pending: { color: "#64748b", bg: "rgba(100,116,139,0.08)", label: "Pending" },
};

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({ tasks: [], journals: [], plan: null });
  const [loading, setLoading] = useState(true);

  const avatar = user?.id
    ? localStorage.getItem("avatar_" + user.id)
    : null;

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [planRes, journalsRes] = await Promise.allSettled([
          getActivePlan(),
          getJournals(),
        ]);

        const plan =
          planRes.status === "fulfilled" ? planRes.value.data : null;

        const journals =
          journalsRes.status === "fulfilled" ? journalsRes.value.data : [];

        let tasks = [];

        if (plan?.id) {
          try {
            const tasksRes = await getTasks(plan.id);
            tasks = tasksRes.data || [];
          } catch (err) {
            tasks = [];
          }
        }

        if (isMounted) {
          setStats({ tasks, journals, plan });
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        toast.error("Failed to load dashboard");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExport = async () => {
    try {
      const res = await exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");

      a.href = url;
      a.download = `BeProductive_${user?.username || "user"}.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success("Export complete");
    } catch {
      toast.error("Export failed");
    }
  };

  const completed = stats.tasks.filter((t) => t.status === "completed").length;
  const total = stats.tasks.length;

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const avgScore = stats.journals.length
    ? (
        stats.journals.reduce(
          (s, j) => s + (j.productivity_score || 0),
          0
        ) / stats.journals.length
      ).toFixed(1)
    : "—";

  // IMPORTANT FIX: prevent blank crash when user not ready
  if (!user) {
    return (
      <div style={{ padding: 20, color: "#fff" }}>
        Loading user session...
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid rgba(37,99,235,0.2)",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "#475569", fontSize: 14 }}>
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          {avatar ? (
            <img src={avatar} alt="avatar" style={s.avatar} />
          ) : (
            <div style={s.avatarFallback}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}

          <div>
            <h1 style={s.greeting}>Good day, {user?.username}</h1>
            <p style={{ color: "#475569", fontSize: 13 }}>
              Here is your productivity overview
            </p>
          </div>
        </div>

        <button onClick={handleExport} style={s.exportBtn}>
          Export
        </button>
      </header>

      <div style={s.statsRow}>
        {[
          {
            label: "Active Plan",
            value: stats.plan ? "Active" : "None",
            accent: stats.plan ? "#10b981" : "#475569",
            sub: stats.plan
              ? `${stats.plan.week_start} — ${stats.plan.week_end}`
              : "No plan this week",
          },
          {
            label: "Tasks",
            value: `${completed}/${total}`,
            accent: "#2563eb",
            sub: `${progress}% complete`,
          },
          {
            label: "Avg Score",
            value: avgScore !== "—" ? `${avgScore}/10` : "—",
            accent: "#8b5cf6",
            sub: `${stats.journals.length} entries`,
          },
          {
            label: "This Week",
            value: stats.journals.length,
            accent: "#0891b2",
            sub: "journal entries",
          },
        ].map((card) => (
          <div key={card.label} style={s.statCard}>
            <div style={{ color: card.accent, fontSize: 26, fontWeight: 800 }}>
              {card.value}
            </div>
            <div style={{ color: "#fff", fontSize: 13 }}>{card.label}</div>
            <div style={{ color: "#475569", fontSize: 11 }}>{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { padding: "28px 24px", maxWidth: 1100 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "2px solid rgba(37,99,235,0.3)",
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  greeting: { fontSize: 20, color: "#fff", margin: 0 },
  exportBtn: {
    padding: "8px 14px",
    background: "#2563eb",
    border: "none",
    color: "#fff",
    borderRadius: 8,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  statCard: {
    background: "#0d1117",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #1f2937",
  },
};