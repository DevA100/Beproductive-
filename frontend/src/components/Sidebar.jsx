import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/planner", icon: "📅", label: "Weekly Planner" },
  { path: "/journal", icon: "📝", label: "Journal" },
  { path: "/ai-coach", icon: "🤖", label: "AI Coach" },
  { path: "/settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const avatar = localStorage.getItem("avatar_" + user?.id);

  // ✅ Safe mobile detection (prevents Vercel crash)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out!");
    navigate("/login");
  };

  const handleNavClick = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Top Bar */}
      {isMobile && (
        <div style={styles.mobileTopBar}>
          <div style={styles.mobileLogo}>⚡ BeProductive</div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={styles.hamburger}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      )}

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={styles.overlay}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          ...styles.sidebar,
          transform:
            mobileOpen || !isMobile
              ? "translateX(0)"
              : "translateX(-100%)",
        }}
      >
        {/* Logo */}
        <div style={styles.logo}>⚡ BeProductive</div>

        {/* User Info */}
        <div style={styles.userInfo}>
          {avatar ? (
            <img src={avatar} alt="avatar" style={styles.avatarImg} />
          ) : (
            <div style={styles.avatar}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={styles.username}>{user?.username}</div>
            <div style={styles.email}>{user?.email}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              style={{
                ...styles.navItem,
                ...(pathname === item.path
                  ? styles.activeItem
                  : {}),
              }}
            >
              <span style={styles.icon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Buy Me Coffee */}
        <a
          href="https://buymeacoffee.com/yourname"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.coffeeBtn}
        >
          ☕ Buy me a coffee
        </a>

        {/* Logout */}
        <button onClick={handleLogout} style={styles.logout}>
          🚪 Logout
        </button>
      </div>
    </>
  );
}

/* ================= STYLES ================= */
const styles = {
  sidebar: {
    width: 260,
    minHeight: "100vh",
    background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1000,
    transition: "transform 0.3s ease",
  },

  mobileTopBar: {
    display: "flex",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    zIndex: 1100,
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  },

  mobileLogo: {
    fontSize: 18,
    fontWeight: 800,
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  hamburger: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 26,
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },

  logo: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 24,
    color: "white",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: "12px",
    marginBottom: 24,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 700,
  },

  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    objectFit: "cover",
  },

  username: { color: "white", fontWeight: 600, fontSize: 14 },
  email: { color: "#888", fontSize: 11 },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
  },

  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    color: "#aaa",
    textDecoration: "none",
  },

  activeItem: {
    background: "rgba(102,126,234,0.2)",
    color: "white",
  },

  icon: { fontSize: 18 },

  coffeeBtn: {
    marginTop: 10,
    padding: "12px",
    borderRadius: 12,
    textAlign: "center",
    textDecoration: "none",
    background: "linear-gradient(135deg, #f6d365, #fda085)",
    color: "white",
    fontWeight: 700,
  },

  logout: {
    marginTop: 10,
    padding: "12px",
    borderRadius: 12,
    border: "none",
    background: "rgba(255,100,100,0.1)",
    color: "#ff6b6b",
    cursor: "pointer",
  },
};