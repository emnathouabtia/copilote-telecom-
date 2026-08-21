import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState } from "react";
import Incidents from "./pages/Incidents.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Stats from "./pages/Stats.jsx";
import Topology from "./pages/Topology.jsx";
const C = {
  bg: "#000000", surface: "#0a0a0a", border: "#1f1f1f",
  accent: "#3b82f6", text: "#e5e5e5", muted: "#525252",
};

function Navbar({ onLogout, user }) {
  return (
    <div style={{
      background: C.surface, borderBottom: `1px solid ${C.border}`,
      padding: "0 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: "52px",
      position: "sticky", top: 0, zIndex: 200
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "30px", height: "30px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>📡</div>
        <span style={{ fontWeight: "700", fontSize: "14px", color: C.text, letterSpacing: "-0.02em" }}>Copilote Télécom</span>
        <span style={{ fontSize: "10px", color: C.muted }}>SOTETEL</span>
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { to: "/", label: "Dashboard", icon: "📊" },
          { to: "/incidents", label: "Incidents", icon: "🚨" },
          { to: "/stats", label: "Statistiques", icon: "📈" },
          { to: "/topology", label: "Topologie", icon: "🗺️" },
        ].map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === "/"}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", borderRadius: "8px", fontSize: "13px",
              fontWeight: isActive ? "600" : "400",
              color: isActive ? C.accent : C.muted,
              background: isActive ? C.accent + "15" : "transparent",
              textDecoration: "none", transition: "all 0.15s"
            })}>
            <span>{icon}</span>{label}
          </NavLink>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", color: C.muted }}>👤 {user?.nom_complet}</span>
        <button onClick={onLogout} style={{
          background: "transparent", border: `1px solid ${C.border}`,
          color: C.muted, borderRadius: "8px", padding: "6px 12px",
          fontSize: "12px", cursor: "pointer"
        }}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

function PrivateRoute({ children, isAuth }) {
  return isAuth ? children : <Navigate to="/login" />;
}

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuth(true);
  };

  const handleLogout = () => {
    setIsAuth(false);
    setUser(null);
  };

  if (!isAuth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Navbar onLogout={handleLogout} user={user} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/topology" element={<Topology />} />
      </Routes>
    </BrowserRouter>
  );
}