// Sidebar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/planner", label: "Weekly Planner" },
  { path: "/journal", label: "Journal" },
  { path: "/ai-coach", label: "AI Coach" },
  { path: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

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

  useEffect(() => {
    document.body.style.backgroundColor = theme === "dark" ? "#000000" : "#ffffff";
  }, [theme]);

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out");
    navigate("/login");
  };

  const getStyles = () => {
    const isDark = theme === "dark";
    
    return {
      sidebar: {
        width: 260,
        minHeight: "100vh",
        background: isDark ? "#000000" : "#ffffff",
        borderRight: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
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
        background: isDark ? "#000000" : "#ffffff",
        borderBottom: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 1100,
      },
      mobileLogo: {
        fontSize: 18,
        fontWeight: 800,
        color: "#0066cc",
      },
      hamburger: {
        background: "none",
        border: "none",
        color: isDark ? "#ffffff" : "#000000",
        fontSize: 24,
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
        fontSize: 20,
        fontWeight: 800,
        color: "#0066cc",
        marginBottom: 24,
        padding: "0 8px",
      },
      userInfo: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: "12px",
        marginBottom: 24,
      },
      avatar: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#0066cc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontWeight: 700,
        fontSize: 18,
        flexShrink: 0,
      },
      avatarImg: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: `2px solid #0066cc`,
      },
      username: {
        color: isDark ? "#ffffff" : "#000000",
        fontWeight: 600,
        fontSize: 14,
      },
      email: {
        color: isDark ? "#888888" : "#666666",
        fontSize: 11,
        marginTop: 2,
      },
      nav: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flex: 1,
      },
      navItem: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderRadius: 8,
        color: isDark ? "#888888" : "#666666",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 500,
        transition: "all 0.2s",
        border: `1px solid transparent`,
      },
      activeItem: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        color: "#0066cc",
      },
      coffeeBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0066cc",
        color: "#ffffff",
        borderRadius: 8,
        padding: "10px 16px",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 8,
        cursor: "pointer",
      },
      logout: {
        background: isDark ? "#1a1a1a" : "#f5f5f5",
        color: isDark ? "#ffffff" : "#000000",
        border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
        borderRadius: 8,
        padding: "10px 16px",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
      },
    };
  };

  const styles = getStyles();
  const isDark = theme === "dark";

  return (
    <>
      {isMobile && (
        <div style={styles.mobileTopBar}>
          <div style={styles.mobileLogo}>BeProductive</div>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={styles.hamburger}>
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      )}

      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={styles.overlay} />}

      <div
        style={{
          ...styles.sidebar,
          transform: mobileOpen || !isMobile ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div style={styles.logo}>BeProductive</div>

        <div style={styles.userInfo}>
          {avatar ? (
            <img src={avatar} alt="avatar" style={styles.avatarImg} />
          ) : (
            <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
          )}
          <div>
            <div style={styles.username}>{user?.username}</div>
            <div style={styles.email}>{user?.email}</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              style={{
                ...styles.navItem,
                ...(pathname === item.path ? styles.activeItem : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <a
          href="https://buymeacoffee.com/yourname"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.coffeeBtn}
        >
          Buy me a coffee
        </a>

        <button onClick={handleLogout} style={styles.logout}>
          Logout
        </button>
      </div>
    </>
  );
}