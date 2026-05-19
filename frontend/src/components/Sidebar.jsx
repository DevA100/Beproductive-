import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: DashIcon },
  { path: "/planner", label: "Weekly Planner", icon: PlannerIcon },
  { path: "/journal", label: "Journal", icon: JournalIcon },
  { path: "/ai-coach", label: "AI Coach", icon: AIIcon },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function PlannerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const avatar = localStorage.getItem("avatar_" + user?.id);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = () => {
    logoutUser();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  return (
    <>
      {isMobile && (
        <header style={s.topBar}>
          <img src="/logo.png" alt="BeProductive" style={{ height: 28 }} />
          <button onClick={() => setMobileOpen(!mobileOpen)} style={s.menuBtn} aria-label="Menu">
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            )}
          </button>
        </header>
      )}

      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={s.overlay} />}

      <aside style={{ ...s.sidebar, transform: mobileOpen || !isMobile ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={s.logoSection}>
          <img src="/logo.png" alt="BeProductive" style={{ height: 36 }} />
        </div>

        <div style={s.userCard}>
          {avatar ? (
            <img src={avatar} alt={user?.username} style={s.avatarImg} />
          ) : (
            <div style={s.avatarFallback}>{user?.username?.[0]?.toUpperCase()}</div>
          )}
          <div style={s.userMeta}>
            <div style={s.userName}>{user?.username}</div>
            <div style={s.userEmail}>{user?.email}</div>
          </div>
        </div>

        <nav style={s.nav}>
          <div style={s.navLabel}>Navigation</div>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link key={path} to={path} style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
                <span style={{ ...s.navIcon, color: active ? "#3b82f6" : "#64748b" }}><Icon /></span>
                <span style={{ color: active ? "#f8fafc" : "#94a3b8", fontWeight: active ? 600 : 400 }}>{label}</span>
                {active && <span style={s.activeDot} />}
              </Link>
            );
          })}
        </nav>

        <div style={s.sidebarFooter}>
          
            href="https://buymeacoffee.com/yourname"
            target="_blank"
            rel="noopener noreferrer"
            style={s.supportBtn}
          <a>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            Support this project
          </a>
          <button onClick={handleLogout} style={s.logoutBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

const s = {
  topBar: { position: "fixed", top: 0, left: 0, right: 0, height: 56, background: "#06080f", borderBottom: "1px solid rgba(30,64,175,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 1100 },
  menuBtn: { background: "none", border: "1px solid rgba(30,64,175,0.3)", borderRadius: 8, padding: "6px 8px", color: "#94a3b8", display: "flex", alignItems: "center" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999 },
  sidebar: { width: 240, height: "100vh", background: "#06080f", borderRight: "1px solid rgba(30,64,175,0.15)", padding: "0 0 24px", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, zIndex: 1000, transition: "transform 0.25s ease" },
  logoSection: { padding: "20px 20px 16px", borderBottom: "1px solid rgba(30,64,175,0.1)" },
  userCard: { margin: "12px 12px 0", padding: "12px", background: "#0d1117", border: "1px solid rgba(30,64,175,0.15)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 },
  avatarFallback: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  avatarImg: { width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(37,99,235,0.4)" },
  userMeta: { overflow: "hidden" },
  userName: { color: "#f8fafc", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userEmail: { color: "#475569", fontSize: 11, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  nav: { flex: 1, padding: "16px 12px 0", display: "flex", flexDirection: "column", gap: 2 },
  navLabel: { color: "#334155", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, textDecoration: "none", fontSize: 13, position: "relative", transition: "background 0.15s" },
  navItemActive: { background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" },
  navIcon: { display: "flex", alignItems: "center", flexShrink: 0 },
  activeDot: { width: 4, height: 4, borderRadius: "50%", background: "#2563eb", marginLeft: "auto" },
  sidebarFooter: { padding: "16px 12px 0", borderTop: "1px solid rgba(30,64,175,0.1)", marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 },
  supportBtn: { display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, color: "#10b981", fontSize: 12, fontWeight: 500, textDecoration: "none" },
  logoutBtn: { display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, color: "#f87171", fontSize: 12, fontWeight: 500 },
};