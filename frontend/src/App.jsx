import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Incidents from "./pages/Incidents.jsx";

// Emna branchera ici sa vraie page Dashboard (pages/Dashboard.jsx).
function DashboardPlaceholder() {
  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "monospace" }}>
      Dashboard — en attente de pages/Dashboard.jsx (Emna)
    </div>
  );
}

function Nav() {
  const linkClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <nav className="nav">
      <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
      <NavLink to="/incidents" className={linkClass}>Incidents</NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<DashboardPlaceholder />} />
        <Route path="/incidents" element={<Incidents />} />
      </Routes>
    </BrowserRouter>
  );
}