import React, { useEffect, useMemo, useState } from "react";

import { getHighestRarity, getPackVisual } from "../../utils/packVisuals";
import PlayerCard from "../ui/PlayerCard";

function PackRevealModal({ open, cards, coins, pack, pullSummary, onClose }) {
  const [phase, setPhase] = useState("idle");
  const [visibleCount, setVisibleCount] = useState(0);

  const safeCards = useMemo(() => (Array.isArray(cards) ? cards : []), [cards]);
  const safePack = pack || { name: "Dream Pack" };
  const visual = getPackVisual(safePack);
  const topRarity = getHighestRarity(safeCards);

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setVisibleCount(0);
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";
    setPhase("charging");
    setVisibleCount(0);

    const chargeTimer = window.setTimeout(() => {
      setPhase("revealing");
      setVisibleCount(1);
    }, 900);

    const revealInterval = window.setInterval(() => {
      setVisibleCount((currentValue) => {
        if (currentValue >= safeCards.length) {
          window.clearInterval(revealInterval);
          setPhase("done");
          return currentValue;
        }

        return currentValue + 1;
      });
    }, 280);

    return () => {
      window.clearTimeout(chargeTimer);
      window.clearInterval(revealInterval);
      document.body.style.overflow = "";
    };
  }, [open, safeCards]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="pack-reveal">
        <div className="pack-reveal__header">
          <div>
            <span className="pack-reveal__eyebrow">{visual.focusLabel}</span>
            <h2>{safePack.name || "New Pack"}</h2>
            <p>{Number(coins || 0).toLocaleString()} coins ready for your next move.</p>
          </div>

          <button className="btn btn--ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="pack-reveal__summary">
          <div className="pack-reveal__summary-card">
            <span>Top Tier Hit</span>
            <strong className={`pack-reveal__summary-rarity pack-reveal__summary-rarity--${topRarity}`}>{topRarity}</strong>
          </div>
          <div className="pack-reveal__summary-card">
            <span>Highest Rating</span>
            <strong>{pullSummary?.highestOverall || Math.max(...safeCards.map((card) => card?.player?.rawOverall || card?.player?.overall || 0), 0)}</strong>
          </div>
          <div className="pack-reveal__summary-card">
            <span>Cards Revealed</span>
            <strong>{safeCards.length}</strong>
          </div>
        </div>

        <div className={`pack-reveal__stage pack-reveal__stage--${phase}`}>
          <div className="pack-reveal__capsule">
            <img alt={safePack.name || "Pack art"} className="pack-reveal__pack-art" src={visual.image} />
            <div className="pack-reveal__capsule-core" />
            <span>{phase === "done" ? "Squad Updated" : "Charging Pack"}</span>
          </div>
        </div>

        <div className="pack-reveal__cards">
          {safeCards.slice(0, visibleCount).map((card, index) => (
            <PlayerCard card={card} key={card.id || card._id || `reveal-${index}`} showPortrait />
          ))}
        </div>

        <div className="pack-reveal__footer">
          <span>
            Revealed {Math.min(visibleCount, safeCards.length)} / {safeCards.length}
          </span>
          <span>{phase === "done" ? "The tunnel lights fade. Your club gets stronger." : "The tunnel lights are warming up..."}</span>
        </div>
      </div>
    </div>
  );
}

export default PackRevealModal;
