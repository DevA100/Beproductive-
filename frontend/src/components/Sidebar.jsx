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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    toast.success("Logged out");
    navigate("/login");
  };

  const avatar = localStorage.getItem("avatar_" + user?.id);

  return (
    <>
      {isMobile && (
        <div style={styles.topbar}>
          <div style={styles.brand}>BeProductive</div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={styles.menuBtn}
          >
            ☰
          </button>
        </div>
      )}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={styles.overlay}
        />
      )}

      <aside
        style={{
          ...styles.sidebar,
          transform:
            mobileOpen || !isMobile
              ? "translateX(0)"
              : "translateX(-100%)",
        }}
      >
        <div style={styles.logo}>BeProductive</div>

        <div style={styles.userBox}>
          <div style={styles.avatar}>
            {user?.username?.[0]?.toUpperCase()}
          </div>

          <div>
            <div style={styles.username}>
              {user?.username}
            </div>
            <div style={styles.email}>
              {user?.email}
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              style={{
                ...styles.link,
                ...(pathname === item.path
                  ? styles.active
                  : {}),
              }}
            >
              <span style={styles.dot} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* KEEPED: Buy Me Coffee */}
        <a
          href="https://buymeacoffee.com/yourname"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.coffee}
        >
          Buy me a coffee
        </a>

        <button onClick={handleLogout} style={styles.logout}>
          Logout
        </button>
      </aside>
    </>
  );
}

const styles = {
  sidebar: {
    width: 260,
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    background: "#0b1020",
    borderRight: "1px solid #1e293b",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    transition: "0.25s ease",
    zIndex: 1000,
  },

  topbar: {
    height: 60,
    background: "#0b1020",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
    position: "fixed",
    width: "100%",
    zIndex: 1100,
  },

  brand: {
    fontWeight: 700,
    color: "#fff",
  },

  menuBtn: {
    background: "transparent",
    border: "1px solid #1e293b",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 6,
    fontSize: 18,
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 999,
  },

  logo: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    color: "#fff",
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    background: "#111827",
    borderRadius: 12,
    marginBottom: 20,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
  },

  username: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
  },

  email: {
    fontSize: 12,
    color: "#94a3b8",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
    marginTop: 10,
  },

  link: {
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  active: {
    background: "#111827",
    color: "#fff",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#2563eb",
  },

  coffee: {
    marginTop: 16,
    textAlign: "center",
    padding: "10px",
    borderRadius: 10,
    background: "#fbbf24",
    color: "#111",
    fontWeight: 600,
    textDecoration: "none",
  },

  logout: {
    marginTop: 10,
    background: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "10px",
    borderRadius: 10,
    cursor: "pointer",
  },
};