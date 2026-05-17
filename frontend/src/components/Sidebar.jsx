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
  const avatar = localStorage.getItem("avatar_" + user?.id);

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out!");
    navigate("/login");
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>⚡ BeProductive</div>
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
          <Link key={item.path} to={item.path} style={{ ...styles.navItem, ...(pathname === item.path ? styles.activeItem : {}) }}>
            <span style={styles.icon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <a href="https://paystack.shop/pay/l3bdcrpds-" target="_blank" rel="noopener noreferrer" style={styles.coffeeBtn}>
        ☕ Buy me a coffee
      </a>
      <button onClick={handleLogout} style={styles.logout}>🚪 Logout</button>
    </div>
  );
}

const styles = {
  sidebar: { width: 260, minHeight: "100vh", background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)", padding: "24px 16px", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0 },
  logo: { fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 24, padding: "0 8px" },
  userInfo: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px", marginBottom: 24 },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18, flexShrink: 0 },
  avatarImg: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  username: { color: "white", fontWeight: 600, fontSize: 14 },
  email: { color: "#888", fontSize: 11, marginTop: 2 },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navItem: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, color: "#aaa", textDecoration: "none", fontSize: 14, fontWeight: 500 },
  activeItem: { background: "linear-gradient(135deg, #667eea20, #764ba220)", color: "white", borderLeft: "3px solid #667eea" },
  icon: { fontSize: 18 },
  coffeeBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #f6d365, #fda085)", color: "white", borderRadius: 12, padding: "12px 16px", textDecoration: "none", fontSize: 14, fontWeight: 700, marginBottom: 8 },
  logout: { background: "rgba(255,100,100,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 12, padding: "12px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600 }
};