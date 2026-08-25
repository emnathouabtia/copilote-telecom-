import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState } from "react";
import Incidents from "./pages/Incidents.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Stats from "./pages/Stats.jsx";
import Topology from "./pages/Topology.jsx";

const C = {
  bg: "#000000", surface: "#0a0a0a", border: "#1f1f1f",
  accent: "#3b82f6", text: "#e5e5e5", muted: "#525252", subtle: "#737373",
};

function Navbar({ onLogout, user, role }) {
  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/incidents", label: "Incidents" },
    { to: "/topology", label: "Topologie" },
    ...(role !== "TECHNICIEN" ? [{ to: "/stats", label: "Statistiques" }] : []),
    ...(role === "ADMIN" ? [{ to: "/admin", label: "Administration" }] : []),
  ];

  return (
    <div style={{
      width: "220px", minHeight: "100vh", background: C.surface,
      borderRight: `1px solid ${C.border}`, display: "flex",
      flexDirection: "column", padding: "16px 12px",
      position: "fixed", top: 0, left: 0, zIndex: 200
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 8px 28px" }}>
        <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "8px", flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: "700", fontSize: "13px", color: C.text }}>Copilote Telecom</div>
          <div style={{ fontSize: "10px", color: C.muted }}>SOTETEL NOC</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px", marginBottom: "6px" }}>
          Navigation
        </div>
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center",
              padding: "9px 12px", borderRadius: "8px", fontSize: "13px",
              fontWeight: isActive ? "600" : "400",
              color: isActive ? C.accent : C.subtle,
              background: isActive ? C.accent + "15" : "transparent",
              textDecoration: "none", transition: "all 0.15s",
              borderLeft: isActive ? `2px solid ${C.accent}` : "2px solid transparent"
            })}>
            {label}
          </NavLink>
        ))}
      </div>

      {/* Utilisateur */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
        <div style={{ padding: "8px 12px", marginBottom: "8px", background: "#111", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: C.text, fontWeight: "500" }}>{user}</div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
            <span style={{
              background: role === "ADMIN" ? "#1e3a5f" : "#1a1a2e",
              color: role === "ADMIN" ? C.accent : C.subtle,
              borderRadius: "4px", padding: "1px 6px", fontSize: "9px"
            }}>{role}</span>
          </div>
        </div>
        <button onClick={onLogout} style={{
          width: "100%", padding: "8px 12px", background: "transparent",
          border: `1px solid ${C.border}`, color: C.muted, borderRadius: "8px",
          fontSize: "12px", cursor: "pointer", textAlign: "left",
          transition: "all 0.15s"
        }}>
          Deconnexion
        </button>
      </div>
    </div>
  );
}

function AccesRefuse() {
  return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", fontFamily: "Inter" }}>
      <div style={{ width: "56px", height: "56px", background: "#1a0000", border: "1px solid #3a0000", borderRadius: "12px" }} />
      <div style={{ color: "#ef4444", fontSize: "18px", fontWeight: "700" }}>Acces refuse</div>
      <div style={{ color: "#525252", fontSize: "13px" }}>Cette page est reservee aux administrateurs</div>
    </div>
  );
}

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState("");
  const [role, setRole] = useState("");

  const handleLogin = (userData) => {
    setUser(userData.nom_complet);
    setRole(userData.role);
    setIsAuth(true);
  };

  const handleLogout = () => {
    setIsAuth(false);
    setUser("");
    setRole("");
  };

  if (!isAuth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <Navbar onLogout={handleLogout} user={user} role={role} />
        <div style={{ marginLeft: "220px", flex: 1, minHeight: "100vh", background: "#000" }}>
          <Routes>
            <Route path="/" element={<Dashboard role={role} />} />
            <Route path="/incidents" element={<Incidents role={role} />} />
            <Route path="/topology" element={<Topology />} />
            <Route path="/stats" element={role === "TECHNICIEN" ? <AccesRefuse /> : <Stats />} />
            <Route path="/admin" element={role !== "ADMIN" ? <AccesRefuse /> : <div style={{ padding: "40px", color: "#e5e5e5" }}>Page Administration — en cours</div>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}