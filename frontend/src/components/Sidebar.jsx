import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Logo Component embedded directly
const FullLogo = ({ size = "default", variant = "light" }) => {
  const dimensions = {
    small: { width: 120, height: 32 },
    default: { width: 160, height: 40 },
    large: { width: 200, height: 48 },
  };

  const dim = dimensions[size] || dimensions.default;
  const textColor = variant === "dark" ? "#1e293b" : "#f8fafc";
  const iconColor = "#3b82f6";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width={dim.height} height={dim.height} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill={iconColor} />
        <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="12" cy="20" r="2" fill="white"/>
        <circle cx="18" cy="26" r="2" fill="white"/>
        <circle cx="28" cy="14" r="2" fill="white"/>
        <path d="M8 32L32 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3"/>
      </svg>
      <span style={{ 
        fontSize: dim.height * 0.6, 
        fontWeight: 700, 
        color: textColor,
        letterSpacing: "-0.5px"
      }}>
        BeProductive
      </span>
    </div>
  );
};

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: DashIcon },
  { path: "/planner", label: "Weekly Planner", icon: PlannerIcon },
  { path: "/journal", label: "Journal", icon: JournalIcon },
  { path: "/ai-coach", label: "AI Coach", icon: AIIcon },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

function DashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function PlannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logoutUser();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleBuyCoffee = () => {
    window.open("https://paystack.shop/pay/l3bdcrpds-", "_blank");
  };

  return (
    <>
      {isMobile && (
        <header style={styles.topBar}>
          <FullLogo size="small" variant="light" />
          <button onClick={() => setMobileOpen(!mobileOpen)} style={styles.menuBtn} aria-label="Menu">
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </header>
      )}

      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={styles.overlay} />}

      <aside style={{
        ...styles.sidebar,
        transform: mobileOpen || !isMobile ? "translateX(0)" : "translateX(-100%)"
      }}>
        <div style={styles.logoSection}>
          <FullLogo size="default" variant="light" />
        </div>

        <div style={styles.userCard}>
          {avatar ? (
            <img src={avatar} alt={user?.username} style={styles.avatarImg} />
          ) : (
            <div style={styles.avatarFallback}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div style={styles.userMeta}>
            <div style={styles.userName}>{user?.username || "User"}</div>
            <div style={styles.userEmail}>{user?.email || "user@example.com"}</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navLabel}>Navigation</div>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {})
                }}
              >
                <span style={{
                  ...styles.navIcon,
                  color: active ? "#3b82f6" : "#64748b"
                }}>
                  <Icon />
                </span>
                <span style={{
                  color: active ? "#f8fafc" : "#94a3b8",
                  fontWeight: active ? 600 : 400
                }}>
                  {label}
                </span>
                {active && <span style={styles.activeDot} />}
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleBuyCoffee} style={styles.supportBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            Buy Me Coffee
          </button>
          
          <Link to="/settings/delete-account" style={styles.deleteAccountBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
            </svg>
            Delete Account
          </Link>
          
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

const styles = {
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    background: "#06080f",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    zIndex: 1100,
  },
  menuBtn: {
    background: "none",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "6px 8px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.7)",
    zIndex: 999,
  },
  sidebar: {
    width: 260,
    height: "100vh",
    background: "#0d1117",
    borderRight: "1px solid #1e293b",
    padding: "0",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1000,
    transition: "transform 0.25s ease",
    overflowY: "auto",
  },
  logoSection: {
    padding: "24px 20px",
    borderBottom: "1px solid #1e293b",
  },
  userCard: {
    margin: "16px",
    padding: "12px",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3b82f6",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
    border: "2px solid #3b82f6",
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "2px solid #3b82f6",
  },
  userMeta: {
    flex: 1,
    overflow: "hidden",
  },
  userName: {
    color: "#f8fafc",
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  nav: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  navLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    padding: "0 12px",
    marginBottom: 8,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    position: "relative",
    transition: "all 0.15s",
  },
  navItemActive: {
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: "#3b82f6",
    marginLeft: "auto",
  },
  sidebarFooter: {
    padding: "16px",
    borderTop: "1px solid #1e293b",
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  supportBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "10px 12px",
    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
  },
  deleteAccountBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "10px 12px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#f87171",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    textDecoration: "none",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "10px 12px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#f87171",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .nav-item:hover {
    background: #1e293b;
  }
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: #ef4444;
    color: #ef4444;
  }
  .delete-account-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: #ef4444;
    color: #ef4444;
  }
  .support-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  .support-btn:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(styleSheet);