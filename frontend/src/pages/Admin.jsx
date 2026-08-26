import { useEffect, useState } from "react";

const C = {
  bg: "#000000", surface: "#0a0a0a", surface2: "#111111",
  border: "#1f1f1f", border2: "#2a2a2a",
  accent: "#3b82f6", danger: "#ef4444", warning: "#f59e0b",
  success: "#22c55e", text: "#e5e5e5", muted: "#525252",
};

const ROLES = ["ADMIN", "TECHNICIEN"];

function RoleBadge({ value }) {
  const color = value === "ADMIN" ? C.danger : C.success;
  return (
    <span style={{ background: color + "18", color, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "600" }}>
      {value}
    </span>
  );
}

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ nom_complet: "", email: "", role: "TECHNICIEN", mot_de_passe: "" });
  const [message, setMessage] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/users");
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleActif = async (user) => {
    try {
      await fetch(`http://localhost:8000/auth/users/${user.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !user.actif })
      });
      showMsg(`Compte ${!user.actif ? "active" : "desactive"} : ${user.nom_complet}`);
      loadUsers();
    } catch (err) { console.error(err); }
  };

  const handleChangeRole = async (id, role) => {
    try {
      await fetch(`http://localhost:8000/auth/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      showMsg("Role mis a jour");
      setModal(null);
      loadUsers();
    } catch (err) { console.error(err); }
  };

  const handleAddUser = async () => {
    if (!newUser.nom_complet || !newUser.email || !newUser.mot_de_passe) {
      showMsg("Tous les champs sont obligatoires", "error");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (data.status === "ok") {
        showMsg("Utilisateur ajoute avec succes");
        setShowAddForm(false);
        setNewUser({ nom_complet: "", email: "", role: "TECHNICIEN", mot_de_passe: "" });
        loadUsers();
      } else {
        showMsg(data.message || "Erreur", "error");
      }
    } catch (err) { console.error(err); }
  };

  const admins = users.filter(u => u.role === "ADMIN");
  const techniciens = users.filter(u => u.role === "TECHNICIEN");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: C.text }}>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; } select option { background: #111; color: #e5e5e5; }`}</style>

      {/* Modal changement role */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "12px", padding: "24px", width: "360px" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Changer le role</div>
            <div style={{ fontSize: "12px", color: C.muted, marginBottom: "16px" }}>{modal.nom_complet}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {ROLES.map(r => (
                <button key={r} onClick={() => handleChangeRole(modal.id, r)}
                  style={{
                    padding: "10px 14px",
                    background: r === modal.role ? "#1a1a2e" : "#111",
                    border: `1px solid ${r === modal.role ? C.accent : C.border2}`,
                    color: r === modal.role ? C.accent : C.text,
                    borderRadius: "8px", cursor: "pointer", fontSize: "12px",
                    textAlign: "left", fontWeight: r === modal.role ? "600" : "400"
                  }}>{r}</button>
              ))}
            </div>
            <button onClick={() => setModal(null)}
              style={{ marginTop: "12px", width: "100%", padding: "8px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Message flash */}
        {message && (
          <div style={{ background: message.type === "error" ? C.danger + "15" : C.success + "15", border: `1px solid ${message.type === "error" ? C.danger : C.success}30`, borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: message.type === "error" ? C.danger : C.success }}>
            {message.text}
          </div>
        )}

        {/* TITRE */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "700" }}>Administration</div>
            <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>Gestion des utilisateurs SOTETEL</div>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)}
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", border: "none", color: "white", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
            {showAddForm ? "Annuler" : "+ Ajouter utilisateur"}
          </button>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
          {[
            { label: "Total", value: users.length, color: C.accent },
            { label: "Administrateurs", value: admins.length, color: C.danger },
            { label: "Techniciens", value: techniciens.length, color: C.success },
            { label: "Comptes actifs", value: users.filter(u => u.actif).length, color: C.warning },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: color }} />
              <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{label}</div>
              <div style={{ fontSize: "30px", fontWeight: "700", color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* FORMULAIRE AJOUT */}
        {showAddForm && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>Nouvel utilisateur</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Nom complet", key: "nom_complet", placeholder: "Prenom Nom", type: "text" },
                { label: "Email", key: "email", placeholder: "email@sotetel.tn", type: "text" },
                { label: "Mot de passe", key: "mot_de_passe", placeholder: "••••••••", type: "password" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "block" }}>{label}</label>
                  <input value={newUser[key]} onChange={e => setNewUser(prev => ({ ...prev, [key]: e.target.value }))}
                    type={type} placeholder={placeholder}
                    style={{ width: "100%", padding: "10px 14px", background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, borderRadius: "8px", fontSize: "13px", outline: "none" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "block" }}>Role</label>
                <select value={newUser.role} onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, borderRadius: "8px", fontSize: "13px", outline: "none" }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleAddUser}
              style={{ marginTop: "16px", padding: "10px 24px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
              Ajouter
            </button>
          </div>
        )}

        {/* TABLEAU ADMINS */}
        {[{ title: "Administrateurs", data: admins, color: C.danger }, { title: "Techniciens", data: techniciens, color: C.success }].map(({ title, data, color }) => (
          <div key={title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", background: color, borderRadius: "50%" }} />
              <span style={{ fontSize: "12px", fontWeight: "600" }}>{title}</span>
              <span style={{ fontSize: "11px", color: C.muted }}>({data.length})</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Nom complet", "Email", "Role", "Statut", "Cree le", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: "500", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: C.muted }}>Chargement...</td></tr>}
                {!loading && data.length === 0 && <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: C.muted }}>Aucun utilisateur</td></tr>}
                {data.map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "#0a0a0a"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px", fontWeight: "500", color: C.text }}>{u.nom_complet}</td>
                    <td style={{ padding: "12px 16px", color: C.muted, fontSize: "12px" }}>{u.email}</td>
                    <td style={{ padding: "12px 16px" }}><RoleBadge value={u.role} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: u.actif ? C.success + "18" : C.danger + "18", color: u.actif ? C.success : C.danger, border: `1px solid ${u.actif ? C.success : C.danger}30`, borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "600" }}>
                        {u.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: C.muted, fontSize: "12px" }}>
                      {u.cree_le ? new Date(u.cree_le).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => setModal(u)}
                          style={{ background: "#1a1a2e", border: `1px solid ${C.accent}30`, color: C.accent, borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                          Role
                        </button>
                        <button onClick={() => handleToggleActif(u)}
                          style={{ background: u.actif ? "#1a0000" : "#001a00", border: `1px solid ${u.actif ? C.danger : C.success}30`, color: u.actif ? C.danger : C.success, borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                          {u.actif ? "Desactiver" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}