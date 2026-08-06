import { useState } from "react";
import { askCopilote } from "../api/chat";

/**
 * Petite fenêtre de chat flottante, ouverte pour un incident précis.
 * Usage : <ChatWidget incident={incidentSelectionne} onClose={...} />
 */
export default function ChatWidget({ incident, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Bonjour, je peux t'aider sur l'incident ${incident?.reference ?? ""}. Que veux-tu savoir ?`,
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!question.trim()) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const result = await askCopilote(incident?.id, userMessage.text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: result.reponse ?? "Pas de réponse reçue." },
      ]);
    } catch (err) {
      // La route /chat n'existe peut-être pas encore côté backend — on
      // affiche un message clair plutôt que de planter silencieusement.
      setError(
        "Le copilote n'est pas encore disponible (route /chat pas encore prête)."
      );
      console.error("Erreur chat", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <span>Copilote — {incident?.reference}</span>
        <button className="chat-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message chat-message--${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="chat-message chat-message--assistant">…</div>}
        {error && <div className="chat-message chat-message--error">{error}</div>}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Que faire pour cet incident ?"
        />
        <button className="chat-send" onClick={handleSend} disabled={loading}>
          Envoyer
        </button>
      </div>
    </div>
  );
}