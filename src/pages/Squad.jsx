import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PlayerCard, { getPlayerDisplayData } from "../components/ui/PlayerCard";
import StatCard from "../components/ui/StatCard";
import stadiumArt from "../assets/2.png";
import api, { getErrorMessage } from "../services/api";

const FALLBACK_FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3"];

function getPositionGroup(positions) {
  const safePositions = Array.isArray(positions) ? positions : [];

  if (safePositions.some((position) => position === "GK")) {
    return "GK";
  }

  if (safePositions.some((position) => ["CB", "LB", "RB", "LWB", "RWB", "SW"].includes(position))) {
    return "DEF";
  }

  if (safePositions.some((position) => ["CM", "CDM", "CAM", "LM", "RM"].includes(position))) {
    return "MID";
  }

  return "ATT";
}

function buildPitchRows(cards, formation) {
  const safeCards = Array.isArray(cards) ? [...cards] : [];
  const formationParts = String(formation || "4-3-3")
    .split("-")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  const defendersNeeded = formationParts[0] || 4;
  const attackersNeeded = formationParts[formationParts.length - 1] || 3;
  const midfieldersNeeded =
    formationParts.length > 2 ? formationParts.slice(1, -1).reduce((sum, value) => sum + value, 0) : 3;

  const buckets = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: []
  };

  safeCards.forEach((card) => {
    const player = getPlayerDisplayData(card);
    buckets[getPositionGroup(player.positions)].push(card);
  });

  function takeCards(groupKey, count) {
    const taken = buckets[groupKey].splice(0, count);

    if (taken.length < count) {
      const needed = count - taken.length;
      const fallbackPool = ["GK", "DEF", "MID", "ATT"]
        .filter((currentGroup) => currentGroup !== groupKey)
        .flatMap((currentGroup) => buckets[currentGroup]);

      const extraCards = fallbackPool.splice(0, needed);

      extraCards.forEach((card) => {
        Object.keys(buckets).forEach((bucketKey) => {
          buckets[bucketKey] = buckets[bucketKey].filter(
            (bucketCard) => (bucketCard.id || bucketCard._id) !== (card.id || card._id)
          );
        });
      });

      return [...taken, ...extraCards];
    }

    return taken;
  }

  return [
    {
      label: "Attack",
      size: attackersNeeded,
      cards: takeCards("ATT", attackersNeeded)
    },
    {
      label: "Midfield",
      size: midfieldersNeeded,
      cards: takeCards("MID", midfieldersNeeded)
    },
    {
      label: "Defense",
      size: defendersNeeded,
      cards: takeCards("DEF", defendersNeeded)
    },
    {
      label: "Goalkeeper",
      size: 1,
      cards: takeCards("GK", 1)
    }
  ];
}

