import { useState } from "react";

const C = {
  bg: "#000000", surface: "#0a0a0a", surface2: "#111111",
  border: "#1f1f1f", border2: "#2a2a2a",
  accent: "#3b82f6", danger: "#ef4444",
  text: "#e5e5e5", muted: "#525252",
};

const USERS = {
  "emna": "emna123",
  "doaa": "doaa123",
  "admin": "admin123",
};

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 const handleSubmit = () => {
  setError("");
  if (!username || !password) {
    setError("Remplissez tous les champs");
    return;
  }
  if (USERS[username] === password) {
    try {
      localStorage.setItem("copilote_user", username);
    } catch(e) {
      console.log("localStorage error:", e);
    }
    onLogin(username);
  } else {
    setError("Identifiants incorrects");
  }
};

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 24px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 16px" }}>📡</div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: C.text, letterSpacing: "-0.03em" }}>Copilote Télécom</div>
          <div style={{ fontSize: "13px", color: C.muted, marginTop: "4px" }}>SOTETEL — Supervision NOC</div>
        </div>

        {/* Card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: C.text, marginBottom: "24px" }}>Connexion</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "block" }}>Identifiant</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="emna, doaa ou admin"
                style={{ width: "100%", padding: "10px 14px", background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, borderRadius: "8px", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "block" }}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, borderRadius: "8px", fontSize: "13px", outline: "none" }}
              />
            </div>

            {error && (
              <div style={{ background: C.danger + "15", border: `1px solid ${C.danger}30`, borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: C.danger }}>
                ⚠ {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", padding: "12px", background: loading ? "#1a1a2e" : "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: loading ? "default" : "pointer", marginTop: "8px", transition: "all 0.2s" }}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>

          
        </div>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: C.muted }}>
                  SOTETEL Tunisie
        </div>
      </div>
    </div>
  );
}