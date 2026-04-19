import React, { useMemo } from "react";

function readFirstText(...values) {
  const value = values.find((entry) => typeof entry === "string" && entry.trim());
  return value ? value.trim() : "";
}

function readFirstNumber(...values) {
  for (const value of values) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
}

function parsePositions(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function deriveRarity(overall) {
  if (overall >= 92) {
    return "icon";
  }

  if (overall >= 87) {
    return "legendary";
  }

  if (overall >= 80) {
    return "epic";
  }

  if (overall >= 70) {
    return "rare";
  }

  return "common";
}

export function getPlayerDisplayData(input) {
  const card = input || {};
  const player = card.player || card.playerId || card;
  const faceStats = player.faceStats || {};

  const positions = parsePositions(
    player.positions || player.player_positions || player.position || player.primaryPosition || ""
  );

  const overall =
    readFirstNumber(player.overall, player.overall_rating, player.rating, player.faceStats?.overall) || 0;

  return {
    id: card.id || card._id || player.id || player._id || "",
    rarity: readFirstText(card.rarity, deriveRarity(overall)).toLowerCase(),
    name: readFirstText(player.name, player.long_name, player.fullName, player.full_name, player.short_name) || "Mystery Star",
    club: readFirstText(player.clubName, player.club_name, player.club, player.team) || "Free Agent",
    nation: readFirstText(player.nationality, player.nationality_name, player.country) || "Unknown Nation",
    positions: positions.length ? positions : ["Utility"],
    overall,
    sellValue: readFirstNumber(card.sellValue, player.sellValue),
    isInSquad: Boolean(card.isInSquad),
    isFavorite: Boolean(card.isFavorite),
    acquiredFromPack: readFirstText(card.acquiredFromPack),
    faceStats: {
      pace: readFirstNumber(faceStats.pace, player.pace) || 0,
      shooting: readFirstNumber(faceStats.shooting, player.shooting) || 0,
      passing: readFirstNumber(faceStats.passing, player.passing) || 0,
      dribbling: readFirstNumber(faceStats.dribbling, player.dribbling) || 0,
      defending: readFirstNumber(faceStats.defending, player.defending) || 0,
      physic: readFirstNumber(faceStats.physic, player.physic) || 0
    }
  };
}

function PlayerCard({
  card,
  selectable = false,
  selected = false,
  onSelect,
  compact = false,
  footer
}) {
  const player = useMemo(() => getPlayerDisplayData(card), [card]);
  const isInteractive = selectable && typeof onSelect === "function";
  const Wrapper = isInteractive ? "button" : "article";
  const wrapperProps = isInteractive
    ? {
        onClick: () => onSelect(player.id),
        type: "button"
      }
    : {};

  return (
    <Wrapper
      className={`player-card player-card--${player.rarity} ${selected ? "is-selected" : ""} ${
        compact ? "player-card--compact" : ""
      }`}
      {...wrapperProps}
    >
      <div className="player-card__shine" />

      <div className="player-card__top">
        <div className="player-card__rating">
          <span className="player-card__rating-number">{player.overall}</span>
          <span className="player-card__rating-label">{player.positions[0]}</span>
        </div>

        <div className="player-card__badges">
          <span className={`player-card__rarity player-card__rarity--${player.rarity}`}>{player.rarity}</span>
          {player.isInSquad ? <span className="player-card__status">In XI</span> : null}
          {selected ? <span className="player-card__status player-card__status--active">Selected</span> : null}
        </div>
      </div>

      <div className="player-card__body">
        <h3 className="player-card__name">{player.name}</h3>
        <p className="player-card__meta">{player.club}</p>
        <p className="player-card__meta player-card__meta--muted">{player.nation}</p>
        <div className="player-card__positions">
          {player.positions.map((position) => (
            <span className="player-card__position-pill" key={`${player.id}-${position}`}>
              {position}
            </span>
          ))}
        </div>
      </div>

      <div className="player-card__stats">
        {Object.entries(player.faceStats).map(([statName, statValue]) => (
          <div className="player-card__stat" key={`${player.id}-${statName}`}>
            <span>{statName.slice(0, 3).toUpperCase()}</span>
            <strong>{statValue}</strong>
          </div>
        ))}
      </div>

      <div className="player-card__footer">
        {player.sellValue !== null ? <span className="player-card__footer-item">Sell {player.sellValue} coins</span> : null}
        {player.acquiredFromPack ? <span className="player-card__footer-item">{player.acquiredFromPack}</span> : null}
        {footer}
      </div>
    </Wrapper>
  );
}

export default PlayerCard;