function Squad() {
  const [squadData, setSquadData] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formation, setFormation] = useState("4-3-3");
  const [formations, setFormations] = useState(FALLBACK_FORMATIONS);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoBuilding, setAutoBuilding] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const loadSquad = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setPageLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/squad");
      const payload = response.data || {};
      const nextSquad = payload.squad || payload;
      const nextCards = payload.availableCards || payload.cards || [];
      const nextFormations = payload.formations || FALLBACK_FORMATIONS;
      const nextSelectedIds = (nextSquad?.startingXI || []).map((card) => card.id || card._id);

      setSquadData(nextSquad);
      setAvailableCards(nextCards);
      setFormations(nextFormations);
      setSelectedIds(nextSelectedIds);
      setFormation(nextSquad?.formation || nextFormations[0] || "4-3-3");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load your squad."));
    } finally {
      if (showLoader) {
        setPageLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSquad(true);
  }, [loadSquad]);

  const selectedCards = useMemo(() => {
    return selectedIds
      .map((selectedId) => availableCards.find((card) => (card.id || card._id) === selectedId))
      .filter(Boolean);
  }, [availableCards, selectedIds]);

  const insights = squadData?.insights || {};
  const pitchRows = useMemo(() => buildPitchRows(selectedCards, formation), [formation, selectedCards]);

  function toggleStarter(cardId) {
    setError("");
    setInfoMessage("");

    setSelectedIds((currentValue) => {
      if (currentValue.includes(cardId)) {
        return currentValue.filter((entry) => entry !== cardId);
      }

      if (currentValue.length >= 11) {
        setError("You can only select 11 starters at a time.");
        return currentValue;
      }

      return [...currentValue, cardId];
    });
  }

  async function handleSaveSquad() {
    setSaving(true);
    setError("");
    setInfoMessage("");

    try {
      const response = await api.put("/squad", {
        formation,
        startingXI: selectedIds
      });

      setSquadData(response.data?.squad || response.data);
      setInfoMessage(response.data?.message || "Squad updated successfully.");
      await loadSquad(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not save your squad."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAutoBuild() {
    setAutoBuilding(true);
    setError("");
    setInfoMessage("");

    try {
      const response = await api.post("/squad/auto-build");
      setSquadData(response.data?.squad || response.data);
      setInfoMessage(response.data?.message || "Squad auto-built successfully.");
      await loadSquad(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not auto-build your squad."));
    } finally {
      setAutoBuilding(false);
    }
  }

  if (pageLoading) {
    return <LoadingSpinner fullScreen text="Drawing the starting XI..." />;
  }

  if (!availableCards.length) {
    return (
      <PageContainer
        backgroundImage={stadiumArt}
        description="Open packs first, then bring your best cards onto the pitch."
        eyebrow="Squad Builder"
        title="Your Starting XI"
      >
        <EmptyState
          actionLabel="Open Packs"
          description="You need players before you can build a formation."
          onAction={() => {
            window.location.href = "/packs";
          }}
          title="No players available"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      backgroundImage={stadiumArt}
      description="Pick the formation, choose the starters, and turn collected cards into a real matchday team."
      eyebrow="Squad Builder"
      title="Your Starting XI"
    >
      {error ? <div className="form-message form-message--error">{error}</div> : null}
      {infoMessage ? <div className="form-message form-message--success">{infoMessage}</div> : null}

      <section className="squad-summary">
        <StatCard accent="green" hint="Current active shape" icon="FM" label="Formation" value={formation} />
        <StatCard accent="cyan" hint="Role-aware quality of your XI" icon="OVR" label="Overall" value={squadData?.overall || 0} />
        <StatCard accent="gold" hint="Club, nation, and league links" icon="CH" label="Chemistry" value={insights.chemistryScore || 0} />
        <StatCard accent="purple" hint="Players selected now" icon="XI" label="Starters" value={`${selectedIds.length}/11`} />
      </section>

      <section className="surface-panel squad-tools">
        <div className="squad-tools__copy">
          <span className="section-heading__eyebrow">Formation Control</span>
          <h2>Use the cards you packed in a real team</h2>
          <p>Choose a shape, select 11 starters, save the XI, then launch a simulation match from the finished squad.</p>

          <div className="formation-selector">
            {formations.map((formationOption) => (
              <button
                className={`formation-selector__button${formation === formationOption ? " is-active" : ""}`}
                key={formationOption}
                onClick={() => setFormation(formationOption)}
                type="button"
              >
                {formationOption}
              </button>
            ))}
          </div>
        </div>

        <div className="squad-tools__actions">
          <button className="btn btn--ghost" disabled={autoBuilding} onClick={handleAutoBuild} type="button">
            {autoBuilding ? "Building..." : "Auto Build"}
          </button>
          <button className="btn btn--primary" disabled={saving} onClick={handleSaveSquad} type="button">
            {saving ? "Saving..." : "Save XI"}
          </button>
          <Link className="btn btn--ghost" to="/matches">
            Play Match
          </Link>
        </div>
      </section>

      <section className="squad-pitch">
        <div className="squad-pitch__lines" />

        {pitchRows.map((row) => (
          <div className="squad-pitch__layer" key={row.label}>
            <span className="squad-pitch__label">{row.label}</span>
            <div className="squad-pitch__row">
              {Array.from({ length: row.size }).map((_, index) => {
                const card = row.cards[index];

                if (!card) {
                  return (
                    <div className="squad-pitch__slot" key={`${row.label}-slot-${index}`}>
                      <span>{row.label}</span>
                    </div>
                  );
                }

                return <PlayerCard card={card} compact key={card.id || card._id} />;
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="surface-panel squad-selection">
        <div className="section-heading">
          <div>
            <span className="section-heading__eyebrow">Starter Pool</span>
            <h2>Select the matchday squad</h2>
            <p>Tap cards to add or remove them from the starting XI. The saved squad is the team used in match simulations.</p>
          </div>
          <span className="pill">{selectedIds.length} selected</span>
        </div>

        <div className="collection-grid">
          {availableCards.map((card) => {
            const cardId = card.id || card._id;

            return (
              <PlayerCard
                card={card}
                key={cardId}
                onSelect={toggleStarter}
                selectable
                selected={selectedIds.includes(cardId)}
              />
            );
          })}
        </div>
      </section>
    </PageContainer>
  );
}

export default Squad;
