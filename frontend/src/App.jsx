import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Incidents from "./pages/Incidents.jsx";
import Dashboard from "./pages/Dashboard.jsx";

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
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
      </Routes>
    </BrowserRouter>
  );
}