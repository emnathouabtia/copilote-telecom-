/**
 * Petit indicateur "en direct" façon console NOC : un point qui pulse
 * quand la connexion WebSocket est active, gris et fixe sinon.
 */
export default function LiveStatusDot({ connected }) {
  return (
    <div className="live-status">
      <span className="live-dot-wrap">
        {connected && <span className="live-dot-ping" />}
        <span className={`live-dot ${connected ? "connected" : ""}`} />
      </span>
      <span className={`live-label ${connected ? "connected" : ""}`}>
        {connected ? "temps réel actif" : "hors ligne"}
      </span>
    </div>
  );
}