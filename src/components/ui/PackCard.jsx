import React from "react";

import { getPackVisual } from "../../utils/packVisuals";

function formatOddsValue(value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return "--";
  }

  if (parsedValue <= 1) {
    return `${(parsedValue * 100).toFixed(parsedValue < 0.1 ? 1 : 0)}%`;
  }

  return `${parsedValue}%`;
}

function getPackId(pack) {
  return pack.id || pack._id || pack.name;
}

function PackCard({ pack, onOpen, opening = false, disabled = false }) {
  const packId = getPackId(pack);
  const minPlayers = Number(pack.minPlayers || pack.min_cards || 0);
  const maxPlayers = Number(pack.maxPlayers || pack.max_cards || minPlayers || 0);
  const odds = pack.odds || {};
  const visual = getPackVisual(pack);
  const highlightRarities = Object.entries(odds)
    .filter(([, value]) => Number(value || 0) > 0)
    .sort((leftValue, rightValue) => Number(rightValue[1]) - Number(leftValue[1]))
    .slice(-3)
    .map(([rarity]) => rarity);

  return (
    <article className={`pack-card pack-card--${visual.tier}`}>
      <div className="pack-card__glow" />

      <div className="pack-card__media">
        <img alt={pack.name || "Dream Squad Pack"} className="pack-card__image" src={visual.image} />
      </div>

      <div className="pack-card__header">
        <span className="pack-card__tag">{visual.focusLabel}</span>
        <h3>{pack.name || "Mystery Pack"}</h3>
        <p>{visual.tagline}</p>
      </div>

      <div className="pack-card__price-row">
        <div>
          <span className="pack-card__label">Entry Cost</span>
          <strong>{Number(pack.cost || 0).toLocaleString()} coins</strong>
        </div>
        <div>
          <span className="pack-card__label">Players</span>
          <strong>{minPlayers === maxPlayers ? `${minPlayers}` : `${minPlayers}-${maxPlayers}`}</strong>
        </div>
      </div>

      <div className="pack-card__focus">
        <span className="pack-card__label">Top Pull Window</span>
        <div className="pack-card__focus-rarities">
          {highlightRarities.map((rarity) => (
            <span className={`pack-card__focus-pill pack-card__focus-pill--${rarity}`} key={`${packId}-${rarity}`}>
              {rarity}
            </span>
          ))}
        </div>
      </div>

      <div className="pack-card__odds">
        {Object.entries(odds).map(([rarity, value]) => (
          <div className="pack-card__odds-row" key={`${packId}-${rarity}`}>
            <span className={`pack-card__odds-rarity pack-card__odds-rarity--${rarity}`}>{rarity}</span>
            <strong>{formatOddsValue(value)}</strong>
          </div>
        ))}
      </div>

      <button
        className="btn btn--primary btn--full"
        disabled={opening || disabled}
        onClick={() => onOpen(pack)}
        type="button"
      >
        {opening ? "Opening..." : "Open Pack"}
      </button>
    </article>
  );
}

export default PackCard;
