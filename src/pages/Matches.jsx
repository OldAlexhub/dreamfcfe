import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import stadiumArt from "../assets/4.png";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

const DEFAULT_STAGES = [
  "Analyzing lineup",
  "Calculating chemistry",
  "Scouting the opponent",
  "Simulating key chances",
  "Rendering match result",
];

function Matches() {
  const { user, loadCurrentUser } = useAuth();
  const [squadData, setSquadData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [difficulty, setDifficulty] = useState("balanced");
  const [opponentName, setOpponentName] = useState("");
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");
  const [matchCost, setMatchCost] = useState(0);

  const loadSquad = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setPageLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/squad");
      setSquadData(response.data?.squad || response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Could not load your match-ready squad."),
      );
    } finally {
      if (showLoader) {
        setPageLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSquad(true);
    (async function loadConfig() {
      try {
        const response = await api.get("/config");
        setMatchCost(Number(response.data?.matchCost || 0));
      } catch (e) {
        // ignore config errors silently
      }
    })();
  }, [loadSquad]);

  const startingXI = useMemo(() => squadData?.startingXI || [], [squadData]);
  const insights = squadData?.insights || {};
  const stages = resultData?.processingStages || DEFAULT_STAGES;

  async function handleSimulateMatch() {
    setSimulating(true);
    setPhaseIndex(0);
    setError("");
    setResultData(null);

    try {
      const response = await api.post("/matches/simulate", {
        difficulty,
        opponentName,
      });
      const payload = response.data || {};
      const nextStages = payload.processingStages || DEFAULT_STAGES;

      for (let index = 0; index < nextStages.length; index += 1) {
        setPhaseIndex(index);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          window.setTimeout(resolve, 780);
        });
      }

      setResultData(payload);
      await loadCurrentUser({ showLoader: false });
      await loadSquad(false);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Could not simulate a match right now."),
      );
    } finally {
      setSimulating(false);
    }
  }

  if (pageLoading) {
    return (
      <LoadingSpinner fullScreen text="Preparing the simulation arena..." />
    );
  }

  if (!startingXI.length) {
    return (
      <PageContainer
        backgroundImage={stadiumArt}
        description="Save a starting XI first, then bring it into the simulation arena."
        eyebrow="Simulation"
        title="Play A Match"
      >
        <EmptyState
          actionLabel="Build My Squad"
          description="You need a saved squad before the simulation engine can run."
          onAction={() => {
            window.location.href = "/squad";
          }}
          title="No saved XI yet"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      actions={
        <div className="hero-action-row">
          <Link className="btn btn--ghost" to="/squad">
            Edit XI
          </Link>
          <button
            className="btn btn--primary"
            disabled={
              simulating ||
              (typeof user?.coins === "number" && user.coins < matchCost)
            }
            onClick={handleSimulateMatch}
            type="button"
          >
            {simulating
              ? "Simulating..."
              : `Simulate Match${matchCost ? ` (${matchCost} coins)` : ""}`}
          </button>
        </div>
      }
      backgroundImage={stadiumArt}
      description={`${user?.teamName || "Dream Squad FC"} is ready for a simulation match built from formation, chemistry, and position-aware player strength.`}
      eyebrow="Simulation Arena"
      title="Play A Match"
    >
      {error ? (
        <div className="form-message form-message--error">{error}</div>
      ) : null}

      <section className="match-summary">
        <StatCard
          accent="green"
          hint="Club entering the simulation"
          icon="TM"
          label="Team"
          value={user?.teamName || `${user?.username || "Dream Squad"} FC`}
        />
        <StatCard
          accent="cyan"
          hint="Saved tactical shape"
          icon="FM"
          label="Formation"
          value={squadData?.formation || "4-3-3"}
        />
        <StatCard
          accent="gold"
          hint="Role-aware squad quality"
          icon="OVR"
          label="Overall"
          value={squadData?.overall || 0}
        />
        <StatCard
          accent="purple"
          hint="Club, nation, and league links"
          icon="CH"
          label="Chemistry"
          value={insights.chemistryScore || 0}
        />
      </section>

      <section className="surface-panel match-config">
        <div>
          <span className="section-heading__eyebrow">Pre-Match Setup</span>
          <h2>Choose the challenge level</h2>
          <p>
            The simulation uses your saved XI, chemistry, tactical fit, and
            position-aware strength scores.
          </p>
        </div>

        <div className="match-config__controls">
          <div className="match-config__difficulty">
            {["friendly", "balanced", "elite"].map((difficultyOption) => (
              <button
                className={`match-config__difficulty-button${difficulty === difficultyOption ? " is-active" : ""}`}
                key={difficultyOption}
                onClick={() => setDifficulty(difficultyOption)}
                type="button"
              >
                {difficultyOption}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Opponent Name (Optional)</span>
            <input
              maxLength={32}
              onChange={(event) => setOpponentName(event.target.value)}
              placeholder="Neon Lions"
              type="text"
              value={opponentName}
            />
          </label>
        </div>
      </section>

      {simulating ? (
        <section className="surface-panel match-processing">
          <div className="match-processing__hero">
            <div className="match-processing__orb" />
            <div>
              <span className="section-heading__eyebrow">Smart Processing</span>
              <h2>{stages[phaseIndex] || "Preparing the match engine"}</h2>
              <p>
                The simulation engine is weighing lineup balance, chemistry,
                role fit, and chance quality.
              </p>
            </div>
          </div>

          <div className="match-processing__stages">
            {stages.map((stage, index) => (
              <div
                className={`match-processing__stage${
                  index === phaseIndex
                    ? " is-active"
                    : index < phaseIndex
                      ? " is-complete"
                      : ""
                }`}
                key={stage}
              >
                <span>{index + 1}</span>
                <strong>{stage}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resultData?.match ? (
        <section className="match-result">
          <div className="surface-panel match-scoreboard">
            <span className="section-heading__eyebrow">
              {resultData.result}
            </span>
            <div className="match-scoreboard__line">
              <div>
                <span>Home</span>
                <strong>{resultData.match.teamName}</strong>
              </div>
              <div className="match-scoreboard__score">
                <span>{resultData.match.score.home}</span>
                <em>-</em>
                <span>{resultData.match.score.away}</span>
              </div>
              <div>
                <span>Away</span>
                <strong>{resultData.match.opponentName}</strong>
              </div>
            </div>
            <p>{resultData.match.recap}</p>

            <div className="match-scoreboard__economy">
              <div
                className={`match-scoreboard__economy-card ${Number(resultData.coinChange || 0) >= 0 ? "is-positive" : "is-negative"}`}
              >
                <span>
                  {Number(resultData.coinChange || 0) >= 0
                    ? "Coins Won"
                    : "Coins Lost"}
                </span>
                <strong>
                  {Number(resultData.coinChange || 0) >= 0 ? "+" : ""}
                  {Number(resultData.coinChange || 0).toLocaleString()}
                </strong>
              </div>
              <div className="match-scoreboard__economy-card">
                <span>Balance After Match</span>
                <strong>
                  {Number(
                    resultData.economy?.coinsAfterMatch ??
                      resultData.user?.coins ??
                      user?.coins ??
                      0,
                  ).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          <div className="match-result__grid">
            <article className="surface-panel match-card">
              <div className="section-heading">
                <div>
                  <span className="section-heading__eyebrow">Standouts</span>
                  <h2>Who changed the match</h2>
                </div>
              </div>

              <div className="match-standouts">
                {(resultData.match.standoutPlayers || []).map((player) => (
                  <div className="match-standout" key={player.playerName}>
                    <strong>{player.playerName}</strong>
                    <span>{player.roleGroup}</span>
                    <span>Match Rating {player.rating}</span>
                    <p>{player.reason}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-panel match-card">
              <div className="section-heading">
                <div>
                  <span className="section-heading__eyebrow">Event Feed</span>
                  <h2>How it unfolded</h2>
                </div>
              </div>

              <div className="match-events">
                {(resultData.match.events || []).map((event, index) => (
                  <div
                    className="match-event"
                    key={`${event.minute}-${event.playerName}-${index}`}
                  >
                    <span className="match-event__minute">{event.minute}'</span>
                    <div>
                      <strong>{event.playerName}</strong>
                      <p>
                        {event.teamName} scored for the{" "}
                        {event.side === "home" ? "home" : "away"} side.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}

export default Matches;
