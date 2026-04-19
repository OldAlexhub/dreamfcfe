import React, { useCallback, useEffect, useMemo, useState } from "react";

import PageContainer from "../components/layout/PageContainer";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PlayerCard, { getPlayerDisplayData } from "../components/ui/PlayerCard";
import StatCard from "../components/ui/StatCard";
import stadiumArt from "../assets/2.png";
import api, { getErrorMessage } from "../services/api";

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

  const leftovers = [];

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

  const rows = [
    takeCards("ATT", attackersNeeded),
    takeCards("MID", midfieldersNeeded),
    takeCards("DEF", defendersNeeded),
    takeCards("GK", 1)
  ];

  Object.values(buckets).forEach((groupCards) => {
    leftovers.push(...groupCards);
  });

  return {
    rows,
    leftovers
  };
}

function Squad() {
  const [squadData, setSquadData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [autoBuilding, setAutoBuilding] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const loadSquad = useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      const response = await api.get("/squad");
      setSquadData(response.data?.squad || response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load your squad."));
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSquad();
  }, [loadSquad]);

  const formation = squadData?.formation || "4-3-3";
  const overall = squadData?.overall || 0;
  const startingXI = useMemo(() => squadData?.startingXI || [], [squadData]);
  const insights = squadData?.insights || {};
  const { rows, leftovers } = useMemo(() => buildPitchRows(startingXI, formation), [formation, startingXI]);

  async function handleAutoBuild() {
    setAutoBuilding(true);
    setError("");
    setInfoMessage("");

    try {
      const response = await api.post("/squad/auto-build");
      setSquadData(response.data?.squad || response.data);
      setInfoMessage(response.data?.message || "Squad auto-built successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not auto-build your squad."));
    } finally {
      setAutoBuilding(false);
    }
  }

  if (pageLoading) {
    return <LoadingSpinner fullScreen text="Drawing the starting XI..." />;
  }

  return (
    <PageContainer
      backgroundImage={stadiumArt}
      description="See your formation, chemistry, and strongest starters in one polished match-day view."
      eyebrow="Squad Builder"
      title="Your Starting XI"
    >
      {error ? <div className="form-message form-message--error">{error}</div> : null}
      {infoMessage ? <div className="form-message form-message--success">{infoMessage}</div> : null}

      <section className="squad-summary">
        <StatCard accent="green" hint="Current active shape" icon="FM" label="Formation" value={formation} />
        <StatCard accent="cyan" hint="Average quality of your XI" icon="OVR" label="Overall" value={overall} />
        <StatCard accent="gold" hint="Club, nation, and league links" icon="CH" label="Chemistry" value={insights.chemistryScore || 0} />
        <StatCard accent="purple" hint="Players on the pitch" icon="XI" label="Starters" value={startingXI.length} />
      </section>

      <section className="surface-panel squad-tools">
        <div>
          <span className="section-heading__eyebrow">Auto Build</span>
          <h2>Let the game set your best team</h2>
          <p>The auto-build uses formation slots and player positions, not just raw rating.</p>
        </div>

        <button className="btn btn--primary" disabled={autoBuilding} onClick={handleAutoBuild} type="button">
          {autoBuilding ? "Building..." : "Auto Build Squad"}
        </button>
      </section>

      {startingXI.length ? (
        <>
          <section className="squad-pitch">
            <div className="squad-pitch__lines" />

            {rows.map((rowCards, rowIndex) => (
              <div className="squad-pitch__row" key={`row-${rowIndex}`}>
                {rowCards.map((card) => (
                  <PlayerCard card={card} compact key={card.id || card._id} />
                ))}
              </div>
            ))}
          </section>

          {leftovers.length ? (
            <section className="surface-panel squad-bench">
              <div className="section-heading">
                <div>
                  <span className="section-heading__eyebrow">Extra Starters</span>
                  <h2>Overflow from the current shape</h2>
                </div>
              </div>

              <div className="squad-bench__grid">
                {leftovers.map((card) => (
                  <PlayerCard card={card} compact key={card.id || card._id} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          actionLabel="Auto Build Now"
          description="You do not have a starting XI yet. Auto-build one from your collection."
          onAction={handleAutoBuild}
          title="No squad selected"
        />
      )}
    </PageContainer>
  );
}

export default Squad;
